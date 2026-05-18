import { Router } from 'express';
import db from '../database.js';
import { printDocxTemplate } from '../utils/printer.js';
import path from 'path';

const router = Router();

router.get('/', (req, res) => {
  const settings = db.prepare('SELECT setting_key, setting_value FROM settings WHERE setting_key != ?').all('rnd_password_hash');
  const data = {};
  for (const s of settings) { data[s.setting_key] = s.setting_value; }
  res.json({ success: true, data });
});

router.put('/', (req, res) => {
  const updates = req.body;
  const update = db.prepare("UPDATE settings SET setting_value = ?, updated_at = datetime('now','localtime') WHERE setting_key = ?");
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'rnd_password_hash') continue;
    update.run(value, key);
  }
  res.json({ success: true, message: 'Pengaturan disimpan' });
});

router.post('/test-print', async (req, res) => {
  const getSetting = (k) => db.prepare('SELECT setting_value FROM settings WHERE setting_key = ?').get(k)?.setting_value;
  const printerName = getSetting('printer_name');

  const requestData = {
    borrow_number: 'RND/TEST/001',
    borrower_name: 'Testing App',
    division: 'Quality Assurance',
    purpose: 'Test Print Integration',
    borrow_date: new Date().toISOString(),
    return_plan_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    items: [
      { item_code: 'TEST-01', item_name: 'Barang Uji Coba', quantity: 1 }
    ],
  };

  const templatePath = path.resolve(process.cwd(), 'SURAT PEMINJAMAN BARANG.docx');

  try {
    await printDocxTemplate(requestData, templatePath, printerName);
    res.json({ success: true, message: `Test print berhasil dikirim ke Word` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
