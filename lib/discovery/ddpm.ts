import { haversineKm, type Coordinate } from "./geo";
export type DdpmStation = Coordinate & { code: string; image?: string | null; liveFrame?: string | null };
export function rankDdpmCandidates(origin: Coordinate, candidates: DdpmStation[]) {
  return candidates.map((candidate) => ({ ...candidate, distanceKm: haversineKm(origin, candidate) })).filter((x) => x.distanceKm !== null).sort((a, b) => a.distanceKm! - b.distanceKm!);
}
export function ddpmImageUrl(station: Pick<DdpmStation, "image" | "liveFrame">): string | null {
  return station.image && station.image !== "no_image" ? station.image : station.liveFrame || null;
}
