import { EarthquakeFeature, EarthquakeRecord } from './earthquake.model';

export function transformFeatureToRecord(
  feature: EarthquakeFeature,
): EarthquakeRecord {
  const { id, properties } = feature;
  const magScaled = Math.round(properties.mag * 1000); // Scale magnitude to ensure precision
  const location = properties.place.split(',').pop() || 'N/A'; // Take the last part as location

  return {
    eventId: id,
    time: properties.time,
    globalTime: 'GLOBAL#TIME',
    globalMag: 'GLOBAL#MAGNITUDE',
    magScaled,
    location: location.trim(),
    status: properties.status,
    tsunami: properties.tsunami,
    feature,
  };
}

export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }

  return batches;
}
