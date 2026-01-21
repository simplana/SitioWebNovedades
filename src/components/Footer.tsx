import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-lavender-peace via-rose-prayer to-divine-light text-navy-devotion relative overflow-hidden">
      <div className="absolute inset-0 bg-aureola-glow opacity-50"></div>
      <div className="absolute top-10 left-10 text-divine-gold opacity-15">
        <svg className="w-8 h-8 animate-float" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          {/* Logo y descripción */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-2 rounded-full shadow-aureola">
                <img
                  src="/novedades_catolicas_logo_transparent.png"
                  alt="Novedades Católicas Logo"
                  className="h-6 w-auto"
                />
              </div>
              <h3 className="font-playfair font-bold text-xl">
                Novedades Católicas
              </h3>
            </div>
            <div className="w-full h-px bg-divine-gold my-2 shadow-golden"></div>
            <p className="text-sm text-navy-devotion opacity-90 mb-4">María Reina de la Paz</p>
            <p className="text-navy-devotion opacity-80 mb-4 leading-relaxed">
              Artículos religiosos para nutrir tu alma 
              y acompañar tu camino de fe y oración.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-navy-devotion opacity-70 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/novedades_catolicas/?hl=es-la" target="_blank" rel="noopener noreferrer" className="text-navy-devotion opacity-70 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="font-playfair font-semibold text-lg mb-4 text-shadow-soft">Caminos de Fe</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/productos" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Artículos Religiosos
                </Link>
              </li>
              <li>
                <Link to="/restauraciones" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Restauraciones
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Mensajes de la Virgen
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Categorías */}
          <div>
            <h4 className="font-playfair font-semibold text-lg mb-4 text-shadow-soft">Artículos Sagrados</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Imágenes Religiosas
                </a>
              </li>
              <li>
                <a href="#" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Rosarios
                </a>
              </li>
              <li>
                <a href="#" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Libros Devocionales
                </a>
              </li>
              <li>
                <a href="#" className="text-navy-devotion opacity-80 hover:text-divine-gold hover:opacity-100 transition-all duration-200">
                  Velas y Coronas
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-playfair font-semibold text-lg mb-4 text-shadow-soft">Encuentranos en Oración</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-divine-gold mt-0.5 flex-shrink-0" />
                <span className="text-navy-devotion opacity-80 text-sm">
                  Rotonda de centennial<br />
                  Panama City, Panamá Province
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-divine-gold flex-shrink-0" />
                <span className="text-navy-devotion opacity-80 text-sm">+507 6959-4358</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-divine-gold flex-shrink-0" />
                <span className="text-navy-devotion opacity-80 text-sm">info@novedadescatolicas.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-divine-gold mt-0.5 flex-shrink-0" />
                <span className="text-navy-devotion opacity-80 text-sm">
                  Lun - Sáb: 9:00 AM - 6:00 PM<br />
                  Dom: 9:00 AM - 2:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-divine-gold border-opacity-30 mt-8 pt-8 text-center relative z-10">
          <p className="text-navy-devotion opacity-70 text-sm">
            © 2024 Novedades Católicas. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;