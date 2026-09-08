import type { PlaceSearchResult } from '@/lib/places-api';

export type RecentLocation = Pick<
  PlaceSearchResult,
  'id' | 'name' | 'address' | 'roadAddress'
>;

export const RECENT_LOCATIONS_STORAGE_KEY =
  'cinemo.recent-viewing-locations';
export const MAX_RECENT_LOCATIONS = 8;

export function readRecentLocations(): RecentLocation[] {
  if (typeof window === 'undefined') return [];

  try {
    const savedLocations = window.localStorage.getItem(
      RECENT_LOCATIONS_STORAGE_KEY,
    );
    const parsedLocations = savedLocations
      ? (JSON.parse(savedLocations) as unknown)
      : [];

    return Array.isArray(parsedLocations)
      ? (parsedLocations as RecentLocation[])
      : [];
  } catch {
    return [];
  }
}

export function normalizeLocationValue(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function getRecentLocationMatches(
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

export function mergeLocationSuggestions(
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

export function toRecentLocation(
  location: PlaceSearchResult | string,
): RecentLocation | null {
  const locationName =
    typeof location === 'string' ? location.trim() : location.name.trim();

  if (!locationName) return null;

  return typeof location === 'string'
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
}

export function prependRecentLocation(
  locations: RecentLocation[],
  location: PlaceSearchResult | string,
) {
  const recentLocation = toRecentLocation(location);
  if (!recentLocation) return locations;

  return [
    recentLocation,
    ...locations.filter(
      (currentLocation) =>
        normalizeLocationValue(currentLocation.name) !==
        normalizeLocationValue(recentLocation.name),
    ),
  ].slice(0, MAX_RECENT_LOCATIONS);
}
