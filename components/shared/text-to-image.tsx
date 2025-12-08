"use client";

import { AlertCircle, Clock, Download, ImageIcon, Loader2, Sparkles, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import {
  AspectRatio,
  GeneratedImage,
  OutputFormat,
} from "@/types/helper.types";
import { ASPECT_RATIOS, formatDate, getStatusBadgeVariant, getStatusText, OUTPUT_FORMATS } from "@/lib/helpers";
import Image from "next/image";
import { Badge } from "../ui/badge";

// Status response type from API
interface StatusResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  signed_url?: string;
  storage_path?: string;
  error_message?: string;
  width?: number;
  height?: number;
}

interface GeneratedImageWithSignedUrl extends GeneratedImage {
  signed_url?: string | null;
}

// Polling configuration
const POLLING_INTERVAL = 1500; // 1.5 seconds
const MAX_POLLING_ATTEMPTS = 120; // Max 3 minutes (120 * 1.5s)

const TextToImage = () => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");

  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [images, setImages] = useState<GeneratedImageWithSignedUrl[]>([]);
  const [currentImage, setCurrentImage] =
    useState<GeneratedImageWithSignedUrl | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pollingCountRef = useRef(0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, []);

  // Fetch user's generated images
  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch("/api/generate-image");
      const data = await response.json();

      if (data.success) {
        setImages(data.data);
        if (data.data.length > 0 && !currentImage) {
          setCurrentImage(data.data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Poll job status
  const pollStatus = useCallback(
    async (recordId: string): Promise<void> => {
      pollingCountRef.current += 1;

      // Check max attempts
      if (pollingCountRef.current > MAX_POLLING_ATTEMPTS) {
        setError("İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.");
        setIsGenerating(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/generate-image/status/${recordId}`
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Durum sorgulanamadı.");
        }

        const statusData: StatusResponse = result.data;

        switch (statusData.status) {
          case "pending":
          case "processing":
            // Continue polling
            pollingRef.current = setTimeout(
              () => pollStatus(recordId),
              POLLING_INTERVAL
            );
            break;

          case "completed":
            // Fetch updated images and set current
            const completedResponse = await fetch("/api/generate-image");
            const completedData = await completedResponse.json();
            if (completedData.success && completedData.data.length > 0) {
              const completedImage = completedData.data.find(
                (img: GeneratedImageWithSignedUrl) => img.id === recordId
              );
              if (completedImage) {
                setCurrentImage(completedImage);
                setImages(completedData.data);
              }
            }
            // Reset state
            setIsGenerating(false);
            pollingCountRef.current = 0;
            break;

          case "failed":
            setError(statusData.error_message || "Görsel oluşturulamadı.");
            setIsGenerating(false);
            pollingCountRef.current = 0;
            // Refresh images list
            fetchImages();
            break;
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Retry on network errors
        pollingRef.current = setTimeout(
          () => pollStatus(recordId),
          POLLING_INTERVAL * 2
        );
      }
    },
    [fetchImages]
  );

  // Generate image
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);
    pollingCountRef.current = 0;

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          num_images: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Görsel üretilirken hata oluştu.");
      }

      if (data.success && data.data) {
        setPrompt("");
        // Start polling for status
        pollStatus(data.data.id);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Beklenmeyen hata oluştu.";
      setError(errorMessage);
      setIsGenerating(false);
    }
  };

   // Download image
   const handleDownload = async (image: GeneratedImageWithSignedUrl) => {
    if (!image.signed_url) return;

    try {
      const response = await fetch(image.signed_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-${image.id}.${image.output_format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("İndirme sırasında hata oluştu.");
    }
  };

  // Delete image
  const handleDelete = async (imageId: string) => {
    if (!confirm("Bu görseli silmek istediğinizden emin misiniz?")) {
      return;
    }

    setDeletingId(imageId);

    try {
      const response = await fetch(`/api/generate-image?id=${imageId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Görsel silinirken hata oluştu.");
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId));
      if (currentImage?.id === imageId) {
        const remainingImages = images.filter((img) => img.id !== imageId);
        setCurrentImage(remainingImages[0] || null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Beklenmeyen hata oluştu.";
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="w-6 h-6 text-primary" />
          Metinden Görsel Oluştur
        </h1>
        <p className="text-muted-foreground">
          Yapay zeka ile hayal ettiğiniz görseli oluşturun.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Görsel Ayarları</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Oluşturmak istediğiniz görseli detaylı bir şekilde tanımlayın..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    İpucu: Ne kadar detaylı açıklarsanız, o kadar iyi sonuç
                    alırsınız.
                  </p>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <Label htmlFor="aspect-ratio">En Boy Oranı</Label>
                  <Select
                    value={aspectRatio}
                    onValueChange={(value) =>
                      setAspectRatio(value as AspectRatio)
                    }
                    disabled={isGenerating}
                  >
                    <SelectTrigger id="aspect-ratio" className="w-full">
                      <SelectValue placeholder="En boy oranı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Output Format */}
                <div className="space-y-2">
                  <Label htmlFor="output-format">Çıktı Formatı</Label>
                  <Select
                    value={outputFormat}
                    onValueChange={(value) =>
                      setOutputFormat(value as OutputFormat)
                    }
                    disabled={isGenerating}
                  >
                    <SelectTrigger id="output-format" className="w-full">
                      <SelectValue placeholder="Çıktı formatı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Görsel Oluştur
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Image History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Geçmiş
                </span>
                <Badge variant="outline">{images.length} görsel</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Henüz görsel oluşturmadınız
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                        currentImage?.id === image.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                      onClick={() => setCurrentImage(image)}
                    >
                      {image.status === "completed" && image.signed_url ? (
                        <Image
                          src={image.signed_url}
                          alt={image.prompt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 100px"
                        />
                      ) : image.status === "processing" ||
                        image.status === "pending" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Generated Image */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Oluşturulan Görsel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="aspect-square flex flex-col items-center justify-center bg-muted/50 rounded-lg">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Görsel hazırlanıyor...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bu işlem birkaç saniye sürebilir
                  </p>
                </div>
              ) : currentImage ? (
                <div className="space-y-4">
                  {/* Image Display */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    {currentImage.status === "completed" &&
                    currentImage.signed_url ? (
                      <Image
                        src={currentImage.signed_url}
                        alt={currentImage.prompt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    ) : currentImage.status === "processing" ||
                      currentImage.status === "pending" ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {getStatusText(currentImage.status)}
                        </p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        <p className="text-sm text-destructive">
                          {currentImage.error_message || "Hata oluştu"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {currentImage.aspect_ratio}
                      </Badge>
                      <Badge variant="outline">
                        {currentImage.output_format.toUpperCase()}
                      </Badge>
                      {currentImage.width && currentImage.height && (
                        <Badge variant="outline">
                          {currentImage.width}x{currentImage.height}
                        </Badge>
                      )}
                      <Badge
                        variant={getStatusBadgeVariant(currentImage.status)}
                      >
                        {getStatusText(currentImage.status)}
                      </Badge>
                    </div>

                    <div className="text-sm">
                      <p className="font-medium mb-1">Prompt:</p>
                      <p className="text-muted-foreground line-clamp-3">
                        {currentImage.prompt}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(currentImage.created_at)}
                    </p>

                    {/* Action Buttons */}
                    {currentImage.status === "completed" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(currentImage)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          İndir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(currentImage.id)}
                          disabled={deletingId === currentImage.id}
                        >
                          {deletingId === currentImage.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">
                    Henüz bir görsel oluşturmadınız
                  </p>
                  <p className="text-sm text-muted-foreground/70 text-center mt-1">
                    Soldaki formu kullanarak ilk görselinizi oluşturun
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TextToImage;
