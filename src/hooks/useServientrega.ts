import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface CotizacionParams {
  ciu_ori: string;
  provincia_ori: string;
  ciu_des: string;
  provincia_des: string;
  valor_declarado: number;
  peso: number;
  alto: number;
  ancho: number;
  largo: number;
  recoleccion?: string;
  nombre_producto?: string;
}

export interface CotizacionResult {
  valor_declarado: string;
  tiempo: string;
  trayecto: string;
  peso: string;
  volumen: number;
  peso_cobrar: string;
  descuento: number;
  flete: number;
  prima: number;
  tiva: number;
  gtotal: number;
}

export interface CotizacionResponse {
  success: boolean;
  cotizacion?: CotizacionResult;
  error?: string;
}

export const useServientrega = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cotizacion, setCotizacion] = useState<CotizacionResult | null>(null);

  const getCotizacion = async (params: CotizacionParams): Promise<CotizacionResponse> => {
    setLoading(true);
    setError(null);
    setCotizacion(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/servientrega-cotizar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: CotizacionResponse = await response.json();

      if (data.success && data.cotizacion) {
        setCotizacion(data.cotizacion);
        setLoading(false);
        return data;
      } else {
        throw new Error(data.error || 'Failed to get cotizacion');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const resetCotizacion = () => {
    setCotizacion(null);
    setError(null);
  };

  return {
    loading,
    error,
    cotizacion,
    getCotizacion,
    resetCotizacion,
  };
};
