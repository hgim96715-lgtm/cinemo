export type KakaoPlaceDocument = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
  x: string;
  y: string;
};

export type KakaoKeywordResponse = {
  documents: KakaoPlaceDocument[];
};
