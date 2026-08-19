export type AssetRecord = {
  id: string;
  organizationId: string;
  orderId: string;
  name: string;
  fileName: string;
  mimeType: string;
  storageUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    title: string;
    status: string;
    updatedAt?: string;
  };
};

export type AssetDownload = {
  downloadUrl: string;
  expiresIn: number;
};

export type PaginatedAssets = {
  items: AssetRecord[];
  page?: number;
  limit?: number;
  total?: number;
};
