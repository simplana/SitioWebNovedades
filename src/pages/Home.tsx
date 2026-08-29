import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Heart, Shield, Truck, MessageCircle, Cross, BookOpen, Users } from 'lucide-react';
import { useFeaturedProducts } from '../hooks/useLoyverse';
import { useTestimonials } from '../hooks/useTestimonials';
import ProductGrid from '../components/ProductGrid';
import Newsletter from '../components/Newsletter';

const Home = () => {
  const { products: featuredProducts, loading, error } = useFeaturedProducts(6);
  const { testimonials, loading: testimonialsLoading } = useTestimonials();

  const features = [
    {
      icon: Shield,
      title: 'Calidad Especial',
      description: 'Artículos religiosos auténticos, con la más alta calidad para nutrir tu alma.'
    },
    {
      icon: Truck,
      title: 'Llevamos Paz a tu Hogar',
      description: 'Con amor y cuidado, llevamos estos tesoros religiosos directamente a tu santuario familiar.'
    },
    {
      icon: MessageCircle,
      title: 'Guía Espiritual',
      description: 'Te acompañamos con sabiduría para elegir el artículo perfecto para cada momento de oración.'
    },
    {
      icon: Heart,
      title: 'Tradición de Amor',
      description: 'Más de 20 años sirviendo con devoción a familias católicas, preservando la fe de generación en generación.'
    }
  ];

  const restorationExamples = [
    {
      id: 1,
      title: 'Restauración de Imagen del Sagrado Corazón',
      beforeImage: 'https://images.pexels.com/photos/8989587/pexels-photo-8989587.jpeg?auto=compress&cs=tinysrgb&w=400',
      afterImage: 'https://images.pexels.com/photos/6985003/pexels-photo-6985003.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Restauración completa de pintura y marco dorado de imagen familiar del siglo XIX.',
      duration: '15 días',
      category: 'Imágenes Religiosas'
    },
    {
      id: 2,
      title: 'Reparación de Crucifijo Antiguo',
      beforeImage: 'https://images.pexels.com/photos/5206044/pexels-photo-5206044.jpeg?auto=compress&cs=tinysrgb&w=400',
      afterImage: 'https://images.pexels.com/photos/8989574/pexels-photo-8989574.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Reparación de brazo fracturado y restauración del acabado original en madera.',
      duration: '10 días',
      category: 'Crucifijos'
    },
    {
      id: 3,
      title: 'Restauración de Rosario de Perlas',
      beforeImage: 'https://images.pexels.com/photos/6546283/pexels-photo-6546283.jpeg?auto=compress&cs=tinysrgb&w=400',
      afterImage: 'https://images.pexels.com/photos/5206044/pexels-photo-5206044.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Reemplazo de hilo, limpieza de perlas y reparación de crucifijo central.',
      duration: '7 días',
      category: 'Rosarios'
    }
  ];

  return (
    <div className="pt-16 bg-white">
      {/* Hero Section */}
      <section 
        className="relative bg-contain bg-center bg-no-repeat min-h-screen flex items-center overflow-hidden"
        style={{
          backgroundImage: `url('/nov cat 2.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%'
        }}
      >
        {/* Sacred Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-devotion/70 via-marian-blue/60 to-celestial-blue/50 z-0"></div>
        
        {/* Sacred Decorative Elements */}
        <div className="absolute top-10 left-10 text-divine-gold opacity-20">
          <svg className="w-12 h-12 animate-float" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="absolute bottom-10 right-10 text-celestial-blue opacity-20">
          <svg className="w-8 h-8 animate-float" style={{animationDelay: '2s'}} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
          <div className="flex items-center justify-center mx-auto mb-8">
            <div className="bg-sacred-white bg-opacity-90 p-6 rounded-full shadow-aureola backdrop-blur-sacred">
              <img 
                src="/novedades_catolicas_logo_transparent.png" 
                alt="Novedades Católicas Logo" 
                className="h-20 w-auto"
              />
            </div>
          </div>
          
          <h1 className="font-playfair text-5xl md:text-7xl font-bold mb-6 text-shadow-divine">
            Novedades Católicas
          </h1>
          
          <div className="w-32 h-1 bg-divine-gold mx-auto mb-6 rounded-full shadow-golden animate-gentle-glow"></div>
          
          <p className="text-2xl md:text-3xl mb-8 font-light text-shadow-soft">
            María Reina de la Paz
          </p>
          
          <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed text-shadow-soft">
            Acompáñanos en este camino de fe y devoción. Encuentra artículos religiosos 
            que nutran tu alma: imágenes religiosas, rosarios de oración, libros espirituales 
            y artículos de la tradición católica para tu hogar cristiano.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/productos"
              className="inline-flex items-center bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-4 px-8 rounded-full transition-all duration-300 text-lg shadow-golden hover:shadow-aureola transform hover:scale-105"
            >
              Explorar Artículos Religiosos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/contacto"
              className="inline-flex items-center bg-sacred-white hover:bg-navy-devotion text-navy-devotion hover:text-sacred-white font-semibold py-4 px-8 rounded-full transition-all duration-300 text-lg backdrop-blur-sacred transform hover:scale-105"
            >
              Contáctanos
              <MessageCircle className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-20 bg-gradient-to-br from-golden-light/15 via-light-gold/12 via-aureola-gold/10 to-divine-gold/8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-golden-light/10 via-light-gold/8 to-aureola-gold/6"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-divine-gold/5 to-golden-light/8"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 relative z-10">
            <h2 className="font-playfair text-5xl md:text-6xl font-bold text-navy-devotion mb-6 text-shadow-sacred">
              Misión y Visión
            </h2>
            <div className="w-32 h-1 bg-divine-gold mx-auto mb-8 rounded-full shadow-golden animate-gentle-glow"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            {/* Misión */}
            <div className="bg-sacred-white/95 rounded-3xl p-10 shadow-divine backdrop-blur-divine border-2 border-divine-gold border-opacity-30">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-aureola animate-gentle-glow">
                  <Cross className="h-8 w-8 text-navy-devotion" />
                </div>
                <h3 className="font-playfair text-3xl font-bold text-navy-devotion mb-6 text-shadow-sacred">
                  Nuestra Misión
                </h3>
              </div>
              <p className="text-stone-prayer text-lg leading-relaxed text-center italic">
                "Nuestra misión es ofrecer artículos religiosos que inspiren la fe, la devoción y 
                la espiritualidad cristiana, promoviendo el mensaje de paz de la Virgen María Reina 
                de la Paz. Buscamos acompañar a cada persona en su camino de oración, 
                fortaleciendo su relación con Dios a través de objetos sagrados, literatura 
                espiritual y recuerdos que transmitan esperanza, amor y reconciliación."
              </p>
            </div>

            {/* Visión */}
            <div className="bg-sacred-white/95 rounded-3xl p-10 shadow-divine backdrop-blur-divine border-2 border-divine-gold border-opacity-30">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-aureola animate-gentle-glow">
                  <Star className="h-8 w-8 text-navy-devotion" />
                </div>
                <h3 className="font-playfair text-3xl font-bold text-navy-devotion mb-6 text-shadow-sacred">
                  Nuestra Visión
                </h3>
              </div>
              <p className="text-stone-prayer text-lg leading-relaxed text-center italic">
                "Ser un referente en la difusión de la fe y la devoción a la Virgen María Reina de la 
                Paz, ofreciendo un espacio donde los fieles encuentren inspiración, esperanza y 
                recursos espirituales que fortalezcan su vida cristiana. Aspiramos a ser 
                reconocidos por nuestra calidad humana, el servicio cercano y la promoción de un 
                mundo más unido, reconciliado y lleno del amor de Dios."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="bg-gradient-to-br from-lavender-peace via-divine-light to-rose-prayer py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-aureola-glow opacity-60"></div>
        <div className="absolute top-10 left-10 text-divine-gold opacity-20">
          <svg className="w-16 h-16 animate-float" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 relative z-10">
            <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-8 shadow-aureola animate-gentle-glow">
              <Star className="h-8 w-8 text-navy-devotion" />
            </div>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-navy-devotion mb-4 text-shadow-sacred">
              Artículos de Fe Destacados
            </h2>
            <div className="w-24 h-1 bg-divine-gold mx-auto mb-6 rounded-full shadow-golden"></div>
            <p className="text-stone-prayer text-lg max-w-2xl mx-auto leading-relaxed">
              Una selección especial de artículos religiosos, elegidos con amor 
              para acompañar tu camino de oración y devoción.
            </p>
          </div>

          <div className="relative z-10">
            <ProductGrid 
              products={featuredProducts} 
              loading={loading}
              error={error}
            />
          </div>

          <div className="text-center mt-12 relative z-10">
            <Link
              to="/productos"
              className="inline-flex items-center bg-gradient-to-r from-marian-blue to-navy-devotion hover:from-navy-devotion hover:to-marian-blue text-sacred-white font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-marian hover:shadow-divine transform hover:scale-105"
            >
              Descubrir Más Artículos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-celestial-blue/25 via-heavenly-blue/30 via-divine-blue/20 to-marian-blue/15 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-celestial-blue/15 via-heavenly-blue/12 to-divine-blue/18"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-marian-blue/15 to-celestial-blue/12"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-8 shadow-aureola animate-gentle-glow">
                <Users className="h-8 w-8 text-navy-devotion" />
              </div>
              <h2 className="font-playfair text-4xl font-bold text-navy-devotion mb-4 text-shadow-sacred">
                Testimonios de Nuestra Comunidad
              </h2>
              <div className="w-24 h-1 bg-divine-gold mx-auto mb-6 rounded-full shadow-golden"></div>
              <p className="text-stone-prayer text-lg max-w-2xl mx-auto leading-relaxed">
                Escucha las voces de nuestra comunidad católica y cómo nuestros artículos
                han acompañado su camino de fe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-sacred-white rounded-2xl p-8 shadow-sacred backdrop-blur-divine border border-divine-gold border-opacity-10">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-divine-gold fill-current" />
                    ))}
                  </div>
                  <p className="text-stone-prayer mb-6 italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-divine-gold to-aureola-gold p-2 rounded-full mr-3">
                      <Users className="h-5 w-5 text-navy-devotion" />
                    </div>
                    <span className="font-semibold text-navy-devotion">{testimonial.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <Newsletter />

    </div>
  );
};

export default Home;