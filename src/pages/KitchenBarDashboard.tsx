import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Order, OrderItem } from '../types';
import { Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function KitchenBarDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [now, setNow] = useState(new Date());

  const stationType = user?.role === 'kitchen' ? 'food' : 'drink';

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => setNow(new Date()), 60000);

    if (socket) {
      socket.on('refresh_orders', fetchOrders);
      socket.on('order_created', (data) => {
        if ((stationType === 'food' && data.hasFood) || (stationType === 'drink' && data.hasDrink)) {
          // Play sound or vibrate
          if (navigator.vibrate) navigator.vibrate(200);
        }
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('refresh_orders');
        socket.off('order_created');
      }
    };
  }, [socket, stationType]);

  const fetchOrders = () => {
    fetch('/api/orders').then(res => res.json()).then(setOrders);
  };

  const markItemReady = (itemId: number, orderId: number) => {
    socket?.emit('mark_item_ready', { itemId, orderId });
  };

  // Filter orders that have pending items for this station
  const activeTickets = orders.filter(order => 
    order.status !== 'delivered' && 
    order.items.some(item => item.type === stationType && item.status === 'pending')
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {stationType === 'food' ? 'Kitchen Queue' : 'Bar Queue'}
        </h2>
        <div className="text-zinc-500 text-sm font-mono">
          {activeTickets.length} Active Tickets
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
        {activeTickets.map(order => {
          const orderTime = new Date(order.created_at);
          const minutesWaiting = Math.floor((now.getTime() - orderTime.getTime()) / 60000);
          const isDelayed = minutesWaiting > 20;

          return (
            <div 
              key={order.id} 
              className={`bg-zinc-900 border-t-4 rounded-b-xl shadow-lg flex flex-col
                ${isDelayed ? 'border-red-500' : minutesWaiting > 10 ? 'border-yellow-500' : 'border-emerald-500'}`}
            >
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-start">
                <div>
                  <div className="text-2xl font-bold font-mono">T{order.table_number}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{order.server_name}</div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-mono font-bold ${isDelayed ? 'text-red-400' : 'text-zinc-400'}`}>
                  <Clock size={14} />
                  {minutesWaiting}m
                </div>
              </div>

              <div className="p-4 flex-1 space-y-4">
                {order.items.filter(i => i.type === stationType).map(item => (
                  <div 
                    key={item.id} 
                    className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors
                      ${item.status === 'ready' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 opacity-50' 
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <span className="font-mono font-bold text-lg">{item.quantity}</span>
                        <div>
                          <span className={`text-lg font-medium ${item.status === 'ready' ? 'line-through' : ''}`}>
                            {item.item_name}
                          </span>
                          {item.notes && (
                            <div className="text-red-400 font-bold text-sm mt-1 uppercase tracking-wide">
                              *** {item.notes} ***
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {item.status === 'pending' && (
                      <button 
                        onClick={() => markItemReady(item.id, order.id)}
                        className="mt-2 w-full py-2 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-zinc-300 rounded-md font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Mark Ready
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {activeTickets.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
            <CheckCircle size={48} className="mb-4 opacity-50" />
            <p className="text-xl font-medium">Queue is clear</p>
            <p className="text-sm mt-2">Great job team!</p>
          </div>
        )}
      </div>
    </div>
  );
}
