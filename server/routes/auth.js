import { Router } from 'express';
import db from '../database.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Verify RND password
router.post('/verify', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, error: 'Password wajib diisi' });
  const setting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'rnd_password_hash'").get();
  if (!setting) return res.status(500).json({ success: false, error: 'Password belum dikonfigurasi' });
  const valid = bcrypt.compareSync(password, setting.setting_value);
  if (!valid) return res.status(401).json({ success: false, error: 'Password salah' });
  res.json({ success: true, message: 'Password benar' });
});

// Change password
router.post('/change-password', (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ success: false, error: 'Isi semua field' });
  const setting = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'rnd_password_hash'").get();
  if (!bcrypt.compareSync(current_password, setting.setting_value)) return res.status(401).json({ success: false, error: 'Password lama salah' });
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare("UPDATE settings SET setting_value = ?, updated_at = datetime('now','localtime') WHERE setting_key = 'rnd_password_hash'").run(hash);
  res.json({ success: true, message: 'Password berhasil diubah' });
});

export default router;
