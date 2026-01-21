import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Facebook, Instagram } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se implementaría el envío del formulario
    console.log('Formulario enviado:', formData);
    alert('Mensaje enviado correctamente. Te contactaremos pronto.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  const handleWhatsAppContact = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '50769594358';
    const message = encodeURIComponent('Hola, me gustaría obtener más información sobre sus productos y servicios.');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-prayer via-lavender-peace to-divine-light py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-aureola-glow opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-divine-gold p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-aureola">
            <Mail className="h-10 w-10 text-sacred-white" />
          </div>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4 text-navy-devotion text-shadow-sacred">
            Contacto
          </h1>
          <div className="w-32 h-1 bg-divine-gold mx-auto mb-6 rounded-full"></div>
          <p className="text-navy-devotion text-lg max-w-2xl mx-auto opacity-90">
            Estamos aquí para servirte. Contáctanos y te atenderemos con el amor 
            y la dedicación que mereces.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Información de contacto */}
          <div>
            <h2 className="font-playfair text-3xl font-bold text-navy mb-8">
              Información de Contacto
            </h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start space-x-4">
                <div className="bg-gold p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-navy" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-2">Dirección</h3>
                  <p className="text-gray-700">
                    Rotonda de centennial<br />
                    Panama City, Panamá Province
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gold p-3 rounded-full">
                  <Phone className="h-6 w-6 text-navy" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-2">Teléfono</h3>
                  <p className="text-gray-700">
                    +507 6959-4358
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gold p-3 rounded-full">
                  <Mail className="h-6 w-6 text-navy" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-2">Correo Electrónico</h3>
                  <p className="text-gray-700">
                    info@novedadescatolicas.com<br />
                    ventas@novedadescatolicas.com
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gold p-3 rounded-full">
                  <Clock className="h-6 w-6 text-navy" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-2">Horarios de Atención</h3>
                  <div className="text-gray-700">
                    <p>Lunes a Sábado: 9:00 AM - 6:00 PM</p>
                    <p>Domingos: 9:00 AM - 2:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Redes sociales */}
            <div className="mb-8">
              <h3 className="font-playfair text-xl font-semibold text-navy mb-4">
                Síguenos en nuestras redes
              </h3>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors duration-200"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full transition-colors duration-200"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Botón de WhatsApp */}
            <button
              onClick={handleWhatsAppContact}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-3"
            >
              <MessageCircle className="h-6 w-6" />
              <span>Contactar por WhatsApp</span>
            </button>
          </div>

          {/* Formulario de contacto */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="font-playfair text-3xl font-bold text-navy mb-6">
              Envíanos un mensaje
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="tu@correo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="+507 0000-0000"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="consulta-producto">Consulta sobre producto</option>
                    <option value="pedido-especial">Pedido especial</option>
                    <option value="asesoramiento">Asesoramiento religioso</option>
                    <option value="sugerencia">Sugerencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                  placeholder="Escribe tu mensaje aquí..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gold hover:bg-yellow-500 text-navy font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>Enviar mensaje</span>
              </button>
            </form>
          </div>
        </div>

        {/* Mapa */}
        <div className="mt-16">
          <h2 className="font-playfair text-3xl font-bold text-navy mb-6 text-center">
            Visítanos en nuestra tienda
          </h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15762.308!2d-79.535!3d9.017!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x907d60efedf4f64c!2sNovedades%20Cat%C3%B3licas%20Mar%C3%ADa%20Reina%20de%20la%20Paz!5e0!3m2!1ses!2spa!4v1637000000000!5m2!1ses!2spa"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Novedades Católicas María Reina de la Paz"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;