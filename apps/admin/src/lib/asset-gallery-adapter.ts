import type { DeliverableRecord } from "@repo/upload-gallery";

import { getId, nestedText, textValue } from "@/lib/format";

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



export function toDeliverableRecords(rows: ApiRecord[]): DeliverableRecord[] {

  return rows

    .filter((row) => !row.isDeleted)

    .map((row) => {
      const fileName = stringField(row.fileName, "file");
      return {
      id: getId(row),

      name: textValue(row.name ?? row.fileName, "Deliverable"),

      fileName,

      mimeType: inferMimeType(stringField(row.mimeType), fileName),

      status: stringField(row.status, "PENDING"),

      version: Number(row.version ?? 1),

      reviewRound: Number(row.reviewRound ?? 1),

      isCurrent: Boolean(row.isCurrent),

      uploadedBy: nestedText(row, ["uploadedBy", "name"]) || nestedText(row, ["uploadedBy", "email"]),

      createdAt: stringField(row.createdAt),
    };
    });

}



export type CurrentDeliverableOptions = {
  deliverableVersion?: number;
  reviewRound?: number;
};

export function countReadyDeliverables(rows: ApiRecord[], options?: CurrentDeliverableOptions) {
  return countCurrentReadyDeliverables(rows, options);
}

export function getCurrentDeliverables(rows: ApiRecord[], options?: CurrentDeliverableOptions) {
  const readyRows = rows.filter(
    (row) =>
      !row.isDeleted &&
      (stringField(row.status) === "READY" || stringField(row.status) === "DELIVERED"),
  );

  const version = Number(options?.deliverableVersion ?? 0);
  const reviewRound = Number(options?.reviewRound ?? 0);

  if (version > 0) {
    return readyRows.filter((row) => {
      const matchesVersion = Number(row.version ?? 0) === version;
      const matchesRound = reviewRound <= 0 || Number(row.reviewRound ?? 1) === reviewRound;
      return matchesVersion && matchesRound;
    });
  }

  return readyRows.filter((row) => row.isCurrent === true);
}

export function countCurrentReadyDeliverables(rows: ApiRecord[], options?: CurrentDeliverableOptions) {
  return getCurrentDeliverables(rows, options).length;
}

export function countPendingDeliverables(rows: ApiRecord[], options?: CurrentDeliverableOptions) {
  const version = Number(options?.deliverableVersion ?? 0);
  const reviewRound = Number(options?.reviewRound ?? 0);
  const batchVersion = version > 0 ? version : 1;

  return rows.filter((row) => {
    if (row.isDeleted) {
      return false;
    }
    if (stringField(row.status) !== "PENDING") {
      return false;
    }
    const matchesRound = reviewRound <= 0 || Number(row.reviewRound ?? 1) === reviewRound;
    const matchesVersion = Number(row.version ?? 0) === batchVersion;
    return matchesRound && matchesVersion;
  }).length;
}

export type DeliverableQuotaSummary = {
  sourceImageCount: number;
  uploadedCount: number;
  pendingCount: number;
  remainingAllowed: number;
};

export function computeDeliverableQuota(
  sourceImageCount: number,
  assets: ApiRecord[],
  options?: CurrentDeliverableOptions,
): DeliverableQuotaSummary {
  const uploadedCount = countCurrentReadyDeliverables(assets, options);
  const pendingCount = countPendingDeliverables(assets, options);
  const maximumAllowed = sourceImageCount;
  const remainingAllowed = Math.max(maximumAllowed - uploadedCount - pendingCount, 0);

  return {
    sourceImageCount,
    uploadedCount,
    pendingCount,
    remainingAllowed,
  };
}



export function getNextUploadVersion(rows: ApiRecord[], orderDeliverableVersion = 0) {

  const maxFromAssets = rows.reduce((max, row) => Math.max(max, Number(row.version ?? 0)), 0);

  return Math.max(orderDeliverableVersion, maxFromAssets) + 1;

}



export type DeliverableVersionGroup = {

  version: number;

  reviewRound: number;

  isCurrent: boolean;

  items: ApiRecord[];

  uploadedBy: string;

  createdAt: string;

};



export function groupDeliverablesByVersion(rows: ApiRecord[]): DeliverableVersionGroup[] {

  const readyRows = rows.filter(

    (row) =>

      !row.isDeleted &&

      (stringField(row.status) === "READY" || stringField(row.status) === "DELIVERED"),

  );



  const groups = new Map<number, ApiRecord[]>();

  for (const row of readyRows) {

    const version = Number(row.version ?? 1);

    const existing = groups.get(version) ?? [];

    existing.push(row);

    groups.set(version, existing);

  }



  return Array.from(groups.entries())

    .map(([version, items]) => {

      const sorted = [...items].sort(

        (left, right) => new Date(String(right.createdAt)).getTime() - new Date(String(left.createdAt)).getTime(),

      );

      const lead = sorted[0];

      return {

        version,

        reviewRound: Number(lead?.reviewRound ?? 1),

        isCurrent: sorted.some((item) => item.isCurrent === true),

        items: sorted,

        uploadedBy:

          nestedText(lead, ["uploadedBy", "name"]) ||

          nestedText(lead, ["uploadedBy", "email"]) ||

          nestedText(lead, ["createdBy", "email"]) ||

          "—",

        createdAt: stringField(lead?.createdAt),

      };

    })

    .sort((left, right) => right.version - left.version);

}
