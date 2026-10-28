import { NextResponse } from "next/server";
import { EAST_AFRICA_LOCATIONS } from "@/lib/data/uganda-locations";
import { calculateDistanceKm } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Find closest location
    let closest = EAST_AFRICA_LOCATIONS[0];
    let minDistance = Infinity;

    for (const loc of EAST_AFRICA_LOCATIONS) {
      const dist = calculateDistanceKm(userLat, userLng, loc.latitude, loc.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closest = loc;
      }
    }

    return NextResponse.json({
      resolved: closest,
      distance_km: minDistance,
    });
  }

  if (query) {
    const matches = EAST_AFRICA_LOCATIONS.filter(
      (loc) =>
        loc.area.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query) ||
        loc.country.toLowerCase().includes(query)
    );
    return NextResponse.json(matches);
  }

  return NextResponse.json(EAST_AFRICA_LOCATIONS);
}
