'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { PostcardReactionSummary } from '@cinemo/shared';
import { useAuthStore } from '@/lib/auth-store';
import { togglePostcardReactionRequest } from '@/lib/postcard-api';
import { useRouter } from 'next/navigation';

const DEFAULT_EMOJIS = ['❤️', '😊', '😭', '👏'];
const ADDITIONAL_EMOJIS = [
  '😍',
  '😂',
  '😮',
  '😢',
  '🔥',
  '✨',
  '👍',
  '🎬',
  '🍿',
];

type Props = {
  postcardId: string;
  reactions: PostcardReactionSummary[];
  onChange: (reactions: PostcardReactionSummary[]) => void;
};

export function PostcardReactionBar({
  postcardId,
  reactions,
  onChange,
}: Props) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [submittingEmoji, setSubmittingEmoji] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    setSelectedEmoji(
      reactions.find((reaction) => reaction.reacted)?.emoji ?? null,
    );
  }, [reactions]);

  const visibleEmojis = Array.from(
    new Set([
      ...DEFAULT_EMOJIS,
      ...reactions
        .map((reaction) => reaction.emoji)
        .filter((emoji) => !DEFAULT_EMOJIS.includes(emoji)),
    ]),
  );

  async function handleReaction(emoji: string) {
    if (!accessToken) {
      const nextPath = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (submittingEmoji) return;

    const previousEmoji =
      reactions.find((reaction) => reaction.reacted)?.emoji ?? selectedEmoji;

    setSubmittingEmoji(emoji);

    try {
      const result = await togglePostcardReactionRequest(
        accessToken,
        postcardId,
        emoji,
      );

      const reactionMap = new Map(
        reactions.map((reaction) => [reaction.emoji, { ...reaction }]),
      );

      if (
        previousEmoji &&
        previousEmoji !== result.emoji &&
        reactionMap.has(previousEmoji)
      ) {
        const previousReaction = reactionMap.get(previousEmoji)!;
        previousReaction.count = Math.max(0, previousReaction.count - 1);
        previousReaction.reacted = false;
      }

      const targetReaction = reactionMap.get(result.emoji);

      if (result.reacted) {
        if (targetReaction) {
          if (previousEmoji !== result.emoji) {
            targetReaction.count += 1;
          }

          targetReaction.reacted = true;
        } else {
          reactionMap.set(result.emoji, {
            emoji: result.emoji,
            count: 1,
            reacted: true,
          });
        }

        setSelectedEmoji(result.emoji);
      } else if (targetReaction) {
        targetReaction.count = Math.max(0, targetReaction.count - 1);
        targetReaction.reacted = false;
        setSelectedEmoji(null);
      }

      onChange(
        Array.from(reactionMap.values()).filter(
          (reaction) => reaction.count > 0,
        ),
      );
    } finally {
      setSubmittingEmoji(null);
    }
  }

  return (
    <div className="postcard-reaction-area">
      <div className="postcard-reaction-bar" aria-label="엽서 이모지 반응">
        {visibleEmojis.map((emoji) => {
          const reaction = reactions.find((item) => item.emoji === emoji);
          const isSelected =
            selectedEmoji === emoji || reaction?.reacted === true;

          return (
            <button
              key={emoji}
              type="button"
              className={`postcard-reaction-button${
                isSelected ? ' is-selected' : ''
              }`}
              aria-label={`${emoji} 반응 ${reaction?.count ?? 0}개`}
              aria-pressed={isSelected}
              disabled={submittingEmoji !== null}
              onClick={() => void handleReaction(emoji)}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{reaction?.count ?? 0}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="postcard-reaction-add"
        aria-label="다른 반응 추가"
        aria-expanded={isPickerOpen}
        onClick={() => setIsPickerOpen((current) => !current)}
      >
        {isPickerOpen ? (
          <X size={16} strokeWidth={1.8} aria-hidden />
        ) : (
          <Plus size={16} strokeWidth={1.8} aria-hidden />
        )}
      </button>

      {isPickerOpen ? (
        <div
          className="postcard-reaction-picker"
          role="dialog"
          aria-label="추가 이모지 선택"
        >
          {ADDITIONAL_EMOJIS.map((emoji) => {
            const reaction = reactions.find((item) => item.emoji === emoji);
            const isSelected = reaction?.reacted === true;

            return (
              <button
                key={emoji}
                type="button"
                className={`postcard-reaction-picker-button${
                  isSelected ? ' is-selected' : ''
                }`}
                aria-pressed={isSelected}
                onClick={() => {
                  void handleReaction(emoji);
                  setIsPickerOpen(false);
                }}
              >
                <span>{emoji}</span>
                {reaction?.count ? <small>{reaction.count}</small> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
