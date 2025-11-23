import React, { useState, useEffect } from 'react';
import { Package, Truck, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { CartItem } from '../hooks/useCart';

interface PackageInfo {
  packageNumber: number;
  items: Array<{
    item: CartItem;
    quantity: number;
  }>;
  totalWeight: number;
  zone: string;
  baseCost: number;
  additionalCost: number;
  totalCost: number;
}

interface ShippingCalculation {
  packages: PackageInfo[];
  totalPackages: number;
  totalWeight: number;
  totalShippingCost: number;
  zone: string;
  hasEstimatedWeights: boolean;
  canShip: boolean;
  warnings: string[];
  estimatedDeliveryHoursMin: number;
  estimatedDeliveryHoursMax: number;
  estimatedDeliveryDate: string;
  deliveryDescription: string;
}

interface ShippingCalculatorProps {
  items: CartItem[];
  province: string;
  onCalculated?: (calculation: ShippingCalculation) => void;
}

const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({ items, province, onCalculated }) => {
  const [calculation, setCalculation] = useState<ShippingCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!province || items.length === 0) {
      setCalculation(null);
      return;
    }

    calculateShipping();
  }, [items, province]);

  const calculateShipping = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/calculate-shipping`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            weight: item.weight || 0.5,
            sku: item.sku,
            options: item.options
          })),
          province
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error calculando envío');
      }

      const data: ShippingCalculation = await response.json();
      setCalculation(data);

      if (onCalculated) {
        onCalculated(data);
      }
    } catch (err) {
      console.error('Error calculating shipping:', err);
      setError(err instanceof Error ? err.message : 'Error calculando envío');
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  };

  const getZoneBadgeColor = (zone: string) => {
    switch (zone) {
      case 'urbano':
        return 'bg-green-100 text-green-800';
      case 'nacional':
        return 'bg-blue-100 text-blue-800';
      case 'especial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDeliveryTime = (hoursMin: number, hoursMax: number) => {
    if (hoursMin === hoursMax) {
      const days = hoursMin / 24;
      return days === 1 ? '1 día hábil' : `${days} días hábiles`;
    } else {
      const daysMin = Math.floor(hoursMin / 24);
      const daysMax = Math.ceil(hoursMax / 24);
      return `${daysMin} a ${daysMax} días hábiles`;
    }
  };

  if (!province || items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-sacred-white rounded-xl shadow-sacred p-6 border-2 border-divine-gold border-opacity-20">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-divine-gold"></div>
          <span className="text-stone-prayer">Calculando envío...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error al calcular envío</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!calculation) {
    return null;
  }

  return (
    <div className="bg-sacred-white rounded-xl shadow-sacred border-2 border-divine-gold border-opacity-20 overflow-hidden">
      <div className="bg-celestial-gradient p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Package className="h-6 w-6 text-divine-gold flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-playfair text-xl font-bold text-navy-devotion mb-2">
                Resumen de Envío
              </h3>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getZoneBadgeColor(calculation.zone)}`}>
                  Zona {calculation.zone.charAt(0).toUpperCase() + calculation.zone.slice(1)}
                </span>
                <span className="text-sm text-stone-prayer">
                  Destino: <span className="font-semibold text-navy-devotion">{province}</span>
                </span>
                <span className="text-sm text-stone-prayer">
                  Peso total: <span className="font-semibold text-navy-devotion">{calculation.totalWeight.toFixed(2)} kg</span>
                </span>
              </div>

              {calculation.hasEstimatedWeights && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      Algunos productos usan peso estimado. El costo final puede variar.
                    </p>
                  </div>
                </div>
              )}

              {calculation.warnings.length > 0 && (
                <div className="space-y-1 mb-3">
                  {calculation.warnings.map((warning, index) => (
                    <p key={index} className="text-xs text-stone-prayer flex items-start space-x-1">
                      <span>•</span>
                      <span>{warning}</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-navy-devotion">
                  <Truck className="h-4 w-4" />
                  <span className="font-medium">
                    {calculation.totalPackages === 1 ? '1 paquete' : `${calculation.totalPackages} paquetes`}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-navy-devotion">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    {formatDeliveryTime(calculation.estimatedDeliveryHoursMin, calculation.estimatedDeliveryHoursMax)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right ml-4">
            <p className="text-sm text-stone-prayer mb-1">Costo de envío</p>
            <p className="font-playfair text-3xl font-bold text-divine-gold">
              ${calculation.totalShippingCost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {calculation.totalPackages > 1 && (
        <div className="border-t border-divine-gold border-opacity-20">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-holy-glow transition-colors"
          >
            <span className="text-sm font-medium text-navy-devotion">
              Ver desglose de paquetes
            </span>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-stone-prayer" />
            ) : (
              <ChevronDown className="h-5 w-5 text-stone-prayer" />
            )}
          </button>

          {expanded && (
            <div className="px-6 pb-6 space-y-4">
              {calculation.packages.map((pkg) => (
                <div key={pkg.packageNumber} className="bg-holy-glow rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-navy-devotion">
                      Paquete {pkg.packageNumber}
                    </h4>
                    <span className="font-semibold text-divine-gold">
                      ${pkg.totalCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-stone-prayer mb-2">
                    Peso: {pkg.totalWeight.toFixed(2)} kg
                  </div>
                  <div className="space-y-2">
                    {pkg.items.map((packageItem, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-stone-prayer">
                        <span>{packageItem.item.name}</span>
                        <span>x{packageItem.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-holy-glow px-6 py-4">
        <p className="text-xs text-stone-prayer">
          {calculation.deliveryDescription}
        </p>
      </div>
    </div>
  );
};

export default ShippingCalculator;
