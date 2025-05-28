
export interface ProvinceData {
  fileName: string;
  jsonData: any;
}

export interface ProvinceInfo {
  id: string;
  count: number;
  radius: number;
  x: number;
  y: number;
  fx?: number;
  fy?: number;
  lines?: string[];
}

export interface ProvinceGeo {
  lat: number;
  lon: number;
}
