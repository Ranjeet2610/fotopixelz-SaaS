import { apiRequest } from "@/lib/api-client";
import type { CreatedOrder, SubmitOrderResult } from "@/lib/catalog-types";
import type { PresignedUrlResult, UploadRecord } from "@/lib/upload-types";

type UploadFileInput = {
  organizationId: string;
  orderId: string;
  file: File;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
};

function putFileWithProgress(
  uploadUrl: string,
  file: File,
  headers: Record<string, string>,
  onProgress: ((progress: number) => void) | undefined,
  signal?: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress?.(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"));

    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          xhr.abort();
        },
        { once: true },
      );
    }

    xhr.send(file);
  });
}

export async function uploadOrderFile(input: UploadFileInput): Promise<UploadRecord> {
  const presigned = await apiRequest<PresignedUrlResult>("/uploads/presigned-url", {
    method: "POST",
    body: {
      organizationId: input.organizationId,
      orderId: input.orderId,
      originalName: input.file.name,
      fileName: input.file.name,
      mimeType: input.file.type || "application/octet-stream",
      fileSize: input.file.size,
    },
  });

  await putFileWithProgress(
    presigned.presigned.uploadUrl,
    input.file,
    presigned.presigned.headers,
    input.onProgress,
    input.signal,
  );

  const completed = await apiRequest<UploadRecord>("/uploads/complete", {
    method: "POST",
    body: {
      uploadId: presigned.upload.id,
      storageKey: presigned.presigned.storageKey,
      storageUrl: presigned.presigned.storageUrl,
    },
  });

  if (completed.status === "FAILED") {
    throw new Error("Upload verification failed. The file was not stored successfully.");
  }

  return completed;
}

export async function listOrderUploads(orderId: string) {
  return apiRequest<UploadRecord[]>(`/uploads/order/${orderId}`);
}

export async function getUploadPreviewUrl(uploadId: string) {
  return apiRequest<{ previewUrl: string; expiresIn: number; fileName: string; mimeType: string }>(
    `/uploads/${uploadId}/preview-url`,
  );
}

export async function downloadUpload(upload: Pick<UploadRecord, "id" | "fileName" | "originalName">) {
  const { previewUrl } = await getUploadPreviewUrl(upload.id);
  const anchor = document.createElement("a");
  anchor.href = previewUrl;
  anchor.download = upload.fileName || upload.originalName;
  anchor.rel = "noopener";
  anchor.target = "_blank";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function deleteOrderUpload(uploadId: string) {
  return apiRequest(`/uploads/${uploadId}`, { method: "DELETE" });
}

export async function markOrderUploaded(orderId: string) {
  return apiRequest<CreatedOrder>("/orders/status", {
    method: "PATCH",
    body: { orderId, status: "UPLOADED" },
  });
}

export async function submitOrder(orderId: string) {
  return apiRequest<SubmitOrderResult>(`/orders/${orderId}/submit`, {
    method: "POST",
  });
}
