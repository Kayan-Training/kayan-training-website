export type DownloadFileCategory = "pdf" | "image" | "other";

export function getDownloadFileCategory(mimeType: string): DownloadFileCategory {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  return "other";
}
