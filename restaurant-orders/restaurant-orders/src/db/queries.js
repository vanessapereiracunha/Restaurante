const db = require('./init');

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const queries = {
  // ---- TABLES ----
  createTable(label) {
    const code = generateCode();
    const stmt = db.prepare('INSERT INTO tables (code, label) VALUES (?, ?)');
    const info = stmt.run(code, label);
    return { id: info.lastInsertRowid, code, label };
  },

  getTableByCode(code) {
    return db.prepare('SELECT * FROM tables WHERE code = ?').get(code);
  },

  listTables() {
    return db.prepare('SELECT * FROM tables ORDER BY id').all();
  },

  // ---- ORDERS ----
  createOrder(tableId, description, items = []) {
    const insertOrder = db.prepare(
      'INSERT INTO orders (table_id, description) VALUES (?, ?)'
    );
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, item_name, quantity) VALUES (?, ?, ?)'
    );

    db.exec('BEGIN');
    let orderId;
    try {
      const info = insertOrder.run(tableId, description || null);
      orderId = info.lastInsertRowid;
      for (const item of items) {
        insertItem.run(orderId, item.item_name, item.quantity || 1);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    return this.getOrderById(orderId);
  },

  getOrderById(id) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return null;
    order.items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(id);
    return order;
  },

  getActiveOrderByTableId(tableId) {
    const order = db
      .prepare(
        `SELECT * FROM orders WHERE table_id = ? AND status != 'pronto'
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(tableId);
    if (!order) {
      // fallback: retorna o último pedido (mesmo já pronto) para exibir histórico recente
      return db
        .prepare(
          'SELECT * FROM orders WHERE table_id = ? ORDER BY created_at DESC LIMIT 1'
        )
        .get(tableId);
    }
    order.items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(order.id);
    return order;
  },

  updateOrderStatus(orderId, status) {
    db.prepare(
      `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(status, orderId);
    return this.getOrderById(orderId);
  },

  listActiveOrders() {
    return db
      .prepare(
        `SELECT orders.*, tables.label as table_label, tables.code as table_code
         FROM orders
         JOIN tables ON tables.id = orders.table_id
         WHERE orders.status != 'pronto'
         ORDER BY orders.created_at ASC`
      )
      .all();
  },

  listAllOrders(limit = 50) {
    return db
      .prepare(
        `SELECT orders.*, tables.label as table_label, tables.code as table_code
         FROM orders
         JOIN tables ON tables.id = orders.table_id
         ORDER BY orders.created_at DESC
         LIMIT ?`
      )
      .all(limit);
  },
};

module.exports = queries;
