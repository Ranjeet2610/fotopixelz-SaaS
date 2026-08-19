import { prisma } from '../packages/database/src/client.ts'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const catalog = [
  {
    category: {
      name: 'Background Removal',
      description: 'Clean cutouts and transparent backgrounds for product imagery.'
    },
    services: [
      { name: 'Basic Background Removal', basePrice: 0.49, description: 'Single subject on plain backgrounds.' },
      { name: 'Complex Background Removal', basePrice: 1.25, description: 'Hair, fur, and intricate edges.' }
    ]
  },
  {
    category: {
      name: 'Ghost Mannequin',
      description: 'Invisible mannequin compositing for apparel products.'
    },
    services: [
      { name: 'Front Ghost Mannequin', basePrice: 1.5, description: 'Front-facing garment compositing.' },
      { name: '3D Ghost Mannequin', basePrice: 2.75, description: 'Front, back, and inner neck blending.' }
    ]
  },
  {
    category: {
      name: 'Fashion Retouching',
      description: 'Skin, fabric, and editorial cleanup for fashion imagery.'
    },
    services: [
      { name: 'Standard Fashion Retouch', basePrice: 1.0, description: 'Dust, wrinkle, and color cleanup.' },
      { name: 'High-End Fashion Retouch', basePrice: 2.5, description: 'Editorial-grade beauty and fabric work.' }
    ]
  },
  {
    category: {
      name: 'Jewelry Retouching',
      description: 'Metal, stone, and reflection enhancement for jewelry.'
    },
    services: [
      { name: 'Basic Jewelry Retouch', basePrice: 1.75, description: 'Dust removal and sparkle enhancement.' },
      { name: 'Premium Jewelry Retouch', basePrice: 3.5, description: 'Stone clarity, metal polish, and compositing.' }
    ]
  }
] as const

async function main() {
  for (const entry of catalog) {
    const categorySlug = slugify(entry.category.name)

    const category = await prisma.serviceCategory.upsert({
      where: { slug: categorySlug },
      update: {
        name: entry.category.name,
        description: entry.category.description
      },
      create: {
        name: entry.category.name,
        slug: categorySlug,
        description: entry.category.description
      }
    })

    for (const service of entry.services) {
      const serviceSlug = slugify(service.name)

      await prisma.service.upsert({
        where: { slug: serviceSlug },
        update: {
          name: service.name,
          description: service.description,
          basePrice: service.basePrice,
          categoryId: category.id,
          isActive: true,
          organizationId: null
        },
        create: {
          name: service.name,
          slug: serviceSlug,
          description: service.description,
          basePrice: service.basePrice,
          categoryId: category.id,
          organizationId: null,
          isActive: true
        }
      })
    }
  }

  const [categoryCount, serviceCount] = await prisma.$transaction([
    prisma.serviceCategory.count(),
    prisma.service.count({ where: { isActive: true } })
  ])

  console.log(`Seed complete: ${categoryCount} categories, ${serviceCount} active services.`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
