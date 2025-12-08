import { createClient } from "@/lib/supabase/server";
import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY,
});

// Type for fal.ai nano-banana response
interface FalImageResult {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
  width?: number;
  height?: number;
}

interface FalNanoBananaResponse {
  images: FalImageResult[];
  description: string;
}

// Fal.ai queue status types
type FalQueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";

interface FalStatusResponse {
  status: FalQueueStatus;
  queue_position?: number;
  response_url?: string;
}

interface FalResultResponse {
  data: FalNanoBananaResponse;
  requestId: string;
}

/**
 * GET - Check job status and process if completed
 * This endpoint handles the polling from the client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: recordId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekmektedir." },
        { status: 401 }
      );
    }

    // Get the record from database
    const { data: record, error: fetchError } = await supabase
      .from("generated_images")
      .select("*")
      .eq("id", recordId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !record) {
      return NextResponse.json(
        { error: "Kayıt bulunamadı." },
        { status: 404 }
      );
    }

    // If already completed or failed, return current status
    if (record.status === "completed" || record.status === "failed") {
      // Generate signed URL for completed images
      let signedUrl: string | null = null;
      if (record.status === "completed" && record.storage_path) {
        const { data: signedUrlData } = await supabase.storage
          .from("generated-images")
          .createSignedUrl(record.storage_path, 3600); // 1 hour expiry
        signedUrl = signedUrlData?.signedUrl || null;
      }

      return NextResponse.json({
        success: true,
        data: {
          id: record.id,
          status: record.status,
          signed_url: signedUrl,
          storage_path: record.storage_path,
          error_message: record.error_message,
          width: record.width,
          height: record.height,
        },
      });
    }

    // Check fal.ai queue status
    if (!record.fal_request_id) {
      return NextResponse.json(
        { error: "Fal request ID bulunamadı." },
        { status: 400 }
      );
    }

    try {
      // Get status from fal.ai
      const statusResponse = (await fal.queue.status("fal-ai/nano-banana-pro", {
        requestId: record.fal_request_id,
        logs: true,
      })) as FalStatusResponse;

      let statusText = "pending";

      switch (statusResponse.status) {
        case "IN_QUEUE":
          statusText = "pending";
          // Update to pending if not already
          if (record.status !== "pending") {
            await supabase
              .from("generated_images")
              .update({ status: "pending" })
              .eq("id", recordId);
          }
          break;

        case "IN_PROGRESS":
          statusText = "processing";
          // Update to processing if not already
          if (record.status !== "processing") {
            await supabase
              .from("generated_images")
              .update({ status: "processing" })
              .eq("id", recordId);
          }
          break;

        case "COMPLETED":
          // Get the result and process it
          const result = (await fal.queue.result("fal-ai/nano-banana-pro", {
            requestId: record.fal_request_id,
          })) as FalResultResponse;

          const falResponse = result.data;

          if (!falResponse.images || falResponse.images.length === 0) {
            throw new Error("Görsel üretilemedi.");
          }

          const generatedImage = falResponse.images[0];

          // Download image from fal.ai URL
          const imageResponse = await fetch(generatedImage.url);
          if (!imageResponse.ok) {
            throw new Error("Görsel indirilemedi.");
          }

          const imageBuffer = await imageResponse.arrayBuffer();
          const imageBlob = new Blob([imageBuffer], {
            type:
              generatedImage.content_type || `image/${record.output_format}`,
          });

          // Upload to Supabase Storage
          const fileName = `${record.id}.${record.output_format}`;
          const storagePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("generated-images")
            .upload(storagePath, imageBlob, {
              contentType:
                generatedImage.content_type || `image/${record.output_format}`,
              upsert: true,
            });

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw new Error("Görsel yüklenemedi.");
          }

          // Generate signed URL for private bucket access
          const { data: signedUrlData } = await supabase.storage
            .from("generated-images")
            .createSignedUrl(storagePath, 3600); // 1 hour expiry

          // Update record with completed status and image data
          const { data: updatedRecord, error: updateError } = await supabase
            .from("generated_images")
            .update({
              status: "completed",
              fal_image_url: generatedImage.url,
              storage_path: storagePath,
              width: generatedImage.width,
              height: generatedImage.height,
              file_size: generatedImage.file_size,
              content_type: generatedImage.content_type,
              description: falResponse.description,
            })
            .eq("id", recordId)
            .select()
            .single();

          if (updateError) {
            console.error("Error updating record:", updateError);
            throw new Error("Kayıt güncellenirken hata oluştu.");
          }

          return NextResponse.json({
            success: true,
            data: {
              id: updatedRecord.id,
              status: "completed",
              signed_url: signedUrlData?.signedUrl || null,
              storage_path: updatedRecord.storage_path,
              width: updatedRecord.width,
              height: updatedRecord.height,
              description: updatedRecord.description,
            },
          });
      }

      // Return current status for pending/processing
      return NextResponse.json({
        success: true,
        data: {
          id: record.id,
          status: statusText,
          queue_position: statusResponse.queue_position,
        },
      });
    } catch (falError) {
      // Update record with failed status
      const errorMessage =
        falError instanceof Error ? falError.message : "Bilinmeyen hata";

      await supabase
        .from("generated_images")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", recordId);

      console.error("Fal.ai error:", falError);
      return NextResponse.json({
        success: false,
        data: {
          id: record.id,
          status: "failed",
          error_message: errorMessage,
        },
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}

