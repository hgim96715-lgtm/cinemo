'use client';

import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useEffect, useRef } from 'react';
import type { CinemaMapCinema } from './cinema-map-data';

type CinemaMapCanvasProps = {
  center: [number, number];
  zoom: number;
  cinemas: CinemaMapCinema[];
  focusCinemaId: string | null;
  isLoading: boolean;
  mapFitKey: string;
  mapResetKey: number;
  fitToItems: boolean;
};

type CinemaMapViewProps = Pick<
  CinemaMapCanvasProps,
  | 'center'
  | 'zoom'
  | 'cinemas'
  | 'isLoading'
  | 'mapFitKey'
  | 'mapResetKey'
  | 'fitToItems'
>;

const cinemaMarkerIcon = L.divIcon({
  className: 'cinema-marker',
  html: '<span aria-hidden="true">📍</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

function FocusCinema({
  cinemaId,
  cinemas,
}: {
  cinemaId: string | null;
  cinemas: CinemaMapCinema[];
}) {
  const map = useMap();
  const lastFocusedCinemaId = useRef<string | null>(null);

  useEffect(() => {
    if (!cinemaId) {
      lastFocusedCinemaId.current = null;
      return;
    }

    if (lastFocusedCinemaId.current === cinemaId) {
      return;
    }

    const cinema = cinemas.find((item) => item.id === cinemaId);

    if (!cinema || !map.getPane('mapPane')) {
      return;
    }

    lastFocusedCinemaId.current = cinemaId;
    console.log('[CinemaMap][focus]', {
      cinemaId,
      center: map.getCenter(),
      zoom: map.getZoom(),
      target: cinema.position,
    });
    map.once('moveend', () => {
      const movedCenter = map.getCenter();

      console.log('[CinemaMap][focus:moveend]', {
        cinemaId,
        center: [movedCenter.lat, movedCenter.lng],
        zoom: map.getZoom(),
      });
      console.log(
        `[CinemaMap][focus:location] lat=${movedCenter.lat.toFixed(6)}, lng=${movedCenter.lng.toFixed(6)}, zoom=${map.getZoom()}`,
      );
    });
    map.stop();
    map.flyTo(cinema.position, 17, {
      animate: true,
      duration: 0.8,
    });
  }, [cinemaId, cinemas, map]);

  return null;
}

function MoveMap({
  center,
  zoom,
  cinemas,
  isLoading,
  mapFitKey,
  mapResetKey,
  fitToItems,
}: CinemaMapViewProps) {
  const map = useMap();
  const isFirstRender = useRef(true);
  const lastMapFitKey = useRef<string | null>(null);
  const lastMapResetKey = useRef(mapResetKey);
  const normalMapView = useRef<{
    center: [number, number];
    zoom: number;
  } | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    const frameId = window.requestAnimationFrame(() => {
      if (container.isConnected) {
        map.invalidateSize({ animate: false, pan: false });
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [map]);

  useEffect(() => {
    const handleMapMoveEnd = () => {
      const movedCenter = map.getCenter();

      console.log(
        `[CinemaMap][map:moveend] lat=${movedCenter.lat.toFixed(6)}, lng=${movedCenter.lng.toFixed(6)}, zoom=${map.getZoom()}`,
      );
    };

    map.on('moveend', handleMapMoveEnd);

    return () => {
      map.off('moveend', handleMapMoveEnd);
    };
  }, [map]);

  useEffect(() => {
    if (lastMapResetKey.current === mapResetKey) {
      return;
    }

    lastMapResetKey.current = mapResetKey;

    // 지역·페이지 데이터가 로딩되는 동안에는 이전 지역으로 먼저 이동하지 않는다.
    // 새 데이터가 도착한 뒤 bounds 이동 한 번만 실행해야 화면이 끊기지 않는다.
    if (isLoading) {
      return;
    }

    if (!map.getPane('mapPane')) {
      return;
    }

    const view = normalMapView.current;

    if (view) {
      map.flyTo(view.center, view.zoom, {
        animate: true,
        duration: 0.5,
        easeLinearity: 0.25,
      });
    } else {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 0.5,
        easeLinearity: 0.25,
      });
    }
  }, [center, isLoading, map, mapResetKey, zoom]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastMapFitKey.current = mapFitKey;
      return;
    }

    if (isLoading || lastMapFitKey.current === mapFitKey) {
      return;
    }

    lastMapFitKey.current = mapFitKey;

    if (!map.getPane('mapPane')) {
      return;
    }

    if (fitToItems && cinemas.length > 0) {
      const positions = cinemas
        .map((cinema) => cinema.position)
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        const fittedZoom = Math.min(
          map.getBoundsZoom(bounds, false, L.point(32, 32)),
          13,
        );
        const fittedCenter = bounds.getCenter();

        normalMapView.current = {
          center: [fittedCenter.lat, fittedCenter.lng],
          zoom: fittedZoom,
        };

        map.flyToBounds(bounds, {
          padding: [32, 32],
          maxZoom: 13,
          animate: true,
          duration: 0.6,
          easeLinearity: 0.25,
        });
      }
    } else {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 0.6,
        easeLinearity: 0.25,
      });
      normalMapView.current = {
        center,
        zoom,
      };
    }

  }, [center, cinemas, fitToItems, isLoading, map, mapFitKey, zoom]);

  return null;
}

export function CinemaMapCanvas({
  center = [37.5665, 126.978],
  zoom = 11,
  cinemas,
  focusCinemaId,
  isLoading,
  mapFitKey,
  mapResetKey,
  fitToItems,
}: CinemaMapCanvasProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="cinema-map-canvas"
      scrollWheelZoom={false}
    >
      <MoveMap
        center={center}
        zoom={zoom}
        cinemas={cinemas}
        isLoading={isLoading}
        mapFitKey={mapFitKey}
        mapResetKey={mapResetKey}
        fitToItems={fitToItems}
      />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution={
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      />

      <FocusCinema cinemaId={focusCinemaId} cinemas={cinemas} />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={40}
        disableClusteringAtZoom={16}
      >
        {cinemas.map((cinema) => (
          <Marker
            key={cinema.id}
            position={cinema.position}
            icon={cinemaMarkerIcon}
          >
            <Popup>
              <strong>{cinema.name}</strong>
              <br />
              {cinema.address}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
