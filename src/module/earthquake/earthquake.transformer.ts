import { EarthquakeItem, EarthquakeRecord } from './earthquake.model';

export function transformFeatureToRecord(
  feature: EarthquakeItem,
): EarthquakeRecord {
  const { id, properties } = feature;

  return {
    id,
    time: properties.time,
    mag: properties.mag,
    allKey: 'ALL',
    location: properties.net,
    locationTsunami: `${properties.net}#${properties.tsunami}`,
    tsunami: properties.tsunami,
    magBucket: 'MAG',
    attributes: feature,
  };
}

export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }

  return batches;
}
