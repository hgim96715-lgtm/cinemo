'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CalendarPlus,
  Check,
  Heart,
  Play,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { UserMovieKind } from '@cinemo/shared';
import type {
  MovieDetail,
  MovieSummary,
  PlaceSearchResult,
  UserMovieListItem,
  UserMovieMarks,
} from '@cinemo/api-contract';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { useAuthStore } from '@/lib/auth-store';
import { updateViewingDetailsRequest } from '@/lib/user-movie-api';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { kstDateKey } from '@/lib/date-kst';
import { searchPlacesRequest } from '@/lib/places-api';
import { WatchedRecordForm } from './WatchedRecordForm';
import {
  type WatchedRecordFormValues,
  isCustomViewingPlatform,
  watchedRecordSchema,
} from './watched-record-form';
import {
  RECENT_LOCATIONS_STORAGE_KEY,
  type RecentLocation,
  getRecentLocationMatches,
  mergeLocationSuggestions,
  prependRecentLocation,
  readRecentLocations,
} from './movie-detail-location';
import { ConfirmModal } from '../common/ConfirmModal';
import { MovieVideoModal } from '../common/MovieVideoModal';

const TMDB_GENRE_LABELS: Record<number, string> = {
  28: '액션',
  12: '모험',
  16: '애니메이션',
  35: '코미디',
  80: '범죄',
  99: '다큐멘터리',
  18: '드라마',
  10751: '가족',
  14: '판타지',
  36: '역사',
  27: '공포',
  10402: '음악',
  9648: '미스터리',
  10749: '로맨스',
  878: 'SF',
  53: '스릴러',
  10752: '전쟁',
  37: '서부',
};

type MovieModalMovie = MovieSummary &
  Partial<
    Pick<
      MovieDetail,
      'genre_ids' | 'origin_countries' | 'firstReleaseDate' | 'reReleaseDates'
    >
  >;

type MovieDetailModalProps = {
  movie: MovieModalMovie;
  isDetailLoading?: boolean;
  screening?: UserMovieListItem;
  marks?: Pick<UserMovieMarks, 'wish' | 'watched'>;
  showWatchedMark?: boolean;
  showCalendar?: boolean;
  onClose: () => void;
  onToggleMark?: (kind: UserMovieKind) => void;
  onSaved?: () => void;
  releaseNotificationEnabled?: boolean;
  onToggleReleaseNotification?: () => void;
};

