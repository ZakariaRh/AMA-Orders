export type Role = 'owner' | 'server' | 'kitchen' | 'bar';

export interface User {
  id: number;
  name: string;
  role: Role;
}

export interface MenuItem {
  id: number;
  name: string;
  category: 'food' | 'drink';
  price: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  notes: string;
  status: 'pending' | 'ready';
  type: 'food' | 'drink';
  item_name: string;
}

export interface Order {
  id: number;
  server_id: number;
  server_name: string;
  table_number: number;
  status: 'pending' | 'in_progress' | 'ready' | 'delivered';
  total_price: number;
  created_at: string;
  prep_end_at: string | null;
  delivered_at: string | null;
  items: OrderItem[];
}
