'use client';

import type { ReactNode } from 'react';

type Props = {
  loading: boolean;
  skeleton: ReactNode;
  error: string | null;
  isEmpty: boolean;
  emptyLabel: string;
  children: ReactNode;
};

export function MovieShelfState({
  loading,
  skeleton,
  error,
  isEmpty,
  emptyLabel,
  children,
}: Props) {
  if (loading) {
    return skeleton;
  }

  if (error && isEmpty) {
    return (
      <p className="my-cinema-shelf-state my-cinema-shelf-state--error" role="alert">
        {error}
      </p>
    );
  }

  if (isEmpty) {
    return (
      <p className="my-cinema-shelf-state" role="status">
        {emptyLabel}
      </p>
    );
  }

  return (
    <>
      {error ? (
        <p className="my-cinema-shelf-state my-cinema-shelf-state--error" role="alert">
          {error}
        </p>
      ) : null}
      {children}
    </>
  );
}
