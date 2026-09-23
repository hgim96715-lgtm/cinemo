'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, UserRound, X } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import {
  PROFILE_BIO_MAX,
  PROFILE_SUGGESTED_TAGS,
  PROFILE_TAG_LIMIT,
  PROFILE_TAG_MAX_LEN,
  normalizeProfileTag,
} from '@cinemo/shared';
import { checkNicknameRequest } from '@/lib/auth-api';
import type { UpdateProfileInput } from '@/lib/auth-store';

import '@/styles/profile.css';

const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, { error: '닉네임을 입력해 주세요.' })
    .max(32, { error: '닉네임은 32자 이하로 입력해 주세요.' }),
  bio: z.string().max(PROFILE_BIO_MAX, {
    error: `소개는 ${PROFILE_BIO_MAX}자 이하로 입력해 주세요.`,
  }),
  profilePublic: z.boolean(),
  tags: z.array(z.string()).max(PROFILE_TAG_LIMIT, {
    error: `태그는 최대 ${PROFILE_TAG_LIMIT}개까지 추가할 수 있습니다.`,
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type Props = {
  initial: ProfileFormValues;
  onSave: (
    input: UpdateProfileInput & { nickname?: string },
  ) => Promise<void> | void;
  onClose: () => void;
};

function addTagToList(tags: string[], raw: string): string[] {
  const tag = normalizeProfileTag(raw);
  if (!tag || tags.includes(tag)) {
    return tags;
  }
  if (tags.length >= PROFILE_TAG_LIMIT) {
    return tags;
  }
  return [...tags, tag];
}
export function ProfileModal({ initial, onSave, onClose }: Props) {
  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: initial,
  });
  const form = watch();

  const [tagInput, setTagInput] = useState('');
  const [tagHint, setTagHint] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const tagComposing = useRef(false);

  function updateForm(partial: Partial<ProfileFormValues>) {
    if (partial.nickname !== undefined) {
      setValue('nickname', partial.nickname, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (partial.bio !== undefined) {
      setValue('bio', partial.bio, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (partial.profilePublic !== undefined) {
      setValue('profilePublic', partial.profilePublic, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (partial.tags !== undefined) {
      setValue('tags', partial.tags, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }
  function tryAddTag(raw: string) {
    setTagHint(null);
    const tag = normalizeProfileTag(raw);
    if (!tag) {
      setTagHint(`태그는 1~${PROFILE_TAG_MAX_LEN}자`);
      return;
    }

    if (form.tags.includes(tag)) {
      setTagHint('이미 추가된 태그');
      return;
    }

    if (form.tags.length >= PROFILE_TAG_LIMIT) {
      setTagHint(`최대 ${PROFILE_TAG_LIMIT}개`);
      return;
    }

    setValue('tags', [...form.tags, tag], {
      shouldDirty: true,
      shouldValidate: true,
    });

    setTagInput('');
  }

  function removeTag(tag: string) {
    updateForm({
      tags: form.tags.filter((item) => item !== tag),
    });
  }
  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }
    if (event.nativeEvent.isComposing || tagComposing.current) {
      return;
    }
    event.preventDefault();
    tryAddTag(tagInput);
  }
  async function validateNickname(
    nicknameValue = form.nickname,
  ): Promise<boolean> {
    const nickname = nicknameValue.trim();

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
      setNicknameError('이미 사용 중인 닉네임입니다.');
      return false;
    }

    setNicknameError(null);
    return true;
  }

  const handleSave: SubmitHandler<ProfileFormValues> = async (values) => {
    setSaving(true);
    try {
      const nicknameAvailable = await validateNickname(values.nickname);
      if (!nicknameAvailable) return;
      await onSave({
        nickname: values.nickname.trim(),
        bio: values.bio.trim() === '' ? null : values.bio.trim(),
        profilePublic: values.profilePublic,
        tags: values.tags,
      });
    } finally {
      setSaving(false);
    }
  };
  const tagCount = form.tags.length;
  const nicknameMessage = nicknameError ?? errors.nickname?.message?.toString();

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="profile-modal-overlay" />

        <Dialog.Content className="profile-modal">
          <Dialog.Close asChild>
            <button
              type="button"
              className="profile-modal-close"
              aria-label="프로필 편집 닫기"
            >
              <X size={16} />
            </button>
          </Dialog.Close>

          <div className="profile-modal-heading">
            <div className="profile-modal-icon" aria-hidden="true">
              <UserRound size={18} />
            </div>

            <div>
              <Dialog.Title asChild>
                <h2>프로필 편집</h2>
              </Dialog.Title>

              <Dialog.Description>
                영화 취향과 공개 범위를 설정할 수 있습니다.
              </Dialog.Description>
            </div>
          </div>

          <div className="profile-preview">
            <p className="profile-preview-label">미리보기</p>

            {form.profilePublic ? (
              <div className="profile-card">
                <p className="profile-card-nick">
                  {form.nickname.trim() || '—'}
                </p>

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
                <p className="profile-card-nick">
                  {form.nickname.trim() || '—'}
                </p>
                <p className="profile-card-note">비공개 · 닉네임만 공개</p>
              </div>
            )}
          </div>

          <div className="profile-form">
            <div className="profile-form-row">
              <label className="profile-form-label" htmlFor="profile-nickname">
                닉네임
              </label>

              <input
                id="profile-nickname"
                className="profile-input"
                value={form.nickname}
                maxLength={32}
                aria-invalid={Boolean(nicknameMessage)}
                onChange={(event) => {
                  setNicknameError(null);
                  updateForm({ nickname: event.target.value });
                }}
                onBlur={() => void validateNickname()}
              />

              {nicknameMessage ? (
                <p className="profile-error">{nicknameMessage}</p>
              ) : null}
            </div>

            <div className="profile-form-row">
              <label className="profile-form-label" htmlFor="profile-bio">
                소개 ({form.bio.length}/{PROFILE_BIO_MAX})
              </label>

              <textarea
                id="profile-bio"
                className="profile-textarea"
                value={form.bio}
                maxLength={PROFILE_BIO_MAX}
                rows={3}
                placeholder="영화 취향, 요즘 보는 OTT…"
                onChange={(event) => updateForm({ bio: event.target.value })}
              />

              {errors.bio?.message ? (
                <p className="profile-error">{errors.bio.message.toString()}</p>
              ) : null}
            </div>

            <div className="profile-form-row">
              <span className="profile-form-label">
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
                          <X size={12} />
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
                  className="profile-tag-input-icon"
                  aria-hidden="true"
                />

                <input
                  className="profile-tag-input"
                  value={tagInput}
                  maxLength={PROFILE_TAG_MAX_LEN + 2}
                  placeholder="스릴러, CGV, 넷플릭스…"
                  onChange={(event) => {
                    setTagHint(null);
                    setTagInput(event.target.value);
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
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => tryAddTag(tagInput)}
                >
                  추가
                </button>
              </div>

              {tagHint ? <p className="profile-error">{tagHint}</p> : null}

              <p className="profile-tag-hint">Enter · 쉼표 · 추가 버튼</p>
            </div>

            <div className="profile-form-row">
              <span className="profile-form-label">추천 태그</span>

              <div className="profile-suggest">
                {PROFILE_SUGGESTED_TAGS.map((tag) => {
                  const selected = form.tags.includes(tag);
                  const full = tagCount >= PROFILE_TAG_LIMIT && !selected;

                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`profile-suggest-chip${
                        selected ? ' is-selected' : ''
                      }${full ? ' is-disabled' : ''}`}
                      disabled={full}
                      onClick={() => {
                        if (selected) {
                          removeTag(tag);
                        } else {
                          updateForm({
                            tags: addTagToList(form.tags, tag),
                          });
                        }
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="profile-form-row">
              <span className="profile-form-label">프로필 공개</span>

              <button
                type="button"
                role="switch"
                aria-checked={form.profilePublic}
                className={`profile-switch${
                  form.profilePublic ? ' is-on' : ''
                }`}
                onClick={() =>
                  updateForm({
                    profilePublic: !form.profilePublic,
                  })
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

          <div className="profile-modal-actions">
            <Dialog.Close asChild>
              <button type="button" className="profile-modal-button">
                취소
              </button>
            </Dialog.Close>

            <button
              type="button"
              className="profile-modal-button profile-modal-button--primary"
              disabled={saving}
              onClick={() => void handleSubmit(handleSave)()}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
