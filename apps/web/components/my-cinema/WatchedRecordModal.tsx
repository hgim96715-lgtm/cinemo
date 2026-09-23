'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import type {
  CinemaResponse,
  MovieSearchItem,
  MovieSummary,
  PlaceSearchResult,
  UserMovieListItem,
} from '@cinemo/api-contract';

import { useAuthStore } from '@/lib/auth-store';
import { kstDateKey } from '@/lib/date-kst';
import { tmdbPosterUrl } from '@/lib/tmdb-image';
import { searchCinemasRequest } from '@/lib/cinema-api';
import { searchPlacesRequest } from '@/lib/places-api';
import {
  toggleUserMovieRequest,
  updateViewingDetailsRequest,
} from '@/lib/user-movie-api';
import {
  isCustomViewingPlatform,
  type WatchedRecordFormValues,
  watchedRecordSchema,
} from './watched-record-form';
import { WatchedRecordForm } from './WatchedRecordForm';
import { WatchedRecordMovie } from './movie-record.types';
import { HomeTicketToggle } from './HomeTicketToggle';

type WatchedPlaceOption = PlaceSearchResult & {
  cinemaId?: string;
};

function normalizePlaceName(value: string) {
  return value.trim().replace(/\s+/g, '').toLocaleLowerCase();
}

type Props = {
  open: boolean;
  movie: WatchedRecordMovie;
  watchedRecord?: UserMovieListItem;
  isDisplayed: boolean;
  onToggleDisplay: () => void;
  onClose: () => void;
  onSaved?: () => void;
};

function toCinemaPlace(cinema: CinemaResponse): WatchedPlaceOption {
  return {
    id: `cinema:${cinema.id}`,
    name: cinema.name,
    category: cinema.category ?? '영화관',
    address: cinema.address,
    roadAddress: cinema.roadAddress ?? '',
    placeUrl: cinema.placeUrl ?? '',
    longitude: cinema.longitude,
    latitude: cinema.latitude,
    cinemaId: cinema.id,
  };
}

