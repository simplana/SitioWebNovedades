import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  FileText,
  TrendingUp,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  TestTube,
  AlertCircle,
  Lock,
  LogIn,
  User
} from 'lucide-react';
import PagueloFacilTestButton from '../components/PagueloFacilTestButton';
import DevTools from './Admin/DevTools';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import { supabase } from '../lib/supabase';

interface QuoteRequest {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  description: string;
  photos: string[];
  status: 'pending' | 'quoted' | 'approved' | 'completed';
  createdAt: string;
  estimatedPrice?: number;
  estimatedDays?: number;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image: string;
  price: number;
  quantity: number;
  options?: string;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_pending' | 'payment_confirmed' | 'payment_failed';
  payment_method?: string;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const Admin = () => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'orders' | 'dev'>('overview');
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
      setCheckingAdmin(false);
    }
  }, [user, loading]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.email) {
        const { data, error } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', user.email)
          .maybeSingle();

        setIsAdmin(!!data && !error);
        setCheckingAdmin(false);
      } else {
        setCheckingAdmin(false);
      }
    };

    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!isAdmin) return;

      try {
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (ordersData) {
          setOrders(ordersData as Order[]);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_pending': return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300';
      case 'payment_confirmed': return 'bg-green-100 text-green-800 border-2 border-green-300';
      case 'payment_failed': return 'bg-red-100 text-red-800 border-2 border-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'payment_pending': return 'Pago Pendiente';
      case 'payment_confirmed': return 'Pago Confirmado';
      case 'payment_failed': return 'Pago Fallido';
      case 'quoted': return 'Cotizado';
      case 'approved': return 'Aprobado';
      case 'completed': return 'Completado';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

      alert(`Estado actualizado a: ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado de la orden');
    }
  };

  const filteredQuotes = quoteRequests.filter(quote => {
    const matchesSearch = quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
  const pendingQuotes = quoteRequests.filter(q => q.status === 'pending').length;
  const activeOrders = orders.filter(o =>
    o.status === 'payment_pending' ||
    o.status === 'payment_confirmed' ||
    o.status === 'processing' ||
    o.status === 'shipped'
  ).length;

  if (loading || checkingAdmin) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <Lock className="h-16 w-16 text-gold mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-navy mb-2">Panel de Administración</h1>
              <p className="text-gray-600">Inicia sesión para acceder</p>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center space-x-2 bg-gold hover:bg-yellow-500 text-navy font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <LogIn className="h-5 w-5" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permiso para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-playfair text-3xl font-bold text-navy">
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona cotizaciones, pedidos y información general del negocio
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resumen General
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'quotes'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cotizaciones ({pendingQuotes})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pedidos ({activeOrders})
            </button>
            <button
              onClick={() => setActiveTab('dev')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dev'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Herramientas Dev
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Prueba de Paguelo Fácil */}
            <div>
              <h2 className="font-playfair text-2xl font-bold text-navy mb-6">
                Configuración de APIs
              </h2>
              
              <div className="space-y-6">
                {/* Estado de Paguelo Fácil */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-blue-600 text-white p-2 rounded-lg text-sm font-bold">
                      Paguelo Fácil
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Sistema de Pagos
                    </h3>
                  </div>
                  
                  <div className="mb-4">
                    <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <strong>Modo Demostración Activo</strong>
                          <p className="mt-1">
                            El sistema está funcionando en modo demo. Para usar pagos reales, 
                            necesitas configurar tu ACCESS TOKEN de Paguelo Fácil.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-4 text-sm">
                      <h4 className="font-semibold mb-2">📋 Cómo configurar tu ACCESS TOKEN:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li>Ve a tu panel de <strong>Paguelo Fácil</strong></li>
                        <li>Busca la sección <strong>"API"</strong> o <strong>"Integraciones"</strong></li>
                        <li>Genera un nuevo <strong>ACCESS TOKEN</strong></li>
                        <li>Ve a tu <strong>Supabase Dashboard</strong> → <strong>Edge Functions</strong> → <strong>Settings</strong></li>
                        <li>Configura las siguientes variables de entorno:</li>
                      </ol>
                      <div className="mt-2 p-3 bg-gray-800 rounded font-mono text-xs text-green-400">
                        PAGUELO_FACIL_ACCESS_TOKEN=your-secret-token-here<br/>
                        PAGUELO_FACIL_API_URL=https://api.paguelofacil.com
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        <strong>⚠️ Importante:</strong> Estas variables deben configurarse <strong>exclusivamente como Environment Variables de Supabase Edge Functions</strong>.
                        <strong className="text-red-600"> NO deben colocarse en el .env del frontend</strong> ni usar el prefijo <code>VITE_</code>.
                      </div>
                    </div>
                  </div>
                  
                  <PagueloFacilTestButton />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cotizaciones Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingQuotes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Package className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pedidos Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Clientes Totales</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar cotizaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="quoted">Cotizados</option>
                  <option value="approved">Aprobados</option>
                  <option value="completed">Completados</option>
                </select>
              </div>
            </div>

            {/* Quotes List */}
            <div className="space-y-4">
              {filteredQuotes.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay cotizaciones</h3>
                  <p className="text-gray-500">Las solicitudes de cotización aparecerán aquí</p>
                </div>
              ) : filteredQuotes.map((quote) => (
                <div key={quote.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-navy">{quote.id}</h3>
                      <p className="text-gray-600">{quote.customerName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
                      {getStatusText(quote.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-navy mb-2">Información del Cliente</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{quote.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{quote.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{quote.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-navy mb-2">Detalles del Trabajo</h4>
                      <p className="text-sm text-gray-700 mb-2">{quote.description}</p>
                      {quote.photos.length > 0 && (
                        <p className="text-sm text-blue-600">📸 {quote.photos.length} foto(s) adjunta(s)</p>
                      )}
                      {quote.estimatedPrice && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Precio estimado: </span>
                          <span className="text-gold font-bold">${quote.estimatedPrice}</span>
                        </div>
                      )}
                      {quote.estimatedDays && (
                        <div className="text-sm">
                          <span className="font-medium">Tiempo estimado: </span>
                          <span>{quote.estimatedDays} días</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                    <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                      <Eye className="h-4 w-4" />
                      <span>Ver Detalles</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gold hover:bg-yellow-500 text-navy rounded-lg transition-colors duration-200">
                      <CheckCircle className="h-4 w-4" />
                      <span>Actualizar Estado</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Buscar pedidos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="payment_pending">Pago Pendiente</option>
                  <option value="payment_confirmed">Pago Confirmado</option>
                  <option value="pending">Pendiente</option>
                  <option value="processing">Procesando</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay pedidos</h3>
                  <p className="text-gray-500">Los pedidos de clientes aparecerán aquí</p>
                </div>
              ) : filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div>
                      <h3 className="font-semibold text-lg text-navy">{order.order_number}</h3>
                      <p className="text-gray-600">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('es-PA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>

                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className="border-2 border-gold rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
                      >
                        <option value="payment_pending">Pago Pendiente</option>
                        <option value="payment_confirmed">Pago Confirmado</option>
                        <option value="pending">Pendiente</option>
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-navy mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Información del Cliente
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{order.customer_phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="break-all">{order.customer_email}</span>
                        </div>
                        {order.payment_method && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="capitalize">{order.payment_method === 'transfer' ? 'Transferencia' : 'Paguelo Fácil'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-navy mb-2 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Productos ({order.order_items.length})
                      </h4>
                      <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                            <span className="flex-1 mr-2">{item.product_name} x{item.quantity}</span>
                            <span className="font-medium whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t-2 border-gold pt-2 mt-2 flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-gold">${parseFloat(order.total.toString()).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-navy mb-2 flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        Envío
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">{order.shipping_address || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dev Tools Tab */}
        {activeTab === 'dev' && (
          <DevTools />
        )}
      </div>
    </div>
  );
};

export default Admin;