export function MovieDetailModal({
  movie,
  isDetailLoading = false,
  screening,
  marks,
  showWatchedMark = true,
  showCalendar = true,
  onClose,
  onToggleMark,
  onSaved,
  releaseNotificationEnabled = false,
  onToggleReleaseNotification,
}: MovieDetailModalProps) {
  const [largeText, setLargeText] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [viewingDetailsError, setViewingDetailsError] = useState<string | null>(
    null,
  );
  const todayKst = kstDateKey();
  const isReleased =
    Boolean(movie.release_date) && movie.release_date <= todayKst;
  const isNotificationEnabled = Boolean(
    marks?.wish && releaseNotificationEnabled,
  );
  const poster = tmdbPosterUrl(movie.poster_path, 'w342');
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSearchResult[]>(
    [],
  );
  const [placeSuggestionsQuery, setPlaceSuggestionsQuery] = useState('');
  const [recentLocations, setRecentLocations] =
    useState<RecentLocation[]>(readRecentLocations);
  const [isPlaceFocused, setIsPlaceFocused] = useState(false);

  const [showNotificationGuide, setShowNotificationGuide] = useState(false);
  const [showNotificationTooltip, setShowNotificationTooltip] =
    useState(false);
  const notificationTooltipTimer = useRef<number | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const [searchingPlacesQuery, setSearchingPlacesQuery] = useState('');
  const calendarParams = new URLSearchParams({
    tmdbId: String(movie.id),
    title: movie.title,
    releaseDate: movie.release_date,
  });

  const calendarUrl = movie.release_date
    ? `/api/calendar/movie?${calendarParams.toString()}`
    : null;

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

  useEffect(() => {
    return () => {
      if (notificationTooltipTimer.current !== null) {
        window.clearTimeout(notificationTooltipTimer.current);
      }
    };
  }, []);

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
  } = useForm<WatchedRecordFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(watchedRecordSchema),
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
      viewingPlace: screening?.viewingPlace ?? '',
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

  const viewingPlace = useWatch({ control, name: 'viewingPlace' });

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
      viewingPlace: screening?.viewingPlace ?? '',
      review: screening?.review ?? '',
      rating: screening?.rating ?? null,
    });
  }, [screening, resetMovieScreeningForm]);

  useEffect(() => {
    const query = viewingPlace.trim();

    if (!isPlaceFocused || !accessToken || isSubmitting || query.length < 2) {
      return;
    }

    const token = accessToken;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      async function loadPlaces() {
        setSearchingPlacesQuery(query);
        try {
          const results = await searchPlacesRequest(token, query);

          if (!cancelled) {
            setPlaceSuggestions(results);
            setPlaceSuggestionsQuery(query);
          }
        } catch {
          if (!cancelled) setPlaceSuggestions([]);
        } finally {
          if (!cancelled) {
            setSearchingPlacesQuery((currentQuery) =>
              currentQuery === query ? '' : currentQuery,
            );
          }
        }
      }
      void loadPlaces();
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    accessToken,
    isPlaceFocused,
    isSubmitting,
    recentLocations,
    viewingPlace,
  ]);

  const recentLocationMatches = getRecentLocationMatches(
    recentLocations,
    viewingPlace.trim(),
  );
  const isSearchingPlaces =
    searchingPlacesQuery === viewingPlace.trim() &&
    searchingPlacesQuery.length >= 2;
  const visiblePlaceSuggestions = (
    isPlaceFocused
      ? viewingPlace.trim().length < 2 ||
        placeSuggestionsQuery !== viewingPlace.trim()
        ? recentLocationMatches
        : mergeLocationSuggestions(recentLocationMatches, placeSuggestions)
      : []
  ) as PlaceSearchResult[];

  function handlePlaceSelect(place: PlaceSearchResult) {
    setValue('viewingPlace', place.name, {
      shouldDirty: true,
      shouldValidate: true,
    });
    rememberLocation(place);
    setIsPlaceFocused(false);
    setPlaceSuggestions([]);
  }

  const handleSaveViewingDetails = handleSubmit(
    async (values: WatchedRecordFormValues) => {
      if (!screening || !accessToken) return;

      setViewingDetailsError(null);

      try {
        const details = {
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
          viewingPlace: values.viewingPlace.trim() || null,
          review: values.review.trim() || null,
          rating: values.rating,
        };

        await updateViewingDetailsRequest(
          accessToken,
          screening.tmdbId,
          details,
        );

        rememberLocation(values.viewingPlace);

        onSaved?.();
        onClose();
      } catch {
        setViewingDetailsError('관람 정보를 저장하지 못했습니다.');
      }
    },
  );

  function handleNotificationClick() {
    setShowNotificationTooltip(true);
    if (notificationTooltipTimer.current !== null) {
      window.clearTimeout(notificationTooltipTimer.current);
    }
    notificationTooltipTimer.current = window.setTimeout(() => {
      setShowNotificationTooltip(false);
      notificationTooltipTimer.current = null;
    }, 1600);

    if (!marks?.wish) {
      setShowNotificationGuide(true);
      return;
    }

    onToggleReleaseNotification?.();
  }

  return (
    <>
      <Dialog.Portal>
        <Dialog.Overlay className="movie-detail-overlay" />
        <Dialog.Content
          className={`movie-detail-modal${largeText ? ' is-large-text' : ''}`}
          aria-describedby={undefined}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <Dialog.Close asChild>
            <button
              type="button"
              className="movie-detail-close"
              aria-label="상세 설명 닫기"
            >
              <X size={22} strokeWidth={1.5} aria-hidden />
            </button>
          </Dialog.Close>

          <div className="movie-detail-content">
            <p className="movie-detail-kicker movie-detail-kicker--top">
              MOVIE DETAIL
            </p>

            <div className="movie-detail-poster">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt={`${movie.title} 포스터`} />
              ) : (
                <span>포스터 없음</span>
              )}
            </div>

            <div className="movie-detail-info">
              <Dialog.Title asChild>
                <h2>{movie.title}</h2>
              </Dialog.Title>
              <div
                className="movie-detail-genres"
                aria-label="영화 장르"
                aria-busy={isDetailLoading}
              >
                {isDetailLoading ? (
                  <>
                    <span
                      className="movie-detail-genre-skeleton movie-detail-genre-skeleton--short"
                      aria-hidden="true"
                    />
                    <span
                      className="movie-detail-genre-skeleton movie-detail-genre-skeleton--long"
                      aria-hidden="true"
                    />
                  </>
                ) : movie.genre_ids?.length ? (
                  movie.genre_ids
                    .map((genreId) => TMDB_GENRE_LABELS[genreId])
                    .filter(Boolean)
                    .map((genre) => <span key={genre}>{genre}</span>)
                ) : null}
              </div>

              <dl className="movie-detail-facts">
                {movie.firstReleaseDate || movie.release_date ? (
                  <div>
                    <dt>개봉일</dt>
                    <dd>
                      {(
                        movie.firstReleaseDate ?? movie.release_date
                      ).replaceAll('-', '.')}
                    </dd>
                  </div>
                ) : null}
                {movie.reReleaseDates?.length ? (
                  <div>
                    <dt>재개봉일</dt>
                    <dd>
                      {movie.reReleaseDates
                        .map((date) => date.replaceAll('-', '.'))
                        .join(', ')}
                    </dd>
                  </div>
                ) : null}
                {movie.director ? (
                  <div>
                    <dt>감독</dt>
                    <dd>{movie.director}</dd>
                  </div>
                ) : null}
                {movie.cast && movie.cast.length > 0 ? (
                  <div>
                    <dt>주요 배우</dt>
                    <dd>{movie.cast.slice(0, 5).join(', ')}</dd>
                  </div>
                ) : null}
              </dl>

              {onToggleMark && showWatchedMark ? (
                <div
                  className="movie-detail-mark-actions"
                  aria-label="영화 상태"
                >
                  <button
                    type="button"
                    className={`my-cinema-mark movie-detail-interest-icon${
                      marks?.wish ? ' is-on' : ''
                    }`}
                    aria-pressed={marks?.wish ?? false}
                    aria-label={
                      marks?.wish ? '보고 싶어요 취소' : '보고 싶어요'
                    }
                    onClick={() => onToggleMark('wish')}
                  >
                    <Heart
                      size={22}
                      strokeWidth={1.8}
                      fill={marks?.wish ? 'currentColor' : 'none'}
                      aria-hidden
                    />
                  </button>
                  {showWatchedMark ? (
                    <button
                      type="button"
                      className={`my-cinema-mark${marks?.watched ? ' is-on' : ''}`}
                      aria-pressed={marks?.watched ?? false}
                      aria-label={marks?.watched ? '봤어요 해제' : '봤어요'}
                      onClick={() => onToggleMark('watched')}
                    >
                      <Check size={17} strokeWidth={2} aria-hidden />
                      <span>{marks?.watched ? '관람 기록' : '봤어요'}</span>
                    </button>
                  ) : null}
                </div>
              ) : null}

              <p className="movie-detail-overview">
                {movie.overview?.trim() || '줄거리 정보가 없어요.'}
              </p>
              {movie.trailerUrl ||
              (showCalendar && calendarUrl) ||
              onToggleReleaseNotification ? (
                <div
                  className="movie-detail-actions"
                  aria-label="영화 관련 링크"
                >
                  {movie.trailerUrl ? (
                    <Dialog.Root
                      open={isVideoOpen}
                      onOpenChange={setIsVideoOpen}
                    >
                      <Dialog.Trigger asChild>
                        <button
                          type="button"
                          className="movie-detail-trailer-link"
                        >
                          <Play size={15} aria-hidden />
                          예고편 보기
                        </button>
                      </Dialog.Trigger>
                      <MovieVideoModal
                        title={movie.title}
                        videoUrl={movie.trailerUrl}
                      />
                    </Dialog.Root>
                  ) : null}
                  {showCalendar && calendarUrl ? (
                    <a
                      className="movie-detail-calendar-button"
                      href={calendarUrl}
                      aria-label={`${movie.title} 캘린더에 추가`}
                      aria-describedby={`movie-calendar-tooltip-${movie.id}`}
                    >
                      <CalendarPlus size={17} aria-hidden />
                      <span className="movie-detail-sr-only">
                        캘린더에 추가
                      </span>
                      <span
                        id={`movie-calendar-tooltip-${movie.id}`}
                        className="movie-detail-tooltip"
                        role="tooltip"
                      >
                        캘린더에 추가
                      </span>
                    </a>
                  ) : null}
                  {onToggleReleaseNotification && !isReleased ? (
                    <button
                      type="button"
                      className={`movie-detail-notification-button${
                        marks?.wish ? ' is-wish' : ''
                      }${isNotificationEnabled ? ' is-on' : ''}${
                        showNotificationTooltip ? ' is-tooltip-visible' : ''
                      }`}
                      aria-pressed={isNotificationEnabled}
                      aria-label={
                        isNotificationEnabled
                          ? '개봉일 알림 해제'
                          : '개봉일 알림 설정'
                      }
                      aria-describedby={`movie-notification-tooltip-${movie.id}`}
                      onClick={(event) => {
                        handleNotificationClick();
                        if (event.detail > 0) {
                          event.currentTarget.blur();
                        }
                      }}
                    >
                      <Bell size={17} aria-hidden />
                      <span
                        id={`movie-notification-tooltip-${movie.id}`}
                        className="movie-detail-tooltip"
                        role="tooltip"
                      >
                        {isNotificationEnabled
                          ? '알림 해제'
                          : '알림 설정'}
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="movie-detail-text-controls">
                <span>설명 크기</span>

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

                {onToggleMark && !showWatchedMark ? (
                  <button
                    type="button"
                    className={
                      marks?.wish
                        ? 'movie-detail-interest-inline is-on'
                        : 'movie-detail-interest-inline'
                    }
                    aria-pressed={marks?.wish ?? false}
                    aria-label={
                      marks?.wish ? '보고 싶어요 취소' : '보고 싶어요'
                    }
                    onClick={() => onToggleMark('wish')}
                  >
                    <Heart
                      size={19}
                      strokeWidth={1.8}
                      fill={marks?.wish ? 'currentColor' : 'none'}
                      aria-hidden
                    />
                  </button>
                ) : null}
              </div>
              {screening ? (
                <WatchedRecordForm
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
                  isPlaceFocused={isPlaceFocused}
                  onPlaceFocus={() => setIsPlaceFocused(true)}
                  onPlaceBlur={() => {
                    window.setTimeout(() => setIsPlaceFocused(false), 0);
                  }}
                  visiblePlaceSuggestions={visiblePlaceSuggestions}
                  isSearchingPlaces={isSearchingPlaces}
                  onPlaceSelect={handlePlaceSelect}
                />
              ) : null}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <ConfirmModal
        open={showNotificationGuide}
        eyebrow="개봉일 알림"
        icon={<Bell size={30} strokeWidth={1.7} />}
        title="보고 싶은 영화로 저장해 주세요"
        description="개봉일 알림은 보고 싶은 영화로 저장한 작품에서만 설정할 수 있어요."
        confirmLabel="보고 싶어요 추가"
        onClose={() => setShowNotificationGuide(false)}
        onConfirm={() => {
          onToggleMark?.('wish');
          setShowNotificationGuide(false);
        }}
      />
    </>
  );
}
