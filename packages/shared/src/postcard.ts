export type PostcardReactionSummary = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export type PostcardItem = {
  id: string;
  tmdbId: number;
  nickname: string;
  movieTitle: string | null;
  originalText: string | null;
  text: string;
  posterPath: string | null;
  isPublic: boolean;
  isOwner: boolean;
  isBookmarked: boolean;
  isPinned: boolean;
  reactionCounts: PostcardReactionSummary[];
  createdAt: string;
  updatedAt: string;
};

export type PostcardListResponse = {
  items: PostcardItem[];
  total: number;
  hasNext: boolean;
};

export type PostcardCommentAuthor = {
  id: string;
  nickname: string;
};

export type PostcardCommentItem = {
  id: string;
  postcardId: string;
  userId: string;
  parentId: string | null;
  text: string;
  user: PostcardCommentAuthor;
  replies: PostcardCommentItem[];
  reactionCount: number;
  reacted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostcardCommentListResponse = {
  items: PostcardCommentItem[];
  total: number;
};
