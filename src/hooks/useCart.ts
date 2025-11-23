import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  image: string;
  options?: string;
  category?: string;
  weight?: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_pending' | 'payment_confirmed' | 'payment_failed';
  createdAt: string;
  shippingAddress?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod?: 'transfer' | 'paguelo_facil';
  paymentId?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery?: string;
}

// Global cart state that forces immediate updates
let globalCartItems: CartItem[] = [];
let cartUpdateCallbacks: (() => void)[] = [];

const notifyCartUpdate = () => {
  cartUpdateCallbacks.forEach(callback => callback());
};

const loadCartFromStorage = (storageKey: string): CartItem[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items: CartItem[], storageKey: string) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
    globalCartItems = items;
    notifyCartUpdate();
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const getStorageKey = useCallback(() => {
    return isAuthenticated && user ? `cart_user_${user.id}` : 'novedades-catolicas-cart';
  }, [isAuthenticated, user]);

  const getOrdersKey = useCallback(() => {
    return isAuthenticated && user ? `orders_user_${user.id}` : 'novedades-catolicas-orders';
  }, [isAuthenticated, user]);

  // Force immediate update function
  const forceUpdate = useCallback(() => {
    const storageKey = getStorageKey();
    const currentItems = loadCartFromStorage(storageKey);
    setItems([...currentItems]); // Force new array reference
  }, [getStorageKey]);

  // Initialize cart and register for updates
  useEffect(() => {
    const storageKey = getStorageKey();
    const initialItems = loadCartFromStorage(storageKey);
    globalCartItems = initialItems;
    setItems(initialItems);

    // Register this component for cart updates
    cartUpdateCallbacks.push(forceUpdate);

    // Load orders
    const ordersKey = getOrdersKey();
    try {
      const storedOrders = localStorage.getItem(ordersKey);
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }

    // Cleanup
    return () => {
      cartUpdateCallbacks = cartUpdateCallbacks.filter(cb => cb !== forceUpdate);
    };
  }, [getStorageKey, getOrdersKey, forceUpdate]);

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.innerHTML = message;
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  };

  const addToCart = useCallback((product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const storageKey = getStorageKey();
    const currentItems = loadCartFromStorage(storageKey);
    
    const existingItemIndex = currentItems.findIndex(item => 
      item.id === product.id && item.options === product.options
    );
    
    let newItems: CartItem[];
    
    if (existingItemIndex >= 0) {
      newItems = currentItems.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newItems = [...currentItems, { ...product, quantity }];
    }
    
    // Save and force immediate update
    saveCartToStorage(newItems, storageKey);
    setItems([...newItems]); // Force immediate local update
    
    showNotification(`✅ ${product.name} agregado al carrito`);
  }, [getStorageKey]);

  const removeFromCart = useCallback((productId: string, options?: string) => {
    const storageKey = getStorageKey();
    const currentItems = loadCartFromStorage(storageKey);
    const newItems = currentItems.filter(item => 
      !(item.id === productId && item.options === options)
    );
    
    saveCartToStorage(newItems, storageKey);
    setItems([...newItems]); // Force immediate local update
  }, [getStorageKey]);

  const updateQuantity = useCallback((productId: string, quantity: number, options?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, options);
      return;
    }

    const storageKey = getStorageKey();
    const currentItems = loadCartFromStorage(storageKey);
    const newItems = currentItems.map(item =>
      item.id === productId && item.options === options 
        ? { ...item, quantity } 
        : item
    );
    
    saveCartToStorage(newItems, storageKey);
    setItems([...newItems]); // Force immediate local update
  }, [getStorageKey, removeFromCart]);

  const clearCart = useCallback(() => {
    const storageKey = getStorageKey();
    saveCartToStorage([], storageKey);
    setItems([]); // Force immediate local update
  }, [getStorageKey]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [items]);

  const getItemQuantity = useCallback((productId: string, options?: string) => {
    const item = items.find(item => 
      item.id === productId && item.options === options
    );
    return item ? item.quantity : 0;
  }, [items]);

  const processOrder = async (
    customerInfo: Order['customerInfo'], 
    shippingAddress?: string,
    orderOptions?: {
      paymentMethod?: 'transfer' | 'paguelo_facil';
      paymentId?: string;
      status?: Order['status'];
    }
  ) => {
    if (!isAuthenticated || !user) {
      throw new Error('Debe iniciar sesión para realizar una compra');
    }

    if (items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    setLoading(true);

    try {
      const order: Order = {
        id: `ORD-${Date.now()}`,
        userId: user.id,
        items: [...items],
        total: getTotalPrice(),
        status: orderOptions?.status || 'pending',
        createdAt: new Date().toISOString(),
        customerInfo,
        shippingAddress,
        paymentMethod: orderOptions?.paymentMethod,
        paymentId: orderOptions?.paymentId,
        paymentStatus: orderOptions?.status === 'payment_pending' ? 'pending' : undefined
      };

      const updatedOrders = [order, ...orders];
      setOrders(updatedOrders);
      
      const ordersKey = getOrdersKey();
      localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));

      // Solo limpiar carrito si no es pago con Paguelo Fácil (se limpia después del pago exitoso)
      if (orderOptions?.paymentMethod !== 'paguelo_facil') {
        clearCart();
      }

      return order;
    } catch (error) {
      console.error('Error processing order:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reorderItems = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.items.forEach(item => {
        addToCart(item, item.quantity);
      });
    }
  };

  const getUserOrders = () => {
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  return {
    items,
    orders: getUserOrders(),
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getItemQuantity,
    processOrder,
    reorderItems,
    isAuthenticated
  };
};