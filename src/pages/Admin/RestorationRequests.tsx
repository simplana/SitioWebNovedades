import React, { useState, useEffect } from 'react';
import {
  Wrench, Phone, Mail, User, Calendar, Search,
  RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon, X, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QuoteRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  description: string;
  photos: string[] | null;
  status: 'pending' | 'quoted' | 'approved' | 'completed' | 'cancelled';
  estimated_price: number | null;
  estimated_days: number | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS: { value: QuoteRequest['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'quoted', label: 'Cotizado', color: 'bg-blue-100 text-blue-800' },
  { value: 'approved', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Completado', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

const statusColor = (status: string) =>
  STATUS_OPTIONS.find(s => s.value === status)?.color ?? 'bg-gray-100 text-gray-800';

const statusLabel = (status: string) =>
  STATUS_OPTIONS.find(s => s.value === status)?.label ?? status;

const RestorationRequests = () => {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError('No se pudieron cargar las solicitudes.');
    } else {
      setRequests(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, newStatus: QuoteRequest['status']) => {
    setUpdatingId(id);
    const { error: err } = await supabase
      .from('quote_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!err) {
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
      );
    }
    setUpdatingId(null);
  };

  const filtered = requests.filter(r => {
    const matchSearch =
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer_phone.includes(searchTerm) ||
      (r.customer_email ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-PA', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Wrench className="h-12 w-12 text-red-300 mx-auto mb-3" />
        <p className="text-red-700 font-medium mb-4">{error}</p>
        <button onClick={load} className="inline-flex items-center space-x-2 px-4 py-2 bg-gold hover:bg-yellow-500 text-navy font-medium rounded-lg transition-colors">
          <RefreshCw className="h-4 w-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-navy">Solicitudes de Restauración</h2>
            <p className="text-sm text-gray-500 mt-1">
              {requests.length} solicitud{requests.length !== 1 ? 'es' : ''} en total
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:border-gold text-gray-600 hover:text-navy font-medium rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o correo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Sin resultados' : 'No hay solicitudes aún'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros.'
                : 'Las solicitudes del formulario de restauración aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <div key={req.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <span className="font-semibold text-navy">{req.customer_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(req.status)}`}>
                          {statusLabel(req.status)}
                        </span>
                        {req.photos && req.photos.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <ImageIcon className="h-3.5 w-3.5" />
                            {req.photos.length} foto{req.photos.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />{req.customer_phone}
                        </span>
                        {req.customer_email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />{req.customer_email}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />{formatDate(req.created_at)}
                        </span>
                      </div>
                    </div>
                    {expandedId === req.id
                      ? <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                      : <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                    }
                  </div>
                </button>

                {expandedId === req.id && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> Nombre
                          </p>
                          <p className="font-medium text-gray-900">{req.customer_name}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> Teléfono
                          </p>
                          <a href={`tel:${req.customer_phone}`} className="text-blue-600 hover:underline">
                            {req.customer_phone}
                          </a>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> Correo
                          </p>
                          {req.customer_email
                            ? <a href={`mailto:${req.customer_email}`} className="text-blue-600 hover:underline break-all">{req.customer_email}</a>
                            : <span className="text-gray-400 italic">No proporcionado</span>
                          }
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Descripción del daño</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{req.description}</p>
                      </div>

                      {req.photos && req.photos.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5" /> Fotos enviadas ({req.photos.length})
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {req.photos.map((url, i) => (
                              <button
                                key={i}
                                onClick={() => setLightboxUrl(url)}
                                className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-gold transition-colors"
                              >
                                <img
                                  src={url}
                                  alt={`Foto ${i + 1}`}
                                  className="w-full h-20 object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                  <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 font-medium">Estado:</span>
                          <select
                            value={req.status}
                            onChange={e => updateStatus(req.id, e.target.value as QuoteRequest['status'])}
                            disabled={updatingId === req.id}
                            className="border-2 border-gold rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-gold focus:border-transparent bg-white disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          {updatingId === req.id && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"></div>
                          )}
                        </div>
                        {req.estimated_price && (
                          <p className="text-sm text-gray-600">
                            Precio estimado: <span className="font-bold text-gold">${req.estimated_price}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Vista ampliada"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <a
            href={lightboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-lg px-3 py-2 text-sm flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir original
          </a>
        </div>
      )}
    </>
  );
};

export default RestorationRequests;
