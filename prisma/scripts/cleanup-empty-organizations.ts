import { prisma } from "../../packages/database/src/client.ts"

type EmptyOrganizationCandidate = {
  id: string
  name: string
  slug: string
  plan: string | null
  subscriptionStatus: string | null
  isActive: boolean
  createdAt: Date
  counts: {
    memberships: number
    orders: number
    uploads: number
    assets: number
    invoices: number
    services: number
  }
}

const execute = process.argv.includes("--execute")

async function findEmptyOrganizations(): Promise<EmptyOrganizationCandidate[]> {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      subscriptionStatus: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          memberships: true,
          orders: true,
          invoices: true,
          services: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  const candidates: EmptyOrganizationCandidate[] = []

  for (const organization of organizations) {
    const [uploads, assets] = await Promise.all([
      prisma.upload.count({ where: { organizationId: organization.id } }),
      prisma.asset.count({ where: { organizationId: organization.id } })
    ])

    const counts = {
      memberships: organization._count.memberships,
      orders: organization._count.orders,
      uploads,
      assets,
      invoices: organization._count.invoices,
      services: organization._count.services
    }

    const isEmpty =
      counts.memberships === 0 &&
      counts.orders === 0 &&
      counts.uploads === 0 &&
      counts.assets === 0 &&
      counts.invoices === 0 &&
      counts.services === 0

    if (isEmpty) {
      candidates.push({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        subscriptionStatus: organization.subscriptionStatus,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
        counts
      })
    }
  }

  return candidates
}

function printCandidates(candidates: EmptyOrganizationCandidate[]) {
  if (candidates.length === 0) {
    console.log("No empty organizations found.")
    return
  }

  console.log(`Found ${candidates.length} empty organization(s):\n`)

  for (const organization of candidates) {
    console.log(
      [
        `- ${organization.name}`,
        `  id: ${organization.id}`,
        `  slug: ${organization.slug}`,
        `  plan: ${organization.plan ?? "—"}`,
        `  subscription: ${organization.subscriptionStatus ?? "—"}`,
        `  active: ${organization.isActive}`,
        `  created: ${organization.createdAt.toISOString()}`,
        `  counts: memberships=${organization.counts.memberships}, orders=${organization.counts.orders}, uploads=${organization.counts.uploads}, assets=${organization.counts.assets}, invoices=${organization.counts.invoices}, services=${organization.counts.services}`
      ].join("\n")
    )
    console.log("")
  }
}

async function deleteCandidates(candidates: EmptyOrganizationCandidate[]) {
  if (candidates.length === 0) {
    return
  }

  await prisma.$transaction(async (tx) => {
    for (const organization of candidates) {
      const [memberships, orders, uploads, assets, invoices, services] = await Promise.all([
        tx.membership.count({ where: { organizationId: organization.id } }),
        tx.order.count({ where: { organizationId: organization.id } }),
        tx.upload.count({ where: { organizationId: organization.id } }),
        tx.asset.count({ where: { organizationId: organization.id } }),
        tx.invoice.count({ where: { organizationId: organization.id } }),
        tx.service.count({ where: { organizationId: organization.id } })
      ])

      const stillEmpty =
        memberships === 0 &&
        orders === 0 &&
        uploads === 0 &&
        assets === 0 &&
        invoices === 0 &&
        services === 0

      if (!stillEmpty) {
        throw new Error(
          `Aborting: organization ${organization.id} (${organization.slug}) gained related data before deletion.`
        )
      }

      await tx.organization.delete({ where: { id: organization.id } })
      console.log(`Deleted organization ${organization.slug} (${organization.id})`)
    }
  })
}

async function main() {
  console.log(execute ? "Running cleanup (execute mode)...\n" : "Dry run (preview only)...\n")

  const candidates = await findEmptyOrganizations()
  printCandidates(candidates)

  if (!execute) {
    if (candidates.length > 0) {
      console.log("No changes made. Re-run with --execute to delete the organizations listed above.")
    }
    return
  }

  if (candidates.length === 0) {
    return
  }

  await deleteCandidates(candidates)
  console.log(`\nCleanup complete. Deleted ${candidates.length} organization(s).`)
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
