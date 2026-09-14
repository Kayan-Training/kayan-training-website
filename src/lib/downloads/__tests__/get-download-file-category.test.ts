import { describe, expect, it } from "vitest";
import { getDownloadFileCategory } from "@/lib/downloads/get-download-file-category";

describe("getDownloadFileCategory", () => {
  it("returns 'pdf' for application/pdf", () => {
    expect(getDownloadFileCategory("application/pdf")).toBe("pdf");
  });

  it("returns 'image' for any image/* mime type", () => {
    expect(getDownloadFileCategory("image/png")).toBe("image");
    expect(getDownloadFileCategory("image/webp")).toBe("image");
  });

  it("returns 'other' for anything else", () => {
    expect(getDownloadFileCategory("video/mp4")).toBe("other");
    expect(getDownloadFileCategory("application/octet-stream")).toBe("other");
  });
});
