import React, { useState, useEffect } from 'react';
import { Package, Save, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLoyverseProducts } from '../../hooks/useLoyverse';

interface ProductMetadata {
  id: string;
  product_id: string;
  variant_id: string | null;
  weight_kg: number;
  updated_at: string;
}

const ProductWeightManager: React.FC = () => {
  const { products, loading: loadingProducts } = useLoyverseProducts();
  const [metadata, setMetadata] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const { data, error } = await supabase
        .from('products_metadata')
        .select('*');

      if (error) throw error;

      const metadataMap: Record<string, number> = {};
      data?.forEach((item: ProductMetadata) => {
        const key = item.variant_id ? `${item.product_id}_${item.variant_id}` : item.product_id;
        metadataMap[key] = item.weight_kg;
      });

      setMetadata(metadataMap);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const handleWeightChange = (productId: string, variantId: string | null, weight: string) => {
    const key = variantId ? `${productId}_${variantId}` : productId;
    const weightNum = parseFloat(weight);

    if (!isNaN(weightNum) && weightNum >= 0) {
      setMetadata(prev => ({
        ...prev,
        [key]: weightNum
      }));
    } else if (weight === '') {
      const newMetadata = { ...metadata };
      delete newMetadata[key];
      setMetadata(newMetadata);
    }
  };

  const handleSave = async (productId: string, variantId: string | null) => {
    const key = variantId ? `${productId}_${variantId}` : productId;
    const weight = metadata[key];

    if (!weight || weight <= 0) {
      alert('Por favor ingresa un peso válido mayor a 0');
      return;
    }

    setSaving(key);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('products_metadata')
        .upsert({
          product_id: productId,
          variant_id: variantId,
          weight_kg: weight,
          updated_by: user?.id
        }, {
          onConflict: 'product_id,variant_id'
        });

      if (error) throw error;

      setSuccess(key);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving weight:', error);
      alert('Error guardando peso');
    } finally {
      setSaving(null);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-divine-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-navy-devotion">
          Gestión de Pesos de Productos
        </h2>
        <p className="text-stone-prayer mt-1">
          Configura el peso de cada producto para calcular costos de envío automáticamente
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>El peso debe estar en kilogramos (kg)</li>
              <li>Productos sin peso usarán 0.5kg por defecto en el cálculo de envío</li>
              <li>Paquetes tienen límite de 5kg. Pedidos más pesados se dividen automáticamente</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dove-gray" />
        <input
          type="text"
          placeholder="Buscar productos por nombre o SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-whisper-gray rounded-lg focus:border-divine-gold focus:ring-2 focus:ring-divine-gold focus:ring-opacity-20 transition-all"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-sacred-white rounded-xl shadow-sacred p-12 text-center">
          <Package className="h-16 w-16 text-dove-gray mx-auto mb-4" />
          <h3 className="font-playfair text-xl font-bold text-navy-devotion mb-2">
            No se encontraron productos
          </h3>
          <p className="text-stone-prayer">
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Carga productos desde Loyverse primero'}
          </p>
        </div>
      ) : (
        <div className="bg-sacred-white rounded-xl shadow-sacred overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-celestial-gradient">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Variante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Peso (kg)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-navy-devotion uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-whisper-gray">
                {filteredProducts.map((product) => {
                  if (product.variants && product.variants.length > 0) {
                    return product.variants.map((variant, idx) => {
                      const key = `${product.id}_${variant.variantId}`;
                      const currentWeight = metadata[key] || variant.weight || 0;
                      const isSaving = saving === key;
                      const isSuccess = success === key;

                      return (
                        <tr key={key} className="hover:bg-holy-glow transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {idx === 0 && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-navy-devotion">
                                  {product.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-stone-prayer">
                            {variant.sku}
                          </td>
                          <td className="px-6 py-4 text-sm text-stone-prayer">
                            {variant.options || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={currentWeight || ''}
                              onChange={(e) => handleWeightChange(product.id, variant.variantId, e.target.value)}
                              placeholder="0.5"
                              className="w-24 px-3 py-2 border-2 border-whisper-gray rounded-lg focus:border-divine-gold focus:ring-2 focus:ring-divine-gold focus:ring-opacity-20 transition-all text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSave(product.id, variant.variantId)}
                              disabled={isSaving || isSuccess}
                              className={`flex items-center space-x-2 ml-auto px-4 py-2 rounded-lg transition-all text-sm ${
                                isSuccess
                                  ? 'bg-green-600 text-white'
                                  : 'bg-marian-blue hover:bg-navy-devotion text-sacred-white'
                              } disabled:opacity-50`}
                            >
                              {isSaving ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : isSuccess ? (
                                <>
                                  <span>✓</span>
                                  <span>Guardado</span>
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4" />
                                  <span>Guardar</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  }

                  const key = product.id;
                  const currentWeight = metadata[key] || 0;
                  const isSaving = saving === key;
                  const isSuccess = success === key;

                  return (
                    <tr key={key} className="hover:bg-holy-glow transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                          <p className="text-sm font-medium text-navy-devotion">
                            {product.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-prayer">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-prayer">
                        -
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={currentWeight || ''}
                          onChange={(e) => handleWeightChange(product.id, null, e.target.value)}
                          placeholder="0.5"
                          className="w-24 px-3 py-2 border-2 border-whisper-gray rounded-lg focus:border-divine-gold focus:ring-2 focus:ring-divine-gold focus:ring-opacity-20 transition-all text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleSave(product.id, null)}
                          disabled={isSaving || isSuccess}
                          className={`flex items-center space-x-2 ml-auto px-4 py-2 rounded-lg transition-all text-sm ${
                            isSuccess
                              ? 'bg-green-600 text-white'
                              : 'bg-marian-blue hover:bg-navy-devotion text-sacred-white'
                          } disabled:opacity-50`}
                        >
                          {isSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : isSuccess ? (
                            <>
                              <span>✓</span>
                              <span>Guardado</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Guardar</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductWeightManager;
