import type { SourceUploadRecord } from "@repo/upload-gallery";
import { getId } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";

function stringField(value: unknown, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function inferMimeType(mimeType: string, fileName: string) {
  const normalized = mimeType.trim().toLowerCase();
  if (normalized && normalized !== "-") {
    return normalized;
  }

  const extension = fileName.trim().toLowerCase().split(".").pop();
  const mimeByExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    tif: "image/tiff",
    tiff: "image/tiff",
  };

  return extension ? mimeByExtension[extension] ?? "" : "";
}

export function toSourceUploadRecords(rows: ApiRecord[]): SourceUploadRecord[] {
  return rows.map((row) => {
    const fileName = stringField(row.fileName, "upload");
    return {
      id: getId(row),
      originalName: stringField(row.originalName ?? row.fileName, "Upload"),
      fileName,
      mimeType: inferMimeType(stringField(row.mimeType), fileName),
      fileSize: Number(row.fileSize ?? 0),
      status: stringField(row.status, "PENDING"),
    };
  });
}
