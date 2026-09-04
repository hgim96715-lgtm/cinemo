'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Heart,
  MapPin,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  GachaMovie,
  UserMovieKind,
  UserMovieListItem,
  UserMovieMarks,
  UserMovieViewingDetails,
} from '@cinemo/shared';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { useAuthStore } from '@/lib/auth-store';
import { updateViewingDetailsRequest } from '@/lib/user-movie-api';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { kstDateKey } from '@/lib/date-kst';
import { PlaceSearchResult, searchPlacesRequest } from '@/lib/places-api';

const movieScreeningSchema = z.object({
  watchedAt: z
    .string()
    .min(1, '관람일을 선택하세요.')
    .refine((date) => date <= kstDateKey(), {
      message: '관람일은 오늘 또는 이전 날짜만 선택할 수 있어요.',
    }),
  viewingType: z.union([z.literal(''), z.enum(['theater', 'home', 'other'])]),
  viewingTypeCustom: z
    .string()
    .trim()
    .max(100, '관람 방식은 100자까지 입력할 수 있어요.'),
  viewingPlatformMode: z.enum(['preset', 'custom']),
  viewingPlatform: z
    .string()
    .trim()
    .max(40, '플랫폼은 40자까지 입력할 수 있어요.'),
  customViewingPlatform: z
    .string()
    .trim()
    .max(40, '플랫폼은 40자까지 입력할 수 있어요.'),
  viewingLocation: z
    .string()
    .trim()
    .max(100, '관람 장소는 100자까지 입력할 수 있어요.'),
  review: z.string().trim().max(1000, '후기는 1000자까지 입력할 수 있어요.'),
  rating: z.number().int().min(1).max(10).nullable(),
});

type MovieScreeningFormValues = z.infer<typeof movieScreeningSchema>;

const VIEWING_PLATFORM_OPTIONS = [
  'Netflix',
  'Disney+',
  '왓챠',
  '쿠팡플레이',
  'Amazon Prime Video',
] as const;

const VIEWING_TYPE_OPTIONS = [
  { value: '', label: '선택 안 함' },
  { value: 'theater', label: '영화관' },
  { value: 'home', label: '집' },
  { value: 'other', label: '기타' },
];

type MovieDetailSelectOption = {
  value: string;
  label: string;
};

type MovieDetailSelectProps = {
  value: string;
  options: MovieDetailSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
};

