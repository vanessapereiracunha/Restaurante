const express = require('express');
const queries = require('../db/queries');
const staffAuth = require('../middleware/staffAuth');

module.exports = function (io) {
  const router = express.Router();

  // RF1 + RF2: dados da mesa pelo codigo do QR
  router.get('/tables/:code', (req, res) => {
    const table = queries.getTableByCode(req.params.code.toUpperCase());
    if (!table) return res.status(404).json({ error: 'Mesa nao encontrada.' });
    res.json(table);
  });

  // RF3: status do pedido ativo da mesa
  router.get('/tables/:code/order', (req, res) => {
    const table = queries.getTableByCode(req.params.code.toUpperCase());
    if (!table) return res.status(404).json({ error: 'Mesa nao encontrada.' });
    const order = queries.getActiveOrderByTableId(table.id);
    if (!order) return res.json({ order: null });
    res.json({ order });
  });

  // Lista mesas (uso administrativo / seed / geracao de QR)
  router.get('/tables', staffAuth, (req, res) => {
    res.json(queries.listTables());
  });

  // RF9: criar pedido (uso interno do garcom/atendente)
  router.post('/orders', staffAuth, (req, res) => {
    const { table_code, description, items } = req.body;
    if (!table_code) return res.status(400).json({ error: 'table_code e obrigatorio.' });

    const table = queries.getTableByCode(table_code.toUpperCase());
    if (!table) return res.status(404).json({ error: 'Mesa nao encontrada.' });

    const order = queries.createOrder(table.id, description, items || []);

    io.to('staff').emit('staff:new_order', {
      order: { ...order, table_label: table.label, table_code: table.code },
    });

    res.status(201).json(order);
  });

  // RF3 + RF4 + RF5: atualizar status do pedido
  router.patch('/orders/:id/status', staffAuth, (req, res) => {
    const { status } = req.body;
    const allowed = ['aguardando', 'preparo', 'pronto'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status deve ser um de: ${allowed.join(', ')}` });
    }

    const order = queries.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido nao encontrado.' });

    const updated = queries.updateOrderStatus(order.id, status);
    const table = queries.listTables().find((t) => t.id === order.table_id);

    // RF4: notifica em tempo real o cliente daquela mesa
    io.to(`table-${table.code}`).emit('order:status_updated', {
      orderId: updated.id,
      status: updated.status,
    });

    // RF5: notifica o painel interno
    io.to('staff').emit('staff:status_changed', {
      orderId: updated.id,
      status: updated.status,
      tableLabel: table.label,
    });

    res.json(updated);
  });

  // RF5 + RF9: lista de pedidos ativos para o painel interno
  router.get('/staff/orders', staffAuth, (req, res) => {
    res.json(queries.listActiveOrders());
  });

  // RF9: historico simples
  router.get('/staff/orders/history', staffAuth, (req, res) => {
    res.json(queries.listAllOrders());
  });

  return router;
};
