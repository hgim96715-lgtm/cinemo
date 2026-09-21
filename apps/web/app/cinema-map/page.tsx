import { Suspense } from 'react';
import CinemaMapClient from './CinemaMapClient';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

export default function CinemaMapPage() {
  return (
    <Suspense fallback={<p>페이지를 불러오는 중...</p>}>
      <CinemaMapClient />
    </Suspense>
  );
}
