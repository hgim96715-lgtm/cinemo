export type CinemaMapRegion = {
  name: string;
  center: [number, number];
  zoom: number;
};

export type CinemaMapCinema = {
  id: string;
  name: string;
  address: string;
  brand: string;
  position: [number, number];
};

export const regions: CinemaMapRegion[] = [
  {
    name: '서울특별시',
    center: [37.5665, 126.978],
    zoom: 11,
  },
  {
    name: '부산광역시',
    center: [35.1796, 129.0756],
    zoom: 11,
  },
  {
    name: '대구광역시',
    center: [35.8714, 128.6014],
    zoom: 11,
  },
];

export const districtCenters: Record<string, [number, number]> = {
  '서울특별시-강남구': [37.5172, 127.0473],
  '서울특별시-중구': [37.5636, 126.9975],
  '서울특별시-마포구': [37.5663, 126.9014],

  '부산광역시-해운대구': [35.1631, 129.1636],
  '부산광역시-수영구': [35.1458, 129.1132],
  '부산광역시-중구': [35.1063, 129.0323],

  '대구광역시-중구': [35.8694, 128.5945],
  '대구광역시-수성구': [35.8583, 128.6308],
  '대구광역시-북구': [35.8859, 128.5829],
};
