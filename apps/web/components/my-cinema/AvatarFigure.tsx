'use client';

import type { CSSProperties } from 'react';
import type { AvatarConfig } from '@cinemo/shared';
import { DEFAULT_AVATAR } from '@cinemo/shared';

type Props = {
  config?: AvatarConfig;
  className?: string;
};

function outfitBg(outfit: AvatarConfig['outfit']): string {
  if (outfit.type === 'solid') return outfit.color;

  if (outfit.type === 'stripe') {
    return `repeating-linear-gradient(
      45deg,
      ${outfit.color1},
      ${outfit.color1} 3px,
      ${outfit.color2} 3px,
      ${outfit.color2} 7px
    )`;
  }

  return `radial-gradient(
    circle,
    ${outfit.color1} 1.5px,
    transparent 1.5px
  ) 0 0 / 5px 5px, ${outfit.color2}`;
}

export function AvatarFigure({ config = DEFAULT_AVATAR, className }: Props) {
  const eyebrowStyle = config.eyebrowStyle ?? 'natural';
  const glassesStyle = config.glassesStyle ?? 'none';
  const hairStyle = config.hairStyle ?? 'none';
  const outfitPreset = config.outfit.preset ?? 'basic';
  const mouthStyle =
    (config.mouthStyle as string) === 'cat' ? 'smile' : config.mouthStyle;

  return (
    <div
      className={`avatar-figure${className ? ` ${className}` : ''}`}
      aria-hidden
    >
      <div className="avatar-upper">
        {config.hat !== 'none' ? (
          <div
            className={`avatar-hat avatar-hat--${config.hat}`}
            style={{ '--hat-color': config.hatColor } as CSSProperties}
          />
        ) : null}

        <div className="avatar-head" style={{ background: config.skinColor }}>
          {hairStyle !== 'none' ? (
            <span className={`avatar-hair avatar-hair--${hairStyle}`} />
          ) : null}

          <div className="avatar-face">
            <div className={`avatar-eyebrows avatar-eyebrows--${eyebrowStyle}`}>
              <span className="avatar-eyebrow" />
              <span className="avatar-eyebrow" />
            </div>

            <div className="avatar-eyes">
              <span className={`avatar-eye avatar-eye--${config.eyeStyle}`} />
              <span className={`avatar-eye avatar-eye--${config.eyeStyle}`} />
            </div>

            {glassesStyle !== 'none' ? (
              <span
                className={`avatar-glasses avatar-glasses--${glassesStyle}`}
              />
            ) : null}

            {config.blushColor !== null ? (
              <>
                <span
                  className="avatar-blush avatar-blush--left"
                  style={{
                    background: `${config.blushColor}88`,
                  }}
                />
                <span
                  className="avatar-blush avatar-blush--right"
                  style={{
                    background: `${config.blushColor}88`,
                  }}
                />
              </>
            ) : null}

            <span
              className={`avatar-mouth avatar-mouth--${mouthStyle}`}
            />
          </div>
        </div>
      </div>

      <div
        className={`avatar-body avatar-body--${outfitPreset}`}
        style={{ background: outfitBg(config.outfit) }}
      />
    </div>
  );
}
