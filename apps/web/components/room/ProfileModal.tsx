'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { Hash, X } from 'lucide-react';
import {
  PROFILE_BIO_MAX,
  PROFILE_SUGGESTED_TAGS,
  PROFILE_TAG_LIMIT,
  PROFILE_TAG_MAX_LEN,
  normalizeProfileTag,
} from '@cinemo/shared';
import { checkNicknameRequest } from '@/lib/auth-api';
import type { UpdateProfileInput } from '@/lib/auth-store';

type ProfileForm = {
  nickname: string;
  bio: string;
  profilePublic: boolean;
  tags: string[];
};

type Props = {
  initial: ProfileForm;
  onSave: (input: UpdateProfileInput & { nickname?: string }) => void;
  onClose: () => void;
};

function addTagToList(tags: string[], raw: string): string[] {
  const tag = normalizeProfileTag(raw);
  if (!tag || tags.includes(tag)) return tags;
  if (tags.length >= PROFILE_TAG_LIMIT) return tags;
  return [...tags, tag];
}

export function ProfileModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<ProfileForm>(initial);
  const [tagInput, setTagInput] = useState('');
  const [tagHint, setTagHint] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const tagComposing = useRef(false);

  function updateForm(partial: Partial<ProfileForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function tryAddTag(raw: string) {
    setTagHint(null);
    const tag = normalizeProfileTag(raw);
    if (!tag) {
      setTagHint(`태그는 1~${PROFILE_TAG_MAX_LEN}자`);
      return;
    }
    setForm((prev) => {
      if (prev.tags.includes(tag)) {
        setTagHint('이미 추가된 태그');
        return prev;
      }
      if (prev.tags.length >= PROFILE_TAG_LIMIT) {
        setTagHint(`최대 ${PROFILE_TAG_LIMIT}개`);
        return prev;
      }
      setTagInput('');
      return { ...prev, tags: [...prev.tags, tag] };
    });
  }

  function removeTag(tag: string) {
    updateForm({ tags: form.tags.filter((item) => item !== tag) });
  }

  function onTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',') return;
    if (e.nativeEvent.isComposing || tagComposing.current) return;
    e.preventDefault();
    tryAddTag(tagInput);
  }

  async function validateNickname(): Promise<boolean> {
    const nickname = form.nickname.trim();
    if (!nickname) {
      setNicknameError('닉네임을 입력해 주세요.');
      return false;
    }
    if (nickname === initial.nickname.trim()) {
      setNicknameError(null);
      return true;
    }
    const { available } = await checkNicknameRequest(nickname);
    if (!available) {
      setNicknameError('이미 사용중인 닉네임입니다.');
      return false;
    }
    setNicknameError(null);
    return true;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const ok = await validateNickname();
      if (!ok) return;

      const bioText = form.bio.trim();
      onSave({
        nickname: form.nickname.trim(),
        bio: bioText === '' ? null : bioText,
        profilePublic: form.profilePublic,
        tags: form.tags,
      });
    } finally {
      setSaving(false);
    }
  }

  const tagCount = form.tags.length;

  return (
    <div className="wardrobe-overlay" onClick={onClose}>
      <div
        className="wardrobe-panel profile-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="wardrobe-close"
          type="button"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <p className="wardrobe-kicker">PROFILE</p>

        <div className="profile-preview">
          <p className="profile-preview-label">미리보기</p>
          {form.profilePublic ? (
            <div className="profile-card">
              <p className="profile-card-nick">{form.nickname.trim() || '—'}</p>
              {form.bio.trim() ? (
                <p className="profile-card-bio">{form.bio.trim()}</p>
              ) : (
                <p className="profile-card-bio profile-card-bio--empty">
                  소개 없음
                </p>
              )}
              {form.tags.length > 0 ? (
                <div className="profile-hash-cloud">
                  {form.tags.map((tag) => (
                    <span key={tag} className="profile-hash">
                      <span className="profile-hash-mark">#</span>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="profile-card-bio profile-card-bio--empty">
                  태그 없음
                </p>
              )}
            </div>
          ) : (
            <div className="profile-card profile-card--private">
              <p className="profile-card-nick">{form.nickname.trim() || '—'}</p>
              <p className="profile-card-note">비공개 · 닉네임만 공개</p>
            </div>
          )}
        </div>

        <div className="wardrobe-section profile-form">
          <div className="wardrobe-row">
            <span className="wardrobe-label">닉네임</span>
            <input
              className="profile-input"
              value={form.nickname}
              maxLength={32}
              onChange={(e) => {
                setNicknameError(null);
                updateForm({ nickname: e.target.value });
              }}
              onBlur={() => void validateNickname()}
            />
            {nicknameError ? (
              <p className="profile-error">{nicknameError}</p>
            ) : null}
          </div>

          <div className="wardrobe-row">
            <span className="wardrobe-label">
              소개 ({form.bio.length}/{PROFILE_BIO_MAX})
            </span>
            <textarea
              className="profile-textarea"
              value={form.bio}
              maxLength={PROFILE_BIO_MAX}
              rows={3}
              placeholder="영화 취향, 요즘 보는 OTT…"
              onChange={(e) => updateForm({ bio: e.target.value })}
            />
          </div>

          <div className="wardrobe-row">
            <span className="wardrobe-label">
              내 태그 ({tagCount}/{PROFILE_TAG_LIMIT})
            </span>

            {form.tags.length > 0 ? (
              <ul className="profile-tag-list" aria-label="선택한 태그">
                {form.tags.map((tag) => (
                  <li key={tag}>
                    <span className="profile-tag-chip">
                      <span className="profile-tag-chip-mark">#</span>
                      {tag}
                      <button
                        type="button"
                        className="profile-tag-remove"
                        onClick={() => removeTag(tag)}
                        aria-label={`${tag} 제거`}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="profile-tag-empty">태그를 추가해 보세요</p>
            )}

            <div className="profile-tag-input-wrap">
              <Hash
                size={14}
                strokeWidth={2}
                className="profile-tag-input-icon"
                aria-hidden
              />
              <input
                className="profile-tag-input"
                value={tagInput}
                maxLength={PROFILE_TAG_MAX_LEN + 2}
                placeholder="스릴러, 20대, 넷플릭스…"
                onChange={(e) => {
                  setTagHint(null);
                  setTagInput(e.target.value);
                }}
                onCompositionStart={() => {
                  tagComposing.current = true;
                }}
                onCompositionEnd={() => {
                  tagComposing.current = false;
                }}
                onKeyDown={onTagKeyDown}
              />
              <button
                type="button"
                className="profile-tag-add"
                disabled={!tagInput.trim() || tagCount >= PROFILE_TAG_LIMIT}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => tryAddTag(tagInput)}
              >
                추가
              </button>
            </div>
            {tagHint ? <p className="profile-error">{tagHint}</p> : null}
            <p className="profile-tag-hint">Enter · 쉼표 · 추가 버튼</p>
          </div>

          <div className="wardrobe-row">
            <span className="wardrobe-label">추천 태그</span>
            <div className="profile-suggest">
              {PROFILE_SUGGESTED_TAGS.map((tag) => {
                const selected = form.tags.includes(tag);
                const full = tagCount >= PROFILE_TAG_LIMIT && !selected;
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`profile-suggest-chip${selected ? ' is-selected' : ''}${full ? ' is-disabled' : ''}`}
                    disabled={full}
                    onClick={() => {
                      if (selected) removeTag(tag);
                      else updateForm({ tags: addTagToList(form.tags, tag) });
                    }}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="wardrobe-row">
            <span className="wardrobe-label">프로필 공개</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.profilePublic}
              className={`profile-switch${form.profilePublic ? ' is-on' : ''}`}
              onClick={() =>
                updateForm({ profilePublic: !form.profilePublic })
              }
            >
              <span className="profile-switch-track">
                <span className="profile-switch-thumb" />
              </span>
              <span className="profile-switch-copy">
                {form.profilePublic
                  ? '공개 — 소개·태그가 보여요'
                  : '비공개 — 닉네임만 보여요'}
              </span>
            </button>
          </div>
        </div>

        <div className="wardrobe-actions">
          <button type="button" className="lobby-btn" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="lobby-btn lobby-btn--primary"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
