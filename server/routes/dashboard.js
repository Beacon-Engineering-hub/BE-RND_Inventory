import { Router } from 'express';
import db from '../database.js';

const router = Router();

router.get('/', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM items').get().c;
  const available = db.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'available'").get().c;
  const out = db.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'out'").get().c;
  const borrowed = db.prepare(`
    SELECT SUM(quantity) as c 
    FROM borrow_request_items 
    WHERE borrow_request_id IN (SELECT id FROM borrow_requests WHERE status IN ('approved', 'borrowed'))
  `).get().c || 0;
  const damaged = db.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'damaged'").get().c;
  const lost = db.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'lost'").get().c;
  const pendingApproval = db.prepare("SELECT COUNT(*) as c FROM borrow_requests WHERE status = 'pending'").get().c;
  const recentItems = db.prepare('SELECT * FROM items ORDER BY id DESC LIMIT 5').all();
  const activeBorrows = db.prepare("SELECT * FROM borrow_requests WHERE status IN ('approved','borrowed') ORDER BY id DESC LIMIT 5").all();
  const recentOutgoing = db.prepare(`SELECT o.*, i.item_code, i.item_name FROM outgoing_items o JOIN items i ON o.item_id = i.id ORDER BY o.id DESC LIMIT 5`).all();
  const categories = db.prepare('SELECT category, COUNT(*) as count FROM items GROUP BY category ORDER BY count DESC').all();

  res.json({
    success: true,
    data: { total, available, out, borrowed, damaged, lost, pendingApproval, recentItems, activeBorrows, recentOutgoing, categories }
  });
});

export default router;
