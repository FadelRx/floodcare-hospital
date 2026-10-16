import { haversineKm, type Coordinate } from "./geo";
type Relationship = "upstream-confirmed" | "direct" | "nearby";
type Station = Coordinate & { id: string; relationship: Relationship };
const priority: Record<Relationship, number> = { "upstream-confirmed": 0, direct: 1, nearby: 2 };
export function rankThaiWaterCandidates(origin: Coordinate, candidates: Station[]) {
  return candidates.map((s) => ({ ...s, distanceKm: haversineKm(origin, s) })).filter((s) => s.distanceKm !== null).sort((a, b) => priority[a.relationship] - priority[b.relationship] || a.distanceKm! - b.distanceKm!);
}
