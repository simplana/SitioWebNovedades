import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  image: string;
  options?: string;
  category?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
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
  const { user, isAuthenticated, isVerified } = useAuth();

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

  useEffect(() => {
    const storageKey = getStorageKey();
    const initialItems = loadCartFromStorage(storageKey);
    globalCartItems = initialItems;
    setItems(initialItems);

    cartUpdateCallbacks.push(forceUpdate);

    // Listen for cart-cleared events
    const handleCartCleared = () => {
      console.log('🔄 Cart cleared event detected, reloading...');
      forceUpdate();
    };

    window.addEventListener('cart-cleared', handleCartCleared);

    const loadOrdersFromSupabase = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedOrders: Order[] = ordersData.map((orderData: any) => ({
          id: orderData.id,
          orderNumber: orderData.order_number,
          userId: orderData.user_id,
          items: orderData.order_items.map((item: any) => ({
            id: item.product_id,
            name: item.product_name,
            sku: item.product_sku,
            image: item.product_image,
            price: parseFloat(item.price),
            quantity: item.quantity,
            options: item.options
          })),
          total: parseFloat(orderData.total),
          status: orderData.status,
          createdAt: orderData.created_at,
          shippingAddress: orderData.shipping_address,
          customerInfo: {
            name: orderData.customer_name,
            email: orderData.customer_email,
            phone: orderData.customer_phone
          },
          paymentMethod: orderData.payment_method,
          paymentId: orderData.payment_id,
          paymentStatus: orderData.payment_status
        }));

        setOrders(formattedOrders);
      } catch (error) {
        console.error('Error loading orders from Supabase:', error);
      }
    };

    loadOrdersFromSupabase();

    return () => {
      cartUpdateCallbacks = cartUpdateCallbacks.filter(cb => cb !== forceUpdate);
      window.removeEventListener('cart-cleared', handleCartCleared);
    };
  }, [getStorageKey, forceUpdate, isAuthenticated, user]);

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

    // Clear localStorage
    localStorage.removeItem(storageKey);

    // Update global state
    globalCartItems = [];

    // Force immediate local update
    setItems([]);

    // Notify all components using the cart
    notifyCartUpdate();

    // Dispatch custom event to notify across tabs/components
    window.dispatchEvent(new CustomEvent('cart-cleared', { detail: { storageKey } }));

    console.log('🧹 Cart cleared successfully from:', storageKey);
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
      paymentCode?: string;
      paymentUrl?: string;
      status?: Order['status'];
      orderNumber?: string;
      shippingCost?: number;
      shippingDetails?: any;
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
      const orderNumber = orderOptions?.orderNumber || `NC-${Date.now()}`;
      const orderTotal = getTotalPrice();

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          shipping_address: shippingAddress,
          total: orderTotal,
          status: orderOptions?.status || 'pending',
          payment_method: orderOptions?.paymentMethod,
          payment_code: orderOptions?.paymentCode,
          payment_id: orderOptions?.paymentId,
          payment_url: orderOptions?.paymentUrl,
          payment_status: orderOptions?.status === 'payment_pending' ? 'pending' : null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsData = items.map(item => ({
        order_id: createdOrder.id,
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku,
        product_image: item.image,
        price: item.price,
        quantity: item.quantity,
        options: item.options || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      const order: Order = {
        id: createdOrder.id,
        orderNumber: orderNumber,
        userId: user.id,
        items: [...items],
        total: orderTotal,
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
    isAuthenticated,
    isVerified
  };
};