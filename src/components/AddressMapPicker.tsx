import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Loader2 } from 'lucide-react';

interface AddressMapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string, province: string, district: string) => void;
  onClose: () => void;
}

interface LocationDetails {
  fullAddress: string;
  province: string;
  district: string;
  city: string;
  street: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  onClose
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: latitude || 8.9824,
    lng: longitude || -79.5199
  });
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({
    fullAddress: '',
    province: '',
    district: '',
    city: '',
    street: ''
  });
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
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

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

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

        let province = '';
        let district = '';
        let city = '';
        let street = '';

        addressComponents.forEach((component: any) => {
          const types = component.types;

          if (types.includes('administrative_area_level_1')) {
            province = component.long_name;
          }

          if (types.includes('administrative_area_level_2') || types.includes('locality')) {
            if (!district) district = component.long_name;
          }

          if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
            if (!city) city = component.long_name;
          }

          if (types.includes('route')) {
            street = component.long_name;
          }
        });

        setLocationDetails({
          fullAddress: formattedAddress,
          province: province || 'Panamá',
          district: district || city || '',
          city: city || district || '',
          street: street
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationDetails({
        fullAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        province: 'Panamá',
        district: '',
        city: '',
        street: ''
      });
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const { google } = window;

    geocoderRef.current = new google.maps.Geocoder();

    const map = new google.maps.Map(mapRef.current, {
      center: position,
      zoom: 17,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    googleMapRef.current = map;

    const marker = new google.maps.Marker({
      position: position,
      map: map,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    markerRef.current = marker;

    reverseGeocode(position.lat, position.lng);

    map.addListener('click', (e: any) => {
      const clickedPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setPosition(clickedPos);
      marker.setPosition(clickedPos);
      map.panTo(clickedPos);
      reverseGeocode(clickedPos.lat, clickedPos.lng);
    });

    marker.addListener('dragend', (e: any) => {
      const newPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setPosition(newPos);
      map.panTo(newPos);
      reverseGeocode(newPos.lat, newPos.lng);
    });
  }, [mapLoaded]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setPosition(newPos);
          if (googleMapRef.current) {
            googleMapRef.current.panTo(newPos);
            googleMapRef.current.setZoom(17);
          }
          if (markerRef.current) {
            markerRef.current.setPosition(newPos);
          }
          reverseGeocode(newPos.lat, newPos.lng);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('No se pudo obtener tu ubicación. Por favor, verifica los permisos del navegador.');
          setLoading(false);
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización');
    }
  };

  const handleConfirm = () => {
    const fullAddressWithNotes = additionalNotes
      ? `${locationDetails.fullAddress} - ${additionalNotes}`
      : locationDetails.fullAddress;

    onLocationSelect(
      position.lat,
      position.lng,
      fullAddressWithNotes,
      locationDetails.province,
      locationDetails.district
    );
    onClose();
  };

  const googleMapsLink = `https://www.google.com/maps?q=${position.lat},${position.lng}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-divine-gold px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center">
            <MapPin className="h-6 w-6 mr-2" />
            Selecciona tu Ubicación en el Mapa
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-amber-600 rounded-full p-1 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                ¿Cómo seleccionar tu ubicación?
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li><strong>Haz clic directamente en el mapa</strong> donde vives</li>
                <li>La dirección, provincia y corregimiento se detectarán automáticamente</li>
                <li>Puedes <strong>arrastrar el marcador rojo</strong> para ajustar la posición</li>
                <li>Agrega detalles adicionales si deseas (color de portón, número de casa, etc.)</li>
                <li>Presiona "Confirmar Ubicación" cuando esté correcto</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={getCurrentLocation}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Navigation className="h-4 w-4" />
                <span>{loading ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}</span>
              </button>
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>Ver en Google Maps</span>
              </a>
            </div>

            <div
              ref={mapRef}
              className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg bg-gray-100"
              style={{ height: '450px' }}
            >
              {!mapLoaded && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-divine-gold mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando mapa...</p>
                  </div>
                </div>
              )}
            </div>

            {geocoding && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin text-amber-600" />
                <span className="text-sm text-amber-800">Obteniendo dirección...</span>
              </div>
            )}

            {locationDetails.fullAddress && !geocoding && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 mb-2">Ubicación Detectada:</p>

                    <div className="space-y-1 text-sm">
                      <div className="flex">
                        <span className="font-medium text-green-900 w-24">Dirección:</span>
                        <span className="text-green-800">{locationDetails.fullAddress}</span>
                      </div>

                      {locationDetails.province && (
                        <div className="flex">
                          <span className="font-medium text-green-900 w-24">Provincia:</span>
                          <span className="text-green-800">{locationDetails.province}</span>
                        </div>
                      )}

                      {locationDetails.district && (
                        <div className="flex">
                          <span className="font-medium text-green-900 w-24">Corregimiento:</span>
                          <span className="text-green-800">{locationDetails.district}</span>
                        </div>
                      )}

                      <div className="flex">
                        <span className="font-medium text-green-900 w-24">Coordenadas:</span>
                        <span className="text-green-800 text-xs">
                          {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detalles adicionales (opcional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                rows={2}
                placeholder="Ej: Portón azul, casa de dos pisos, al lado del supermercado"
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes agregar referencias adicionales para facilitar la entrega
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!locationDetails.fullAddress || geocoding}
            className="bg-divine-gold text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MapPin className="h-4 w-4" />
            <span>Confirmar Ubicación</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressMapPicker;
