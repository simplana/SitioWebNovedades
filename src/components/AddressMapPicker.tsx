import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';

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
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

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

    map.addListener('click', (e: any) => {
      const clickedPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setPosition(clickedPos);
      marker.setPosition(clickedPos);
      map.panTo(clickedPos);
    });

    marker.addListener('dragend', (e: any) => {
      const newPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setPosition(newPos);
      map.panTo(newPos);
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
      alert('Por favor, completa todos los campos requeridos (Dirección, Provincia y Corregimiento)');
      return;
    }

    onLocationSelect(position.lat, position.lng, address, province, district);
    onClose();
  };

  const googleMapsLink = `https://www.google.com/maps?q=${position.lat},${position.lng}`;

  const panamaProvinces = [
    'Panamá',
    'Panamá Oeste',
    'Colón',
    'Chiriquí',
    'Coclé',
    'Herrera',
    'Los Santos',
    'Veraguas',
    'Bocas del Toro',
    'Darién',
    'Comarca Guna Yala',
    'Comarca Emberá-Wounaan',
    'Comarca Ngäbe-Buglé'
  ];

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
                <li><strong>Haz clic en el mapa</strong> donde vives o arrastra el marcador rojo</li>
                <li>El mapa te ayuda a <strong>confirmar visualmente</strong> tu ubicación exacta</li>
                <li>Completa los campos de <strong>Dirección, Provincia y Corregimiento</strong> manualmente</li>
                <li>Agrega detalles adicionales si deseas (color de portón, referencias, etc.)</li>
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

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900 flex items-start">
                <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-green-600" />
                <span>
                  <strong className="block mb-1">Ubicación seleccionada en el mapa:</strong>
                  <span className="text-green-800 text-xs">
                    Latitud: {position.lat.toFixed(6)}, Longitud: {position.lng.toFixed(6)}
                  </span>
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia <span className="text-red-500">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                  required
                >
                  <option value="">Selecciona una provincia</option>
                  {panamaProvinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Corregimiento / Distrito <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                  placeholder="Ej: Bella Vista, San Miguelito"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección completa <span className="text-red-500">*</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                rows={3}
                placeholder="Ej: Calle 50, Edificio Torre del Mar, Piso 10, Oficina 1005&#10;o&#10;Urbanización Los Ángeles, Casa 123, Portón azul"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Incluye calle, edificio, casa, apartamento, y referencias que ayuden con la entrega
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
            className="bg-divine-gold text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors flex items-center space-x-2"
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
