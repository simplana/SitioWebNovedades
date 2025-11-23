import React, { useState, useEffect } from 'react';
import { Package, Truck, Search, Plus, Eye, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import OrderTrackingDetail from '../OrderTrackingDetail';

interface Shipment {
  id: string;
  order_id: string;
  package_number: number;
  tracking_number: string;
  guia_number: string;
  status: string;
  recipient_name: string;
  destination_province: string;
  destination_address: string;
  weight_kg: number;
  shipping_cost: number;
  shipping_zone: string;
  estimated_delivery_date: string;
  created_at: string;
}

const ShipmentManager: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showTracking, setShowTracking] = useState(false);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      label_created: { label: 'Guía Creada', className: 'bg-blue-100 text-blue-800' },
      in_transit: { label: 'En Tránsito', className: 'bg-purple-100 text-purple-800' },
      out_for_delivery: { label: 'En Reparto', className: 'bg-orange-100 text-orange-800' },
      delivered: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Fallido', className: 'bg-red-100 text-red-800' },
      returned: { label: 'Devuelto', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filteredShipments = shipments.filter(shipment =>
    shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-divine-gold"></div>
      </div>
    );
  }

  if (showTracking && selectedShipment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setShowTracking(false);
            setSelectedShipment(null);
          }}
          className="flex items-center space-x-2 text-marian-blue hover:text-navy-devotion transition-colors"
        >
          <span>← Volver a lista de envíos</span>
        </button>

        <div className="bg-sacred-white rounded-xl shadow-sacred p-6">
          <h3 className="font-playfair text-xl font-bold text-navy-devotion mb-4">
            Información del Envío
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-stone-prayer">Orden:</span>
              <p className="font-semibold text-navy-devotion">{selectedShipment.order_id}</p>
            </div>
            <div>
              <span className="text-stone-prayer">Destinatario:</span>
              <p className="font-semibold text-navy-devotion">{selectedShipment.recipient_name}</p>
            </div>
            <div>
              <span className="text-stone-prayer">Provincia:</span>
              <p className="font-semibold text-navy-devotion">{selectedShipment.destination_province}</p>
            </div>
            <div>
              <span className="text-stone-prayer">Peso:</span>
              <p className="font-semibold text-navy-devotion">{selectedShipment.weight_kg} kg</p>
            </div>
            <div>
              <span className="text-stone-prayer">Costo:</span>
              <p className="font-semibold text-divine-gold">${selectedShipment.shipping_cost.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-stone-prayer">Estado:</span>
              <div className="mt-1">{getStatusBadge(selectedShipment.status)}</div>
            </div>
          </div>
        </div>

        <OrderTrackingDetail
          trackingNumber={selectedShipment.tracking_number}
          orderId={selectedShipment.order_id}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-navy-devotion">
            Gestión de Envíos
          </h2>
          <p className="text-stone-prayer mt-1">
            {shipments.length} envíos registrados
          </p>
        </div>

        <button
          onClick={fetchShipments}
          className="flex items-center space-x-2 bg-marian-blue hover:bg-navy-devotion text-sacred-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dove-gray" />
        <input
          type="text"
          placeholder="Buscar por número de guía, orden o destinatario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-whisper-gray rounded-lg focus:border-divine-gold focus:ring-2 focus:ring-divine-gold focus:ring-opacity-20 transition-all"
        />
      </div>

      {filteredShipments.length === 0 ? (
        <div className="bg-sacred-white rounded-xl shadow-sacred p-12 text-center">
          <Package className="h-16 w-16 text-dove-gray mx-auto mb-4" />
          <h3 className="font-playfair text-xl font-bold text-navy-devotion mb-2">
            No hay envíos registrados
          </h3>
          <p className="text-stone-prayer">
            {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Los envíos aparecerán aquí una vez creados'}
          </p>
        </div>
      ) : (
        <div className="bg-sacred-white rounded-xl shadow-sacred overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-celestial-gradient">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Guía
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Destinatario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Entrega Est.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-whisper-gray">
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-holy-glow transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-divine-gold" />
                        <span className="text-sm font-medium text-navy-devotion">
                          {shipment.tracking_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-prayer">
                      {shipment.order_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-devotion">
                      {shipment.recipient_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-prayer">
                      {shipment.destination_province}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(shipment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-prayer">
                      {shipment.estimated_delivery_date ? new Date(shipment.estimated_delivery_date).toLocaleDateString('es-ES') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedShipment(shipment);
                          setShowTracking(true);
                        }}
                        className="text-marian-blue hover:text-navy-devotion transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver Tracking</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentManager;
