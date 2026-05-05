import * as geoip from 'geoip-lite';

export const IPToLocationHelper = (ip: string): string | undefined => {
  const geo = geoip.lookup(ip);
  if (geo) {
    const country =
      !geo.country || geo.country.length === 0 ? 'Unknown' : geo.country;
    const city = !geo.city || geo.city.length === 0 ? 'Unknown' : geo.city;
    return `${country} / ${city}`;
  } else {
    return undefined;
  }
};
