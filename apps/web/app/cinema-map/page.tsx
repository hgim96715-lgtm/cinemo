'use client';

import { useEffect, useState } from 'react';
import '@/styles/common.css';
import '@/styles/cinema-map.css';
import '@/styles/cinemo-select.css';
import '@/styles/cinemo-nav.css';
import '@/styles/cinemo-page-header.css';
import '@/styles/confirm-modal.css';
import { Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';
import { CinemoSelect } from '@/components/common/CinemoSelect';
import { CinemoPageHeader } from '@/components/common/CinemoPageHeader';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import type { CinemaResponse, RegionResponse } from '@cinemo/api-contract';
import { getRegionsRequest } from '@/lib/region-api';
import { getCinemasRequest } from '@/lib/cinema-api';

const CinemaMapCanvas = dynamic(
  () => import('./CinemaMapCanvas').then((module) => module.CinemaMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="cinema-map-canvas-loading"
        role="status"
        aria-live="polite"
      >
        지도를 불러오는 중...
      </div>
    ),
  },
);

export default function CinemaMapPage() {
  const [regionAreas, setRegionAreas] = useState<RegionResponse[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regionAreasError, setRegionAreasError] = useState<string | null>(null);
  const [isRegionsLoading, setIsRegionsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [cinemas, setCinemas] = useState<CinemaResponse[]>([]);
  const [isCinemasLoading, setIsCinemasLoading] = useState(true);

  const selectedRegionData = regionAreas.find(
    (region) => region.name === selectedRegion,
  );

  const regionCenter =
    typeof selectedRegionData?.centerLatitude === 'number' &&
    typeof selectedRegionData.centerLongitude === 'number'
      ? ([
          selectedRegionData.centerLatitude,
          selectedRegionData.centerLongitude,
        ] as [number, number])
      : undefined;

  const selectedCenter: [number, number] = regionCenter ?? [37.5665, 126.978];

  const selectedZoom: number = selectedRegionData?.zoom ?? 11;

  const visibleCinemas = cinemas.map((cinema) => ({
    id: cinema.id,
    brand: cinema.brand ?? '영화관',
    name: cinema.name,
    address: cinema.roadAddress ?? cinema.address,
    position: [cinema.latitude, cinema.longitude] as [number, number],
  }));

  useEffect(() => {
    let cancelled = false;

    async function loadRegions() {
      try {
        const response = await getRegionsRequest();

        if (!cancelled) {
          setRegionAreas(response);
          setSelectedRegion(response[0]?.name ?? '');
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setRegionAreasError(
            error instanceof Error
              ? error.message
              : '지역 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsRegionsLoading(false);
        }
      }
    }

    void loadRegions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsCinemasLoading(true);
    setSearchError(null);

    if (!selectedRegion) {
      setIsCinemasLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadCinemas() {
      try {
        const response = await getCinemasRequest(selectedRegion);

        if (!cancelled) {
          setCinemas(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setSearchError(
            error instanceof Error
              ? error.message
              : '영화관 검색에 실패했어요.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsCinemasLoading(false);
        }
      }
    }

    void loadCinemas();

    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  const regionOptions = regionAreas.map((region) => ({
    value: region.name,
    label: region.addressName || region.name,
  }));

  return (
    <main className="cinema-map">
      <CinemoPageHeader
        className="cinema-map-header"
        eyebrow="CINEMO CINEMA MAP"
        title="지역별 영화관 탐색"
        description="지역을 선택해 주변 영화관을 확인해보세요."
      />

      <section className="cinema-map-layout">
        <div className="cinema-map-panel" aria-label="대한민국 지도">
          <CinemaMapCanvas
            center={selectedCenter}
            zoom={selectedZoom}
            cinemas={visibleCinemas}
            isLoading={isCinemasLoading}
          />
        </div>

        <aside className="cinema-map-panel">
          {regionAreasError ? (
            <ConfirmModal
              open={Boolean(regionAreasError)}
              title="지역 목록 조회 실패"
              description={regionAreasError}
              confirmLabel="확인"
              cancelLabel=""
              onConfirm={() => setRegionAreasError(null)}
              onClose={() => setRegionAreasError(null)}
            />
          ) : null}
          <span className="cinema-map-filter-label">지역 선택</span>
          {isRegionsLoading ? (
            <p role="status" aria-live="polite">
              지역 목록을 불러오는 중...
            </p>
          ) : (
            <CinemoSelect
              value={selectedRegion}
              options={regionOptions}
              ariaLabel="지역 선택"
              onChange={(value) => {
                setSelectedRegion(value);
              }}
            />
          )}
          <div className="cinema-map-heading">
            <h2>{selectedRegion}</h2>
            <span
              className="cinema-map-count"
              aria-label={`${visibleCinemas.length}개 영화관`}
            >
              영화관 {visibleCinemas.length}개
            </span>
          </div>
          {searchError ? (
            <ConfirmModal
              open={Boolean(searchError)}
              title="영화관 검색 실패"
              description={searchError}
              confirmLabel="확인"
              cancelLabel=""
              onConfirm={() => setSearchError(null)}
              onClose={() => setSearchError(null)}
            />
          ) : isCinemasLoading ? (
            <p className="cinema-map-status" role="status" aria-live="polite">
              영화관을 불러오는 중...
            </p>
          ) : visibleCinemas.length > 0 ? (
            <ul className="cinema-map-list">
              {visibleCinemas.map((cinema) => (
                <li key={cinema.id} className="cinema-map-list-item">
                  <span className="cinema-map-brand">{cinema.brand}</span>
                  <strong>{cinema.name}</strong>
                  <span>{cinema.address}</span>

                  <a
                    href={`https://map.kakao.com/link/to/${encodeURIComponent(
                      cinema.name,
                    )},${cinema.position[0]},${cinema.position[1]}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    카카오맵
                    <Navigation size={14} aria-hidden="true" />
                  </a>

                  <a
                    href={`https://map.naver.com/p/search/${encodeURIComponent(
                      `${cinema.name}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    네이버지도
                    <Navigation size={14} aria-hidden="true" />
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${cinema.position[0]},${cinema.position[1]}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Maps
                    <Navigation size={14} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cinema-map-empty-state">
              선택한 지역에 등록된 영화관이 없어요.
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}
