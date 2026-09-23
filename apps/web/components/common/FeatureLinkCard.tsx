import Link from 'next/link';
import type { ReactNode } from 'react';

type FeatureLinkCardProps = {
  href: string;
  ariaLabel: string;
  kicker: string;
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
};

export function FeatureLinkCard({
  href,
  ariaLabel,
  kicker,
  title,
  description,
  icon,
  className,
}: FeatureLinkCardProps) {
  return (
    <Link
      href={href}
      className={`lobby-feature-card${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      <span className="lobby-feature-kicker">{kicker}</span>
      <strong>{title}</strong>
      <span className="lobby-feature-description">{description}</span>
      <span className="lobby-feature-icon" aria-hidden="true">
        {icon}
      </span>
    </Link>
  );
}
