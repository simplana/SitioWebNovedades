import React, { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CheckCircle, Truck, Home, AlertCircle, RefreshCw } from 'lucide-react';

interface TrackingEvent {
  date: string;
  code: string;
  description: string;
  location?: string;
  responsible?: string;
  observations?: string;
}

interface OrderTrackingDetailProps {
  trackingNumber: string;
  orderId?: string;
}

const OrderTrackingDetail: React.FC<OrderTrackingDetailProps> = ({ trackingNumber, orderId }) => {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTracking = async () => {
    try {
      setError(null);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const url = `${supabaseUrl}/functions/v1/get-servientrega-tracking?trackingNumber=${encodeURIComponent(trackingNumber)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo tracking');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setCurrentStatus(data.currentStatus || '');
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setError(err instanceof Error ? err.message : 'Error obteniendo tracking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchTracking();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [trackingNumber, autoRefresh]);

  const getStatusIcon = (description: string) => {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('entregado') || lowerDesc.includes('delivered')) {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    if (lowerDesc.includes('reparto') || lowerDesc.includes('entrega')) {
      return <Truck className="h-6 w-6 text-blue-600" />;
    }
    if (lowerDesc.includes('tránsito') || lowerDesc.includes('transito')) {
      return <Package className="h-6 w-6 text-orange-600" />;
    }
    if (lowerDesc.includes('generado') || lowerDesc.includes('creado')) {
      return <Package className="h-6 w-6 text-gray-600" />;
    }

    return <MapPin className="h-6 w-6 text-blue-600" />;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-sacred-white rounded-xl shadow-sacred p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-divine-gold"></div>
          <span className="text-stone-prayer">Cargando información de tracking...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
        <div className="flex items-start space-x-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error al obtener tracking</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchTracking();
          }}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-sacred-white rounded-xl shadow-sacred overflow-hidden">
      <div className="bg-celestial-gradient p-6 border-b border-divine-gold border-opacity-20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-playfair text-xl font-bold text-navy-devotion mb-1">
              Seguimiento de Envío
            </h3>
            <p className="text-sm text-stone-prayer">
              Número de guía: <span className="font-semibold text-navy-devotion">{trackingNumber}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchTracking();
            }}
            className="flex items-center space-x-2 bg-marian-blue hover:bg-navy-devotion text-sacred-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-dove-gray mx-auto mb-3" />
            <p className="text-stone-prayer">No hay eventos de tracking disponibles aún</p>
            <p className="text-sm text-dove-gray mt-1">La información se actualizará pronto</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    index === 0 ? 'bg-divine-gold bg-opacity-20' : 'bg-holy-glow'
                  }`}>
                    {getStatusIcon(event.description)}
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 h-full min-h-[40px] bg-whisper-gray my-2"></div>
                  )}
                </div>

                <div className="flex-1 pb-6">
                  <div className={`rounded-lg p-4 ${
                    index === 0 ? 'bg-divine-gold bg-opacity-10 border-2 border-divine-gold border-opacity-30' : 'bg-holy-glow'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-navy-devotion">
                        {event.description}
                      </h4>
                      {index === 0 && (
                        <span className="bg-divine-gold text-navy-devotion text-xs font-semibold px-2 py-1 rounded-full">
                          Actual
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-stone-prayer">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(event.date)}</span>
                      </div>

                      {event.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.responsible && (
                        <div className="text-xs mt-1">
                          <span className="font-medium">Responsable:</span> {event.responsible}
                        </div>
                      )}

                      {event.observations && (
                        <div className="text-xs mt-1 text-dove-gray italic">
                          {event.observations}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-holy-glow px-6 py-4 border-t border-divine-gold border-opacity-20">
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-dove-gray text-divine-gold focus:ring-divine-gold"
            />
            <span className="text-stone-prayer">Actualizar automáticamente cada 30 segundos</span>
          </label>
          <span className="text-xs text-dove-gray">
            Última actualización: {new Date().toLocaleTimeString('es-ES')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingDetail;
