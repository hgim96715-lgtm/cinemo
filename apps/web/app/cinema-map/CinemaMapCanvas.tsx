'use client';

// Leaflet은 DOM을 직접 관리하므로 개발 중 Fast Refresh에서 이전 지도 인스턴스를 재사용하지 않음.
// @refresh reset

import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { CinemaMapCinema } from './cinema-map-data';

type CinemaMapCanvasProps = {
  center: [number, number];
  zoom: number;
  cinemas: CinemaMapCinema[];
  isLoading: boolean;
};

type CinemaMapViewProps = Pick<
  CinemaMapCanvasProps,
  'center' | 'zoom' | 'cinemas' | 'isLoading'
>;

const cinemaMarkerIcon = L.divIcon({
  className: 'cinema-marker',
  html: '<span aria-hidden="true">📍</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

function MoveMap({ center, zoom, cinemas, isLoading }: CinemaMapViewProps) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      if (container.isConnected) {
        map.invalidateSize({ pan: false });
      }
    });

    resizeObserver.observe(container);

    const frameId = window.requestAnimationFrame(() => {
      if (container.isConnected) {
        map.invalidateSize({ pan: false });
      }
    });

    const timeoutId = window.setTimeout(() => {
      if (container.isConnected) {
        map.invalidateSize({ pan: false });
      }
    }, 100);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [map]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (isLoading) {
      return;
    }

    if (!map.getPane('mapPane')) {
      return;
    }

    map.stop();

    if (cinemas.length > 0) {
      const positions = cinemas
        .map((cinema) => cinema.position)
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);

        map.flyToBounds(bounds, {
          padding: [32, 32],
          maxZoom: 13,
          animate: true,
          duration: 0.8,
        });
      }
    } else {
      map.flyTo(center, zoom, {
        duration: 0.8,
      });
    }

    return () => {
      if (map.getPane('mapPane')) {
        map.stop();
      }
    };
  }, [center, cinemas, isLoading, map, zoom]);

  return null;
}

export function CinemaMapCanvas({
  center = [37.5665, 126.978],
  zoom = 11,
  cinemas,
  isLoading,
}: CinemaMapCanvasProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="cinema-map-canvas"
      scrollWheelZoom
    >
      <MoveMap
        center={center}
        zoom={zoom}
        cinemas={cinemas}
        isLoading={isLoading}
      />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution={
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      />

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
    </MapContainer>
  );
}
