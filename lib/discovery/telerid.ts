import { haversineKm, type Coordinate } from "./geo";
type Station = Coordinate & { id: string; basin: string; province: string; observedAt: string; cctv?: Array<{ path?: string | null }> };
export function rankTeleridCandidates(origin: Coordinate & { basin: string; province: string }, candidates: Station[], now = new Date()) {
  return candidates.map((s) => {
    const ageHours = (now.getTime() - Date.parse(s.observedAt)) / 3_600_000;
    return { ...s, sameBasin: s.basin === origin.basin, sameProvince: s.province === origin.province, ageHours, distanceKm: haversineKm(origin, s), cameraPath: s.cctv?.find((c) => !!c.path)?.path ?? null };
  }).filter((s) => s.distanceKm !== null && s.ageHours >= 0 && s.ageHours <= 24).sort((a, b) => Number(b.sameBasin) - Number(a.sameBasin) || Number(b.sameProvince) - Number(a.sameProvince) || a.ageHours - b.ageHours || a.distanceKm! - b.distanceKm!);
}
