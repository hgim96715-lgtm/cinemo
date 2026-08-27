'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type {
  AvatarConfig,
} from '@cinemo/shared';
import { AvatarFigure } from './AvatarFigure';
import {
  BLUSH_COLORS,
  EYE_OPTIONS,
  EYEBROW_OPTIONS,
  GLASSES_OPTIONS,
  HAT_COLORS,
  HAT_OPTIONS,
  HAIR_OPTIONS,
  MOUTH_OPTIONS,
  OUTFIT_COLORS,
  OUTFIT_OPTIONS,
  SKIN_COLORS,
  withOutfitPreset,
} from './avatar-options';

type Props = {
  initial: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  onClose: () => void;
};

function normalizeAvatarForSave(avatar: AvatarConfig): AvatarConfig {
  const legacy = avatar as AvatarConfig & {
    expressionStyle?: unknown;
    hairStyle?: string;
  };
  const { expressionStyle: _expressionStyle, ...withoutExpression } = legacy;

  if (withoutExpression.hairStyle === 'wave') {
    withoutExpression.hairStyle = 'none';
  }

  return withoutExpression as AvatarConfig;
}

export function WardrobeModal({ initial, onSave, onClose }: Props) {
  const [tempAvatar, setTempAvatar] = useState<AvatarConfig>(initial);
  const [tab, setTab] = useState<'hat' | 'face' | 'outfit'>('hat');

  function patch(partial: Partial<AvatarConfig>) {
    setTempAvatar((prev) => ({ ...prev, ...partial }));
  }

  function stripeOutfit(
    overrides: Partial<{ color1: string; color2: string }>,
  ) {
    const prev =
      tempAvatar.outfit.type === 'stripe'
        ? tempAvatar.outfit
        : { color1: OUTFIT_COLORS[0]!, color2: OUTFIT_COLORS[1]! };
    return {
      type: 'stripe' as const,
      preset: tempAvatar.outfit.preset,
      color1: overrides.color1 ?? prev.color1,
      color2: overrides.color2 ?? prev.color2,
    };
  }

  function dotsOutfit(overrides: Partial<{ color1: string; color2: string }>) {
    const prev =
      tempAvatar.outfit.type === 'dots'
        ? tempAvatar.outfit
        : { color1: '#ffffff', color2: OUTFIT_COLORS[0]! };
    return {
      type: 'dots' as const,
      preset: tempAvatar.outfit.preset,
      color1: overrides.color1 ?? prev.color1,
      color2: overrides.color2 ?? prev.color2,
    };
  }


  return (
    <div className="wardrobe-overlay" onClick={onClose}>
      <div className="wardrobe-panel" onClick={(e) => e.stopPropagation()}>
        <button
          className="wardrobe-close"
          type="button"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <p className="wardrobe-kicker">WARDROBE</p>

        <div className="wardrobe-preview">
          <AvatarFigure config={tempAvatar} />
        </div>

        <div className="wardrobe-tabs">
          {(['hat', 'face', 'outfit'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`wardrobe-tab${tab === t ? ' is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'hat' ? '모자' : t === 'face' ? '얼굴' : '옷'}
            </button>
          ))}
        </div>

        <div className="wardrobe-section">
          {tab === 'hat' && (
            <>
              <div className="wardrobe-row">
                <span className="wardrobe-label">스타일</span>
                <div className="wardrobe-chips">
                  {HAT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`wardrobe-chip${tempAvatar.hat === value ? ' is-active' : ''}`}
                      onClick={() => patch({ hat: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {tempAvatar.hat !== 'none' && (
                <div className="wardrobe-row">
                  <span className="wardrobe-label">색상</span>
                  <div className="wardrobe-swatches">
                    {HAT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`wardrobe-swatch${tempAvatar.hatColor === color ? ' is-active' : ''}`}
                        style={{ background: color }}
                        onClick={() => patch({ hatColor: color })}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'face' && (
            <>
              <div className="wardrobe-row">
                <span className="wardrobe-label">피부</span>
                <div className="wardrobe-swatches">
                  {SKIN_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`wardrobe-swatch${tempAvatar.skinColor === color ? ' is-active' : ''}`}
                      style={{ background: color }}
                      onClick={() => patch({ skinColor: color })}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>
              <div className="wardrobe-row">
                <span className="wardrobe-label">눈</span>
                <div className="wardrobe-chips">
                  {EYE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`wardrobe-chip${tempAvatar.eyeStyle === value ? ' is-active' : ''}`}
                      onClick={() => patch({ eyeStyle: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wardrobe-row">
                <span className="wardrobe-label">눈썹</span>
                <div className="wardrobe-chips">
                  {EYEBROW_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`wardrobe-chip${(tempAvatar.eyebrowStyle ?? 'natural') === value ? ' is-active' : ''}`}
                      onClick={() => patch({ eyebrowStyle: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wardrobe-row">
                <span className="wardrobe-label">안경</span>
                <div className="wardrobe-chips">
                  {GLASSES_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`wardrobe-chip${(tempAvatar.glassesStyle ?? 'none') === value ? ' is-active' : ''}`}
                      onClick={() => patch({ glassesStyle: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wardrobe-row">
                <span className="wardrobe-label">머리</span>
                <div className="wardrobe-chips">
                  {HAIR_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`wardrobe-chip${(tempAvatar.hairStyle ?? 'none') === value ? ' is-active' : ''}`}
                      onClick={() => patch({ hairStyle: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wardrobe-row">
                <span className="wardrobe-label">입</span>
                <div className="wardrobe-chips">
                  {MOUTH_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`wardrobe-chip${tempAvatar.mouthStyle === value ? ' is-active' : ''}`}
                      onClick={() => patch({ mouthStyle: value })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wardrobe-row">
                <span className="wardrobe-label">볼터치</span>
                <div className="wardrobe-swatches">
                  {BLUSH_COLORS.map((color) => (
                    <button
                      key={color ?? 'none'}
                      type="button"
                      className={`wardrobe-swatch${tempAvatar.blushColor === color ? ' is-active' : ''}${color === null ? ' wardrobe-swatch--none' : ''}`}
                      style={color ? { background: color } : undefined}
                      onClick={() => patch({ blushColor: color })}
                      aria-label={color ?? '없음'}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'outfit' && (
            <>
              <div className="wardrobe-row">
                <span className="wardrobe-label">의상</span>
                <div className="wardrobe-chips">
                  {OUTFIT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={`wardrobe-chip${(tempAvatar.outfit.preset ?? 'basic') === value ? ' is-active' : ''}`}
                      onClick={() =>
                        patch({
                          outfit: withOutfitPreset(tempAvatar.outfit, value),
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wardrobe-row">
                <span className="wardrobe-label">패턴</span>
                <div className="wardrobe-chips">
                  <button
                    type="button"
                    className={`wardrobe-chip${tempAvatar.outfit.type === 'solid' ? ' is-active' : ''}`}
                    onClick={() =>
                      patch({
                        outfit: {
                          type: 'solid',
                          preset: tempAvatar.outfit.preset,
                          color: OUTFIT_COLORS[0]!,
                        },
                      })
                    }
                  >
                    단색
                  </button>
                  <button
                    type="button"
                    className={`wardrobe-chip${tempAvatar.outfit.type === 'stripe' ? ' is-active' : ''}`}
                    onClick={() => patch({ outfit: stripeOutfit({}) })}
                  >
                    줄무늬
                  </button>
                  <button
                    type="button"
                    className={`wardrobe-chip${tempAvatar.outfit.type === 'dots' ? ' is-active' : ''}`}
                    onClick={() => patch({ outfit: dotsOutfit({}) })}
                  >
                    도트
                  </button>
                </div>
              </div>

              {tempAvatar.outfit.type === 'solid' && (
                <div className="wardrobe-row">
                  <span className="wardrobe-label">색상</span>
                  <div className="wardrobe-swatches">
                    {OUTFIT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`wardrobe-swatch${tempAvatar.outfit.type === 'solid' && tempAvatar.outfit.color === color ? ' is-active' : ''}`}
                        style={{ background: color }}
                        onClick={() =>
                          patch({
                            outfit: {
                              type: 'solid',
                              preset: tempAvatar.outfit.preset,
                              color,
                            },
                          })
                        }
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {tempAvatar.outfit.type === 'stripe' && (
                <>
                  <div className="wardrobe-row">
                    <span className="wardrobe-label">색상 1</span>
                    <div className="wardrobe-swatches">
                      {OUTFIT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`wardrobe-swatch${tempAvatar.outfit.type === 'stripe' && tempAvatar.outfit.color1 === color ? ' is-active' : ''}`}
                          style={{ background: color }}
                          onClick={() =>
                            patch({ outfit: stripeOutfit({ color1: color }) })
                          }
                          aria-label={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="wardrobe-row">
                    <span className="wardrobe-label">색상 2</span>
                    <div className="wardrobe-swatches">
                      {OUTFIT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`wardrobe-swatch${tempAvatar.outfit.type === 'stripe' && tempAvatar.outfit.color2 === color ? ' is-active' : ''}`}
                          style={{ background: color }}
                          onClick={() =>
                            patch({ outfit: stripeOutfit({ color2: color }) })
                          }
                          aria-label={color}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {tempAvatar.outfit.type === 'dots' && (
                <>
                  <div className="wardrobe-row">
                    <span className="wardrobe-label">도트색</span>
                    <div className="wardrobe-swatches">
                      {['#ffffff', '#f4e4b8', ...OUTFIT_COLORS].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`wardrobe-swatch${tempAvatar.outfit.type === 'dots' && tempAvatar.outfit.color1 === color ? ' is-active' : ''}`}
                          style={{ background: color }}
                          onClick={() =>
                            patch({ outfit: dotsOutfit({ color1: color }) })
                          }
                          aria-label={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="wardrobe-row">
                    <span className="wardrobe-label">배경색</span>
                    <div className="wardrobe-swatches">
                      {OUTFIT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`wardrobe-swatch${tempAvatar.outfit.type === 'dots' && tempAvatar.outfit.color2 === color ? ' is-active' : ''}`}
                          style={{ background: color }}
                          onClick={() =>
                            patch({ outfit: dotsOutfit({ color2: color }) })
                          }
                          aria-label={color}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="wardrobe-actions">
          <button type="button" className="lobby-btn" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="lobby-btn lobby-btn--primary"
            onClick={() => {
              onSave(normalizeAvatarForSave(tempAvatar));
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
