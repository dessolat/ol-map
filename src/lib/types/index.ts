import type { Coordinate } from 'ol/coordinate';

export enum EGeometryType {
  Polygon = 'Polygon',
  Circle = 'Circle'
}

export type TPolygonCoordinates = Coordinate[];
// export type TPolygonCoordinates = [number, number][];
export type TPolygonData = { type: EGeometryType.Polygon; id: string; coordinates: TPolygonCoordinates };

export type TCircleCenter = Coordinate;
// export type TCircleCenter = [number, number];
export type TCircleData = { type: EGeometryType.Circle; id: string; center: TCircleCenter; radius: number };

export enum EAppMode {
  Video = 'video',
  Polygon = 'polygon'
}
