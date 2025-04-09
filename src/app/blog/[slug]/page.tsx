'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

type BlogPost = {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  imageUrl: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export default function BlogPostPage({
  params
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const defaultImage = '/images/default-blog.jpg'

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/blog/slug/${slug}`)

        if (!response.ok) {
          if (response.status === 404) {
            return notFound()
          }
          throw new Error('Не удалось загрузить статью')
        }

        const data = await response.json()
        setPost(data.post)
      } catch (error) {
        console.error('Error fetching blog post:', error)
        setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке статьи')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  // Если пост не найден, показываем страницу 404
  if (!isLoading && !post) {
    return notFound()
  }

  // Расчет времени чтения
  const readTime = post ? Math.max(1, Math.ceil(post.content.length / 1000)) + ' мин' : '1 мин'

  // Форматирование даты публикации
  const publishedDate = post?.publishedAt
    ? new Date(post.publishedAt)
    : post?.createdAt
      ? new Date(post.createdAt)
      : new Date()

  return (
    <>
      <Header />
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="mb-8">
            <Link href="/blog">
              <Button variant="outline" className="group mb-6">
                <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Вернуться к списку</span>
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-red-50 text-red-700">
              {error}
            </div>
          ) : post ? (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <div
                className="h-[300px] md:h-[400px] w-full bg-cover bg-center rounded-xl mb-8 relative"
                style={{
                  backgroundImage: `url(${post.imageUrl || defaultImage})`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 rounded-xl flex flex-col justify-end p-6 md:p-8">
                  <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
                  <div className="flex items-center space-x-4 text-white">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">{readTime}</span>
                    </div>
                    <div className="text-sm">{publishedDate.toLocaleDateString('ru-RU')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </motion.article>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  )
}
