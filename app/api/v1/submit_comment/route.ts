import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { decrypt, encryptResponse } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const body = await request.json();

    const type = decrypt(body.type) as string;
    const id = decrypt(body.id) as string;
    const content = decrypt(body.content) as string;
    const emojis = body.emojis ? decrypt(body.emojis) as string : null;

    if (!type || !id || !content) {
      return createErrorResponse('Missing required fields');
    }

    if (type === 'post') {
      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: BigInt(id) }
      });

      if (!post) {
        return createErrorResponse('Post not found', 404);
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          postId: BigInt(id),
          userId: user.id,
          comment: content,
          content: content,
          belongType: 'App\\Models\\Post',
          belongId: BigInt(id),
          name: user.username,
          isVerified: user.isVerified,
          userImgUrl: user.imgUrl
        }
      });

      // Add emojis if provided
      if (emojis) {
        const emojiIds = JSON.parse(emojis);
        if (Array.isArray(emojiIds)) {
          await prisma.commentEmoji.createMany({
            data: emojiIds.map((emojiId: number) => ({
              commentId: comment.id,
              emojiId: BigInt(emojiId)
            }))
          });
        }
      }

      // TODO: Send notification to post author

      return createSuccessResponse(
        encryptResponse('Submitted successfully')
      );

    } else if (type === 'comment') {
      // Reply to comment
      const parentComment = await prisma.comment.findUnique({
        where: { id: BigInt(id) }
      });

      if (!parentComment) {
        return createErrorResponse('Comment not found', 404);
      }

      const reply = await prisma.comment.create({
        data: {
          postId: parentComment.postId,
          userId: user.id,
          comment: content,
          content: content,
          belongType: 'App\\Models\\Comment',
          belongId: BigInt(id),
          name: user.username,
          isVerified: user.isVerified,
          userImgUrl: user.imgUrl
        }
      });

      // TODO: Send notification to comment author

      return createSuccessResponse(
        encryptResponse('Submitted successfully')
      );

    } else {
      return createErrorResponse('Invalid type. Use post or comment');
    }

  } catch (error) {
    console.error('Submit comment error:', error);
    return createErrorResponse('Failed to submit comment', 500);
  }
} 
 