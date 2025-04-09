'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, ArrowRight, ArrowLeft } from 'lucide-react'
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

function BlogPost({ post }: { post: BlogPost }) {
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt)
  const readTime = Math.max(1, Math.ceil(post.content.length / 1000)) + ' мин'
  const defaultImage = '/images/default-blog.jpg'

  return (
    <Link href={`/blog/${post.slug}`} className="flex flex-col h-full group">
      <motion.div
        className="overflow-hidden rounded-lg blog-card-hover h-full"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="h-60 bg-cover bg-center"
          style={{
            backgroundImage: `url(${post.imageUrl || defaultImage})`
          }}
        >
          <div className="w-full h-full flex items-end blog-overlay">
            <div className="text-white p-4">
              <h3 className="text-xl font-bold mb-2">{post.title}</h3>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>{readTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-800 flex-1">
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
          <span className="text-blue-600 dark:text-blue-400 font-medium inline-flex items-center group-hover:text-blue-700 transition-colors">
            Читать полностью
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </motion.div>
    </Link>
  )
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch('/api/blog')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Не удалось загрузить статьи блога')
        }

        // Фильтруем только опубликованные статьи
        const publishedPosts = data.blogPosts.filter((post: BlogPost) => post.isPublished)
        setBlogPosts(publishedPosts)
      } catch (error) {
        console.error('Error fetching blog posts:', error)
        setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке статей')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlogPosts()
  }, [])

  return (
    <>
      <Header />
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-20">
          <div className="mb-10 flex items-center">
            <Link href="/">
              <Button variant="outline" className="group mr-4">
                <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>На главную</span>
              </Button>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">Блог о путешествиях</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-red-50 text-red-700">
              {error}
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <p className="text-gray-500 text-xl">Скоро здесь появятся интересные статьи</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <BlogPost key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
