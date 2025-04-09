import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Получение списка заявок из формы обратной связи
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Формируем условие поиска
    let where = {}
    if (status) {
      where = { status }
    }

    // Получаем общее количество заявок
    const totalCount = await prisma.contactRequest.count({ where })

    // Получаем заявки с пагинацией и сортировкой
    const contactRequests = await prisma.contactRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      contactRequests,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching contact requests:', error)
    return NextResponse.json(
      { error: 'Не удалось получить заявки из формы обратной связи' },
      { status: 500 }
    )
  }
}

// Создание новой заявки из формы обратной связи
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Валидация основных полей
    if (!body.message) {
      return NextResponse.json(
        { error: 'Пожалуйста, заполните обязательное поле "Сообщение"' },
        { status: 400 }
      )
    }

    // Подготавливаем данные для создания
    const requestData = {
      ...body,
      status: 'new',
      updatedAt: new Date()
    }

    // Создаем новую заявку
    const contactRequest = await prisma.contactRequest.create({
      data: requestData,
    })

    return NextResponse.json({
      success: true,
      contactRequest
    })
  } catch (error) {
    console.error('Error creating contact request:', error)
    return NextResponse.json(
      { error: 'Не удалось создать заявку из формы обратной связи' },
      { status: 500 }
    )
  }
}

// Обновление заявки из формы обратной связи
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Проверяем наличие ID
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID заявки не указан' },
        { status: 400 }
      )
    }

    // Получаем текущую заявку
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id: body.id }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    // Подготавливаем данные для обновления
    const updateData = {
      ...body,
      updatedAt: new Date()
    }

    // Удаляем id из данных обновления
    delete updateData.id

    // Обновляем заявку
    const updatedRequest = await prisma.contactRequest.update({
      where: { id: body.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      contactRequest: updatedRequest
    })
  } catch (error) {
    console.error('Error updating contact request:', error)
    return NextResponse.json(
      { error: 'Не удалось обновить заявку из формы обратной связи' },
      { status: 500 }
    )
  }
}

// Удаление заявки из формы обратной связи
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = parseInt(url.searchParams.get('id') || '0')

    if (!id) {
      return NextResponse.json(
        { error: 'ID заявки не указан' },
        { status: 400 }
      )
    }

    // Проверяем существование заявки
    const existingRequest = await prisma.contactRequest.findUnique({
      where: { id }
    })

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    // Удаляем заявку
    await prisma.contactRequest.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting contact request:', error)
    return NextResponse.json(
      { error: 'Не удалось удалить заявку из формы обратной связи' },
      { status: 500 }
    )
  }
}
