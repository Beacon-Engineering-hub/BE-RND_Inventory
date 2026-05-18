import { Router } from 'express';
import db from '../database.js';

const router = Router();

// ─── GET /api/items ────────────────────────────────────
router.get('/', (req, res) => {
  const { search, category, status, type } = req.query;
  let query = 'SELECT * FROM items WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (item_name LIKE ? OR item_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND item_type = ?';
    params.push(type);
  }

  query += ' ORDER BY id DESC';
  const items = db.prepare(query).all(...params);
  res.json({ success: true, data: items });
});

// ─── GET /api/items/categories ─────────────────────────
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM items ORDER BY category').all();
  res.json({ success: true, data: categories.map(c => c.category) });
});

// ─── GET /api/items/next-code ──────────────────────────
router.get('/next-code', (req, res) => {
  const last = db.prepare("SELECT item_code FROM items ORDER BY id DESC LIMIT 1").get();
  let nextNum = 1;
  if (last) {
    const num = parseInt(last.item_code.replace('RND-', ''), 10);
    nextNum = num + 1;
  }
  const nextCode = `RND-${String(nextNum).padStart(4, '0')}`;
  res.json({ success: true, data: nextCode });
});

// ─── GET /api/items/:id ────────────────────────────────
router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Barang tidak ditemukan' });

  if (item.item_type === 'box') {
    item.contents = db.prepare('SELECT * FROM item_contents WHERE item_id = ? ORDER BY id').all(item.id);
  }

  res.json({ success: true, data: item });
});

// ─── POST /api/items ───────────────────────────────────
router.post('/', (req, res) => {
  const { item_name, category, item_type, quantity, notes, contents, image_url } = req.body;

  if (!item_name || !category) {
    return res.status(400).json({ success: false, error: 'Nama barang dan kategori wajib diisi' });
  }

  // Auto generate code
  const last = db.prepare("SELECT item_code FROM items ORDER BY id DESC LIMIT 1").get();
  let nextNum = 1;
  if (last) {
    nextNum = parseInt(last.item_code.replace('RND-', ''), 10) + 1;
  }
  const item_code = `RND-${String(nextNum).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO items (item_code, item_name, category, item_type, quantity, notes, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(item_code, item_name, category, item_type || 'single', quantity || 1, notes || null, image_url || null);

  // Insert box contents if applicable
  if (item_type === 'box' && contents && contents.length > 0) {
    const insertContent = db.prepare(`INSERT INTO item_contents (item_id, content_name, quantity, content_note) VALUES (?, ?, ?, ?)`);
    for (const c of contents) {
      insertContent.run(result.lastInsertRowid, c.content_name, c.quantity || 1, c.content_note || null);
    }
  }

  // Audit log
  db.prepare(`INSERT INTO audit_log (action, target_type, target_id, description) VALUES (?, ?, ?, ?)`)
    .run('ADD_ITEM', 'item', result.lastInsertRowid, `Tambah barang: ${item_code} - ${item_name}`);

  const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: newItem });
});

// ─── PUT /api/items/:id ────────────────────────────────
router.put('/:id', (req, res) => {
  const { item_name, category, item_type, quantity, notes, status, contents, image_url } = req.body;
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Barang tidak ditemukan' });

  db.prepare(`
    UPDATE items SET item_name = ?, category = ?, item_type = ?, quantity = ?, notes = ?, status = ?, image_url = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    item_name || item.item_name,
    category || item.category,
    item_type || item.item_type,
    quantity || item.quantity,
    notes !== undefined ? notes : item.notes,
    status || item.status,
    image_url !== undefined ? image_url : item.image_url,
    item.id
  );

  // Update box contents
  if (item_type === 'box' && contents) {
    db.prepare('DELETE FROM item_contents WHERE item_id = ?').run(item.id);
    const insertContent = db.prepare(`INSERT INTO item_contents (item_id, content_name, quantity, content_note) VALUES (?, ?, ?, ?)`);
    for (const c of contents) {
      insertContent.run(item.id, c.content_name, c.quantity || 1, c.content_note || null);
    }
  }

  db.prepare(`INSERT INTO audit_log (action, target_type, target_id, description) VALUES (?, ?, ?, ?)`)
    .run('EDIT_ITEM', 'item', item.id, `Edit barang: ${item.item_code}`);

  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(item.id);
  res.json({ success: true, data: updated });
});

// ─── DELETE /api/items/:id ─────────────────────────────
router.delete('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Barang tidak ditemukan' });

  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);

  db.prepare(`INSERT INTO audit_log (action, target_type, target_id, description) VALUES (?, ?, ?, ?)`)
    .run('DELETE_ITEM', 'item', item.id, `Hapus barang: ${item.item_code} - ${item.item_name}`);

  res.json({ success: true, message: 'Barang berhasil dihapus' });
});

export default router;
