export const EARTHQUAKE_FEATURE = {
  type: 'Feature',
  properties: {
    mag: 5.2,
    place: '39 km NW of Slavyanka, Russia',
    time: 1761392723124,
    updated: 1761396988501,
    tz: null,
    url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000rjf6',
    detail:
      'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us6000rjf6&format=geojson',
    felt: 1,
    cdi: 1,
    mmi: null,
    alert: null,
    status: 'reviewed',
    tsunami: 0,
    sig: 416,
    net: 'us',
    code: '6000rjf6',
    ids: ',us6000rjf6,usauto6000rjf6,',
    sources: ',us,usauto,',
    types: ',dyfi,internal-moment-tensor,origin,phase-data,',
    nst: 95,
    dmin: 1.33,
    rms: 0.51,
    gap: 30,
    magType: 'mb',
    type: 'earthquake',
    title: 'M 5.2 - 39 km NW of Slavyanka, Russia',
  },
  geometry: {
    type: 'Point',
    coordinates: [131.0017, 43.0788, 561.686],
  },
  id: 'us6000rjf6',
};

export const NEXT_TOKEN =
  'eyJldmVudElkIjoidXM2MDAwcmpldiIsIm1hZ1NjYWxlZCI6NDUwMCwiZ2xvYmFsTWFnIjoiR0xPQkFMI01BR05JVFVERSJ9';

export const ALLOWED_FILTERS: string[] = [
  'startTime,endTime',
  'minMagnitude,maxMagnitude',
  'location,minMagnitude,maxMagnitude',
  'location',
  'isTsunami',
  'isTsunami,startTime,endTime',
];

export const REQUEST_COUNT_BY_ENDPOINT = [
  {
    endpoint: '/earthquakes',
    total: 200,
  },
  {
    endpoint: '/earthquakes/:eventId',
    total: 15,
  },
];
