import { useCallback, useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Draw from 'ol/interaction/Draw';
import Modify from 'ol/interaction/Modify';
import GeoJSON, { type GeoJSONPolygon } from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import { Circle, Polygon } from 'ol/geom';
import { defaultStyle, selectedStyle } from './PolygonStyles';
import {
  EGeometryType,
  // type TCircleCenter,
  type TCircleData,
  // type TPolygonCoordinates,
  type TPolygonData
} from './lib/types';

const PolygonDrawer = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());

  const [coordinates, setCoordinates] = useState<(TPolygonData | TCircleData)[]>([]);

  const [selectedFeature, setSelectedFeature] = useState<Feature<Polygon> | null>(null);

  const [drawType, setDrawType] = useState<EGeometryType>(EGeometryType.Polygon);

  const [selectedPoint, setSelectedPoint] = useState<{
    feature: Feature<Polygon>;
    ringIndex: number;
    coordIndex: number;
  } | null>(null);

  // GeoJSON formatter

  const updateCoordinates = useCallback(() => {
    const features = vectorSourceRef.current.getFeatures();
    const coords = features.map(feature => {
      const geometry = feature.getGeometry();

      if (geometry instanceof Polygon) {
        const polygonCoords = geometry.getCoordinates()[0]; // наружный контур
        const lonLatCoords = polygonCoords.map(coord => toLonLat(coord));

        const result: TPolygonData = {
          type: EGeometryType.Polygon,
          id: feature.getId() as string,
          coordinates: lonLatCoords
        };

        return result;
      }

      if (geometry instanceof Circle) {
        const center = toLonLat(geometry.getCenter());
        const radius = geometry.getRadius(); // уже в метрах

        const result: TCircleData = {
          type: EGeometryType.Circle,
          id: feature.getId() as string,
          center,
          radius
        };

        return result;
      }

      // if (geometry instanceof Polygon) {
      //   const format = new GeoJSON();
      //   const geojson = format.writeFeatureObject(feature);

      //   const result: TPolygonData = {
      //     type: EGeometryType.Polygon,
      //     coordinates: ((geojson.geometry as GeoJSONPolygon).coordinates as [TPolygonCoordinates])[0]
      //   };

      //   return result;
      // }

      // if (geometry instanceof Circle) {
      //   const result: TCircleData = {
      //     type: EGeometryType.Circle,
      //     center: geometry.getCenter() as TCircleCenter,
      //     radius: geometry.getRadius()
      //   };

      //   return result;
      // }

      return null;
    });

    setCoordinates(coords.filter(c => c !== null));
  }, []);

  useEffect(() => {
    const rasterLayer = new TileLayer({ source: new OSM() });
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: defaultStyle
    });

    const map = new Map({
      target: mapRef.current as HTMLDivElement,
      layers: [rasterLayer, vectorLayer],
      view: new View({
        center: fromLonLat([37.618423, 55.751244]),
        zoom: 5
      })
    });

    // Modify
    const modify = new Modify({ source: vectorSourceRef.current });
    map.addInteraction(modify);

    map.on('click', evt => {
      let foundPoint = null;
      let minPixelDist = Infinity;

      const clickPixel = evt.pixel;

      map.forEachFeatureAtPixel(evt.pixel, feature => {
        if (!(feature.getGeometry() instanceof Polygon)) return;

        const geometry = feature.getGeometry() as Polygon;
        const coords = geometry.getCoordinates();

        coords.forEach((ring, ringIndex) => {
          ring.forEach((point, coordIndex) => {
            const pixel = map.getPixelFromCoordinate(point);
            const dx = pixel[0] - clickPixel[0];
            const dy = pixel[1] - clickPixel[1];
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30 && dist < minPixelDist) {
              minPixelDist = dist;
              foundPoint = { feature, ringIndex, coordIndex };
            }
          });
        });
      });

      if (foundPoint) {
        setSelectedPoint(foundPoint);
      } else {
        setSelectedPoint(null);
      }
    });

    // Listen to modifications
    vectorSourceRef.current.on('addfeature', updateCoordinates);
    modify.on('modifyend', updateCoordinates);

    // Выбор полигона по клику
    map.on('singleclick', evt => {
      let found = false;

      vectorSourceRef.current.getFeatures().forEach(f => f.setStyle(undefined));

      map.forEachFeatureAtPixel(evt.pixel, feature => {
        if (!(feature instanceof Feature)) return false;

        setSelectedFeature(feature as Feature<Polygon>);
        feature.setStyle(selectedStyle);
        found = true;
        return true;
      });

      if (!found) {
        setSelectedFeature(null);
      }
    });

    (mapRef.current as HTMLDivElement & { olMap?: Map }).olMap = map; // Чтобы потом к нему обращаться

    return () => {
      map.setTarget(undefined);
    };
  }, [updateCoordinates]);

  const handleDelete = () => {
    if (selectedFeature) {
      selectedFeature.setStyle(undefined); // сбрасываем стиль
      vectorSourceRef.current.removeFeature(selectedFeature);
      setSelectedFeature(null);

      // Обновить координаты
      const features = vectorSourceRef.current.getFeatures();
      const format = new GeoJSON();
      const coords = features.map(feature => {
        const geojson = format.writeFeatureObject(feature);
        return (geojson.geometry as GeoJSONPolygon).coordinates;
      });
      setCoordinates(coords);
    }
  };

  const handleAddPolygon = () => {
    const map = (mapRef.current as HTMLDivElement & { olMap?: Map })?.olMap as Map;
    if (!map) return;

    const draw = new Draw({
      source: vectorSourceRef.current,
      type: drawType
    });

    map.addInteraction(draw);

    draw.on('drawend', () => {
      map.removeInteraction(draw); // Удалить после рисования
    });
  };

  const handleDeletePoint = () => {
    if (!selectedPoint) return;

    const { feature, ringIndex, coordIndex } = selectedPoint;
    const geometry = feature.getGeometry() as Polygon;
    const coords = geometry.getCoordinates();

    const ring = coords[ringIndex];

    if (ring.length <= 4) {
      alert('Полигон должен содержать минимум 3 точки.');
      return;
    }

    ring.splice(coordIndex, 1);

    // Закрываем контур — последняя точка = первая
    if (
      ring.length > 0 &&
      (ring[ring.length - 1][0] !== ring[0][0] || ring[ring.length - 1][1] !== ring[0][1])
    ) {
      ring[ring.length - 1] = [...ring[0]];
    }

    geometry.setCoordinates(coords);
    setSelectedPoint(null);
    updateCoordinates();
  };

  const drawOptions = [
    { label: 'Полигон', value: EGeometryType.Polygon },
    { label: 'Окружность', value: EGeometryType.Circle }
  ];

  return (
    <div>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
      <h2 style={{ textAlign: 'center' }}>Рисование полигонов и окружностей</h2>
      <div
        style={{
          padding: '1em',
          display: 'flex',
          flexDirection: 'column',
          rowGap: '1rem',
          alignItems: 'center'
        }}>
        <div>
          <h3>Выберите тип рисования:</h3>
          {drawOptions.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDrawType(value)}
              style={{
                padding: '8px 16px',
                marginRight: '8px',
                backgroundColor: drawType === value ? '#007bff' : '#e0e0e0',
                color: drawType === value ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
              {label}
            </button>
          ))}
        </div>
        <div>
          <h3 style={{ marginTop: '1em' }}>Управление полигонами:</h3>
          <button
            onClick={handleAddPolygon}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5cb85c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '8px'
            }}>
            Нарисовать
          </button>

          <button
            onClick={handleDelete}
            disabled={!selectedFeature}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedFeature ? '#d9534f' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedFeature ? 'pointer' : 'not-allowed'
            }}>
            Удалить
          </button>
        </div>
        <div>
          <button
            onClick={handleDeletePoint}
            disabled={!selectedPoint}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedPoint ? '#f0ad4e' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedPoint ? 'pointer' : 'not-allowed',
              marginRight: '8px'
            }}>
            Удалить точку
          </button>
        </div>

        <h3 style={{ marginTop: '1em' }}>Координаты полигонов:</h3>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(coordinates)}</pre>
      </div>
    </div>
  );
};

export default PolygonDrawer;
