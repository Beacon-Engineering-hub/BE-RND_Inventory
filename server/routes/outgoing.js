import { Router } from 'express';
import db from '../database.js';

const router = Router();

// ─── GET /api/outgoing ─────────────────────────────────
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, i.item_code, i.item_name, i.category
    FROM outgoing_items o
    JOIN items i ON o.item_id = i.id
    ORDER BY o.id DESC
  `).all();
  res.json({ success: true, data: rows });
});

// ─── POST /api/outgoing ────────────────────────────────
router.post('/', (req, res) => {
  const { item_id, person_in_charge, reason, description } = req.body;

  if (!item_id || !person_in_charge) {
    return res.status(400).json({ success: false, error: 'Item dan penanggung jawab wajib diisi' });
  }

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(item_id);
  if (!item) return res.status(404).json({ success: false, error: 'Barang tidak ditemukan' });
  if (item.status !== 'available') {
    return res.status(400).json({ success: false, error: `Barang tidak tersedia (status: ${item.status})` });
  }

  // Record outgoing
  const result = db.prepare(`
    INSERT INTO outgoing_items (item_id, person_in_charge, reason, description)
    VALUES (?, ?, ?, ?)
  `).run(item_id, person_in_charge, reason || null, description || null);

  // Update item status
  db.prepare(`UPDATE items SET status = 'out', updated_at = datetime('now','localtime') WHERE id = ?`).run(item_id);

  db.prepare(`INSERT INTO audit_log (action, target_type, target_id, description) VALUES (?, ?, ?, ?)`)
    .run('ITEM_OUT', 'outgoing', result.lastInsertRowid, `Barang keluar: ${item.item_code} - PIC: ${person_in_charge}`);

  res.status(201).json({ success: true, message: 'Barang keluar berhasil dicatat' });
});

export default router;
