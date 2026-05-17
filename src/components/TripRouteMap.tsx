import { useCallback, useEffect, useMemo, useRef } from "react";
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

const PRIMARY = "#007aff";

const TripRouteMap = ({ coordinates }: TripRouteMapProps) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const center = useMemo(() => {
    if (coordinates.length === 0) return { lat: 35.6762, lng: 139.6503 };
    const avgLat =
      coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
    const avgLng =
      coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;
    return { lat: avgLat, lng: avgLng };
  }, [coordinates]);

  // 선택된 날짜의 좌표 전체가 보이도록 지도 영역 조정
  const fitToCoordinates = useCallback(
    (map: google.maps.Map) => {
      if (coordinates.length === 0) return;
      if (coordinates.length === 1) {
        map.setCenter({ lat: coordinates[0].lat, lng: coordinates[0].lng });
        map.setZoom(14);
        return;
      }
      const bounds = new google.maps.LatLngBounds();
      coordinates.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
      map.fitBounds(bounds, 60);
    },
    [coordinates]
  );

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      fitToCoordinates(map);
    },
    [fitToCoordinates]
  );

  // 일자 탭 변경 등으로 좌표가 바뀌면 지도 영역을 다시 맞춤
  useEffect(() => {
    if (mapRef.current) fitToCoordinates(mapRef.current);
  }, [fitToCoordinates]);

  const path = useMemo(
    () => coordinates.map((c) => ({ lat: c.lat, lng: c.lng })),
    [coordinates]
  );

  const makeMarkerIcon = useCallback((index: number) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38"><circle cx="19" cy="19" r="14" fill="${PRIMARY}" stroke="#ffffff" stroke-width="3"/><text x="19" y="24" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif">${index}</text></svg>`;
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(38, 38),
      anchor: new google.maps.Point(19, 19),
    };
  }, []);

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
        gestureHandling: "greedy",
      }}
    >
      {/* 해당 날짜 일정 순서대로 잇는 경로선 */}
      {coordinates.length >= 2 && (
        <PolylineF
          path={path}
          options={{
            strokeColor: PRIMARY,
            strokeOpacity: 0,
            icons: [
              {
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  strokeColor: PRIMARY,
                  scale: 3,
                },
                offset: "0",
                repeat: "14px",
              },
            ],
          }}
        />
      )}

      {/* 방문 순서가 표시된 마커 */}
      {coordinates.map((coord, idx) => (
        <MarkerF
          key={`${coord.lat}-${coord.lng}-${idx}`}
          position={{ lat: coord.lat, lng: coord.lng }}
          icon={makeMarkerIcon(idx + 1)}
          title={coord.label}
          zIndex={idx + 1}
        />
      ))}
    </GoogleMap>
  );
};

export default TripRouteMap;
