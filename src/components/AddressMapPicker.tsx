import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Navigation, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AddressMapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}

interface LocationMarkerProps {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} /> : null;
};

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  onClose
}) => {
  const [position, setPosition] = useState<[number, number]>([
    latitude || 8.9824,
    longitude || -79.5199
  ]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<any>(null);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          if (mapRef.current) {
            mapRef.current.flyTo(newPos, 17);
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
    onLocationSelect(position[0], position[1], address);
    onClose();
  };

  const googleMapsLink = `https://www.google.com/maps?q=${position[0]},${position[1]}`;

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
                <li>Haz clic directamente en el mapa donde vives</li>
                <li>Mueve el mapa arrastrándolo con el mouse o dedos</li>
                <li>Usa el zoom (+/-) para acercarte más</li>
                <li>El marcador rojo se colocará donde hagas clic</li>
                <li>Cuando esté en el lugar correcto, presiona "Confirmar Ubicación"</li>
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

            <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg" style={{ height: '500px' }}>
              <MapContainer
                center={position}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900 flex items-start">
                <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-green-600" />
                <span>
                  <strong className="block mb-1">Ubicación seleccionada:</strong>
                  <span className="text-green-800">
                    Latitud: {position[0].toFixed(6)}, Longitud: {position[1].toFixed(6)}
                  </span>
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción adicional (opcional)
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                rows={2}
                placeholder="Ej: Portón azul, casa de dos pisos"
              />
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
