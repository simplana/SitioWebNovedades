import React, { useState } from 'react';
import { MapPin, Navigation, X, Check } from 'lucide-react';

interface AddressMapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  onClose
}) => {
  const [currentLat, setCurrentLat] = useState(latitude || 8.9824);
  const [currentLng, setCurrentLng] = useState(longitude || -79.5199);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLat(position.coords.latitude);
          setCurrentLng(position.coords.longitude);
          setMapKey(prev => prev + 1);
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
    onLocationSelect(currentLat, currentLng, address);
    onClose();
  };

  const updateLocation = () => {
    setMapKey(prev => prev + 1);
  };

  const googleMapsPlaceUrl = `https://www.google.com/maps/place/${currentLat},${currentLng}/@${currentLat},${currentLng},17z`;

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
              <p className="text-sm text-blue-800">
                <strong>¿Cómo seleccionar cualquier punto?</strong>
              </p>
              <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                <li>Haz clic en "Abrir en Google Maps" para buscar tu ubicación</li>
                <li>En Google Maps, haz clic derecho sobre el punto exacto que deseas</li>
                <li>Selecciona la primera opción (las coordenadas) para copiarlas</li>
                <li>Regresa aquí y pega las coordenadas en los campos de abajo</li>
                <li>Presiona "Actualizar Mapa" para ver el marcador en esa ubicación</li>
                <li>Si está correcto, haz clic en "Confirmar Ubicación"</li>
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
                href={googleMapsPlaceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>Abrir en Google Maps</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud
                </label>
                <input
                  type="text"
                  value={currentLat}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!isNaN(Number(val)) || val === '-' || val === '' || val.endsWith('.')) {
                      setCurrentLat(val === '' ? 0 : val === '-' ? 0 : parseFloat(val) || 0);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                  placeholder="8.9824"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud
                </label>
                <input
                  type="text"
                  value={currentLng}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!isNaN(Number(val)) || val === '-' || val === '' || val.endsWith('.')) {
                      setCurrentLng(val === '' ? 0 : val === '-' ? 0 : parseFloat(val) || 0);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                  placeholder="-79.5199"
                />
              </div>
              <button
                onClick={updateLocation}
                className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>Actualizar Mapa</span>
              </button>
            </div>

            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '450px' }}>
              <iframe
                key={mapKey}
                src={`https://maps.google.com/maps?q=${currentLat},${currentLng}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de ubicación"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 flex items-start">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Ubicación seleccionada:</strong> {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
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
