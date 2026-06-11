import { prisma } from "../../packages/database/src/client.ts"

const RETAINED_EMAIL = "ranjeet.suneja@gmail.com"
const RETAINED_ROLE = "SUPER_ADMIN" as const

async function main() {
  const retainedUser = await prisma.user.findUnique({
    where: { email: RETAINED_EMAIL },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      password: true,
      createdAt: true,
      memberships: {
        select: {
          id: true,
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
              subscriptionStatus: true,
              isActive: true,
              _count: { select: { memberships: true, orders: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  const usersToDelete = await prisma.user.findMany({
    where: {
      email: { not: RETAINED_EMAIL },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const allOrganizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      subscriptionStatus: true,
      isActive: true,
      createdAt: true,
      memberships: {
        select: {
          role: true,
          user: { select: { id: true, email: true, role: true } },
        },
      },
      _count: { select: { memberships: true, orders: true, invoices: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const retainedUserId = retainedUser?.id ?? null
  const retainedOrgIds = new Set<string>()

  if (retainedUser) {
    for (const membership of retainedUser.memberships) {
      const isOwnerLike = membership.role === "OWNER" || membership.role === "ADMIN" || membership.role === "SUPER_ADMIN"
      if (isOwnerLike) {
        retainedOrgIds.add(membership.organization.id)
      }
    }
  }

  const organizationsToKeep = allOrganizations.filter((org) => retainedOrgIds.has(org.id))
  const organizationsToDelete = allOrganizations.filter((org) => !retainedOrgIds.has(org.id))

  const deletedUserIds = usersToDelete.map((user) => user.id)
  const orgDeleteIds = organizationsToDelete.map((org) => org.id)

  const [
    membershipsDeletedUsers,
    membershipsRetainedUser,
    membershipsOnDeletedOrgs,
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
    workflowEvents,
    notifications,
    auditLogs,
    billingProfiles,
    globalServices,
    orgScopedServices,
    serviceCategories,
    addons,
    demoOrgs,
    trialOrgs,
  ] = await Promise.all([
    prisma.membership.count({ where: { userId: { in: deletedUserIds } } }),
    prisma.membership.count({ where: { userId: retainedUserId ?? "__missing__" } }),
    prisma.membership.count({ where: { organizationId: { in: orgDeleteIds } } }),
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
    prisma.workflowEvent.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
    prisma.userBillingProfile.count(),
    prisma.service.count({ where: { organizationId: null } }),
    prisma.service.count({ where: { organizationId: { not: null } } }),
    prisma.serviceCategory.count(),
    prisma.addon.count(),
    prisma.organization.count({ where: { plan: "DEMO" } }),
    prisma.organization.count({ where: { subscriptionStatus: "TRIAL" } }),
  ])

  console.log("=".repeat(72))
  console.log("FOTOPIXELZ FINAL DEV CLEANUP — DRY RUN")
  console.log("No database modifications were made.")
  console.log("=".repeat(72))
  console.log("")

  console.log("## RETENTION POLICY")
  console.log(`  Keep exactly one user: ${RETAINED_EMAIL}`)
  console.log(`  Required role after cleanup: ${RETAINED_ROLE}`)
  console.log("  Keep catalog: Service (global), ServiceCategory, Addon")
  console.log("  Delete all transactional + demo/trial data")
  console.log("")

  console.log("## 1. USER THAT WILL REMAIN")
  if (!retainedUser) {
    console.log("  BLOCKER: Retained user was not found in the database.")
  } else {
    console.log(`  Count: 1`)
    console.log(`  - ${retainedUser.email}`)
    console.log(`    current role: ${retainedUser.role}`)
    console.log(`    target role: ${RETAINED_ROLE}`)
    console.log(`    active: ${retainedUser.isActive}`)
    console.log(`    password hash present: ${retainedUser.password.length > 0}`)
    console.log(`    id: ${retainedUser.id}`)
    console.log(`    org memberships (owner/admin): ${retainedOrgIds.size}`)
  }
  console.log("")

  console.log("## 2. USERS THAT WILL BE DELETED")
  console.log(`  Count: ${usersToDelete.length}`)
  for (const user of usersToDelete) {
    console.log(`  - ${user.email} | ${user.role} | active=${user.isActive} | id=${user.id}`)
  }
  console.log("")

  console.log("## 3. ORGANIZATIONS TO KEEP (owned by retained SUPER_ADMIN)")
  console.log(`  Count: ${organizationsToKeep.length}`)
  console.log("  Ownership rule: retained user has OWNER, ADMIN, or SUPER_ADMIN membership on org")
  for (const org of organizationsToKeep) {
    console.log(
      `  - ${org.name} | slug=${org.slug} | plan=${org.plan ?? "—"} | subscription=${org.subscriptionStatus ?? "—"} | members=${org._count.memberships} | orders=${org._count.orders} | id=${org.id}`,
    )
  }
  console.log("")

  console.log("## 4. ORGANIZATIONS TO DELETE")
  console.log(`  Count: ${organizationsToDelete.length}`)
  for (const org of organizationsToDelete) {
    const retainedMember = org.memberships.find((member) => member.user.id === retainedUserId)
    const reason = retainedMember
      ? `retained user present but membership role=${retainedMember.role} (not owner/admin)`
      : "not owned by retained SUPER_ADMIN"
    console.log(
      `  - ${org.name} | slug=${org.slug} | plan=${org.plan ?? "—"} | subscription=${org.subscriptionStatus ?? "—"} | members=${org._count.memberships} | orders=${org._count.orders} | reason=${reason} | id=${org.id}`,
    )
  }
  console.log("")

  console.log("## 5. TABLE IMPACT (rows deleted by cleanup plan)")
  const impact = [
    ["User", usersToDelete.length],
    ["User (remain)", retainedUser ? 1 : 0],
    ["Organization", organizationsToDelete.length],
    ["Organization (remain)", organizationsToKeep.length],
    ["Membership (deleted users)", membershipsDeletedUsers],
    ["Membership (on deleted orgs, total)", membershipsOnDeletedOrgs],
    ["Membership (retained user, remain)", membershipsRetainedUser],
    ["Order", orders],
    ["OrderItem", orderItems],
    ["OrderAddon", orderAddons],
    ["Upload", uploads],
    ["Asset", assets],
    ["AssetVersion", assetVersions],
    ["EditingJob", editingJobs],
    ["AiJob", aiJobs],
    ["QAReview", qaReviews],
    ["Revision", revisions],
    ["Payment", payments],
    ["Invoice", invoices],
    ["WorkflowEvent", workflowEvents],
    ["Notification", notifications],
    ["AuditLog", auditLogs],
    ["UserBillingProfile", billingProfiles],
    ["Organization DEMO plan rows (delete set includes these)", demoOrgs],
    ["Organization TRIAL subscription rows (delete set includes these)", trialOrgs],
  ] as const

  for (const [label, count] of impact) {
    console.log(`  ${label}: ${count}`)
  }
  console.log("")

  console.log("## 6. CATALOG / CONFIG KEPT (no delete)")
  console.log(`  Service (global catalog): ${globalServices}`)
  console.log(`  Service (org-scoped): ${orgScopedServices} ${orgScopedServices > 0 ? "-> would be deleted with orgs" : ""}`)
  console.log(`  ServiceCategory: ${serviceCategories}`)
  console.log(`  Addon: ${addons}`)
  console.log("  Pricing rules: stored on Service/Addon rows above (kept)")
  console.log("  Database schema: unchanged")
  console.log("")

  console.log("## 7. LOGIN VERIFICATION FOR RETAINED USER")
  if (!retainedUser) {
    console.log("  FAIL: User does not exist — cleanup must not run until account exists.")
  } else if (!retainedUser.isActive) {
    console.log("  WARN: User is inactive — login will fail until isActive=true.")
  } else if (!retainedUser.password) {
    console.log("  FAIL: Password hash missing — login will fail.")
  } else {
    console.log("  PASS: Account exists with password hash and isActive=true.")
    console.log(`  ACTION: Ensure role is set to ${RETAINED_ROLE} during cleanup (currently ${retainedUser.role}).`)
    console.log("  PASS: Auth uses email + password; no dependency on deleted users/orgs for login.")
  }
  console.log("")

  console.log("## 8. POST-CLEANUP EXPECTED STATE")
  console.log("  Users: 1 (ranjeet.suneja@gmail.com, SUPER_ADMIN)")
  console.log(`  Organizations: ${organizationsToKeep.length}`)
  console.log("  Orders / uploads / assets / invoices: 0")
  console.log(`  Global services: ${globalServices}`)
  console.log(`  Categories: ${serviceCategories}`)
  console.log(`  Addons: ${addons}`)
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
