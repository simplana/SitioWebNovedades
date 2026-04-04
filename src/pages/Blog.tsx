import React, { useState } from 'react';
import { Calendar, User, ArrowRight, Heart, Cross, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMedjugorjeMessages } from '../hooks/useMedjugorjeMessages';
import { RefreshCw } from 'lucide-react';

// URL fija y persistente para la imagen de la Virgen de Medjugorje desde Supabase Storage
const VIRGEN_MEDJUGORJE_IMAGE = 'https://iabrhkvwhmliemgioxce.supabase.co/storage/v1/object/public/restorations/messages/virgen-medjugorje.jpg';

const Blog = () => {
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  
  const {
    messages,
    loading,
    error,
    hasNewMessage,
    refreshMessages,
    getLatestMessage,
    getPreviousMessages,
    setHasNewMessage
  } = useMedjugorjeMessages();

  const latestMessage = getLatestMessage();
  const previousMessages = getPreviousMessages();

  const toggleMessage = (id: string) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  const handleRefresh = async () => {
    await refreshMessages();
    setHasNewMessage(false);
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-divine-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-gold to-light-gold p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-golden animate-gentle-glow">
            <Heart className="h-10 w-10 text-navy animate-pulse" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-navy mb-4">
            Cargando mensajes de la Virgen...
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto"></div>
        </div>
      </div>
    );
  }

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
            <Heart className="h-10 w-10 text-sacred-white" />
          </div>
          <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6 text-navy-devotion text-shadow-sacred">
            Mensajes de la Virgen
          </h1>
          <div className="w-32 h-1 bg-divine-gold mx-auto mb-6 rounded-full"></div>
          <p className="text-navy-devotion text-xl max-w-3xl mx-auto leading-relaxed font-light opacity-90">
            Palabras de amor maternal de nuestra Santísima Madre, María Reina de la Paz, 
            para guiar nuestros corazones hacia su Hijo Jesús.
          </p>
          
          {/* Controles */}
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={handleRefresh}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                hasNewMessage 
                  ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse' 
                  : 'bg-sacred-white hover:bg-holy-glow text-navy border-2 border-gold'
              }`}
            >
              <RefreshCw className="h-5 w-5" />
              <span>{hasNewMessage ? '¡Nuevo mensaje disponible!' : 'Actualizar mensajes'}</span>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
              <p className="text-sm">Error: {error}</p>
              <button 
                onClick={handleRefresh}
                className="text-red-800 underline text-sm mt-1"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Último Mensaje Destacado */}
        {latestMessage && (
          <div className="mb-16">
            <h2 className="font-playfair text-4xl font-bold text-navy mb-10 text-center text-shadow-soft">
              Último Mensaje
            </h2>
            <div className="bg-sacred-white rounded-3xl shadow-sacred overflow-hidden backdrop-blur-divine border-2 border-gold relative">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-gold to-light-gold text-navy px-4 py-2 rounded-full text-sm font-bold shadow-golden animate-gentle-glow">
                NUEVO
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-10">
                <div className="order-2 lg:order-1">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{latestMessage.date}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-playfair text-3xl font-bold text-navy mb-4 text-shadow-soft">
                    {latestMessage.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 flex items-center">
                    <Star className="h-4 w-4 mr-2 text-gold" />
                    {latestMessage.location}
                  </p>
                  
                  <p className="text-gray-700 mb-8 leading-relaxed text-lg italic">
                    "{latestMessage.excerpt}"
                  </p>
                  
                  <div className="bg-holy-glow rounded-2xl p-6 mb-8">
                    <h4 className="font-playfair text-xl font-semibold text-navy mb-4">
                      Mensaje Completo:
                    </h4>
                    <div className="text-gray-700 leading-relaxed space-y-4">
                      {latestMessage.message.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="italic">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="order-1 lg:order-2">
                  <img
                    src={VIRGEN_MEDJUGORJE_IMAGE}
                    alt="Nuestra Señora de Medjugorje"
                    className="w-full h-full object-cover rounded-2xl shadow-divine"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes Anteriores */}
        {previousMessages.length > 0 && (
          <div className="mb-8">
            <h2 className="font-playfair text-4xl font-bold text-navy mb-8 text-center text-shadow-soft">
              Mensajes Anteriores
            </h2>
          </div>
        )}

        {/* Lista de Mensajes Anteriores */}
        <div className="space-y-6">
          {previousMessages.map((message) => (
            <div key={message.id} className="bg-sacred-white rounded-2xl shadow-divine overflow-hidden backdrop-blur-divine border border-holy-glow transition-all duration-300 hover:shadow-sacred">
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1">
                    <img
                      src={VIRGEN_MEDJUGORJE_IMAGE}
                      alt="Nuestra Señora de Medjugorje"
                      className="w-full h-64 object-cover rounded-xl shadow-sacred"
                    />
                  </div>
                  
                  <div className="lg:col-span-2">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{message.date}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-2 text-gold" />
                        <span>{message.location}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-playfair text-2xl font-bold text-navy mb-3 text-shadow-soft">
                      {message.title}
                    </h3>
                    
                    <p className="text-gray-700 mb-4 leading-relaxed italic">
                      "{message.excerpt}"
                    </p>
                    
                    <button
                      onClick={() => toggleMessage(message.id)}
                      className="inline-flex items-center text-marian-blue hover:text-navy font-semibold group bg-holy-glow px-6 py-3 rounded-full transition-all duration-300 hover:shadow-divine"
                    >
                      {expandedMessage === message.id ? 'Ocultar mensaje' : 'Leer mensaje completo'}
                      {expandedMessage === message.id ? (
                        <ChevronUp className="ml-2 h-4 w-4 group-hover:-translate-y-1 transition-transform duration-300" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform duration-300" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Mensaje expandido */}
                {expandedMessage === message.id && (
                  <div className="mt-8 pt-8 border-t border-holy-glow">
                    <div className="bg-celestial-gradient rounded-2xl p-8">
                      <h4 className="font-playfair text-xl font-semibold text-navy mb-6 text-center">
                        Mensaje Completo
                      </h4>
                      <div className="text-gray-700 leading-relaxed space-y-4 max-w-4xl mx-auto">
                        {message.message.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="italic text-center">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sección de inspiración */}
        <div className="mt-20 bg-celestial-gradient text-navy rounded-3xl p-12 text-center relative overflow-hidden shadow-sacred">
          <div className="absolute inset-0 bg-marian-glow opacity-40"></div>
          <div className="absolute top-6 left-6 text-celestial-blue opacity-30">
            <svg className="w-8 h-8 animate-float" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="relative z-10">
            <div className="bg-gradient-to-br from-gold to-light-gold p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-golden animate-gentle-glow">
              <Heart className="h-10 w-10 text-navy" />
            </div>
            <h3 className="font-playfair text-3xl font-bold mb-6 text-shadow-soft">
              "Soy vuestra Madre que os ama con amor infinito"
            </h3>
            <p className="text-navy text-lg mb-8 max-w-3xl mx-auto leading-relaxed opacity-90">
              Que estos mensajes de nuestra Santísima Madre María toquen vuestros corazones 
              y os guíen siempre hacia su Hijo Jesús, fuente de toda paz y salvación.
            </p>
            <Link
              to="/productos"
              className="inline-flex items-center bg-gradient-to-r from-gold to-light-gold hover:from-light-gold hover:to-gold text-navy font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-golden hover:shadow-divine transform hover:scale-105 relative z-10"
            >
              Ver artículos marianos
              <Cross className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;