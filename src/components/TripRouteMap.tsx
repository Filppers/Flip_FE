import { useCallback, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
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
      {/* {coordinates.map((coord, idx) => (
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
      ))} */}
    </GoogleMap>
  );
};

export default TripRouteMap;
