import { prisma } from "../../packages/database/src/client.ts"

const KEEP_ROLES = ["ADMIN", "SUPER_ADMIN"] as const
const DELETE_ROLES = ["CLIENT", "EDITOR", "QA"] as const

async function main() {
  const [
    usersToKeep,
    usersToDelete,
    allOrganizations,
    demoOrgs,
    trialOrgs,
    orgsOwnedByDeletedUsers,
    membershipsOnDeletedUsers,
    membershipsOnKeptUsers,
    orders,
    orderItems,
    orderAddons,
    uploads,
    assets,
    assetVersions,
    editingJobs,
    aiJobs,
    qaReviews,
    revisions,
    payments,
    invoices,
    notificationsDeletedUsers,
    auditLogsDeletedUsers,
    workflowEvents,
    billingProfilesDeletedUsers,
    orgScopedServices,
    serviceCategories,
    globalServices,
    addons,
    emptyOrgs,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: [...KEEP_ROLES] } },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { in: [...DELETE_ROLES] } },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
        isActive: true,
        createdAt: true,
        _count: { select: { memberships: true, orders: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organization.findMany({
      where: { plan: "DEMO" },
      select: { id: true, name: true, slug: true, plan: true, subscriptionStatus: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organization.findMany({
      where: { subscriptionStatus: "TRIAL" },
      select: { id: true, name: true, slug: true, plan: true, subscriptionStatus: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organization.findMany({
      where: {
        memberships: {
          some: {
            role: "OWNER",
            user: { role: { in: [...DELETE_ROLES] } },
          },
        },
      },
      select: { id: true, name: true, slug: true, plan: true, subscriptionStatus: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.membership.count({ where: { user: { role: { in: [...DELETE_ROLES] } } } }),
    prisma.membership.count({ where: { user: { role: { in: [...KEEP_ROLES] } } } }),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.orderAddon.count(),
    prisma.upload.count(),
    prisma.asset.count(),
    prisma.assetVersion.count(),
    prisma.editingJob.count(),
    prisma.aiJob.count(),
    prisma.qAReview.count(),
    prisma.revision.count(),
    prisma.payment.count(),
    prisma.invoice.count(),
    prisma.notification.count({ where: { user: { role: { in: [...DELETE_ROLES] } } } }),
    prisma.auditLog.count({ where: { user: { role: { in: [...DELETE_ROLES] } } } }),
    prisma.workflowEvent.count(),
    prisma.userBillingProfile.count({ where: { user: { role: { in: [...DELETE_ROLES] } } } }),
    prisma.service.count({ where: { organizationId: { not: null } } }),
    prisma.serviceCategory.count(),
    prisma.service.count({ where: { organizationId: null } }),
    prisma.addon.count(),
    prisma.organization.findMany({
      where: { memberships: { none: {} } },
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const deletedUserIds = new Set(usersToDelete.map((user) => user.id))

  const orgsWithKeptMember = await prisma.organization.findMany({
    where: {
      memberships: {
        some: {
          user: { role: { in: [...KEEP_ROLES] } },
        },
      },
    },
    select: { id: true },
  })
  const keptMemberOrgIds = new Set(orgsWithKeptMember.map((org) => org.id))

  const organizationsToDelete = new Map<string, (typeof allOrganizations)[number] & { reasons: string[] }>()

  function markOrg(org: { id: string; name: string; slug: string; plan?: string | null; subscriptionStatus?: string | null }, reason: string) {
    const existing = allOrganizations.find((item) => item.id === org.id)
    if (!existing) return
    const current = organizationsToDelete.get(org.id)
    if (current) {
      if (!current.reasons.includes(reason)) current.reasons.push(reason)
      return
    }
    organizationsToDelete.set(org.id, { ...existing, reasons: [reason] })
  }

  for (const org of demoOrgs) markOrg(org, "DEMO plan")
  for (const org of trialOrgs) markOrg(org, "TRIAL subscription")
  for (const org of orgsOwnedByDeletedUsers) markOrg(org, "OWNER is deleted-role user")
  for (const org of emptyOrgs) markOrg(org, "zero memberships")

  for (const org of allOrganizations) {
    const members = await prisma.membership.findMany({
      where: { organizationId: org.id },
      select: { userId: true, role: true, user: { select: { email: true, role: true } } },
    })

    const hasKeptPlatformUser = members.some((member) =>
      KEEP_ROLES.includes(member.user.role as (typeof KEEP_ROLES)[number]),
    )
    const allMembersDeleted = members.length > 0 && members.every((member) => deletedUserIds.has(member.userId))

    if (allMembersDeleted) {
      markOrg(org, "all members are CLIENT/EDITOR/QA users being deleted")
    }

    if (!hasKeptPlatformUser && members.some((member) => deletedUserIds.has(member.userId))) {
      markOrg(org, "linked only to deleted-role users")
    }
  }

  for (const orgId of keptMemberOrgIds) {
    organizationsToDelete.delete(orgId)
  }

  const orgDeleteList = [...organizationsToDelete.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const orgDeleteIds = new Set(orgDeleteList.map((org) => org.id))

  const [
    ordersInDeletedOrgs,
    uploadsInDeletedOrgs,
    assetsInDeletedOrgs,
    invoicesInDeletedOrgs,
    orgServicesInDeletedOrgs,
    ordersByDeletedUsers,
    uploadsByDeletedUsers,
    assetsByDeletedUsers,
  ] = await Promise.all([
    prisma.order.count({ where: { organizationId: { in: [...orgDeleteIds] } } }),
    prisma.upload.count({ where: { organizationId: { in: [...orgDeleteIds] } } }),
    prisma.asset.count({ where: { organizationId: { in: [...orgDeleteIds] } } }),
    prisma.invoice.count({ where: { organizationId: { in: [...orgDeleteIds] } } }),
    prisma.service.count({ where: { organizationId: { in: [...orgDeleteIds] } } }),
    prisma.order.count({ where: { createdById: { in: [...deletedUserIds] } } }),
    prisma.upload.count({ where: { userId: { in: [...deletedUserIds] } } }),
    prisma.asset.count({ where: { createdById: { in: [...deletedUserIds] } } }),
  ])

  const orgsToKeep = allOrganizations.filter((org) => !orgDeleteIds.has(org.id))

  console.log("=".repeat(72))
  console.log("FOTOPIXELZ DEV CLEANUP — DRY RUN REPORT")
  console.log("No database modifications were made.")
  console.log("=".repeat(72))
  console.log("")

  console.log("## 1. USERS TO KEEP (ADMIN / SUPER_ADMIN)")
  console.log(`Count: ${usersToKeep.length}`)
  for (const user of usersToKeep) {
    console.log(`  - ${user.email} | ${user.role} | active=${user.isActive} | id=${user.id}`)
  }
  console.log("")

  console.log("## 2. USERS TO DELETE (CLIENT / EDITOR / QA)")
  console.log(`Count: ${usersToDelete.length}`)
  for (const user of usersToDelete) {
    console.log(`  - ${user.email} | ${user.role} | active=${user.isActive} | id=${user.id}`)
  }
  console.log("")

  console.log("## 3. ORGANIZATIONS TO DELETE")
  console.log(`Count: ${orgDeleteList.length}`)
  for (const org of orgDeleteList) {
    console.log(
      `  - ${org.name} | slug=${org.slug} | plan=${org.plan ?? "—"} | subscription=${org.subscriptionStatus ?? "—"} | members=${org._count.memberships} | orders=${org._count.orders} | reasons=${org.reasons.join("; ")} | id=${org.id}`,
    )
  }
  console.log("")

  console.log("## 4. ORGANIZATIONS TO KEEP")
  console.log(`Count: ${orgsToKeep.length}`)
  for (const org of orgsToKeep) {
    console.log(
      `  - ${org.name} | slug=${org.slug} | plan=${org.plan ?? "—"} | subscription=${org.subscriptionStatus ?? "—"} | members=${org._count.memberships} | orders=${org._count.orders} | id=${org.id}`,
    )
  }
  console.log("")

  console.log("## 5. TABLE IMPACT COUNTS (current database totals)")
  const tableCounts = [
    ["User (delete roles)", usersToDelete.length],
    ["User (keep roles)", usersToKeep.length],
    ["Organization (delete set)", orgDeleteList.length],
    ["Organization (keep set)", orgsToKeep.length],
    ["Membership (deleted users)", membershipsOnDeletedUsers],
    ["Membership (kept users)", membershipsOnKeptUsers],
    ["Order (all)", orders],
    ["Order (in deleted orgs)", ordersInDeletedOrgs],
    ["Order (created by deleted users)", ordersByDeletedUsers],
    ["OrderItem (all)", orderItems],
    ["OrderAddon (all)", orderAddons],
    ["Upload (all)", uploads],
    ["Upload (in deleted orgs)", uploadsInDeletedOrgs],
    ["Upload (by deleted users)", uploadsByDeletedUsers],
    ["Asset (all)", assets],
    ["Asset (in deleted orgs)", assetsInDeletedOrgs],
    ["Asset (by deleted users)", assetsByDeletedUsers],
    ["AssetVersion (all)", assetVersions],
    ["EditingJob (all)", editingJobs],
    ["AiJob (all)", aiJobs],
    ["QAReview (all)", qaReviews],
    ["Revision (all)", revisions],
    ["Payment (all)", payments],
    ["Invoice (all)", invoices],
    ["Invoice (in deleted orgs)", invoicesInDeletedOrgs],
    ["Notification (deleted users)", notificationsDeletedUsers],
    ["AuditLog (deleted users)", auditLogsDeletedUsers],
    ["WorkflowEvent (all)", workflowEvents],
    ["UserBillingProfile (deleted users)", billingProfilesDeletedUsers],
    ["Service (org-scoped, all)", orgScopedServices],
    ["Service (org-scoped, deleted orgs)", orgServicesInDeletedOrgs],
    ["Service (global catalog)", globalServices],
    ["ServiceCategory (catalog)", serviceCategories],
    ["Addon (catalog)", addons],
  ] as const

  for (const [label, count] of tableCounts) {
    console.log(`  ${label}: ${count}`)
  }
  console.log("")

  console.log("## 6. CATALOG DATA (KEEP unless org-scoped service overrides)")
  console.log(`  Global services (organizationId IS NULL): ${globalServices}`)
  console.log(`  Service categories: ${serviceCategories}`)
  console.log(`  Addons: ${addons}`)
  console.log("")

  console.log("## 7. POST-CLEANUP VALIDATION (projected)")
  console.log(`  Remaining users: ${usersToKeep.length} (all ADMIN/SUPER_ADMIN)`)
  console.log(`  Remaining organizations: ${orgsToKeep.length}`)
  console.log(`  Remaining memberships for kept users: ${membershipsOnKeptUsers}`)
  const riskyKeptOrgs = orgsToKeep.filter((org) => org._count.orders > 0 || org._count.memberships === 0)
  if (riskyKeptOrgs.length > 0) {
    console.log("  Review kept orgs with orders or zero members:")
    for (const org of riskyKeptOrgs) {
      console.log(`    - ${org.slug} | members=${org._count.memberships} | orders=${org._count.orders}`)
    }
  } else {
    console.log("  No kept organizations with orphan orders or zero memberships.")
  }
  console.log("")
  console.log("=".repeat(72))
}

main()
  .catch((error) => {
    console.error("Dry-run failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
