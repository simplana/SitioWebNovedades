import React, { useState } from 'react';
import { Wrench, Camera, Cross, Heart, Award, Clock, MessageCircle, Upload, CheckCircle } from 'lucide-react';

const Restauraciones = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    description: '',
    photos: null as FileList | null
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      photos: e.target.files
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Crear mensaje para WhatsApp
    const message = encodeURIComponent(
      `🔧 SOLICITUD DE RESTAURACIÓN\n\n` +
      `👤 Nombre: ${formData.name}\n` +
      `📞 Teléfono: ${formData.phone}\n` +
      `📧 Email: ${formData.email}\n` +
      `📝 Descripción del daño:\n${formData.description}\n\n` +
      `${formData.photos ? `📸 Fotos adjuntas: ${formData.photos.length} archivo(s)` : '📸 Sin fotos adjuntas'}\n\n` +
      `Por favor, proporcione una cotización para la restauración.`
    );

    const whatsappUrl = `https://wa.me/50769594358?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        description: '',
        photos: null
      });
    }, 3000);
  };

  const restorationExamples = [
    {
      id: 1,
      title: 'Restauración de Imagen del Sagrado Corazón',
      beforeImage: 'https://images.pexels.com/photos/8989587/pexels-photo-8989587.jpeg?auto=compress&cs=tinysrgb&w=400',
      afterImage: 'https://images.pexels.com/photos/6985003/pexels-photo-6985003.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Restauración completa de pintura y marco dorado de imagen familiar del siglo XIX.',
      duration: '15 días',
      category: 'Imágenes Religiosas'
    }
  ];

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
            
            <div className="space-y-6">
              {/* Ejemplo 1: Imagen del Sagrado Corazón */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-playfair text-lg font-semibold text-navy">
                    Restauración de Imagen del Sagrado Corazón
                  </h3>
                </div>
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/7045933/pexels-photo-7045933.jpeg?auto=compress&cs=tinysrgb&w=400"
                      alt="Antes"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      ANTES
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/8989574/pexels-photo-8989574.jpeg?auto=compress&cs=tinysrgb&w=400"
                      alt="Después"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      DESPUÉS
                    </div>
                  </div>
                </div>
              </div>

              {/* Ejemplo 2: Crucifijo Antiguo */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-playfair text-lg font-semibold text-navy">
                    Reparación de Crucifijo Antiguo
                  </h3>
                </div>
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/6985072/pexels-photo-6985072.jpeg?auto=compress&cs=tinysrgb&w=400"
                      alt="Antes"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      ANTES
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/6985003/pexels-photo-6985003.jpeg?auto=compress&cs=tinysrgb&w=400"
                      alt="Después"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      DESPUÉS
                    </div>
                  </div>
                </div>
              </div>

              {/* Ejemplo 3: Rosario de Perlas */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-playfair text-lg font-semibold text-navy">
                    Restauración de Rosario de Perlas
                  </h3>
                </div>
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/7045925/pexels-photo-7045925.jpeg?auto=compress&cs=tinysrgb&w=400"
                      alt="Antes"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      ANTES
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="https://images.pexels.com/photos/6546283/pexels-photo-6546283.jpeg?auto=compress&cs=tinysrgb&w=400"
                      alt="Después"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      DESPUÉS
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Cotización */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="font-playfair text-3xl font-bold text-navy mb-6">
              Solicita tu Cotización
            </h2>
            
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-600 mb-2">¡Solicitud Enviada!</h3>
                <p className="text-gray-600">Te contactaremos pronto por WhatsApp con tu cotización.</p>
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
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fotos del artículo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gold transition-colors duration-200">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      name="photos"
                      onChange={handleFileChange}
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <span className="text-gold font-medium">Haz clic para subir fotos</span>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG hasta 10MB cada una</p>
                    </label>
                    {formData.photos && (
                      <p className="text-sm text-green-600 mt-2">
                        {formData.photos.length} archivo(s) seleccionado(s)
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gold hover:bg-yellow-500 text-navy font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Solicitar Cotización por WhatsApp</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Restauraciones;