export type Coordinate = { lat: number; lon: number };
export function validCoordinate(p: Coordinate): boolean {
  return Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lat >= -90 && p.lat <= 90 && p.lon >= -180 && p.lon <= 180 && !(p.lat === 0 && p.lon === 0);
}
export function haversineKm(a: Coordinate, b: Coordinate): number | null {
  if (!validCoordinate(a) || !validCoordinate(b)) return null;
  const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
