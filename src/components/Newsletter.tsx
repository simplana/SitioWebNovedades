import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Aquí se implementaría la lógica de suscripción
      console.log('Suscrito:', email);
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <section className="bg-celestial-gradient py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-marian-glow opacity-50"></div>
      <div className="absolute top-8 right-8 text-divine-gold opacity-20">
        <svg className="w-10 h-10 animate-float" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-aureola animate-gentle-glow">
          <Mail className="h-8 w-8 text-navy-devotion" />
        </div>
        
        <h2 className="font-playfair text-3xl md:text-4xl font-bold text-navy-devotion mb-4 text-shadow-sacred">
          Recibe Novedades y Reflexiones Espirituales
        </h2>
        <div className="w-24 h-1 bg-divine-gold mx-auto mb-6 rounded-full shadow-golden"></div>
        <p className="text-navy-devotion text-lg mb-8 max-w-2xl mx-auto leading-relaxed opacity-90">
          Únete a nuestra comunidad de oración y recibe en tu corazón las últimas bendiciones, 
          novedades especiales y reflexiones espirituales para nutrir tu alma.
        </p>

        {isSubscribed ? (
          <div className="flex items-center justify-center space-x-2 text-marian-blue text-lg bg-sacred-white bg-opacity-90 py-4 px-6 rounded-full shadow-sacred backdrop-blur-divine">
            <CheckCircle className="h-6 w-6" />
            <span className="font-semibold">¡Bendiciones! Ya formas parte de nuestra familia de fe.</span>
            <span className="font-semibold">¡Gracias! Ya formas parte de nuestra familia de fe.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Tu correo para recibir bendiciones"
                placeholder="Tu correo para recibir novedades"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-full border border-divine-gold border-opacity-30 focus:ring-2 focus:ring-divine-gold focus:border-transparent text-navy-devotion bg-sacred-white bg-opacity-90 backdrop-blur-sacred shadow-sacred"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
              >
                Unirme en Oración
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default Newsletter;