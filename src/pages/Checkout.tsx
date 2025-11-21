import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { usePagueloFacil } from '../hooks/usePagueloFacil';
import { ShoppingCart, CreditCard, Truck, CheckCircle, ArrowLeft, User, MapPin, Phone, Mail, MessageCircle, Search, Navigation } from 'lucide-react';
import PagueloFacilButton from '../components/PagueloFacilButton';
import PagueloFacilPaymentCard from '../components/PagueloFacilPaymentCard';
import CheckoutMap from '../components/CheckoutMap';
import { supabase } from '../lib/supabase';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, processOrder, loading } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { createPayment, loading: pagueloLoading } = usePagueloFacil();
  
  const [step, setStep] = useState<'info' | 'payment' | 'confirmation'>('info');
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    country: 'Panamá',
    province: '',
    district: '',
    corregimiento: '',
    street: '',
    houseNumber: '',
    apartmentFloor: '',
    notes: '',
    deliveryMethod: 'delivery',
    latitude: 8.9824,
    longitude: -79.5199
  });

  const [autocompleteValue, setAutocompleteValue] = useState('');
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<any>(null);
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);
  const [savedAddress, setSavedAddress] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'paguelo_facil'>('transfer');

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          setLoadingProfile(false);
          return;
        }

        if (data && data.provincia && data.corregimiento && data.direccion_exacta) {
          setSavedAddress(data);
          setCustomerInfo(prev => ({
            ...prev,
            name: data.full_name || prev.name,
            phone: data.phone || prev.phone,
            province: data.provincia,
            corregimiento: data.corregimiento,
            street: data.direccion_exacta,
            houseNumber: data.casa_edificio || '',
            apartmentFloor: data.direccion_referencia || '',
            notes: data.notas_adicionales || '',
            latitude: data.latitude || 8.9824,
            longitude: data.longitude || -79.5199
          }));
          setAutocompleteValue(data.direccion_exacta);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [user]);

  useEffect(() => {
    const loadPlacesAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        setTimeout(loadPlacesAutocomplete, 100);
        return;
      }

      if (!autocompleteRef.current || autocompleteInstanceRef.current) return;

      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
        componentRestrictions: { country: 'pa' },
        fields: ['address_components', 'geometry', 'formatted_address'],
        types: ['address']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || '';

        let province = '';
        let district = '';
        let corregimiento = '';
        let streetName = '';
        let streetNumber = '';

        if (place.address_components) {
          for (const component of place.address_components) {
            const types = component.types;

            if (types.includes('administrative_area_level_1')) {
              province = component.long_name;
            }

            if (types.includes('locality')) {
              district = component.long_name;
            }

            if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
              corregimiento = component.long_name;
            }

            if (types.includes('route')) {
              streetName = component.long_name;
            }

            if (types.includes('street_number')) {
              streetNumber = component.long_name;
            }
          }
        }

        setCustomerInfo(prev => ({
          ...prev,
          province: province,
          district: district,
          corregimiento: corregimiento || district,
          street: streetName,
          houseNumber: streetNumber,
          latitude: lat,
          longitude: lng
        }));

        setAutocompleteValue(formattedAddress);
      });

      autocompleteInstanceRef.current = autocomplete;
    };

    if (step === 'info') {
      loadPlacesAutocomplete();
    }
  }, [step]);
  // Datos de ubicación de Panamá
  const panamaData = {
    'Panamá': {
      'Panamá': ['Ancón', 'Betania', 'Bella Vista', 'Calidonia', 'Chorrrera', 'Curundú', 'El Chorrillo', 'Parque Lefevre', 'Pedregal', 'Pueblo Nuevo', 'Río Abajo', 'San Felipe', 'San Francisco', 'Santa Ana', 'Tocumen', 'Juan Díaz'],
      'San Miguelito': ['Amelia Denis de Icaza', 'Belisario Frías', 'Belisario Porras', 'José Domingo Espinar', 'Mateo Iturralde', 'Rufina Alfaro', 'Villa Lucre', 'Victoriano Lorenzo']
    },
    'Panamá Oeste': {
      'Arraiján': ['Arraiján', 'Burunga', 'Cerro Silvestre', 'Juan D. Arosemena', 'Nuevo Chorrillo', 'Veracruz'],
      'La Chorrera': ['Arosemena', 'Barrio Balboa', 'Barrio Colón', 'El Coco', 'Feuillet', 'Guadalupe', 'Herrera', 'Hurtado', 'La Chorrera', 'Los Díaz', 'Mendoza', 'Playa Leona', 'Puerto Caimito', 'Santa Rita', 'Toboga']
    },
    'Colón': {
      'Colón': ['Barrio Norte', 'Barrio Sur', 'Buena Vista', 'Cristóbal', 'Limón', 'Manglar Alto', 'Puerto Pilón', 'Rainbowcity', 'Sabanitas', 'Salamanca'],
      'Chagres': ['Chagres', 'La Encantada', 'Palmas Bellas', 'Piña']
    },
    'Chiriquí': {
      'David': ['David', 'Bijagual', 'Cochea', 'Guacá', 'Pedregal'],
      'Boquete': ['Bajo Boquete', 'Alto Boquete', 'Caldera', 'Jaramillo', 'Los Naranjos', 'Palmira']
    },
    'Coclé': {
      'Penonomé': ['Penonomé', 'Coclé', 'El Coco', 'Río Grande', 'Tulú'],
      'Aguadulce': ['Aguadulce', 'Barrios Unidos', 'El Cristo', 'El Roble', 'Pocrí']
    },
    'Herrera': {
      'Chitré': ['Chitré', 'La Arena', 'Llano Bonito', 'Monagrillo', 'San Juan Bautista'],
      'Las Minas': ['Las Minas', 'Chepo', 'Leones']
    },
    'Los Santos': {
      'Las Tablas': ['Las Tablas', 'El Bebedero', 'El Cocal', 'El Páramo', 'Flores', 'Guararé', 'La Tiza', 'La Villa de Los Santos', 'Llano de Piedra', 'Monagre', 'Pocosol', 'Santa Ana'],
      'Guararé': ['Guararé', 'El Espinal', 'El Hato', 'La Enea', 'La Pasera']
    },
    'Veraguas': {
      'Santiago': ['Santiago', 'Cañazas', 'La Colorada', 'La Peña', 'Los Algarrobos', 'Ponuga', 'San Pedro del Espíritu Santo', 'Urracá'],
      'Soná': ['Soná', 'Bahía Honda', 'Calidonia', 'Guarumal', 'Río de Jesús']
    },
    'Bocas del Toro': {
      'Bocas del Toro': ['Bocas del Toro', 'Bastimentos', 'Cauchero', 'Punta Laurel', 'Tierra Oscura'],
      'Changuinola': ['Changuinola', 'Almirante', 'Guabito', 'Las Delicias', 'Teribe', 'Valle de Agua Arriba', 'Valle del Risco']
    },
    'Darién': {
      'La Palma': ['La Palma', 'Chepigana', 'Garachiné', 'La Guinea', 'Río Congo', 'Taimatí', 'Yape'],
      'Pinogana': ['El Real', 'Boca de Cupe', 'Cucunatí', 'Jaqué', 'Paya', 'Pucuro', 'Río Iglesias', 'Setegantí', 'Yaviza']
    }
  };

  const total = getTotalPrice();

  // Redirigir si no está autenticado o carrito vacío
  React.useEffect(() => {
    console.log('🔍 Checkout conditions:', {
      isAuthenticated,
      itemsLength: items.length,
      user: user?.email
    });
    
    // Comentar temporalmente las validaciones para debug
    // if (!isAuthenticated) {
    //   console.log('❌ Not authenticated, redirecting to home');
    //   navigate('/');
    //   return;
    // }
    // if (items.length === 0) {
    //   console.log('❌ Empty cart, redirecting to products');
    //   navigate('/productos');
    //   return;
    // }
  }, [isAuthenticated, items.length, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => {
      const newInfo = { ...prev, [name]: value };
      
      // Reset dependent fields when parent changes
      if (name === 'province') {
        newInfo.district = '';
        newInfo.corregimiento = '';
      } else if (name === 'district') {
        newInfo.corregimiento = '';
      }
      
      return newInfo;
    });
  };

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handleCompleteOrder = async () => {
    try {
      // Crear mensaje de WhatsApp con todos los detalles
      const itemsList = items.map(item => 
        `• ${item.name} (${item.sku}) - Cantidad: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
      ).join('\n');
      if (paymentMethod === 'paguelo_facil') {
        // Procesar pago con Paguelo Fácil
        const orderId = `ORD-${Date.now()}`;
        
        const paymentResponse = await createPayment({
          orderId,
          items,
          customer: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone
          },
          total
        });

        if (paymentResponse.success && paymentResponse.paymentUrl) {
          // Crear orden con estado de pago pendiente
          const order = await processOrder(
            {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone
            },
            customerInfo.country === 'Panamá' 
              ? `${customerInfo.street} ${customerInfo.houseNumber}, ${customerInfo.corregimiento}, ${customerInfo.district}, ${customerInfo.province}, Panamá`
              : `${customerInfo.street}, ${customerInfo.country}`,
            {
              paymentMethod: 'paguelo_facil',
              paymentId: paymentResponse.paymentId,
              status: 'payment_pending'
            }
          );
          
          // Redirigir a Paguelo Fácil para completar el pago
          window.location.href = paymentResponse.paymentUrl;
          return;
        } else {
          throw new Error(paymentResponse.error || 'Error al crear el pago con Paguelo Fácil');
        }
      } else {
        // Método de transferencia bancaria - enviar por WhatsApp
        const itemsList = items.map(item => 
          `• ${item.name} (${item.sku}) - Cantidad: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');
        
        const whatsappMessage = encodeURIComponent(
          `🛒 NUEVA ORDEN DE COMPRA\n\n` +
          `👤 INFORMACIÓN DEL CLIENTE:\n` +
          `Nombre: ${customerInfo.name}\n` +
          `Email: ${customerInfo.email}\n` +
          `Teléfono: ${customerInfo.phone}\n` +
          `Dirección: ${customerInfo.country === 'Panamá' 
            ? `${customerInfo.street} ${customerInfo.houseNumber}, ${customerInfo.corregimiento}, ${customerInfo.district}, ${customerInfo.province}, Panamá`
            : `${customerInfo.street}, ${customerInfo.country}`
          }\n\n` +
          `📦 PRODUCTOS ORDENADOS:\n${itemsList}\n\n` +
          `💰 TOTAL: $${total.toFixed(2)}\n\n` +
          `💳 MÉTODO DE PAGO: Transferencia Bancaria\n\n` +
          `${customerInfo.notes ? `📝 NOTAS: ${customerInfo.notes}\n\n` : ''}` +
          `Por favor confirme esta orden y proporcione los datos bancarios para completar la transferencia.`
        );
        
        // Abrir WhatsApp con el mensaje
        const whatsappUrl = `https://wa.me/50760000000?text=${whatsappMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // Crear orden con estado de pago pendiente para transferencia
        const order = await processOrder(
          {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone
          },
          customerInfo.country === 'Panamá' 
            ? `${customerInfo.street} ${customerInfo.houseNumber}, ${customerInfo.corregimiento}, ${customerInfo.district}, ${customerInfo.province}, Panamá`
            : `${customerInfo.street}, ${customerInfo.country}`,
          {
            paymentMethod: 'transfer',
            status: 'payment_pending'
          }
        );
        
        setCompletedOrder(order);
        setOrderCompleted(true);
        setStep('confirmation');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Error al procesar la orden. Por favor intenta de nuevo.');
    }
  };

  // Comentar temporalmente para debug
  // if (!isAuthenticated || items.length === 0) {
  //   return null;
  // }

  if (orderCompleted) {
    return (
      <div className="pt-16 min-h-screen bg-divine-gradient">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-sacred-white rounded-2xl shadow-divine p-8 text-center">
            <div className="bg-green-100 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="font-playfair text-3xl font-bold text-navy-devotion mb-4">
              ¡Orden Confirmada!
            </h1>
            
            <p className="text-stone-prayer text-lg mb-6">
              Tu orden <span className="font-semibold text-divine-gold">{completedOrder?.id}</span> ha sido procesada exitosamente.
            </p>
            
            <div className="bg-celestial-gradient rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-navy-devotion mb-4">Detalles de tu orden:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total de artículos:</span>
                  <span className="font-semibold">{completedOrder?.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total pagado:</span>
                  <span className="font-semibold text-divine-gold">${completedOrder?.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className="font-semibold text-green-600">Confirmada</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-stone-prayer">
                Te contactaremos pronto por WhatsApp para coordinar la entrega.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/productos')}
                  className="bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
                >
                  Seguir Comprando
                </button>
                
                <button
                  onClick={() => navigate('/orders')}
                  className="bg-gradient-to-r from-marian-blue to-navy-devotion hover:from-navy-devotion hover:to-marian-blue text-sacred-white font-semibold py-3 px-6 rounded-full transition-all duration-300 shadow-marian hover:shadow-divine transform hover:scale-105"
                >
                  Ver Mis Órdenes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-marian-blue via-navy-devotion to-celestial-blue">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-whisper-gray rounded-full transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="font-playfair text-3xl font-bold text-white">
            Finalizar Compra
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'info' ? 'text-divine-gold' : 'text-white'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'info' ? 'bg-divine-gold text-navy-devotion' : 'bg-whisper-gray'}`}>
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium">Información</span>
            </div>
            
            <div className="w-8 h-px bg-whisper-gray"></div>
            
            <div className={`flex items-center space-x-2 ${step === 'payment' ? 'text-divine-gold' : 'text-white'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-divine-gold text-navy-devotion' : 'bg-divine-gold text-navy-devotion'}`}>
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="font-medium">Pago</span>
            </div>
            
            <div className="w-8 h-px bg-whisper-gray"></div>
            
            <div className={`flex items-center space-x-2 ${step === 'confirmation' ? 'text-divine-gold' : 'text-white'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirmation' ? 'bg-divine-gold text-navy-devotion' : 'bg-divine-gold text-navy-devotion'}`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="font-medium">Confirmación</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'info' && (
              <div className="bg-sacred-white rounded-2xl shadow-sacred p-8">
                <h2 className="font-playfair text-2xl font-bold text-navy-devotion mb-6 flex items-center">
                  <MapPin className="h-6 w-6 mr-2 text-divine-gold" />
                  Información de Contacto y Entrega
                </h2>

                <form onSubmit={handleSubmitInfo} className="space-y-6">
                  {/* Delivery Method First */}
                  <div>
                    <label className="block text-sm font-medium text-stone-prayer mb-2">
                      Método de entrega *
                    </label>
                    <div className="space-y-3">
                      <div
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          customerInfo.deliveryMethod === 'delivery'
                            ? 'border-divine-gold bg-light-gold bg-opacity-20'
                            : 'border-divine-gold border-opacity-30 hover:border-divine-gold hover:border-opacity-50'
                        }`}
                        onClick={() => setCustomerInfo(prev => ({ ...prev, deliveryMethod: 'delivery' }))}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="delivery"
                            checked={customerInfo.deliveryMethod === 'delivery'}
                            onChange={handleInputChange}
                            className="text-divine-gold focus:ring-divine-gold"
                          />
                          <div>
                            <h3 className="font-semibold text-navy-devotion">Envío a domicilio</h3>
                            <p className="text-sm text-stone-prayer">Recibe tu pedido en la dirección que indiques</p>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          customerInfo.deliveryMethod === 'pickup'
                            ? 'border-divine-gold bg-light-gold bg-opacity-20'
                            : 'border-divine-gold border-opacity-30 hover:border-divine-gold hover:border-opacity-50'
                        }`}
                        onClick={() => setCustomerInfo(prev => ({ ...prev, deliveryMethod: 'pickup' }))}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="pickup"
                            checked={customerInfo.deliveryMethod === 'pickup'}
                            onChange={handleInputChange}
                            className="text-divine-gold focus:ring-divine-gold"
                          />
                          <div>
                            <h3 className="font-semibold text-navy-devotion">Retiro en tienda</h3>
                            <p className="text-sm text-stone-prayer">Retira tu pedido en nuestra tienda física</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-prayer mb-2">
                        Nombre completo *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dove-gray h-5 w-5" />
                        <input
                          type="text"
                          name="name"
                          value={customerInfo.name}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-stone-prayer mb-2">
                        Correo electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dove-gray h-5 w-5" />
                        <input
                          type="email"
                          name="email"
                          value={customerInfo.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-prayer mb-2">
                      Teléfono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dove-gray h-5 w-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={customerInfo.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                        placeholder="+507 0000-0000"
                        required
                      />
                    </div>
                  </div>
                  
                  
                  {/* Address Section with Map - Only for delivery */}
                  {customerInfo.deliveryMethod === 'delivery' && (
                    <>
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="font-semibold text-lg text-navy-devotion mb-4 flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-divine-gold" />
                          Dirección de Entrega
                        </h3>

                        {savedAddress && !useDifferentAddress && (
                          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-green-800 mb-1">
                                  ✓ Usando tu dirección guardada
                                </p>
                                <p className="text-sm text-green-700">
                                  {savedAddress.direccion_exacta}
                                  {savedAddress.casa_edificio && `, ${savedAddress.casa_edificio}`}
                                  {savedAddress.direccion_referencia && `, ${savedAddress.direccion_referencia}`}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  {savedAddress.corregimiento}, {savedAddress.provincia}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUseDifferentAddress(true)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                            >
                              Usar una dirección diferente
                            </button>
                          </div>
                        )}

                        {(!savedAddress || useDifferentAddress) && (
                          <>
                            {useDifferentAddress && savedAddress && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                                <p className="text-sm text-yellow-800">
                                  Usando una dirección diferente para este pedido
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUseDifferentAddress(false);
                                    setCustomerInfo(prev => ({
                                      ...prev,
                                      province: savedAddress.provincia,
                                      corregimiento: savedAddress.corregimiento,
                                      street: savedAddress.direccion_exacta,
                                      houseNumber: savedAddress.casa_edificio || '',
                                      apartmentFloor: savedAddress.direccion_referencia || '',
                                      notes: savedAddress.notas_adicionales || '',
                                      latitude: savedAddress.latitude || 8.9824,
                                      longitude: savedAddress.longitude || -79.5199
                                    }));
                                    setAutocompleteValue(savedAddress.direccion_exacta);
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                                >
                                  Usar dirección guardada
                                </button>
                              </div>
                            )}

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                              <p className="text-sm text-blue-800 mb-2">
                                <strong>Busca tu dirección:</strong> Escribe tu dirección en el campo de búsqueda y selecciona de las sugerencias.
                              </p>
                              <p className="text-xs text-blue-700">
                                El mapa se actualizará automáticamente y puedes ajustar el marcador arrastrándolo o haciendo click en tu ubicación exacta.
                              </p>
                            </div>
                          </>
                        )}

                        {(!savedAddress || useDifferentAddress) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-stone-prayer mb-2">
                                  <Search className="inline h-4 w-4 mr-1" />
                                  Buscar dirección *
                                </label>
                                <input
                                  ref={autocompleteRef}
                                  type="text"
                                  value={autocompleteValue}
                                  onChange={(e) => setAutocompleteValue(e.target.value)}
                                  className="w-full px-4 py-3 border-2 border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-divine-gold"
                                  placeholder="Ej: Calle 50, Ciudad de Panamá"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Comienza a escribir y selecciona de las sugerencias
                                </p>
                              </div>

                            <div>
                              <label className="block text-sm font-medium text-stone-prayer mb-2">
                                Provincia *
                              </label>
                              <input
                                type="text"
                                name="province"
                                value={customerInfo.province}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent bg-gray-50"
                                placeholder="Se llenará automáticamente"
                                readOnly
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-stone-prayer mb-2">
                                Corregimiento / Distrito *
                              </label>
                              <input
                                type="text"
                                name="corregimiento"
                                value={customerInfo.corregimiento}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                                placeholder="Ingresa el corregimiento"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-stone-prayer mb-2">
                                  Casa/Edificio
                                </label>
                                <input
                                  type="text"
                                  name="houseNumber"
                                  value={customerInfo.houseNumber}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                                  placeholder="Ej: Casa 123"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-stone-prayer mb-2">
                                  Apt/Piso (opcional)
                                </label>
                                <input
                                  type="text"
                                  name="apartmentFloor"
                                  value={customerInfo.apartmentFloor}
                                  onChange={handleInputChange}
                                  className="w-full px-4 py-3 border border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent"
                                  placeholder="Ej: Apt 4B"
                                />
                              </div>
                            </div>
                          </div>

                            <div>
                              <label className="block text-sm font-medium text-stone-prayer mb-2">
                                Mapa de ubicación
                              </label>
                              <CheckoutMap
                                latitude={customerInfo.latitude}
                                longitude={customerInfo.longitude}
                                onLocationChange={(lat, lng, address, province, district) => {
                                  setCustomerInfo(prev => ({
                                    ...prev,
                                    latitude: lat,
                                    longitude: lng,
                                    province: province,
                                    corregimiento: district
                                  }));
                                  setAutocompleteValue(address);
                                }}
                                height="400px"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-stone-prayer mb-2">
                                Notas adicionales (opcional)
                              </label>
                              <textarea
                                name="notes"
                                value={customerInfo.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-3 border border-divine-gold border-opacity-30 rounded-lg focus:ring-2 focus:ring-divine-gold focus:border-transparent resize-none"
                                placeholder="Instrucciones especiales para la entrega..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-divine-gold to-aureola-gold hover:from-aureola-gold hover:to-divine-gold text-navy-devotion font-semibold py-4 px-6 rounded-full transition-all duration-300 shadow-golden hover:shadow-aureola transform hover:scale-105"
                  >
                    Continuar al Pago
                  </button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-sacred-white rounded-2xl shadow-sacred p-8">
                <h2 className="font-playfair text-2xl font-bold text-navy-devotion mb-6">
                  Método de Pago
                </h2>
                
                <div className="space-y-4 mb-8">
                  {/* Transferencia Bancaria */}
                  <div 
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                      paymentMethod === 'transfer' 
                        ? 'border-divine-gold bg-light-gold bg-opacity-20 shadow-lg transform scale-105' 
                        : 'border-gray-200 hover:border-divine-gold hover:shadow-md hover:scale-102'
                    }`}
                    onClick={() => setPaymentMethod('transfer')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="payment"
                          value="transfer"
                          checked={paymentMethod === 'transfer'}
                          onChange={() => setPaymentMethod('transfer')}
                          className="text-divine-gold focus:ring-divine-gold h-5 w-5"
                        />
                        <div className="bg-gradient-to-r from-divine-gold to-aureola-gold text-navy-devotion px-3 py-1 rounded-lg text-sm font-bold">
                          Transferencia Bancaria
                        </div>
                      </div>
                      {paymentMethod === 'transfer' && (
                        <CheckCircle className="h-6 w-6 text-divine-gold" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-devotion text-lg mb-2">Pago por Transferencia</h3>
                      <p className="text-sm text-stone-prayer">
                        Te enviaremos los datos bancarios por WhatsApp para que realices la transferencia de forma segura.
                      </p>
                    </div>
                  </div>
                  
                  {/* Paguelo Fácil */}
                  <PagueloFacilPaymentCard
                    isSelected={paymentMethod === 'paguelo_facil'}
                    onSelect={() => setPaymentMethod('paguelo_facil')}
                  />
                  
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep('info')}
                    className="flex-1 bg-whisper-gray hover:bg-dove-gray text-stone-prayer font-semibold py-3 px-6 rounded-full transition-all duration-300"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleCompleteOrder}
                    disabled={loading || pagueloLoading}
                    className={`flex-1 font-semibold py-3 px-6 rounded-full transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 ${
                      paymentMethod === 'paguelo_facil'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        : 'bg-gradient-to-r from-marian-blue to-navy-devotion hover:from-navy-devotion hover:to-marian-blue text-sacred-white shadow-marian hover:shadow-divine transform hover:scale-105'
                    }`}
                  >
                    {paymentMethod === 'paguelo_facil' ? (
                      <>
                        {pagueloLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Procesando pago...</span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <div className="bg-white text-blue-600 px-2 py-1 rounded text-xs font-black">
                                Paguelo
                              </div>
                              <div className="bg-blue-800 text-white px-2 py-1 rounded text-xs font-black">
                                Fácil
                              </div>
                            </div>
                            <CreditCard className="h-5 w-5" />
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5" />
                        <span>{loading ? 'Procesando...' : 'Confirmar Orden por WhatsApp'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-sacred-white rounded-2xl shadow-sacred p-6 sticky top-24">
              <h3 className="font-playfair text-xl font-bold text-navy-devotion mb-6">
                Resumen de Orden
              </h3>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.id}-${item.options || ''}`} className="flex space-x-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg shadow-sacred"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-navy-devotion text-sm leading-tight">
                        {item.name}
                      </h4>
                      {item.options && (
                        <p className="text-xs text-stone-prayer">{item.options}</p>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-dove-gray">Qty: {item.quantity}</span>
                        <span className="font-semibold text-divine-gold text-sm">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-divine-gold border-opacity-20 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-stone-prayer">Subtotal:</span>
                  <span className="font-semibold text-navy-devotion">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-stone-prayer">Envío:</span>
                  <span className="font-semibold text-green-600">Gratis</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-navy-devotion">Total:</span>
                  <span className="text-divine-gold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;