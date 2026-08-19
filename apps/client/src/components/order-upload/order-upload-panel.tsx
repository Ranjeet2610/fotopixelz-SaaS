"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useOrganization } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CreatedOrder } from "@/lib/catalog-types";
import { formatBytes } from "@/lib/format-bytes";
import { buildSubmittedOrderBilling, calculateOrderBilling } from "@/lib/order-billing";
import { getCreditsRemaining } from "@/lib/workspace";
import { formatOrderNumber, getClientOrderStatusLabel, isPreUploadOrderStatus } from "@/lib/order-status";
import { SourceUploadGallery } from "@repo/upload-gallery";
import {
  deleteOrderUpload,
  downloadUpload,
  getUploadPreviewUrl,
  listOrderUploads,
  markOrderUploaded,
  submitOrder,
  uploadOrderFile,
} from "@/lib/upload-client";
import type { LocalUploadItem, UploadRecord } from "@/lib/upload-types";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = "image/*";

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

type OrderUploadPanelProps = {
  order: CreatedOrder;
  onOrderUpdated: (order: CreatedOrder) => void;
};

export function OrderUploadPanel({ order, onOrderUpdated }: OrderUploadPanelProps) {
  const { organization, refreshOrganization } = useOrganization();
  const [serverUploads, setServerUploads] = useState<UploadRecord[]>([]);
  const [localUploads, setLocalUploads] = useState<LocalUploadItem[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const isUploadPhase = isPreUploadOrderStatus(order.status);
  const isSubmitPhase = order.status === "UPLOADED";
  const isDeliveredPhase = order.status === "DELIVERED";
  const isSubmittedPhase =
    order.status === "PENDING" ||
    order.status === "ASSIGNED" ||
    order.status === "IN_PROGRESS" ||
    order.status === "READY_FOR_QA" ||
    order.status === "REVISION_REQUIRED" ||
    order.status === "APPROVED";

  const creditsRemaining = getCreditsRemaining(organization);
  const uploadedCount = useMemo(
    () => serverUploads.filter((upload) => upload.status === "UPLOADED").length,
    [serverUploads],
  );

  const billing = useMemo(
    () => calculateOrderBilling(order, uploadedCount, creditsRemaining),
    [order, uploadedCount, creditsRemaining],
  );
  const hasUploadInProgress = localUploads.some(
    (item) => item.status === "queued" || item.status === "uploading",
  );
  const canContinue = uploadedCount > 0 && !hasUploadInProgress && !submitting;
  const canSubmit = uploadedCount > 0 && !hasUploadInProgress && !submitting;

  const refreshServerUploads = useCallback(async () => {
    const uploads = await listOrderUploads(order.id);
    setServerUploads(uploads.filter((upload) => upload.status !== "DELETED"));
  }, [order.id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingUploads(true);
      try {
        const uploads = await listOrderUploads(order.id);
        if (!cancelled) {
          setServerUploads(uploads.filter((upload) => upload.status !== "DELETED"));
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load existing uploads.");
        }
      } finally {
        if (!cancelled) {
          setLoadingUploads(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [order.id]);

  const runUpload = useCallback(
    async (localId: string, file: File) => {
      if (!organization?.id) {
        setLocalUploads((current) =>
          current.map((item) =>
            item.localId === localId
              ? { ...item, status: "failed", error: "Organization not available." }
              : item,
          ),
        );
        return;
      }

      const controller = new AbortController();
      abortControllers.current.set(localId, controller);

      setLocalUploads((current) =>
        current.map((item) =>
          item.localId === localId ? { ...item, status: "uploading", progress: 0, error: undefined } : item,
        ),
      );

      try {
        const record = await uploadOrderFile({
          organizationId: organization.id,
          orderId: order.id,
          file,
          signal: controller.signal,
          onProgress: (progress) => {
            setLocalUploads((current) =>
              current.map((item) => (item.localId === localId ? { ...item, progress } : item)),
            );
          },
        });

        setLocalUploads((current) => current.filter((item) => item.localId !== localId));
        setServerUploads((current) => [record, ...current.filter((upload) => upload.id !== record.id)]);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        const message = caught instanceof Error ? caught.message : "Upload failed";
        setLocalUploads((current) =>
          current.map((item) =>
            item.localId === localId ? { ...item, status: "failed", progress: 0, error: message } : item,
          ),
        );
      } finally {
        abortControllers.current.delete(localId);
      }
    },
    [organization?.id, order.id],
  );

  const queueFiles = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((file) => isImageMime(file.type));
      if (imageFiles.length === 0) {
        setError("Please select image files only.");
        return;
      }

      setError(null);

      const nextItems: LocalUploadItem[] = imageFiles.map((file) => ({
        localId: createLocalId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        progress: 0,
      }));

      setLocalUploads((current) => [...current, ...nextItems]);
      nextItems.forEach((item) => {
        void runUpload(item.localId, item.file);
      });
    },
    [runUpload],
  );

  const removeLocalItem = useCallback((localId: string) => {
    const controller = abortControllers.current.get(localId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(localId);
    }

    setLocalUploads((current) => {
      const target = current.find((item) => item.localId === localId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.localId !== localId);
    });
  }, []);

  const retryUpload = useCallback(
    (localId: string) => {
      const target = localUploads.find((item) => item.localId === localId);
      if (!target) {
        return;
      }

      setLocalUploads((current) =>
        current.map((item) =>
          item.localId === localId ? { ...item, status: "queued", progress: 0, error: undefined } : item,
        ),
      );
      void runUpload(localId, target.file);
    },
    [localUploads, runUpload],
  );

  const removeServerUpload = useCallback(
    async (uploadId: string) => {
      setError(null);
      try {
        await deleteOrderUpload(uploadId);
        setServerUploads((current) => current.filter((upload) => upload.id !== uploadId));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to remove upload");
      }
    },
    [],
  );

  const handleContinue = useCallback(async () => {
    if (!canContinue) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await markOrderUploaded(order.id);
      onOrderUpdated(updated);
      await refreshServerUploads();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save upload step");
    } finally {
      setSubmitting(false);
    }
  }, [canContinue, onOrderUpdated, order, refreshServerUploads]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await submitOrder(order.id);
      onOrderUpdated(result.order);
      await refreshOrganization();
      await refreshServerUploads();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, onOrderUpdated, order.id, refreshOrganization, refreshServerUploads]);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (!isUploadPhase) {
        return;
      }
      if (event.dataTransfer.files.length > 0) {
        queueFiles(event.dataTransfer.files);
      }
    },
    [isUploadPhase, queueFiles],
  );

  const localUploadsRef = useRef(localUploads);
  localUploadsRef.current = localUploads;

  useEffect(() => {
    return () => {
      localUploadsRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      abortControllers.current.forEach((controller) => controller.abort());
    };
  }, []);

  if (isSubmittedPhase) {
    const submittedBilling = buildSubmittedOrderBilling(order);

    return (
      <div className="space-y-6">
        <Card className="border-status-success/30 bg-status-success/5">
          <CardHeader>
            <CardTitle>Order submitted successfully</CardTitle>
            <CardDescription>
              Your order is now in the production queue. We will notify you when it is ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Metric label="Order number" value={formatOrderNumber(order)} />
            <Metric label="Status" value={getClientOrderStatusLabel(order.status)} />
            <Metric label="Images uploaded" value={String(order.totalImages)} />
            <Metric label="Free credits used" value={String(order.creditsUsed)} />
          </CardContent>
        </Card>

        <BillingSummary billing={submittedBilling} currency={order.currency} />

        <SourceUploadGalleryCard
          uploads={serverUploads}
          loading={loadingUploads}
          onRemove={removeServerUpload}
        />
      </div>
    );
  }

  if (isSubmitPhase) {
    return (
      <div className="space-y-6">
        <Card className="border-status-success/30 bg-status-success/5">
          <CardHeader>
            <CardTitle>Images uploaded</CardTitle>
            <CardDescription>
              {uploadedCount} image{uploadedCount === 1 ? "" : "s"} attached. Review billing and submit
              your order.
            </CardDescription>
          </CardHeader>
        </Card>

        {billing.imagesNotUploaded > 0 ? (
          <Card className="border-status-warning/30 bg-status-warning/5">
            <CardHeader>
              <CardTitle>Upload shortfall</CardTitle>
              <CardDescription>
                Expected: {billing.expectedImages} · Uploaded: {billing.uploadedImages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {billing.imagesNotUploaded} image{billing.imagesNotUploaded === 1 ? "" : "s"} not uploaded.
                Billing is based on uploaded images only.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <BillingSummary billing={billing} currency={order.currency} />

        {billing.paymentRequired ? (
          <Card className="border-status-warning/30 bg-status-warning/5">
            <CardHeader>
              <CardTitle>Payment required</CardTitle>
              <CardDescription>
                {formatMoney(billing.amountDue, order.currency)} is due after free credits are applied.
                Online payment will be available soon.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {error ? (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <SourceUploadGalleryCard
          uploads={serverUploads}
          loading={loadingUploads}
          allowRemove
          onRemove={removeServerUpload}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {hasUploadInProgress
              ? "Wait for uploads to finish before submitting."
              : uploadedCount === 0
                ? "Upload at least one image before submitting."
                : billing.paymentRequired
                  ? `Submit order — ${formatMoney(billing.amountDue, order.currency)} due after credits.`
                  : "Submit with free credits — no payment due."}
          </p>
          <Button
            type="button"
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {submitting ? "Submitting…" : "Submit order"}
          </Button>
        </div>
      </div>
    );
  }

  if (isDeliveredPhase) {
    return null;
  }

  if (!isUploadPhase && !isSubmittedPhase && !isSubmitPhase) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order in progress</CardTitle>
          <CardDescription>This order has already been submitted for production.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Metric label="Order number" value={formatOrderNumber(order)} />
          <Metric label="Status" value={getClientOrderStatusLabel(order.status)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {order.status === "SUBMITTED" ? (
        <Card className="border-status-success/30 bg-status-success/5">
          <CardHeader>
            <CardTitle>Order submitted successfully</CardTitle>
            <CardDescription>
              Upload source files to begin production.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Metric label="Order number" value={formatOrderNumber(order)} />
            <Metric label="Status" value={getClientOrderStatusLabel(order.status)} />
          </CardContent>
        </Card>
      ) : null}

      {uploadedCount > 0 ? (
        <>
          {billing.imagesNotUploaded > 0 ? (
            <Card className="border-status-warning/30 bg-status-warning/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Expected {billing.expectedImages} images · Uploaded {billing.uploadedImages} ·{" "}
                  {billing.imagesNotUploaded} not uploaded yet. Final billing uses uploaded count
                  only.
                </p>
              </CardContent>
            </Card>
          ) : null}
          <BillingSummary billing={billing} currency={order.currency} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Billing estimate</CardTitle>
            <CardDescription>
              Expected {billing.expectedImages} images from your order. Upload images to see final
              billing.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload source images</CardTitle>
          <CardDescription>
            Add all images for this order. You need at least one image before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn("upload-dropzone", isDragging && "upload-dropzone-active")}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <p className="font-medium">Drag and drop images here</p>
            <p className="mt-1 text-sm text-muted-foreground">JPEG, PNG, WebP, and other image formats</p>
            <label className="mt-4 inline-flex cursor-pointer">
              <span className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium">
                Browse files
              </span>
              <input
                type="file"
                className="sr-only"
                multiple
                accept={ACCEPTED_TYPES}
                onChange={(event) => {
                  if (event.target.files) {
                    queueFiles(event.target.files);
                    event.target.value = "";
                  }
                }}
              />
            </label>
          </div>

          {error ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {loadingUploads ? (
            <p className="text-sm text-muted-foreground">Loading existing uploads…</p>
          ) : null}

          <SourceUploadGallery
            uploads={serverUploads}
            allowRemove
            onRemove={(uploadId) => void removeServerUpload(uploadId)}
            fetchPreviewUrl={getUploadPreviewUrl}
            downloadUpload={downloadUpload}
            formatBytes={formatBytes}
            additionalTiles={localUploads.map((item) => (
              <LocalUploadTile
                key={item.localId}
                item={item}
                onRemove={() => removeLocalItem(item.localId)}
                onRetry={item.status === "failed" ? () => retryUpload(item.localId) : undefined}
              />
            ))}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {hasUploadInProgress
            ? "Wait for uploads to finish before continuing."
            : uploadedCount === 0
              ? "Upload at least one image to continue."
              : `${uploadedCount} image${uploadedCount === 1 ? "" : "s"} ready.`}
        </p>
        <Button
          type="button"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={() => void handleContinue()}
          disabled={!canContinue}
        >
          {submitting ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function BillingSummary({
  billing,
  currency,
}: {
  billing: ReturnType<typeof calculateOrderBilling>;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing summary</CardTitle>
        <CardDescription>Based on uploaded images and available free credits.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Metric label="Expected images" value={String(billing.expectedImages)} />
        <Metric label="Uploaded images" value={String(billing.uploadedImages)} />
        <Metric label="Free credits used" value={String(billing.freeCreditsUsed)} />
        <Metric label="Billable images" value={String(billing.billableImages)} />
        <Metric label="Price per image" value={formatMoney(billing.pricePerImage, currency)} />
        <Metric label="Amount due" value={formatMoney(billing.amountDue, currency)} />
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

type SourceUploadGalleryCardProps = {
  uploads: UploadRecord[];
  loading: boolean;
  allowRemove?: boolean;
  onRemove: (uploadId: string) => void;
};

function SourceUploadGalleryCard({
  uploads,
  loading,
  allowRemove = false,
  onRemove,
}: SourceUploadGalleryCardProps) {
  if (!loading && uploads.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded images</CardTitle>
        <CardDescription>Click a thumbnail to open the full-size preview.</CardDescription>
      </CardHeader>
      <CardContent>
        <SourceUploadGallery
          uploads={uploads}
          loading={loading}
          allowRemove={allowRemove}
          onRemove={onRemove}
          fetchPreviewUrl={getUploadPreviewUrl}
          downloadUpload={downloadUpload}
          formatBytes={formatBytes}
        />
      </CardContent>
    </Card>
  );
}

type LocalUploadTileProps = {
  item: LocalUploadItem;
  onRemove: () => void;
  onRetry?: () => void;
};

function LocalUploadTile({ item, onRemove, onRetry }: LocalUploadTileProps) {
  const showProgress = item.status === "uploading" || item.status === "queued";
  const canRemove = item.status === "queued" || item.status === "failed";

  return (
    <div className="upload-tile">
      <div className="upload-thumb">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.previewUrl} alt="" />
        ) : (
          <span className="upload-thumb-fallback" aria-hidden>
            IMG
          </span>
        )}
        {showProgress ? (
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
        {item.status === "failed" && item.error ? <p className="upload-error">{item.error}</p> : null}
        <div className="upload-actions">
          {onRetry ? (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          {canRemove ? (
            <Button type="button" size="sm" variant="outline" onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
