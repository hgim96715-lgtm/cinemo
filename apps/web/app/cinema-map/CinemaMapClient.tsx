'use client';

import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
import type {
  CinemaAnalysisResponse,
  CinemaPageResponse,
  CinemaResponse,
  RegionResponse,
} from '@cinemo/api-contract';
import { getRegionsRequest } from '@/lib/region-api';
import {
  getCinemaAnalysisRequest,
  getCinemasRequest,
  searchCinemasRequest,
} from '@/lib/cinema-api';
import { CinemaAnalysisCharts } from './CinemaAnalysisCharts';

const CINEMA_PAGE_SIZE = 20;

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [regionAreas, setRegionAreas] = useState<RegionResponse[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regionAreasError, setRegionAreasError] = useState<string | null>(null);
  const [isRegionsLoading, setIsRegionsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [cinemas, setCinemas] = useState<CinemaResponse[]>([]);
  const [isCinemasLoading, setIsCinemasLoading] = useState(true);
  const [cinemaSearchQuery, setCinemaSearchQuery] = useState('');
  const [searchedCinemas, setSearchedCinemas] = useState<CinemaResponse[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [cinemaPage, setCinemaPage] = useState<CinemaPageResponse | null>(null);
  const [cinemaPageNumber, setCinemaPageNumber] = useState(1);
  const [analysis, setAnalysis] = useState<CinemaAnalysisResponse | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const selectedTab =
    searchParams.get('tab') === 'analysis' ? 'analysis' : 'map';

  const handleTabChange = (value: string) => {
    if (value === selectedTab) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

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
    if (selectedTab !== 'analysis' || analysis) {
      return;
    }
    let cancelled = false;

    async function loadAnalysis() {
      setIsAnalysisLoading(true);
      setAnalysisError(null);

      try {
        const response = await getCinemaAnalysisRequest();

        if (!cancelled) {
          setAnalysis(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setAnalysisError(
            error instanceof Error
              ? error.message
              : '영화관 분석을 불러오지 못했어요.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsAnalysisLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [selectedTab, analysis]);

  useEffect(() => {
    let cancelled = false;

    async function loadCinemas() {
      setIsCinemasLoading(true);

      try {
        const response = await getCinemasRequest(
          selectedRegion || undefined,
          cinemaPageNumber,
          CINEMA_PAGE_SIZE,
        );
        if (!cancelled) {
          setCinemas(response.items);
          setCinemaPage(response);
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
  }, [selectedRegion, cinemaPageNumber]);

  useEffect(() => {
    const query = cinemaSearchQuery.trim();
    let cancelled = false;

    async function loadSearchedCinemas() {
      try {
        const response = await searchCinemasRequest(query);
        if (!cancelled) {
          setSearchedCinemas(response);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setSearchedCinemas([]);
          setSearchError(
            error instanceof Error
              ? error.message
              : '영화관 검색에 실패했어요.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsSearchLoading(false);
        }
      }
    }

    const timerId = window.setTimeout(
      () => {
        if (!query) {
          setSearchedCinemas([]);
          setIsSearchLoading(false);
          setSearchError(null);
          return;
        }

        setSearchedCinemas([]);
        setIsSearchLoading(true);
        setSearchError(null);
        void loadSearchedCinemas();
      },
      query ? 300 : 0,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [cinemaSearchQuery]);

  const selectedRegionTitle = selectedRegion || '전체 지역';
  const regionOptions = [
    { value: '', label: '전체 지역' },
    ...regionAreas.map((region) => ({
      value: region.name,
      label: region.addressName || region.name,
    })),
  ];

  const isGlobalSearch = cinemaSearchQuery.trim().length > 0;

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

  const isAllRegions = selectedRegion === '';

  const selectedCenter: [number, number] =
    isAllRegions || isGlobalSearch
      ? [36.5, 127.8]
      : (regionCenter ?? [37.5665, 126.978]);

  const selectedZoom =
    isAllRegions || isGlobalSearch ? 7 : (selectedRegionData?.zoom ?? 11);

  const cinemasForDisplay = cinemaSearchQuery.trim()
    ? searchedCinemas
    : cinemas;

  const visibleCinemas = cinemasForDisplay.map((cinema) => ({
    id: cinema.id,
    brand: cinema.brand ?? '영화관',
    name: cinema.name,
    address: cinema.roadAddress ?? cinema.address,
    position: [cinema.latitude, cinema.longitude] as [number, number],
  }));

  const cinemaCount = isGlobalSearch
    ? visibleCinemas.length
    : (cinemaPage?.totalCount ?? 0);

  return (
    <main className="cinema-map">
      <CinemoPageHeader
        className="cinema-map-header"
        eyebrow="CINEMO CINEMA MAP"
        title="지역별 영화관 탐색"
        description="지역을 선택해 주변 영화관을 확인해보세요."
      />

      <Tabs.Root
        className="cinema-map-tabs-root"
        value={selectedTab}
        onValueChange={handleTabChange}
      >
        <Tabs.List className="cinema-map-tabs" aria-label="영화관 화면">
          <Tabs.Trigger className="cinema-map-tab" value="map">
            지도
          </Tabs.Trigger>
          <Tabs.Trigger className="cinema-map-tab" value="analysis">
            분석
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="cinema-map-tab-panel" value="map">
          <section className="cinema-map-layout">
            <div className="cinema-map-panel" aria-label="대한민국 지도">
              <CinemaMapCanvas
                center={selectedCenter}
                zoom={selectedZoom}
                cinemas={visibleCinemas}
                isLoading={isCinemasLoading || isSearchLoading}
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
                <>
                  <CinemoSelect
                    value={selectedRegion}
                    options={regionOptions}
                    ariaLabel="지역 선택"
                    onChange={(value) => {
                      setIsCinemasLoading(true);
                      setCinemas([]);
                      setCinemaPage(null);
                      setCinemaPageNumber(1);
                      setCinemaSearchQuery('');
                      setSelectedRegion(value);
                    }}
                  />
                  <label
                    className="cinema-map-filter-label"
                    htmlFor="cinema-search"
                  >
                    영화관 검색
                  </label>
                  <input
                    className="cinema-map-search"
                    type="search"
                    value={cinemaSearchQuery}
                    onChange={(event) =>
                      setCinemaSearchQuery(event.target.value)
                    }
                    placeholder="영화관 이름, 주소, 브랜드 검색"
                    aria-label="영화관 검색"
                  />
                  <div className="cinema-map-heading">
                    <h2>
                      {isGlobalSearch
                        ? '전국 영화관 검색 결과'
                        : selectedRegionTitle}
                    </h2>

                    {isCinemasLoading || isSearchLoading ? (
                      <span
                        className="cinema-map-count cinema-map-count--placeholder"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="cinema-map-count"
                        aria-label={`${cinemaCount}개 영화관`}
                      >
                        {isGlobalSearch ? '검색 결과' : '영화관'} {cinemaCount}
                        개
                      </span>
                    )}
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
                  ) : (isCinemasLoading || isSearchLoading) &&
                    visibleCinemas.length === 0 ? (
                    <p
                      className="cinema-map-status"
                      role="status"
                      aria-live="polite"
                    >
                      영화관을 불러오는 중...
                    </p>
                  ) : visibleCinemas.length > 0 ? (
                    <ul className="cinema-map-list">
                      {visibleCinemas.map((cinema) => (
                        <li key={cinema.id} className="cinema-map-list-item">
                          <span className="cinema-map-brand">
                            {cinema.brand}
                          </span>
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
                      {isGlobalSearch
                        ? '검색 결과가 없어요.'
                        : '선택한 지역에 등록된 영화관이 없어요.'}
                    </p>
                  )}

                  {!isGlobalSearch &&
                  cinemaPage &&
                  cinemaPage.totalPages > 1 ? (
                    <nav
                      className="cinema-map-pagination"
                      aria-label="영화관 목록 페이지"
                    >
                      <button
                        type="button"
                        disabled={isCinemasLoading || cinemaPage.page === 1}
                        onClick={() =>
                          setCinemaPageNumber((page) => Math.max(1, page - 1))
                        }
                      >
                        이전
                      </button>
                      <span>
                        {cinemaPage.page} / {cinemaPage.totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={
                          isCinemasLoading ||
                          cinemaPage.page === cinemaPage.totalPages
                        }
                        onClick={() =>
                          setCinemaPageNumber((page) =>
                            Math.min(cinemaPage.totalPages, page + 1),
                          )
                        }
                      >
                        다음
                      </button>
                    </nav>
                  ) : null}
                </>
              )}
            </aside>
          </section>
        </Tabs.Content>

        <Tabs.Content className="cinema-map-tab-panel" value="analysis">
          <section className="cinema-map-analysis-panel">
            <div className="cinema-analysis-heading">
              <div>
                <span className="cinema-analysis-kicker">OVERVIEW</span>
                <h2>영화관 분석</h2>
              </div>

              {analysis ? (
                <div className="cinema-analysis-total">
                  <span>전체 영화관</span>
                  <strong>{analysis.totalCount.toLocaleString()}</strong>
                  <span>개</span>
                </div>
              ) : null}
            </div>

            {isAnalysisLoading ? (
              <p className="cinema-analysis-status" role="status">
                분석 데이터를 불러오는 중...
              </p>
            ) : analysisError ? (
              <p className="cinema-analysis-status" role="alert">
                {analysisError}
              </p>
            ) : analysis ? (
              <CinemaAnalysisCharts analysis={analysis} />
            ) : null}
          </section>
        </Tabs.Content>
      </Tabs.Root>
    </main>
  );
}
