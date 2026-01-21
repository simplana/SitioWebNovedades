import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppFloat = () => {
  const handleWhatsAppClick = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '50760000000';
    const message = encodeURIComponent('¡Hola! Me interesa conocer más sobre sus productos religiosos.');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-50 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        ¡Escríbenos!
      </span>
    </button>
  );
};

export default WhatsAppFloat;