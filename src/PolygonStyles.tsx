import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

export const defaultStyle = new Style({
  fill: new Fill({
    color: 'rgba(0, 123, 255, 0.1)',
  }),
  stroke: new Stroke({
    color: '#007bff',
    width: 2,
  }),
});

export const selectedStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 193, 7, 0.3)',
  }),
  stroke: new Stroke({
    color: '#ffc107',
    width: 3,
  }),
});