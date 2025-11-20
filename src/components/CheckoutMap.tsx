import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

interface CheckoutMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address: string, province: string, district: string) => void;
  height?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const CheckoutMap: React.FC<CheckoutMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  height = '500px'
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');
  const [geocoding, setGeocoding] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        setMapError('Google Maps API Key no configurada');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        setMapError('Error al cargar Google Maps');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const { google } = window;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: 17,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    googleMapRef.current = map;

    const marker = new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: map,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    markerRef.current = marker;
    geocoderRef.current = new google.maps.Geocoder();

    marker.addListener('dragend', (e: any) => {
      const newPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      reverseGeocode(newPos.lat, newPos.lng);
    });
  }, [mapLoaded]);

  useEffect(() => {
    if (googleMapRef.current && markerRef.current && latitude && longitude) {
      const newPos = { lat: latitude, lng: longitude };
      googleMapRef.current.panTo(newPos);
      markerRef.current.setPosition(newPos);
    }
  }, [latitude, longitude]);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    setGeocoding(true);
    const latlng = { lat, lng };

    try {
      const results = await new Promise<any>((resolve, reject) => {
        geocoderRef.current.geocode({ location: latlng }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });

      if (results && results[0]) {
        const addressComponents = results[0].address_components;
        const formattedAddress = results[0].formatted_address;

        let foundProvince = '';
        let foundDistrict = '';

        for (const component of addressComponents) {
          const types = component.types;

          if (types.includes('administrative_area_level_1')) {
            foundProvince = component.long_name;
          }

          if (types.includes('locality') || types.includes('sublocality') || types.includes('administrative_area_level_2')) {
            if (!foundDistrict) {
              foundDistrict = component.long_name;
            }
          }
        }

        onLocationChange(lat, lng, formattedAddress, foundProvince, foundDistrict);
      }
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
    } finally {
      setGeocoding(false);
    }
  };

  if (mapError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-800 font-semibold">{mapError}</p>
          <p className="text-red-600 text-sm mt-1">Verifica la configuración de API Key</p>
        </div>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-divine-gold mx-auto mb-2" />
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      {geocoding && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-divine-gold" />
          <span className="text-sm text-gray-700">Detectando dirección...</span>
        </div>
      )}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center space-x-2">
        <MapPin className="h-4 w-4 text-divine-gold" />
        <span className="text-xs text-gray-700">Arrastra el marcador para ajustar</span>
      </div>
    </div>
  );
};

export default CheckoutMap;