function MovieDetailSelect({
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
}: MovieDetailSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <div
      className={`movie-detail-select${open ? ' is-open' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="movie-detail-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        disabled={disabled}
      >
        <span>{selectedOption?.label ?? '선택 안 함'}</span>
        <ChevronDown size={18} strokeWidth={1.7} aria-hidden />
      </button>

      {open ? (
        <div
          className="movie-detail-select-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => (
            <button
              key={option.value || 'empty'}
              type="button"
              className="movie-detail-select-option"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isCustomViewingPlatform(value: string | null | undefined) {
  return Boolean(
    value &&
    !VIEWING_PLATFORM_OPTIONS.includes(
      value as (typeof VIEWING_PLATFORM_OPTIONS)[number],
    ),
  );
}

type SavedScreeningDetails = UserMovieViewingDetails & {
  watchedAt: string | null;
};

type RecentLocation = Pick<
  PlaceSearchResult,
  'id' | 'name' | 'address' | 'roadAddress'
>;

const RECENT_LOCATIONS_STORAGE_KEY = 'cinemo.recent-viewing-locations';
const MAX_RECENT_LOCATIONS = 8;

function normalizeLocationValue(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function getRecentLocationMatches(
  locations: RecentLocation[],
  query: string,
) {
  const normalizedQuery = normalizeLocationValue(query);

  return locations.filter((location) => {
    if (!normalizedQuery) return true;

    return normalizeLocationValue(
      [location.name, location.address, location.roadAddress].join(' '),
    ).includes(normalizedQuery);
  });
}

function mergeLocationSuggestions(
  recentLocations: RecentLocation[],
  kakaoLocations: PlaceSearchResult[],
) {
  return [
    ...recentLocations,
    ...kakaoLocations.filter(
      (location) =>
        !recentLocations.some(
          (recentLocation) =>
            normalizeLocationValue(recentLocation.name) ===
            normalizeLocationValue(location.name),
        ),
    ),
  ];
}

type MovieDetailModalProps = {
  movie: GachaMovie;
  screening?: UserMovieListItem;
  marks?: Pick<UserMovieMarks, 'wish' | 'watched'>;
  onClose: () => void;
  onToggleMark?: (kind: UserMovieKind) => void;
  onSaved?: (details: SavedScreeningDetails) => void;
};

export function MovieDetailModal({
  movie,
  screening,
  marks,
  onClose,
  onToggleMark,
  onSaved,
}: MovieDetailModalProps) {
  const [largeText, setLargeText] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [viewingDetailsError, setViewingDetailsError] = useState<string | null>(
    null,
  );
  const todayKst = kstDateKey();
  const poster = tmdbPosterUrl(movie.poster_path, 'w342');
  const [locationSuggestions, setLocationSuggestions] = useState<
    PlaceSearchResult[]
  >([]);
  const [locationSuggestionsQuery, setLocationSuggestionsQuery] =
    useState('');
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>(
    () => {
      if (typeof window === 'undefined') return [];

      try {
        const savedLocations = window.localStorage.getItem(
          RECENT_LOCATIONS_STORAGE_KEY,
        );

        return savedLocations
          ? (JSON.parse(savedLocations) as RecentLocation[])
          : [];
      } catch {
        return [];
      }
    },
  );
  const [isLocationFocused, setIsLocationFocused] = useState(false);

  const [searchingPlacesQuery, setSearchingPlacesQuery] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RECENT_LOCATIONS_STORAGE_KEY,
        JSON.stringify(recentLocations),
      );
    } catch {
      // localStorage를 사용할 수 없는 환경에서도 관람 정보 저장은 계속함
    }
  }, [recentLocations]);

  function rememberLocation(location: PlaceSearchResult | string) {
    const locationName =
      typeof location === 'string' ? location.trim() : location.name.trim();

    if (!locationName) return;

    const recentLocation: RecentLocation =
      typeof location === 'string'
        ? {
            id: `recent:${normalizeLocationValue(locationName)}`,
            name: locationName,
            address: '',
            roadAddress: '',
          }
        : {
            id: `recent:${normalizeLocationValue(locationName)}`,
            name: locationName,
            address: location.address,
            roadAddress: location.roadAddress,
          };

    setRecentLocations((currentLocations) => [
      recentLocation,
      ...currentLocations.filter(
        (currentLocation) =>
          normalizeLocationValue(currentLocation.name) !==
          normalizeLocationValue(locationName),
      ),
    ].slice(0, MAX_RECENT_LOCATIONS));
  }

  const {
    handleSubmit,
    register,
    control,
    setValue,
    reset: resetMovieScreeningForm,
    formState: { errors, isSubmitting },
  } = useForm<MovieScreeningFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(movieScreeningSchema),
    defaultValues: {
      watchedAt: screening?.watchedAt?.slice(0, 10) ?? '',
      viewingType: screening?.viewingType ?? '',
      viewingTypeCustom: screening?.viewingTypeCustom ?? '',
      viewingPlatformMode: isCustomViewingPlatform(screening?.viewingPlatform)
        ? 'custom'
        : 'preset',
      viewingPlatform: isCustomViewingPlatform(screening?.viewingPlatform)
        ? ''
        : (screening?.viewingPlatform ?? ''),
      customViewingPlatform: isCustomViewingPlatform(screening?.viewingPlatform)
        ? (screening?.viewingPlatform ?? '')
        : '',
      viewingLocation: screening?.viewingLocation ?? '',
      review: screening?.review ?? '',
      rating: screening?.rating ?? null,
    },
  });

  const viewingPlatformMode = useWatch({
    control,
    name: 'viewingPlatformMode',
  });
  const selectedViewingPlatform = useWatch({
    control,
    name: 'viewingPlatform',
  });
  const selectedViewingType = useWatch({
    control,
    name: 'viewingType',
  });

  const viewingLocation = useWatch({ control, name: 'viewingLocation' });

  useEffect(() => {
    resetMovieScreeningForm({
      watchedAt: screening?.watchedAt?.slice(0, 10) ?? '',
      viewingType: screening?.viewingType ?? '',
      viewingTypeCustom: screening?.viewingTypeCustom ?? '',
      viewingPlatformMode: isCustomViewingPlatform(screening?.viewingPlatform)
        ? 'custom'
        : 'preset',
      viewingPlatform: isCustomViewingPlatform(screening?.viewingPlatform)
        ? ''
        : (screening?.viewingPlatform ?? ''),
      customViewingPlatform: isCustomViewingPlatform(screening?.viewingPlatform)
        ? (screening?.viewingPlatform ?? '')
        : '',
      viewingLocation: screening?.viewingLocation ?? '',
      review: screening?.review ?? '',
      rating: screening?.rating ?? null,
    });
  }, [screening, resetMovieScreeningForm]);

  useEffect(() => {
    const query = viewingLocation.trim();

    if (!isLocationFocused || !accessToken || isSubmitting || query.length < 2) {
      return;
    }

    const token = accessToken;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      async function loadLocations() {
        setSearchingPlacesQuery(query);
        try {
          const results = await searchPlacesRequest(token, query);

          if (!cancelled) {
            setLocationSuggestions(results);
            setLocationSuggestionsQuery(query);
          }
        } catch {
          if (!cancelled) setLocationSuggestions([]);
        } finally {
          if (!cancelled) {
            setSearchingPlacesQuery((currentQuery) =>
              currentQuery === query ? '' : currentQuery,
            );
          }
        }
      }
      void loadLocations();
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    accessToken,
    isLocationFocused,
    isSubmitting,
    recentLocations,
    viewingLocation,
  ]);

  const recentLocationMatches = getRecentLocationMatches(
    recentLocations,
    viewingLocation.trim(),
  );
  const isSearchingPlaces =
    searchingPlacesQuery === viewingLocation.trim() &&
    searchingPlacesQuery.length >= 2;
  const visibleLocationSuggestions = (
    isLocationFocused
      ? viewingLocation.trim().length < 2 ||
        locationSuggestionsQuery !== viewingLocation.trim()
        ? recentLocationMatches
        : mergeLocationSuggestions(recentLocationMatches, locationSuggestions)
      : []
  ) as PlaceSearchResult[];

  function handleLocationSelect(location: PlaceSearchResult) {
    setValue('viewingLocation', location.name, {
      shouldDirty: true,
      shouldValidate: true,
    });
    rememberLocation(location);
    setIsLocationFocused(false);
    setLocationSuggestions([]);
  }

  const handleSaveViewingDetails = handleSubmit(
    async (values: MovieScreeningFormValues) => {
      if (!screening || !accessToken) return;

      setViewingDetailsError(null);

      try {
        const details: SavedScreeningDetails = {
          watchedAt: values.watchedAt || null,
          viewingType: values.viewingType || null,
          viewingTypeCustom:
            values.viewingType === 'other'
              ? values.viewingTypeCustom.trim() || null
              : null,
          viewingPlatform:
            (values.viewingPlatformMode === 'custom'
              ? values.customViewingPlatform
              : values.viewingPlatform
            ).trim() || null,
          viewingLocation: values.viewingLocation.trim() || null,
          review: values.review.trim() || null,
          rating: values.rating,
        };

        await updateViewingDetailsRequest(
          accessToken,
          screening.tmdbId,
          details,
        );

        rememberLocation(values.viewingLocation);

        onSaved?.(details);
      } catch {
        setViewingDetailsError('관람 정보를 저장하지 못했습니다.');
      }
    },
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="movie-detail-overlay" role="presentation" onClick={onClose}>
      <section
        className={`movie-detail-modal${largeText ? ' is-large-text' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="movie-detail-close"
          onClick={onClose}
          aria-label="상세 설명 닫기"
        >
          <X size={22} strokeWidth={1.5} aria-hidden />
        </button>

        <div className="movie-detail-content">
          <div className="movie-detail-poster">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={`${movie.title} 포스터`} />
            ) : (
              <span>포스터 없음</span>
            )}
          </div>

          <div className="movie-detail-info">
            <p className="movie-detail-kicker">MOVIE DETAIL</p>

            <h2 id="movie-detail-title">{movie.title}</h2>

            <p className="movie-detail-meta">
              {movie.release_date?.slice(0, 4) || '개봉연도 정보 없음'}
              {movie.director ? ` · 감독 ${movie.director}` : ''}
            </p>

            {onToggleMark ? (
              <div className="movie-detail-mark-actions" aria-label="영화 상태">
                <button
                  type="button"
                  className={`room-mark${marks?.wish ? ' is-on' : ''}`}
                  aria-pressed={marks?.wish ?? false}
                  aria-label={marks?.wish ? '찜 해제' : '찜'}
                  onClick={() => onToggleMark('wish')}
                >
                  <Heart
                    size={17}
                    strokeWidth={1.7}
                    fill={marks?.wish ? 'currentColor' : 'none'}
                    aria-hidden
                  />
                  <span>{marks?.wish ? '찜한 영화' : '찜하기'}</span>
                </button>
                <button
                  type="button"
                  className={`room-mark${marks?.watched ? ' is-on' : ''}`}
                  aria-pressed={marks?.watched ?? false}
                  aria-label={marks?.watched ? '봤어요 해제' : '봤어요'}
                  onClick={() => onToggleMark('watched')}
                >
                  <Check size={17} strokeWidth={2} aria-hidden />
                  <span>{marks?.watched ? '관람 기록' : '봤어요'}</span>
                </button>
              </div>
            ) : null}

            <p className="movie-detail-overview">
              {movie.overview?.trim() || '줄거리 정보가 없어요.'}
            </p>

            <div className="movie-detail-text-controls">
              <span>설명 글자 크기</span>

              <button
                type="button"
                onClick={() => setLargeText(false)}
                aria-label="설명 글자 작게"
                aria-pressed={!largeText}
              >
                <ZoomOut size={16} strokeWidth={1.5} aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => setLargeText(true)}
                aria-label="설명 글자 크게"
                aria-pressed={largeText}
              >
                <ZoomIn size={16} strokeWidth={1.5} aria-hidden />
              </button>
            </div>
            {screening ? (
              <form
                className="movie-detail-screening"
                aria-labelledby="my-screening-title"
                onSubmit={handleSaveViewingDetails}
              >
                <p className="movie-detail-kicker" id="my-screening-title">
                  MY SCREENING
                </p>

                <label>
                  <span>관람일</span>
                  <input
                    type="date"
                    max={todayKst}
                    {...register('watchedAt')}
                    disabled={isSubmitting}
                  />
                  {errors.watchedAt?.message ? (
                    <small role="alert">{errors.watchedAt.message}</small>
                  ) : null}
                </label>

                <label className="movie-detail-viewing-type-field">
                  <span>관람 방식</span>
                  <MovieDetailSelect
                    value={selectedViewingType}
                    options={VIEWING_TYPE_OPTIONS}
                    ariaLabel="관람 방식 선택"
                    disabled={isSubmitting}
                    onChange={(value) => {
                      setValue(
                        'viewingType',
                        value as MovieScreeningFormValues['viewingType'],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        },
                      );
                      if (value !== 'other') {
                        setValue('viewingTypeCustom', '', {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                  {selectedViewingType === 'other' ? (
                    <input
                      {...register('viewingTypeCustom')}
                      placeholder="관람 방식을 직접 입력"
                      maxLength={100}
                      disabled={isSubmitting}
                    />
                  ) : null}
                  {errors.viewingTypeCustom?.message ? (
                    <small role="alert">
                      {errors.viewingTypeCustom.message}
                    </small>
                  ) : null}
                </label>

                <label className="movie-detail-platform-field">
                  <span>플랫폼</span>
                  <MovieDetailSelect
                    value={
                      viewingPlatformMode === 'custom'
                        ? 'other'
                        : selectedViewingPlatform
                    }
                    options={[
                      { value: '', label: '선택 안 함' },
                      ...VIEWING_PLATFORM_OPTIONS.map((platform) => ({
                        value: platform,
                        label: platform,
                      })),
                      { value: 'other', label: '기타' },
                    ]}
                    ariaLabel="플랫폼 선택"
                    disabled={isSubmitting}
                    onChange={(value) => {
                      if (value === 'other') {
                        setValue('viewingPlatformMode', 'custom', {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        return;
                      }

                      setValue('viewingPlatformMode', 'preset', {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue('viewingPlatform', value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                  {viewingPlatformMode === 'custom' ? (
                    <input
                      {...register('customViewingPlatform')}
                      placeholder="플랫폼을 직접 입력"
                      maxLength={40}
                      disabled={isSubmitting}
                    />
                  ) : null}
                  {errors.customViewingPlatform?.message ? (
                    <small role="alert">
                      {errors.customViewingPlatform.message}
                    </small>
                  ) : null}
                </label>

                <label>
                  <span>관람 장소</span>
                  <MapPin size={16} strokeWidth={1.5} aria-hidden />
                  <input
                    {...register('viewingLocation')}
                    placeholder="CGV 압구정, 집 등"
                    maxLength={100}
                    disabled={isSubmitting}
                    onFocus={() => setIsLocationFocused(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsLocationFocused(false), 0);
                    }}
                  />
                  {errors.viewingLocation?.message ? (
                    <small role="alert">{errors.viewingLocation.message}</small>
                  ) : null}
                  {isSearchingPlaces ? (
                    <small className="movie-detail-location-status">
                      장소를 찾는 중…
                    </small>
                  ) : null}

                  {!isSearchingPlaces && visibleLocationSuggestions.length > 0 ? (
                    <div
                      className="movie-detail-location-suggestions"
                      role="listbox"
                      aria-label="관람 장소 추천"
                    >
                      {visibleLocationSuggestions.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          role="option"
                          aria-selected={false}
                          className="movie-detail-location-option"
                          onPointerDown={(event) => {
                            event.preventDefault();
                            handleLocationSelect(location);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleLocationSelect(location);
                            }
                          }}
                        >
                          <strong>{location.name}</strong>
                          <span>
                            {location.roadAddress || location.address}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </label>

                <label>
                  <span>후기</span>
                  <textarea
                    {...register('review')}
                    placeholder="이 영화에 대한 짧은 기록을 남겨보세요"
                    maxLength={1000}
                    rows={4}
                    disabled={isSubmitting}
                  />
                  {errors.review?.message ? (
                    <small role="alert">{errors.review.message}</small>
                  ) : null}
                </label>

                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <div className="movie-detail-rating">
                      <div className="movie-detail-rating-heading">
                        <span>평점</span>
                        <strong>
                          {field.value ? (
                            <button
                              type="button"
                              onClick={() => field.onChange(null)}
                              disabled={isSubmitting}
                            >
                              평점 지우기
                            </button>
                          ) : null}
                        </strong>
                      </div>

                      <div className="movie-detail-rating-bar">
                        {Array.from({ length: 10 }, (_, index) => {
                          const score = index + 1;

                          return (
                            <button
                              key={score}
                              type="button"
                              className={
                                score <= (field.value ?? 0) ? 'is-filled' : ''
                              }
                              onClick={() => field.onChange(score)}
                              aria-label={`${score}점`}
                              aria-pressed={score === field.value}
                              disabled={isSubmitting}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                />
                {errors.rating?.message ? (
                  <small role="alert">{errors.rating.message}</small>
                ) : null}

                {viewingDetailsError ? (
                  <p role="alert">{viewingDetailsError}</p>
                ) : null}

                <button
                  type="submit"
                  className="movie-detail-screening-save"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '저장 중…' : '관람 정보 저장'}
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
