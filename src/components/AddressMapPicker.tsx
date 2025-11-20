import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X, Search, Loader2 } from 'lucide-react';

interface AddressMapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string, province: string, district: string) => void;
  onClose: () => void;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');
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
        setMapError('No se ha configurado la API Key de Google Maps.');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        setMapError('Error al cargar Google Maps.');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const { google } = window;

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
    geocoderRef.current = new google.maps.Geocoder();

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

        setAddress(formattedAddress);
        setProvince(foundProvince);
        setDistrict(foundDistrict);
      }
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!searchQuery.trim() || !geocoderRef.current) return;

    setGeocoding(true);

    try {
      const results = await new Promise<any>((resolve, reject) => {
        geocoderRef.current.geocode(
          {
            address: searchQuery + ', Panamá',
            componentRestrictions: { country: 'PA' }
          },
          (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results);
            } else {
              reject(status);
            }
          }
        );
      });

      if (results && results[0]) {
        const location = results[0].geometry.location;
        const newPos = {
          lat: location.lat(),
          lng: location.lng()
        };

        setPosition(newPos);

        if (googleMapRef.current) {
          googleMapRef.current.panTo(newPos);
          googleMapRef.current.setZoom(17);
        }

        if (markerRef.current) {
          markerRef.current.setPosition(newPos);
        }

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

        setAddress(formattedAddress);
        setProvince(foundProvince);
        setDistrict(foundDistrict);
      }
    } catch (error) {
      console.error('Error buscando dirección:', error);
      alert('No se pudo encontrar la dirección. Intenta con otra búsqueda o selecciona manualmente en el mapa.');
    } finally {
      setGeocoding(false);
    }
  };

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
    if (!address.trim() || !province.trim() || !district.trim()) {
      alert('Por favor, busca una dirección o selecciona una ubicación en el mapa primero.');
      return;
    }

    onLocationSelect(position.lat, position.lng, address, province, district);
    onClose();
  };

  const googleMapsLink = `https://www.google.com/maps?q=${position.lat},${position.lng}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-divine-gold px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center">
            <MapPin className="h-6 w-6 mr-2" />
            Selecciona tu Ubicación
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
                Dos formas de seleccionar tu ubicación:
              </p>
              <div className="text-sm text-blue-800 space-y-2">
                <div className="flex items-start">
                  <span className="font-bold mr-2">1.</span>
                  <span><strong>Escribe tu dirección</strong> en el campo de búsqueda y presiona el botón de buscar</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold mr-2">2.</span>
                  <span><strong>Haz clic en el mapa</strong> o arrastra el marcador rojo a tu ubicación</span>
                </div>
                <p className="mt-2 pt-2 border-t border-blue-300">
                  El sistema detectará automáticamente tu <strong>Provincia y Corregimiento</strong> según la ubicación seleccionada.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                    placeholder="Ej: Calle 50, Ciudad de Panamá"
                    className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                    disabled={geocoding}
                  />
                  <Search className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                <button
                  onClick={handleSearchAddress}
                  disabled={geocoding || !searchQuery.trim()}
                  className="px-6 py-3 bg-divine-gold text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {geocoding ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      <span>Buscar</span>
                    </>
                  )}
                </button>
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
            </div>

            <div
              ref={mapRef}
              className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg bg-gray-100"
              style={{ height: '400px' }}
            >
              {mapError && (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center max-w-md">
                    <div className="bg-red-100 rounded-full p-4 inline-block mb-4">
                      <X className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-red-800 font-semibold mb-2">Error al Cargar el Mapa</p>
                    <p className="text-red-600 text-sm mb-4">{mapError}</p>
                    <p className="text-gray-600 text-xs">
                      Por favor, contacta al administrador para configurar Google Maps.
                    </p>
                  </div>
                </div>
              )}
              {!mapLoaded && !mapError && (
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
                <span className="text-amber-800 text-sm">Detectando dirección...</span>
              </div>
            )}

            {address && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-green-900 mb-1">Dirección Detectada:</p>
                  <p className="text-sm text-green-800">{address}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-green-900 mb-1">Provincia:</p>
                    <p className="text-sm text-green-800">{province || 'No detectada'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-900 mb-1">Corregimiento/Distrito:</p>
                    <p className="text-sm text-green-800">{district || 'No detectado'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-green-900 mb-1">Coordenadas:</p>
                  <p className="text-xs text-green-700">
                    Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            {!address && !geocoding && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">
                  Busca una dirección o selecciona una ubicación en el mapa para continuar
                </p>
              </div>
            )}
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
            disabled={!address || !province || !district}
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
