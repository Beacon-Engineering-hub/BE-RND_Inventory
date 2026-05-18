import { Router } from 'express';
import db from '../database.js';
import { printDocxTemplate } from '../utils/printer.js';
import path from 'path';

const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM borrow_requests';
  const params = [];
  if (status) { query += ' WHERE status = ?'; params.push(status); }
  query += ' ORDER BY id DESC';
  const requests = db.prepare(query).all(...params);
  const getItems = db.prepare(`SELECT bri.*, i.item_code, i.item_name, i.category FROM borrow_request_items bri JOIN items i ON bri.item_id = i.id WHERE bri.borrow_request_id = ?`);
  for (const r of requests) { r.items = getItems.all(r.id); }
  res.json({ success: true, data: requests });
});

router.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ success: false, error: 'Tidak ditemukan' });
  r.items = db.prepare(`SELECT bri.*, i.item_code, i.item_name, i.category, i.item_type FROM borrow_request_items bri JOIN items i ON bri.item_id = i.id WHERE bri.borrow_request_id = ?`).all(r.id);
  res.json({ success: true, data: r });
});

router.post('/', (req, res) => {
  const { borrower_name, division, purpose, borrow_date, return_plan_date, items } = req.body;
  if (!borrower_name || !division || !purpose || !borrow_date || !return_plan_date) return res.status(400).json({ success: false, error: 'Semua field wajib diisi' });
  if (!items || !items.length) return res.status(400).json({ success: false, error: 'Pilih minimal satu barang' });
  for (const item of items) {
    const it = db.prepare('SELECT * FROM items WHERE id = ? AND status = ?').get(item.id, 'available');
    if (!it) return res.status(400).json({ success: false, error: `Barang ID ${item.id} tidak tersedia` });
    if (it.quantity < item.quantity) return res.status(400).json({ success: false, error: `Stok ${it.item_name} tidak cukup` });
  }
  const result = db.prepare(`INSERT INTO borrow_requests (borrower_name, division, purpose, borrow_date, return_plan_date) VALUES (?, ?, ?, ?, ?)`).run(borrower_name, division, purpose, borrow_date, return_plan_date);
  const ins = db.prepare(`INSERT INTO borrow_request_items (borrow_request_id, item_id, quantity) VALUES (?, ?, ?)`);
  for (const item of items) { ins.run(result.lastInsertRowid, item.id, item.quantity); }
  db.prepare(`INSERT INTO audit_log (action, target_type, target_id, description) VALUES (?, ?, ?, ?)`).run('BORROW_REQUEST', 'borrow_request', result.lastInsertRowid, `Pengajuan oleh ${borrower_name} (${division})`);
  res.status(201).json({ success: true, message: 'Pengajuan berhasil', data: { id: result.lastInsertRowid } });
});

