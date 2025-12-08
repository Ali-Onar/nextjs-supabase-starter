import { AspectRatio, OutputFormat } from "@/types/helper.types";

// Constants for UI
export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1 (Kare)" },
  { value: "16:9", label: "16:9 (Geniş)" },
  { value: "9:16", label: "9:16 (Dikey)" },
  { value: "4:3", label: "4:3 (Standart)" },
  { value: "3:4", label: "3:4 (Portre)" },
  { value: "3:2", label: "3:2 (Fotoğraf)" },
  { value: "2:3", label: "2:3 (Dikey Fotoğraf)" },
  { value: "21:9", label: "21:9 (Ultra Geniş)" },
  { value: "5:4", label: "5:4" },
  { value: "4:5", label: "4:5" },
];

export const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
];

// Format date
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Get status badge variant
export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "completed":
      return "default";
    case "processing":
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

// Get status text in Turkish
export const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "Tamamlandı";
    case "processing":
      return "İşleniyor";
    case "pending":
      return "Bekliyor";
    case "failed":
      return "Başarısız";
    default:
      return status;
  }
};
