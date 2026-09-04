'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Heart,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  GachaMovie,
  UserMovieKind,
  UserMovieListItem,
  UserMovieMarks,
} from '@cinemo/shared';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { useAuthStore } from '@/lib/auth-store';
import { updateViewingDetailsRequest } from '@/lib/user-movie-api';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { kstDateKey } from '@/lib/date-kst';
import type { PlaceSearchResult } from '@/lib/places-api';
import { searchPlacesRequest } from '@/lib/places-api';
import { MovieDetailScreeningForm } from './MovieDetailScreeningForm';
import {
  type MovieScreeningFormValues,
  type SavedScreeningDetails,
  isCustomViewingPlatform,
  movieScreeningSchema,
} from './movie-detail-form';
import {
  RECENT_LOCATIONS_STORAGE_KEY,
  type RecentLocation,
  getRecentLocationMatches,
  mergeLocationSuggestions,
  prependRecentLocation,
  readRecentLocations,
} from './movie-detail-location';

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
  const [locationSuggestionsQuery, setLocationSuggestionsQuery] = useState('');
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>(
    readRecentLocations,
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
    setRecentLocations((currentLocations) =>
      prependRecentLocation(currentLocations, location),
    );
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

    if (
      !isLocationFocused ||
      !accessToken ||
      isSubmitting ||
      query.length < 2
    ) {
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
        onClose();
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
              <MovieDetailScreeningForm
                control={control}
                errors={errors}
                register={register}
                setValue={setValue}
                onSubmit={handleSaveViewingDetails}
                todayKst={todayKst}
                isSubmitting={isSubmitting}
                selectedViewingType={selectedViewingType}
                viewingPlatformMode={viewingPlatformMode}
                selectedViewingPlatform={selectedViewingPlatform}
                viewingDetailsError={viewingDetailsError}
                isLocationFocused={isLocationFocused}
                onLocationFocus={() => setIsLocationFocused(true)}
                onLocationBlur={() => {
                  window.setTimeout(() => setIsLocationFocused(false), 0);
                }}
                visibleLocationSuggestions={visibleLocationSuggestions}
                isSearchingPlaces={isSearchingPlaces}
                onLocationSelect={handleLocationSelect}
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
