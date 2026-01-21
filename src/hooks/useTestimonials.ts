import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Testimonial {
  id: string;
  user_id: string;
  name: string;
  text: string;
  rating: number;
  approved: boolean;
  created_at: string;
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('testimonials')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (fetchError) throw fetchError;

      setTestimonials(data || []);
    } catch (err) {
      console.error('Error loading testimonials:', err);
      setError('Error al cargar testimonios');
    } finally {
      setLoading(false);
    }
  };

  const addTestimonial = async (name: string, text: string, rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debes iniciar sesión para dejar un testimonio');

      const { error: insertError } = await supabase
        .from('testimonials')
        .insert({
          user_id: user.id,
          name,
          text,
          rating
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (err: any) {
      console.error('Error adding testimonial:', err);
      return { success: false, error: err.message || 'Error al agregar testimonio' };
    }
  };

  return {
    testimonials,
    loading,
    error,
    addTestimonial,
    refreshTestimonials: loadTestimonials
  };
}
