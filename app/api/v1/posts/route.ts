import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { encryptResponse } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const from = parseInt(searchParams.get('from') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');

    const posts = await prisma.post.findMany({
      where: {
        status: 'Published',
        publishedAt: {
          lte: new Date()
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        media: true,
        reactions: {
          where: {
            userId: user.id
          }
        },
        postViewers: {
          where: {
            userId: user.id
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
            postViewers: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      skip: from,
      take: limit
    });

    // Transform posts for response
    const transformedPosts = posts.map(post => ({
      ...post,
      isLiked: post.reactions.length > 0,
      isViewed: post.postViewers.length > 0,
      commentsCount: post._count.comments,
      likesCount: post._count.reactions,
      viewsCount: post._count.postViewers,
      categories: post.categories.map(pc => pc.category),
      // Remove sensitive data
      reactions: undefined,
      postViewers: undefined,
      _count: undefined
    }));

    return createSuccessResponse(encryptResponse(transformedPosts));

  } catch (error) {
    console.error('Get posts error:', error);
    return createErrorResponse('Failed to fetch posts', 500);
  }
} 