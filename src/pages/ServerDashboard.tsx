import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { MenuItem, Order, OrderItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Send, Clock, CheckCircle, AlertCircle, Utensils, Coffee } from 'lucide-react';

export function ServerDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'menu' | 'tables'>('menu');
  const [tableNumber, setTableNumber] = useState(1);
  const [cart, setCart] = useState<(MenuItem & { quantity: number; notes: string })[]>([]);

  useEffect(() => {
    fetch('/api/menu').then(res => res.json()).then(setMenu);
    fetchOrders();

    if (socket) {
      socket.on('refresh_orders', fetchOrders);
      socket.on('order_ready', (data) => {
        // In a real app, use the Web Notification API or a toast
        alert(`Order ${data.orderId} is Ready!`);
      });
    }

    return () => {
      if (socket) {
        socket.off('refresh_orders');
        socket.off('order_ready');
      }
    };
  }, [socket]);

  const fetchOrders = () => {
    fetch('/api/orders').then(res => res.json()).then(data => {
      // Filter orders for this server
      setOrders(data.filter((o: Order) => o.server_id === user?.id));
    });
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const updateNotes = (id: number, notes: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, notes } : i));
  };

  const submitOrder = () => {
    if (cart.length === 0) return;
    
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    socket?.emit('create_order', {
      server_id: user?.id,
      table_number: tableNumber,
      items: cart,
      total_price: totalPrice
    });
    
    setCart([]);
    setActiveTab('tables');
  };

  const markDelivered = (orderId: number) => {
    socket?.emit('mark_order_delivered', { orderId });
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered');

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex gap-4 border-b border-zinc-800 pb-4">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${activeTab === 'menu' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
        >
          New Order
        </button>
        <button 
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${activeTab === 'tables' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
        >
          Active Tables
          {activeOrders.length > 0 && (
            <span className="bg-zinc-950 text-emerald-500 text-xs px-2 py-0.5 rounded-full">
              {activeOrders.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
              <span className="text-zinc-400 font-medium">Table Number:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setTableNumber(Math.max(1, tableNumber - 1))} className="p-2 bg-zinc-800 rounded-lg"><Minus size={16} /></button>
                <span className="text-xl font-bold w-12 text-center">{tableNumber}</span>
                <button onClick={() => setTableNumber(tableNumber + 1)} className="p-2 bg-zinc-800 rounded-lg"><Plus size={16} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menu.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center hover:border-emerald-500/50 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.category === 'food' ? <Utensils size={14} className="text-orange-400" /> : <Coffee size={14} className="text-blue-400" />}
                      {item.name}
                    </div>
                    <div className="text-zinc-500 text-sm mt-1">${item.price.toFixed(2)}</div>
                  </div>
                  <Plus className="text-zinc-600" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-[calc(100vh-200px)] sticky top-24">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              Current Order
              <span className="text-sm font-normal text-zinc-500">Table {tableNumber}</span>
            </h2>
            
            <div className="flex-1 overflow-auto space-y-4">
              <AnimatePresence>
                {cart.map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-zinc-950 p-3 rounded-lg border border-zinc-800"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-emerald-400 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-zinc-800 rounded"><Minus size={14} /></button>
                      <span className="w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-zinc-800 rounded"><Plus size={14} /></button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Add note (e.g. No salt)" 
                      value={item.notes}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {cart.length === 0 && (
                <div className="text-zinc-500 text-center py-8">Cart is empty</div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800 mt-4">
              <div className="flex justify-between items-center mb-4 text-lg font-bold">
                <span>Total</span>
                <span>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
              <button 
                onClick={submitOrder}
                disabled={cart.length === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Send Order
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Table {order.table_number}</h3>
                  <div className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                  ${order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                    order.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                    'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
                >
                  {order.status.replace('_', ' ')}
                </div>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex gap-2">
                      <span className="text-zinc-500">{item.quantity}x</span>
                      <div>
                        <span className={item.status === 'ready' ? 'text-emerald-400 line-through opacity-70' : 'text-zinc-200'}>
                          {item.item_name}
                        </span>
                        {item.notes && <div className="text-xs text-red-400 font-medium">Note: {item.notes}</div>}
                      </div>
                    </div>
                    {item.status === 'ready' && <CheckCircle size={14} className="text-emerald-500 mt-0.5" />}
                  </div>
                ))}
              </div>

              {order.status === 'ready' && (
                <button 
                  onClick={() => markDelivered(order.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-3 rounded-xl transition-colors"
                >
                  Delivered to Table
                </button>
              )}
            </div>
          ))}
          {activeOrders.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
              No active tables. Time to take some orders!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
