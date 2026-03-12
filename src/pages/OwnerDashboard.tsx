import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { DollarSign, ShoppingBag, Clock, Users, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { MealManager } from '../components/MealManager';

export function OwnerDashboard() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on('refresh_orders', fetchOrders);
    }

    return () => {
      if (socket) {
        socket.off('refresh_orders');
      }
    };
  }, [socket]);

  const fetchOrders = () => {
    fetch('/api/orders').then(res => res.json()).then(setOrders);
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const today = new Date();
    
    switch (timeFilter) {
      case 'today': return isSameDay(orderDate, today);
      case 'yesterday': return isSameDay(orderDate, subDays(today, 1));
      case 'week': return orderDate >= subDays(today, 7);
      case 'month': return orderDate >= subDays(today, 30);
      case 'all': return true;
      default: return true;
    }
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_price, 0);
  const totalOrders = filteredOrders.length;
  
  // Calculate average delivery time (from created to delivered)
  const deliveredOrders = filteredOrders.filter(o => o.delivered_at);
  const avgDeliveryTimeMs = deliveredOrders.reduce((sum, order) => {
    return sum + (new Date(order.delivered_at!).getTime() - new Date(order.created_at).getTime());
  }, 0) / (deliveredOrders.length || 1);
  const avgDeliveryTimeMins = Math.round(avgDeliveryTimeMs / 60000);

  // Staff efficiency
  const staffStats = filteredOrders.reduce((acc, order) => {
    if (!acc[order.server_name]) {
      acc[order.server_name] = { name: order.server_name, orders: 0, sales: 0, deliveryTimes: [] };
    }
    acc[order.server_name].orders += 1;
    acc[order.server_name].sales += order.total_price;
    
    if (order.delivered_at) {
      const time = new Date(order.delivered_at).getTime() - new Date(order.created_at).getTime();
      acc[order.server_name].deliveryTimes.push(time);
    }
    return acc;
  }, {} as Record<string, any>);

  const staffArray = Object.values(staffStats).map((staff: any) => ({
    ...staff,
    avgTime: staff.deliveryTimes.length 
      ? Math.round((staff.deliveryTimes.reduce((a: number, b: number) => a + b, 0) / staff.deliveryTimes.length) / 60000)
      : 0
  })).sort((a, b) => b.sales - a.sales);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Intelligence Center</h2>
        
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 overflow-x-auto max-w-full">
          {(['today', 'yesterday', 'week', 'month', 'all'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize whitespace-nowrap transition-colors
                ${timeFilter === filter ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 text-zinc-400 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="font-medium uppercase tracking-wider text-xs">Total Revenue</span>
          </div>
          <div className="text-4xl font-light tracking-tight">${totalRevenue.toFixed(2)}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 text-zinc-400 mb-2">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <ShoppingBag size={20} />
            </div>
            <span className="font-medium uppercase tracking-wider text-xs">Total Orders</span>
          </div>
          <div className="text-4xl font-light tracking-tight">{totalOrders}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-4 text-zinc-400 mb-2">
            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
              <Clock size={20} />
            </div>
            <span className="font-medium uppercase tracking-wider text-xs">Avg Service Time</span>
          </div>
          <div className="text-4xl font-light tracking-tight">{avgDeliveryTimeMins} <span className="text-xl text-zinc-500">min</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {user?.role === 'owner' && <MealManager />}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-2">
            <Users size={18} className="text-zinc-400" />
            <h3 className="font-bold text-lg">Staff Efficiency</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/50 text-zinc-500 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Server</th>
                  <th className="px-6 py-4 font-medium text-right">Orders</th>
                  <th className="px-6 py-4 font-medium text-right">Sales</th>
                  <th className="px-6 py-4 font-medium text-right">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {staffArray.map(staff => (
                  <tr key={staff.name} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{staff.name}</td>
                    <td className="px-6 py-4 text-right font-mono">{staff.orders}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400">${staff.sales.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-mono">{staff.avgTime}m</td>
                  </tr>
                ))}
                {staffArray.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No data for selected period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-2">
            <CalendarIcon size={18} className="text-zinc-400" />
            <h3 className="font-bold text-lg">Master Log</h3>
          </div>
          <div className="overflow-y-auto max-h-[400px] p-4 space-y-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg">T{order.table_number}</span>
                    <span className="text-sm text-zinc-400">{order.server_name}</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-medium">${order.total_price.toFixed(2)}</span>
                </div>
                
                <div className="text-xs text-zinc-500 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{format(parseISO(order.created_at), 'HH:mm:ss')}</span>
                  </div>
                  {order.prep_end_at && (
                    <div className="flex justify-between">
                      <span>Prepared:</span>
                      <span>{format(parseISO(order.prep_end_at), 'HH:mm:ss')}</span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Delivered:</span>
                      <span>{format(parseISO(order.delivered_at), 'HH:mm:ss')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-zinc-500">No orders found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
