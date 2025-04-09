import { PrismaClient } from '@prisma/client'
import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const prisma = new PrismaClient()

  // Получаем все опубликованные посты блога
  const posts = await prisma.blogPost.findMany({
    where: {
      isPublished: true
    },
    select: {
      slug: true,
      updatedAt: true
    }
  })

  // Создаем записи для sitemap из блог постов
  const blogEntries = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }))

  // Основные страницы сайта
  const routes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5
    }
  ]

  // Очищаем соединение с базой данных
  await prisma.$disconnect()

  return [...routes, ...blogEntries]
}
