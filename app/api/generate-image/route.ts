import { createClient } from "@/lib/supabase/server";
import { AspectRatio, OutputFormat } from "@/types/helper.types";
import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY,
});

// Request body type
interface GenerateImageRequest {
  prompt: string;
  aspect_ratio?: AspectRatio;
  output_format?: OutputFormat;
  num_images?: number;
}

/**
 * POST - Submit a new image generation job
 * Returns immediately with job ID for polling
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Parse request body
    const body: GenerateImageRequest = await request.json();
    const {
      prompt,
      aspect_ratio = "1:1",
      output_format = "png",
      num_images = 1,
    } = body;

    // Validate prompt
    if (!prompt || prompt.trim() === "") {
      return NextResponse.json(
        { error: "Prompt alanı zorunludur." },
        { status: 400 }
      );
    }

    // 1. Submit job to fal.ai queue (non-blocking)
    const { request_id } = await fal.queue.submit("fal-ai/nano-banana-pro", {
      input: {
        prompt: prompt.trim(),
        aspect_ratio,
        output_format,
        num_images,
      },
    });

    // 2. Create record with 'pending' status and fal_request_id
    const { data: record, error: insertError } = await supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        prompt: prompt.trim(),
        aspect_ratio,
        output_format,
        num_images,
        status: "pending",
        fal_request_id: request_id,
      })
      .select()
      .single();

    if (insertError || !record) {
      console.error("Error creating record:", insertError);
      return NextResponse.json(
        { error: "Kayıt oluşturulurken hata oluştu." },
        { status: 500 }
      );
    }

    // 3. Return immediately with job info
    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        fal_request_id: request_id,
        status: "pending",
      },
      message: "Görsel oluşturma işlemi başlatıldı.",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch user's generated images
 */
export async function GET() {
  try {
    const supabase = await createClient();

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

    // Fetch user's generated images
    const { data, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error);
      return NextResponse.json(
        { error: "Görseller yüklenirken hata oluştu." },
        { status: 500 }
      );
    }

    // Generate signed URLs for completed images with storage_path
    const imagesWithSignedUrls = await Promise.all(
      (data || []).map(async (image) => {
        if (image.status === "completed" && image.storage_path) {
          const { data: signedUrlData } = await supabase.storage
            .from("generated-images")
            .createSignedUrl(image.storage_path, 3600); // 1 hour expiry

          return {
            ...image,
            signed_url: signedUrlData?.signedUrl || null,
          };
        }
        return {
          ...image,
          signed_url: null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: imagesWithSignedUrls,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a generated image
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return NextResponse.json(
        { error: "Görsel ID'si gereklidir." },
        { status: 400 }
      );
    }

    // Get the image record first
    const { data: imageRecord, error: fetchError } = await supabase
      .from("generated_images")
      .select("storage_path")
      .eq("id", imageId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !imageRecord) {
      return NextResponse.json(
        { error: "Görsel bulunamadı." },
        { status: 404 }
      );
    }

    // Delete from storage if exists
    if (imageRecord.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("generated-images")
        .remove([imageRecord.storage_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from("generated_images")
      .delete()
      .eq("id", imageId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting record:", deleteError);
      return NextResponse.json(
        { error: "Görsel silinirken hata oluştu." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}
