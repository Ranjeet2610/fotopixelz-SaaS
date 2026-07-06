"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { deleteDeliverable, uploadDeliverableFile } from "@/lib/asset-client";
import { formatDeliverableQuotaError } from "@/lib/asset-gallery-adapter";
import { textValue } from "@/lib/format";
import { formatBytes } from "@/lib/upload-utils";
import type { ApiRecord } from "@/lib/types";
import { Button } from "./ui";

type LocalDeliverableItem = {
  localId: string;
  file: File;
  previewUrl: string | null;
  status: "queued" | "uploading" | "uploaded" | "failed";
  progress: number;
  error?: string;
};

type DeliverableUploadPanelProps = {
  organizationId: string;
  orderId: string;
  disabled?: boolean;
  sourceImageCount: number;
  uploadedCount: number;
  pendingCount: number;
  remainingAllowed: number;
  pendingAssets?: ApiRecord[];
  onUploaded: () => void;
  onAssetsChanged?: () => void;
};

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|tiff?)$/i.test(file.name);
}

export function DeliverableUploadPanel({
  organizationId,
  orderId,
  disabled = false,
  sourceImageCount,
  uploadedCount,
  pendingCount,
  remainingAllowed,
  pendingAssets = [],
  onUploaded,
  onAssetsChanged,
}: DeliverableUploadPanelProps) {
  const [items, setItems] = useState<LocalDeliverableItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingPendingId, setCancellingPendingId] = useState<string | null>(null);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    setError(null);
    setItems((current) => current.filter((item) => item.status === "uploading" || item.status === "queued"));
  }, [uploadedCount, pendingCount, remainingAllowed, orderId]);

  const refreshAssets = useCallback(() => {
    onAssetsChanged?.();
  }, [onAssetsChanged]);

  const runUpload = useCallback(
    async (localId: string, file: File) => {
      const controller = new AbortController();
      abortControllers.current.set(localId, controller);

      setItems((current) =>
        current.map((item) =>
          item.localId === localId
            ? { ...item, status: "uploading", progress: 0, error: undefined }
            : item,
        ),
      );

      try {
        await uploadDeliverableFile({
          organizationId,
          orderId,
          file,
          signal: controller.signal,
          onPresignedCreated: refreshAssets,
          onProgress: (progress) => {
            setItems((current) =>
              current.map((item) => (item.localId === localId ? { ...item, progress } : item)),
            );
          },
        });

        setItems((current) => current.filter((item) => item.localId !== localId));
        onUploaded();
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          setItems((current) => current.filter((item) => item.localId !== localId));
          refreshAssets();
          return;
        }

        const message = caught instanceof Error ? caught.message : "Upload failed";
        setItems((current) =>
          current.map((item) =>
            item.localId === localId ? { ...item, status: "failed", progress: 0, error: message } : item,
          ),
        );
        refreshAssets();
      } finally {
        abortControllers.current.delete(localId);
      }
    },
    [onUploaded, orderId, organizationId, refreshAssets],
  );

  const queueFiles = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter(isImageFile);
      if (imageFiles.length === 0) {
        setError("Please select image files only.");
        return;
      }

      if (sourceImageCount === 0) {
        setError("Source images must be uploaded before deliverables can be added.");
        return;
      }

      const activeLocal = itemsRef.current.filter(
        (item) => item.status === "queued" || item.status === "uploading",
      ).length;
      const totalAttempted = activeLocal + imageFiles.length;

      if (totalAttempted > remainingAllowed) {
        setError(
          formatDeliverableQuotaError({
            sourceImageCount,
            uploadedCount,
            pendingCount,
            attemptedUpload: totalAttempted,
          }),
        );
        return;
      }

      setError(null);
      const nextItems: LocalDeliverableItem[] = imageFiles.map((file) => ({
        localId: createLocalId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        progress: 0,
      }));

      setItems((current) => [...current, ...nextItems]);
      void (async () => {
        for (const item of nextItems) {
          await runUpload(item.localId, item.file);
        }
      })();
    },
    [pendingCount, remainingAllowed, runUpload, sourceImageCount, uploadedCount],
  );

  const removeItem = useCallback((localId: string) => {
    const controller = abortControllers.current.get(localId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(localId);
    }

    setItems((current) => {
      const target = current.find((item) => item.localId === localId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.localId !== localId);
    });
  }, []);

  async function handleCancelPending(assetId: string) {
    setCancellingPendingId(assetId);
    setError(null);
    try {
      await deleteDeliverable(assetId);
      onUploaded();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to cancel pending upload");
    } finally {
      setCancellingPendingId(null);
    }
  }

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) {
        return;
      }
      if (event.dataTransfer.files.length > 0) {
        queueFiles(event.dataTransfer.files);
      }
    },
    [disabled, queueFiles],
  );

  return (
    <div className="deliverable-upload-panel">
      <div className="deliverable-quota-summary stack-sm">
        <p className="muted-copy">Source Images: {sourceImageCount}</p>
        <p className="muted-copy">Uploaded: {uploadedCount}</p>
        <p className="muted-copy">Remaining: {remainingAllowed}</p>
        {pendingCount > 0 ? <p className="muted-copy">Pending upload: {pendingCount}</p> : null}
      </div>

      {pendingAssets.length > 0 ? (
        <div className="stack-sm">
          {pendingAssets.map((asset) => {
            const assetId = textValue(asset.id);
            const fileName = textValue(asset.fileName ?? asset.name, "Deliverable");
            return (
              <div className="button-row" key={assetId}>
                <span className="muted-copy" title={fileName}>
                  Pending: {fileName}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={cancellingPendingId === assetId}
                  onClick={() => void handleCancelPending(assetId)}
                >
                  {cancellingPendingId === assetId ? "Cancelling…" : "Cancel Pending Upload"}
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}

      <div
        className={`upload-dropzone${isDragging ? " upload-dropzone-active" : ""}${disabled ? " upload-dropzone-disabled" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <p className="deliverable-drop-title">Drag and drop final deliverables here</p>
        <p className="muted-copy">JPEG, PNG, WebP, TIFF — multiple files supported</p>
        <label className="deliverable-browse-label">
          <span className="upload-gallery-btn">Browse files</span>
          <input
            type="file"
            className="sr-only"
            multiple
            accept="image/*,.tif,.tiff"
            disabled={disabled}
            onChange={(event) => {
              if (event.target.files) {
                queueFiles(event.target.files);
                event.target.value = "";
              }
            }}
          />
        </label>
      </div>

      {error ? <p className="form-error" style={{ whiteSpace: "pre-line" }}>{error}</p> : null}

      {items.length > 0 ? (
        <div className="upload-grid">
          {items.map((item) => (
            <div className="upload-tile" key={item.localId}>
              <div className="upload-thumb">
                {item.previewUrl ? <img src={item.previewUrl} alt="" /> : <span className="upload-thumb-fallback">IMG</span>}
                {item.status === "uploading" || item.status === "queued" ? (
                  <div className="upload-progress-overlay">
                    <div className="upload-progress-bar" style={{ width: `${item.progress}%` }} />
                  </div>
                ) : null}
              </div>
              <div className="upload-meta">
                <p className="upload-name" title={item.file.name}>
                  {item.file.name}
                </p>
                <p className="upload-size">{formatBytes(item.file.size)}</p>
                {item.error ? <p className="upload-error">{item.error}</p> : null}
                <div className="upload-actions">
                  {item.status === "failed" ? (
                    <Button size="sm" variant="secondary" onClick={() => void runUpload(item.localId, item.file)}>
                      Retry
                    </Button>
                  ) : null}
                  {item.status === "queued" || item.status === "uploading" || item.status === "failed" ? (
                    <Button size="sm" variant="secondary" onClick={() => removeItem(item.localId)}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
