import React, { useState } from 'react';
import { Wrench, Camera, Upload, CheckCircle, AlertCircle, MessageCircle, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const Restauraciones = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileError, setFileError] = useState('');

  const restorationExamples = [
    {
      before: "https://iabrhkvwhmliemgioxce.supabase.co/storage/v1/object/public/restorations/examples/set-1-before.jpg",
      after: "https://iabrhkvwhmliemgioxce.supabase.co/storage/v1/object/public/restorations/examples/set-1-after.jpg"
    },
    {
      before: "https://iabrhkvwhmliemgioxce.supabase.co/storage/v1/object/public/restorations/examples/set-2-before.jpg",
      after: "https://iabrhkvwhmliemgioxce.supabase.co/storage/v1/object/public/restorations/examples/set-2-after.jpg"
    },
    {
      before: "https://iabrhkvwhmliemgioxce.supabase.co/storage/v1/object/public/restorations/examples/set-3-before.jpg",
      after: "https://iabrhkvwhmliemgioxce.supabase.co/storage/v1/object/public/restorations/examples/set-3-after.jpg"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const files = Array.from(e.target.files ?? []);

    const invalid = files.find(f => !ALLOWED_TYPES.includes(f.type));
    if (invalid) {
      setFileError('Solo se permiten imágenes en formato JPG, PNG o WEBP.');
      return;
    }

    const tooBig = files.find(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setFileError(`Cada imagen debe pesar menos de ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setSelectedFiles(files);
    setPreviewUrls(files.map(f => URL.createObjectURL(f)));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadPhotos = async (requestId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop();
      const path = `requests/${requestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('restorations')
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('restorations').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('idle');
    setErrorMsg('');

    try {
      const { data: inserted, error: insertError } = await supabase
        .from('quote_requests')
        .insert({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email || null,
          description: formData.description,
          photos: [],
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      let photoUrls: string[] = [];
      if (selectedFiles.length > 0) {
        photoUrls = await uploadPhotos(inserted.id);
        await supabase
          .from('quote_requests')
          .update({ photos: photoUrls })
          .eq('id', inserted.id);
      }

      setSubmitStatus('success');
      setFormData({ name: '', phone: '', email: '', description: '' });
      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (err: any) {
      setSubmitStatus('error');
      setErrorMsg('No se pudo enviar la solicitud. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, me gustaría solicitar información sobre el servicio de restauraciones.`
    );
    window.open(`https://wa.me/50769594358?text=${message}`, '_blank');
  };

  return (
    <div className="pt-16 min-h-screen bg-divine-gradient">
      {/* Header */}
      <div className="bg-gradient-to-br from-lavender-peace via-divine-light to-celestial-blue py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-aureola-glow opacity-60"></div>
        <div className="absolute top-10 left-10 text-celestial-blue opacity-20">
          <svg className="w-16 h-16 animate-float" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="absolute bottom-10 right-10 text-celestial-blue opacity-20">
          <svg className="w-12 h-12 animate-float" style={{animationDelay: '2s'}} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="bg-divine-gold p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8">
            <Wrench className="h-10 w-10 text-sacred-white" />
          </div>
          <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6 text-navy-devotion text-shadow-sacred">
            Restauraciones & Reparaciones
          </h1>
          <div className="w-32 h-1 bg-divine-gold mx-auto mb-6 rounded-full"></div>
          <p className="text-navy-devotion text-xl max-w-3xl mx-auto leading-relaxed font-light opacity-90">
            Devolvemos la vida y el esplendor a tus artículos religiosos más preciados.
            Con amor y dedicación, restauramos cada pieza como un acto de devoción.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div>
          {/* Ejemplos de Nuestro Trabajo */}
          <div>
            <h2 className="font-playfair text-3xl font-bold text-navy mb-8">
              Ejemplos de Nuestro Trabajo
            </h2>

            <div className="space-y-12">
              {restorationExamples.map((example, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                            ANTES DE LA RESTAURACIÓN
                          </div>
                        </div>
                        <div className="relative bg-gray-50 rounded-lg p-4">
                          <img
                            src={example.before}
                            alt="Antes de la restauración"
                            className="w-full h-auto object-cover mx-auto rounded-lg shadow-md"
                            style={{ maxHeight: '600px', objectPosition: 'top center' }}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="bg-green-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                            DESPUÉS DE LA RESTAURACIÓN
                          </div>
                        </div>
                        <div className="relative bg-gray-50 rounded-lg p-4">
                          <img
                            src={example.after}
                            alt="Después de la restauración"
                            className="w-full h-auto object-cover mx-auto rounded-lg shadow-md"
                            style={{ maxHeight: '600px', objectPosition: 'top center' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario de Cotización */}
          <div className="bg-white rounded-lg shadow-lg p-8 mt-12">
            <h2 className="font-playfair text-3xl font-bold text-navy mb-6">
              Solicita tu Cotización
            </h2>

            {submitStatus === 'success' ? (
              <div className="text-center py-10">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-playfair text-xl font-semibold text-green-700 mb-2">¡Solicitud Enviada!</h3>
                <p className="text-gray-600 mb-6">Recibimos tu solicitud correctamente. Te contactaremos pronto con tu cotización.</p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="text-sm text-gold hover:underline font-medium"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="+507 0000-0000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="tu@correo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del daño *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                    placeholder="Describe detalladamente el estado del artículo y qué tipo de restauración necesita..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fotos del artículo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gold transition-colors duration-200">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <span className="text-gold font-medium">Haz clic para subir fotos</span>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG, WEBP — hasta {MAX_FILE_SIZE_MB}MB cada una</p>
                    </label>
                    {fileError && (
                      <p className="text-sm text-red-600 mt-2">{fileError}</p>
                    )}
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={url}
                            alt={`Foto ${i + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {submitStatus === 'error' && (
                  <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{errorMsg}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gold hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-navy font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy"></div>
                        <span>Enviando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Enviar solicitud</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>También puedes contactarnos por WhatsApp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restauraciones;
