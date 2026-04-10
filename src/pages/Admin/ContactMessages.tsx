import React, { useState, useEffect } from 'react';
import { Mail, Phone, User, Calendar, MessageSquare, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
}

const subjectLabels: Record<string, string> = {
  'consulta-producto': 'Consulta sobre producto',
  'pedido-especial': 'Pedido especial',
  'asesoramiento': 'Asesoramiento religioso',
  'sugerencia': 'Sugerencia',
  'otro': 'Otro',
};

const ContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadMessages = async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('No se pudieron cargar los mensajes. Verifica que la tabla contact_messages existe en la base de datos.');
    } else {
      setMessages(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const filtered = messages.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.phone ?? '').includes(searchTerm)
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <MessageSquare className="h-12 w-12 text-red-300 mx-auto mb-3" />
        <p className="text-red-700 font-medium mb-2">Error al cargar mensajes</p>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <div className="bg-gray-800 rounded-lg p-4 text-left text-xs font-mono text-green-400 mb-4 max-w-2xl mx-auto">
          <p className="text-gray-400 mb-2">-- Ejecuta este SQL en Supabase Dashboard {'>'} SQL Editor:</p>
          <p>CREATE TABLE IF NOT EXISTS contact_messages (</p>
          <p>&nbsp;&nbsp;id uuid PRIMARY KEY DEFAULT gen_random_uuid(),</p>
          <p>&nbsp;&nbsp;name text NOT NULL DEFAULT '',</p>
          <p>&nbsp;&nbsp;email text NOT NULL DEFAULT '',</p>
          <p>&nbsp;&nbsp;phone text,</p>
          <p>&nbsp;&nbsp;subject text NOT NULL DEFAULT '',</p>
          <p>&nbsp;&nbsp;message text NOT NULL DEFAULT '',</p>
          <p>&nbsp;&nbsp;created_at timestamptz DEFAULT now()</p>
          <p>);</p>
          <p>ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;</p>
          <p>CREATE POLICY "Anyone can submit a contact message" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);</p>
          <p>CREATE POLICY "Admins can view all contact messages" ON contact_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = auth.jwt() -&gt;&gt; 'email'));</p>
        </div>
        <button
          onClick={loadMessages}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gold hover:bg-yellow-500 text-navy font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-navy">Mensajes de Contacto</h2>
          <p className="text-sm text-gray-500 mt-1">{messages.length} mensaje{messages.length !== 1 ? 's' : ''} recibido{messages.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={loadMessages}
          className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 hover:border-gold text-gray-600 hover:text-navy font-medium rounded-lg transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o asunto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchTerm ? 'Sin resultados' : 'No hay mensajes aún'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Los mensajes del formulario de contacto aparecerán aquí.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(msg => (
            <div key={msg.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-semibold text-navy">{msg.name}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                        {subjectLabels[msg.subject] ?? msg.subject}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {msg.email}
                      </span>
                      {msg.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {msg.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  </div>
                  {expandedId === msg.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              </button>

              {expandedId === msg.id && (
                <div className="px-5 pb-5 border-t border-gray-100">
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Nombre
                      </p>
                      <p className="text-gray-900 font-medium">{msg.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> Correo
                      </p>
                      <a href={`mailto:${msg.email}`} className="text-blue-600 hover:underline break-all">{msg.email}</a>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> Teléfono
                      </p>
                      {msg.phone ? (
                        <a href={`tel:${msg.phone}`} className="text-blue-600 hover:underline">{msg.phone}</a>
                      ) : (
                        <span className="text-gray-400 italic">No proporcionado</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Mensaje
                    </p>
                    <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
