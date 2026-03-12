import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import path from 'path';

const PORT = 3000;

// Initialize Database
const db = new Database('comanda.db');

// Setup tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pin TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    table_number INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'in_progress', 'ready', 'delivered'
    total_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    prep_end_at DATETIME,
    delivered_at DATETIME,
    FOREIGN KEY (server_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    status TEXT NOT NULL, -- 'pending', 'ready'
    type TEXT NOT NULL, -- 'food', 'drink'
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );
`);

// Seed data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, role, pin) VALUES (?, ?, ?)');
  insertUser.run('Alice (Owner)', 'owner', '1111');
  insertUser.run('Bob (Server)', 'server', '2222');
  insertUser.run('Charlie (Server)', 'server', '3333');
  insertUser.run('Dave (Kitchen)', 'kitchen', '4444');
  insertUser.run('Eve (Bar)', 'bar', '5555');

  const insertMenu = db.prepare('INSERT INTO menu_items (name, category, price) VALUES (?, ?, ?)');
  insertMenu.run('Margherita Pizza', 'food', 12.50);
  insertMenu.run('Spaghetti Carbonara', 'food', 14.00);
  insertMenu.run('Caesar Salad', 'food', 9.00);
  insertMenu.run('Tiramisu', 'food', 7.00);
  insertMenu.run('Coca Cola', 'drink', 3.00);
  insertMenu.run('Mojito', 'drink', 8.50);
  insertMenu.run('Espresso', 'drink', 2.50);
  insertMenu.run('House Wine (Red)', 'drink', 6.00);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  app.use(express.json());

  // API Routes
  app.post('/api/login', (req, res) => {
    const { pin } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE pin = ?').get(pin);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid PIN' });
    }
  });

  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT id, name, role FROM users').all();
    res.json(users);
  });

  app.get('/api/menu', (req, res) => {
    const menu = db.prepare('SELECT * FROM menu_items').all();
    res.json(menu);
  });

  app.get('/api/orders', (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, u.name as server_name 
      FROM orders o 
      JOIN users u ON o.server_id = u.id 
      ORDER BY o.created_at DESC
    `).all();
    
    const items = db.prepare(`
      SELECT oi.*, m.name as item_name 
      FROM order_items oi 
      JOIN menu_items m ON oi.menu_item_id = m.id
    `).all();

    const ordersWithItems = orders.map((o: any) => ({
      ...o,
      items: items.filter((i: any) => i.order_id === o.id)
    }));

    res.json(ordersWithItems);
  });

  // Socket.io for real-time updates
  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('create_order', (data) => {
      const { server_id, table_number, items, total_price } = data;
      
      const insertOrder = db.prepare('INSERT INTO orders (server_id, table_number, status, total_price) VALUES (?, ?, ?, ?)');
      const result = insertOrder.run(server_id, table_number, 'pending', total_price);
      const orderId = result.lastInsertRowid;

      const insertItem = db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity, notes, status, type) VALUES (?, ?, ?, ?, ?, ?)');
      
      let hasFood = false;
      let hasDrink = false;

      items.forEach((item: any) => {
        if (item.category === 'food') hasFood = true;
        if (item.category === 'drink') hasDrink = true;
        insertItem.run(orderId, item.id, item.quantity, item.notes || '', 'pending', item.category);
      });

      // Broadcast new order to kitchen/bar
      io.emit('order_created', { orderId, hasFood, hasDrink });
      io.emit('refresh_orders');
    });

    socket.on('mark_item_ready', (data) => {
      const { itemId, orderId } = data;
      db.prepare('UPDATE order_items SET status = ? WHERE id = ?').run('ready', itemId);
      
      // Check if all items in order are ready
      const pendingItems = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE order_id = ? AND status = ?').get(orderId, 'pending') as { count: number };
      
      if (pendingItems.count === 0) {
        db.prepare('UPDATE orders SET status = ?, prep_end_at = CURRENT_TIMESTAMP WHERE id = ?').run('ready', orderId);
        io.emit('order_ready', { orderId });
      } else {
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('in_progress', orderId);
      }
      
      io.emit('refresh_orders');
    });

    socket.on('mark_order_delivered', (data) => {
      const { orderId } = data;
      db.prepare('UPDATE orders SET status = ?, delivered_at = CURRENT_TIMESTAMP WHERE id = ?').run('delivered', orderId);
      io.emit('refresh_orders');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
