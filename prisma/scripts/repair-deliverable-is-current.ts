import { prisma } from "../../packages/database/src/client.ts"

type AffectedBatch = {
  orderId: string
  orderTitle: string
  deliverableVersion: number
  reviewRound: number
  readyAssetCount: number
  currentAssetCount: number
  assetIds: string[]
}

const execute = process.argv.includes("--execute")

async function findAffectedBatches(): Promise<AffectedBatch[]> {
  const orders = await prisma.order.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      title: true,
      deliverableVersion: true,
      reviewRound: true,
      assets: {
        where: {
          isDeleted: false,
          status: { in: ["READY", "DELIVERED"] }
        },
        select: {
          id: true,
          version: true,
          reviewRound: true,
          isCurrent: true
        }
      }
    }
  })

  const affected: AffectedBatch[] = []

  for (const order of orders) {
    if (order.deliverableVersion <= 0) {
      continue
    }

    const batchAssets = order.assets.filter(
      (asset) =>
        asset.version === order.deliverableVersion && asset.reviewRound === order.reviewRound
    )

    if (batchAssets.length <= 1) {
      continue
    }

    const currentAssetCount = batchAssets.filter((asset) => asset.isCurrent).length

    if (currentAssetCount === batchAssets.length) {
      continue
    }

    affected.push({
      orderId: order.id,
      orderTitle: order.title,
      deliverableVersion: order.deliverableVersion,
      reviewRound: order.reviewRound,
      readyAssetCount: batchAssets.length,
      currentAssetCount,
      assetIds: batchAssets.map((asset) => asset.id)
    })
  }

  return affected
}

async function repairBatch(batch: AffectedBatch) {
  const result = await prisma.asset.updateMany({
    where: {
      id: { in: batch.assetIds },
      isDeleted: false,
      status: { in: ["READY", "DELIVERED"] },
      version: batch.deliverableVersion,
      reviewRound: batch.reviewRound
    },
    data: { isCurrent: true }
  })

  return result.count
}

async function main() {
  const affected = await findAffectedBatches()

  if (affected.length === 0) {
    console.log("No affected deliverable batches found.")
    return
  }

  console.log(`Found ${affected.length} affected batch(es):\n`)

  for (const batch of affected) {
    console.log(
      `- Order "${batch.orderTitle}" (${batch.orderId})` +
        ` | v${batch.deliverableVersion} round ${batch.reviewRound}` +
        ` | ${batch.readyAssetCount} READY/DELIVERED` +
        ` | ${batch.currentAssetCount} isCurrent=true`
    )
  }

  if (!execute) {
    console.log("\nDry run only. Re-run with --execute to repair affected assets.")
    return
  }

  console.log("\nRepairing...")

  let repairedAssets = 0
  for (const batch of affected) {
    const count = await repairBatch(batch)
    repairedAssets += count
    console.log(`  Repaired ${count} asset(s) for order ${batch.orderId}`)
  }

  console.log(`\nDone. Marked ${repairedAssets} asset(s) as isCurrent=true.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