router.post('/:id/approve', (req, res) => {
  const r = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ success: false, error: 'Tidak ditemukan' });
  if (r.status !== 'pending') return res.status(400).json({ success: false, error: 'Sudah diproses' });
  const year = new Date().getFullYear();
  const prefix = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'letter_number_prefix'").get();
  const pfx = prefix ? prefix.setting_value : 'RND/PINJAM';
  const count = db.prepare("SELECT COUNT(*) as cnt FROM borrow_requests WHERE borrow_number IS NOT NULL AND borrow_number LIKE ?").get(`%/${year}/%`);
  const num = (count.cnt || 0) + 1;
  const bn = `${pfx}/${year}/${String(num).padStart(4, '0')}`;
  db.prepare(`UPDATE borrow_requests SET status = 'approved', borrow_number = ?, approved_at = datetime('now','localtime'), updated_at = datetime('now','localtime') WHERE id = ?`).run(bn, r.id);
  const items = db.prepare('SELECT bri.*, i.item_code, i.item_name, i.quantity as stock FROM borrow_request_items bri JOIN items i ON bri.item_id = i.id WHERE bri.borrow_request_id = ?').all(r.id);
  
  for (const i of items) { 
    const newStock = Math.max(0, i.stock - i.quantity);
    const newStatus = newStock <= 0 ? 'borrowed' : 'available';
    db.prepare(`UPDATE items SET quantity = ?, status = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(newStock, newStatus, i.item_id); 
  }
  db.prepare(`INSERT INTO audit_log (action, target_type, target_id, description) VALUES (?, ?, ?, ?)`).run('APPROVE_BORROW', 'borrow_request', r.id, `Disetujui: ${bn}`);

  // Auto-print surat peminjaman jika mode print = auto
  const printMode = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'print_mode'").get()?.setting_value;
  if (printMode === 'auto') {
    const printerName = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'printer_name'").get()?.setting_value;
    
    const requestData = {
      borrow_number: bn,
      borrower_name: r.borrower_name,
      division: r.division,
      purpose: r.purpose,
      borrow_date: r.borrow_date,
      return_plan_date: r.return_plan_date,
      items,
    };
    
    // Asumsi file ditaruh di folder utama proyek
    const templatePath = path.resolve(process.cwd(), 'SURAT PEMINJAMAN BARANG.docx');
    
    printDocxTemplate(requestData, templatePath, printerName)
      .then(() => console.log(`[Print] Surat ${bn} tercetak di Word.`))
      .catch(e => console.error(`[Print] Gagal cetak via Word: ${e.message}`));
  }

  res.json({ success: true, message: 'Disetujui', data: { borrow_number: bn } });
});

router.post('/:id/reject', (req, res) => {
  const { reason } = req.body;
  const r = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ success: false, error: 'Tidak ditemukan' });
  if (r.status !== 'pending') return res.status(400).json({ success: false, error: 'Sudah diproses' });
  db.prepare(`UPDATE borrow_requests SET status = 'rejected', reject_reason = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(reason || null, r.id);
  db.prepare(`INSERT INTO audit_log (action, target_type, target_id, description) VALUES (?, ?, ?, ?)`).run('REJECT_BORROW', 'borrow_request', r.id, `Ditolak: ${r.borrower_name}`);
  res.json({ success: true, message: 'Ditolak' });
});

router.post('/:id/return', (req, res) => {
  const { return_notes, item_statuses } = req.body;
  const r = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ success: false, error: 'Tidak ditemukan' });
  if (r.status !== 'approved' && r.status !== 'borrowed') return res.status(400).json({ success: false, error: 'Tidak dalam status dipinjam' });
  db.prepare(`UPDATE borrow_requests SET status = 'returned', returned_at = datetime('now','localtime'), return_notes = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(return_notes || null, r.id);
  const items = db.prepare('SELECT bri.*, i.quantity as stock FROM borrow_request_items bri JOIN items i ON bri.item_id = i.id WHERE bri.borrow_request_id = ?').all(r.id);
  for (const i of items) {
    const st = (item_statuses && item_statuses[i.item_id]) || 'available';
    const newStock = i.stock + i.quantity;
    db.prepare(`UPDATE items SET quantity = ?, status = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(newStock, st, i.item_id);
  }
  db.prepare(`INSERT INTO audit_log (action, target_type, target_id, description) VALUES (?, ?, ?, ?)`).run('RETURN_BORROW', 'borrow_request', r.id, `Dikembalikan: ${r.borrow_number}`);
  res.json({ success: true, message: 'Berhasil dikembalikan' });
});

router.post('/:id/print', (req, res) => {
  const r = db.prepare('SELECT * FROM borrow_requests WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ success: false, error: 'Tidak ditemukan' });
  if (!r.borrow_number) return res.status(400).json({ success: false, error: 'Belum di-approve, tidak bisa cetak surat.' });

  const items = db.prepare('SELECT bri.*, i.item_code, i.item_name, i.quantity as stock FROM borrow_request_items bri JOIN items i ON bri.item_id = i.id WHERE bri.borrow_request_id = ?').all(r.id);
  
  const requestData = {
    borrow_number: r.borrow_number,
    borrower_name: r.borrower_name,
    division: r.division,
    purpose: r.purpose,
    borrow_date: r.borrow_date,
    return_plan_date: r.return_plan_date,
    items,
  };
  
  const printerName = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'printer_name'").get()?.setting_value;
  const templatePath = path.resolve(process.cwd(), 'SURAT PEMINJAMAN BARANG.docx');
  
  printDocxTemplate(requestData, templatePath, printerName)
    .then(() => res.json({ success: true, message: 'Surat berhasil dikirim ke printer' }))
    .catch(e => res.status(500).json({ success: false, error: 'Gagal mencetak: ' + e.message }));
});

export default router;
