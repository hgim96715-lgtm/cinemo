import { kstDayRange } from './date-kst';
import { PrismaService } from '../prisma/prisma.service';

export async function seedDemoReviewLikes(
  prisma: PrismaService,
  dateKey: string,
  userIds: string[],
): Promise<number> {
  const candidates = [...new Set(userIds)];
  if (candidates.length < 2) return 0;

  const { start, end } = kstDayRange(dateKey);
  const posts = await prisma.reviewPost.findMany({
    where: {
      userId: { in: candidates },
      createdAt: { gte: start, lt: end },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, userId: true, createdAt: true },
  });

  const data = posts.flatMap((post, postIndex) => {
    const likers = candidates.filter((userId) => userId !== post.userId);
    const count = Math.min(likers.length, 1 + (postIndex % 3));

    return likers.slice(0, count).map((userId, likeIndex) => ({
      postId: post.id,
      userId,
      createdAt: new Date(
        post.createdAt.getTime() + 30_000 + likeIndex * 1_000,
      ),
    }));
  });

  if (data.length === 0) return 0;

  const result = await prisma.reviewPostLike.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
}