function mergePlaceOptions(
  cinemas: WatchedPlaceOption[],
  places: PlaceSearchResult[],
) {
  const merged = [...cinemas, ...places];
  const seen = new Set<string>();

  return merged.filter((place) => {
    const key = `${place.name}:${place.roadAddress || place.address}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function resolveCinemaId(viewingPlace: string) {
  const query = viewingPlace.trim();
  if (!query) {
    return null;
  }
  try {
    const cinemas = await searchCinemasRequest(query);
    const normalizedQuery = normalizePlaceName(query);
    const matches = cinemas.filter((cinema) => {
      const normalizedName = normalizePlaceName(cinema.name);
      const normalizedAddress = normalizePlaceName(
        `${cinema.name} ${cinema.address} ${cinema.roadAddress ?? ''}`,
      );
      return (
        normalizedName === normalizedQuery ||
        normalizedAddress === normalizedQuery
      );
    });
    return matches.length === 1 ? matches[0].id : null;
  } catch {
    return null;
  }
}

export function WatchedRecordModal({
  open,
  movie,
  watchedRecord,
  isDisplayed,
  onToggleDisplay,
  onClose,
  onSaved,
}: Props) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const todayKst = kstDateKey();
  const poster = tmdbPosterUrl(movie.poster_path, 'w185');

  const [isPlaceFocused, setIsPlaceFocused] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<
    WatchedPlaceOption[]
  >([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | null>(
    watchedRecord?.cinemaId ?? null,
  );
  const [selectedCinemaName, setSelectedCinemaName] = useState(
    watchedRecord?.viewingPlace ?? '',
  );
  const [viewingDetailsError, setViewingDetailsError] = useState<string | null>(
    null,
  );

  const {
    control,
    register,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WatchedRecordFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(watchedRecordSchema),
    defaultValues: {
      watchedAt: watchedRecord?.watchedAt?.slice(0, 10) ?? todayKst,
      viewingType: watchedRecord?.viewingType ?? '',
      viewingTypeCustom: watchedRecord?.viewingTypeCustom ?? '',
      viewingPlatformMode: isCustomViewingPlatform(
        watchedRecord?.viewingPlatform,
      )
        ? 'custom'
        : 'preset',
      viewingPlatform: isCustomViewingPlatform(watchedRecord?.viewingPlatform)
        ? ''
        : (watchedRecord?.viewingPlatform ?? ''),
      customViewingPlatform: isCustomViewingPlatform(
        watchedRecord?.viewingPlatform,
      )
        ? (watchedRecord?.viewingPlatform ?? '')
        : '',
      viewingPlace: watchedRecord?.viewingPlace ?? '',
      review: watchedRecord?.review ?? '',
      rating: watchedRecord?.rating ?? null,
    },
  });

  const viewingPlace = useWatch({
    control,
    name: 'viewingPlace',
  });

  const selectedViewingType = useWatch({
    control,
    name: 'viewingType',
  });

  const viewingPlatformMode = useWatch({
    control,
    name: 'viewingPlatformMode',
  });

  const selectedViewingPlatform = useWatch({
    control,
    name: 'viewingPlatform',
  });

  useEffect(() => {
    reset({
      watchedAt: watchedRecord?.watchedAt?.slice(0, 10) ?? todayKst,
      viewingType: watchedRecord?.viewingType ?? '',
      viewingTypeCustom: watchedRecord?.viewingTypeCustom ?? '',
      viewingPlatformMode: isCustomViewingPlatform(
        watchedRecord?.viewingPlatform,
      )
        ? 'custom'
        : 'preset',
      viewingPlatform: isCustomViewingPlatform(watchedRecord?.viewingPlatform)
        ? ''
        : (watchedRecord?.viewingPlatform ?? ''),
      customViewingPlatform: isCustomViewingPlatform(
        watchedRecord?.viewingPlatform,
      )
        ? (watchedRecord?.viewingPlatform ?? '')
        : '',
      viewingPlace: watchedRecord?.viewingPlace ?? '',
      review: watchedRecord?.review ?? '',
      rating: watchedRecord?.rating ?? null,
    });

    setSelectedCinemaId(watchedRecord?.cinemaId ?? null);
    setSelectedCinemaName(watchedRecord?.viewingPlace ?? '');
  }, [reset, watchedRecord, todayKst]);

  useEffect(() => {
    if (
      selectedCinemaName &&
      viewingPlace.trim() !== selectedCinemaName.trim()
    ) {
      setSelectedCinemaId(null);
      setSelectedCinemaName('');
    }
  }, [selectedCinemaName, viewingPlace]);

  useEffect(() => {
    const query = viewingPlace.trim();
    const shouldSearch = open && isPlaceFocused;

    if (!open || !shouldSearch || query.length < 2) {
      setPlaceSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    let cancelled = false;
    let cinemaPlaces: WatchedPlaceOption[] = [];
    let placeResults: PlaceSearchResult[] = [];

    const publishSuggestions = () => {
      if (!cancelled) {
        setPlaceSuggestions(mergePlaceOptions(cinemaPlaces, placeResults));
      }
    };

    setPlaceSuggestions([]);
    setIsSearchingPlaces(true);

    const timer = window.setTimeout(async () => {
      const cinemaRequest = searchCinemasRequest(query).then(
        (cinemas) => {
          if (cancelled) return;

          cinemaPlaces = cinemas.map(toCinemaPlace);

          const exactCinema = cinemaPlaces.find(
            (cinema) =>
              normalizePlaceName(cinema.name) === normalizePlaceName(query),
          );

          if (exactCinema?.cinemaId) {
            setSelectedCinemaId(exactCinema.cinemaId);
            setSelectedCinemaName(exactCinema.name);
          }

          publishSuggestions();
        },
        () => {
          publishSuggestions();
        },
      );

      const placeRequest = (
        accessToken
          ? searchPlacesRequest(accessToken, query)
          : Promise.resolve([])
      ).then(
        (places) => {
          if (cancelled) return;
          placeResults = places;
          publishSuggestions();
        },
        () => {
          publishSuggestions();
        },
      );

      await Promise.all([cinemaRequest, placeRequest]);

      if (!cancelled) {
        setIsSearchingPlaces(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accessToken, isPlaceFocused, open, viewingPlace]);

  function handlePlaceSelect(place: WatchedPlaceOption) {
    setValue('viewingPlace', place.name, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setSelectedCinemaId(place.cinemaId ?? null);
    setSelectedCinemaName(place.name);
    setIsPlaceFocused(false);
  }

  const handleSave = handleSubmit(async (values) => {
    if (!accessToken) {
      return;
    }
    const cinemaId =
      selectedCinemaId ?? (await resolveCinemaId(values.viewingPlace));

    setViewingDetailsError(null);

    try {
      if (!watchedRecord) {
        await toggleUserMovieRequest(accessToken, movie.id, 'watched');
      }

      await updateViewingDetailsRequest(accessToken, movie.id, {
        cinemaId,
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
      });

      onSaved?.();
      onClose();
    } catch (error: unknown) {
      setViewingDetailsError(
        error instanceof Error
          ? error.message
          : '관람 기록을 저장하지 못했습니다.',
      );
    }
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="movie-detail-overlay" />

        <Dialog.Content
          className="movie-detail-modal watched-record-modal"
          aria-describedby={undefined}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <HomeTicketToggle
            isDisplayed={isDisplayed}
            onToggle={onToggleDisplay}
          />

          <Dialog.Close asChild>
            <button
              type="button"
              className="movie-detail-close"
              aria-label="관람 기록 모달 닫기"
            >
              <X size={22} strokeWidth={1.5} aria-hidden />
            </button>
          </Dialog.Close>

          <Dialog.Title className="movie-detail-kicker">
            WATCHED RECORD
          </Dialog.Title>

          <div className="watched-record-modal-poster">
            {poster ? (
              <Image
                src={poster}
                alt={`${movie.title} 포스터`}
                fill
                sizes="88px"
              />
            ) : (
              <span>포스터 없음</span>
            )}
          </div>

          <h2>{movie.title}</h2>

          <WatchedRecordForm
            control={control}
            errors={errors}
            register={register}
            setValue={setValue}
            onSubmit={handleSave}
            todayKst={todayKst}
            isSubmitting={isSubmitting}
            selectedViewingType={selectedViewingType}
            viewingPlatformMode={viewingPlatformMode}
            selectedViewingPlatform={selectedViewingPlatform}
            viewingDetailsError={viewingDetailsError}
            isPlaceFocused={isPlaceFocused}
            onPlaceFocus={() => setIsPlaceFocused(true)}
            onPlaceBlur={() => setIsPlaceFocused(false)}
            visiblePlaceSuggestions={placeSuggestions}
            isSearchingPlaces={isSearchingPlaces}
            onPlaceSelect={handlePlaceSelect}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
