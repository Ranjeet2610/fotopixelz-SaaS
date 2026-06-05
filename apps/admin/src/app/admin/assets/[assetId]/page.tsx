import { AssetDetailPage } from "@/components/asset-detail-page";

export default async function Page({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  return <AssetDetailPage assetId={assetId} />;
}
