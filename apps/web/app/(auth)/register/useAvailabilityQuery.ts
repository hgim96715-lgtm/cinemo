'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkEmailRequest, checkNicknameRequest } from '@/lib/auth-api';
import { registerQueryKeys } from './query-keys';

export type AvailabilityStatus =
  | 'empty'
  | 'validationError'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useDelayedInput(value: string, delayMs = 400) {
  const [delayedValue, setDelayedValue] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDelayedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);
  return delayedValue;
}

export function useEmailAvailability(value: string) {
  const trimmedValue = value.trim();
  const delayedValue = useDelayedInput(trimmedValue);

  const currentValueIsValid = EMAIL_RE.test(trimmedValue);
  const delayedValueIsValid = EMAIL_RE.test(delayedValue);

  const query = useQuery({
    queryKey: registerQueryKeys.availability.email(delayedValue),
    queryFn: () => checkEmailRequest(delayedValue),
    enabled: delayedValueIsValid,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  let status: AvailabilityStatus = 'empty';

  if (!trimmedValue) {
    status = 'empty';
  } else if (!currentValueIsValid) {
    status = 'validationError';
  } else if (trimmedValue !== delayedValue || query.isFetching) {
    status = 'checking';
  } else if (query.isError) {
    status = 'error';
  } else if (query.data) {
    status = query.data.available ? 'available' : 'unavailable';
  }
  return {
    ...query,
    status,
  };
}
export function useNicknameAvailability(value: string) {
  const trimmedValue = value.trim();
  const delayedValue = useDelayedInput(trimmedValue);

  const currentValueIsValid =
    trimmedValue.length >= 2 && trimmedValue.length <= 20;

  const delayedValueIsValid =
    delayedValue.length >= 2 && delayedValue.length <= 20;

  const query = useQuery({
    queryKey: registerQueryKeys.availability.nickname(delayedValue),
    queryFn: () => checkNicknameRequest(delayedValue),
    enabled: delayedValueIsValid,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  let status: AvailabilityStatus = 'empty';

  if (!trimmedValue) {
    status = 'empty';
  } else if (!currentValueIsValid) {
    status = 'validationError';
  } else if (trimmedValue !== delayedValue || query.isFetching) {
    status = 'checking';
  } else if (query.isError) {
    status = 'error';
  } else if (query.data) {
    status = query.data.available ? 'available' : 'unavailable';
  }

  return {
    ...query,
    status,
  };
}
