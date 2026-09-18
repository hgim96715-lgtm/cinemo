import type { ReactNode } from 'react';
import { CinemoNav } from './CinemoNav';

type CinemoPageHeaderProps = {
  eyebrow: string;
  subtitle?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  nav?: ReactNode;
  leading?: ReactNode;
  children?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function CinemoPageHeader({
  eyebrow,
  subtitle,
  title,
  description,
  nav = <CinemoNav />,
  leading,
  children,
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: CinemoPageHeaderProps) {
  return (
    <header className={`cinemo-page-header${className ? ` ${className}` : ''}`}>
      {nav}

      {leading}
      <span
        className={`cinemo-page-eyebrow${eyebrowClassName ? ` ${eyebrowClassName}` : ''}`}
      >
        {eyebrow}
      </span>

      {subtitle ? <p className="cinemo-page-subtitle">{subtitle}</p> : null}

      <h1 className={titleClassName}>{title}</h1>

      {description ? (
        <p className={descriptionClassName}>{description}</p>
      ) : null}

      {children}
    </header>
  );
}
