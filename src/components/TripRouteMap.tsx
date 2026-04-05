import { useCallback, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  PolylineF,
} from "@react-google-maps/api";

interface Coordinate {
  lat: number;
  lng: number;
  label: string;
  day: number;
}

interface TripRouteMapProps {
  coordinates: Coordinate[];
}

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

const DAY_COLORS = [
  "#EB5A2A",
  "#2563EB",
  "#16A34A",
  "#9333EA",
  "#CA8A04",
  "#DC2626",
  "#0891B2",
];

const TripRouteMap = ({ coordinates }: TripRouteMapProps) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const center = useMemo(() => {
    if (coordinates.length === 0) return { lat: 35.6762, lng: 139.6503 };
    const avgLat =
      coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
    const avgLng =
      coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;
    return { lat: avgLat, lng: avgLng };
  }, [coordinates]);

  // 일자별로 그룹핑
  const dayGroups = useMemo(() => {
    const groups: Record<number, Coordinate[]> = {};
    coordinates.forEach((c) => {
      if (!groups[c.day]) groups[c.day] = [];
      groups[c.day].push(c);
    });
    return groups;
  }, [coordinates]);

  // 지도 로드 후 모든 핀이 보이도록 bounds 맞추기
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      if (coordinates.length === 0) return;
      const bounds = new google.maps.LatLngBounds();
      coordinates.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
      map.fitBounds(bounds, 50);
    },
    [coordinates]
  );

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-[#F3F4F6] flex items-center justify-center">
        <p className="text-[#9CA3AF] font-medium">지도 로딩 중...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={center}
      zoom={12}
      onLoad={onMapLoad}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      {/* 번호 마커 */}
      {coordinates.map((coord, idx) => (
        <MarkerF
          key={idx}
          position={{ lat: coord.lat, lng: coord.lng }}
          label={{
            text: String(idx + 1),
            color: "#ffffff",
            fontWeight: "bold",
            fontSize: "12px",
          }}
          title={coord.label}
        />
      ))}

      {/* 일자별 경로선 */}
      {Object.entries(dayGroups).map(([day, coords]) => (
        <PolylineF
          key={day}
          path={coords.map((c) => ({ lat: c.lat, lng: c.lng }))}
          options={{
            strokeColor: DAY_COLORS[(Number(day) - 1) % DAY_COLORS.length],
            strokeWeight: 4,
            strokeOpacity: 0.9,
            geodesic: true,
          }}
        />
      ))}

      {/* 일자 간 연결선 (Day1 마지막 → Day2 첫번째 ...) */}
      {(() => {
        const days = Object.keys(dayGroups)
          .map(Number)
          .sort((a, b) => a - b);
        const crossDayPaths: { lat: number; lng: number }[][] = [];
        for (let i = 0; i < days.length - 1; i++) {
          const prevDay = dayGroups[days[i]];
          const nextDay = dayGroups[days[i + 1]];
          if (prevDay.length > 0 && nextDay.length > 0) {
            const from = prevDay[prevDay.length - 1];
            const to = nextDay[0];
            crossDayPaths.push([
              { lat: from.lat, lng: from.lng },
              { lat: to.lat, lng: to.lng },
            ]);
          }
        }
        return crossDayPaths.map((path, idx) => (
          <PolylineF
            key={`cross-${idx}`}
            path={path}
            options={{
              strokeColor: "#9CA3AF",
              strokeWeight: 2,
              strokeOpacity: 0.5,
              geodesic: true,
              icons: [
                {
                  icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                  offset: "0",
                  repeat: "15px",
                },
              ],
            }}
          />
        ));
      })()}
    </GoogleMap>
  );
};

export default TripRouteMap;
