import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Схема валидации для добавления фотографии
const addPhotoSchema = z.object({
  url: z.string().url('Должен быть валидный URL'),
  title: z.string().optional(),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
});

// GET /api/galleries/[id]/photos - получение всех фотографий галереи
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const galleryId = parseInt(params.id);

    if (isNaN(galleryId)) {
      return NextResponse.json(
        { error: 'ID галереи должен быть числовым' },
        { status: 400 }
      );
    }

    // Проверяем существование галереи
    const gallery = await prisma.photoGallery.findUnique({
      where: { id: galleryId },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Галерея не найдена' },
        { status: 404 }
      );
    }

    const photos = await prisma.galleryPhoto.findMany({
      where: { galleryId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Ошибка при получении фотографий:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении фотографий' },
      { status: 500 }
    );
  }
}

// POST /api/galleries/[id]/photos - добавление новой фотографии
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Проверка авторизации
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: 'Требуется авторизация' },
      { status: 401 }
    );
  }

  try {
    const galleryId = parseInt(params.id);

    if (isNaN(galleryId)) {
      return NextResponse.json(
        { error: 'ID галереи должен быть числовым' },
        { status: 400 }
      );
    }

    // Проверяем существование галереи
    const gallery = await prisma.photoGallery.findUnique({
      where: { id: galleryId },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Галерея не найдена' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Поддержка массива фотографий
    if (Array.isArray(body)) {
      const photosToAdd = [];
      const errors = [];

      for (let i = 0; i < body.length; i++) {
        const validation = addPhotoSchema.safeParse(body[i]);
        if (validation.success) {
          photosToAdd.push({
            url: body[i].url,
            title: body[i].title,
            description: body[i].description,
            order: body[i].order ?? i,
            galleryId,
          });
        } else {
          errors.push({
            index: i,
            errors: validation.error.format(),
          });
        }
      }

      if (photosToAdd.length === 0) {
        return NextResponse.json(
          { error: 'Все фотографии имеют некорректные данные', details: errors },
          { status: 400 }
        );
      }

      // Создаем все валидные фотографии
      const createdPhotos = await prisma.$transaction(
        photosToAdd.map(photo =>
          prisma.galleryPhoto.create({ data: photo })
        )
      );

      return NextResponse.json({
        created: createdPhotos,
        errors: errors.length > 0 ? errors : undefined,
      }, { status: 201 });
    } else {
      // Валидация данных для одной фотографии
      const validation = addPhotoSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Ошибка валидации', details: validation.error.format() },
          { status: 400 }
        );
      }

      // Определяем порядок если не указан
      let order = body.order;
      if (order === undefined) {
        const lastPhoto = await prisma.galleryPhoto.findFirst({
          where: { galleryId },
          orderBy: { order: 'desc' },
        });
        order = lastPhoto ? lastPhoto.order + 1 : 0;
      }

      // Создаем новую фотографию
      const newPhoto = await prisma.galleryPhoto.create({
        data: {
          url: body.url,
          title: body.title,
          description: body.description,
          order,
          galleryId,
        },
      });

      return NextResponse.json(newPhoto, { status: 201 });
    }
  } catch (error) {
    console.error('Ошибка при добавлении фотографии:', error);
    return NextResponse.json(
      { error: 'Ошибка при добавлении фотографии' },
      { status: 500 }
    );
  }
}
