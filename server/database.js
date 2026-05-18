import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'data', 'inventory_rnd.sqlite');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT NOT NULL UNIQUE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'single' CHECK(item_type IN ('single', 'box')),
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'out', 'borrowed', 'damaged', 'lost')),
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS item_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    content_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    content_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS outgoing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    person_in_charge TEXT NOT NULL,
    reason TEXT,
    description TEXT,
    out_date TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (item_id) REFERENCES items(id)
  );

  CREATE TABLE IF NOT EXISTS borrow_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrow_number TEXT UNIQUE,
    borrower_name TEXT NOT NULL,
    division TEXT NOT NULL,
    purpose TEXT NOT NULL,
    borrow_date TEXT NOT NULL,
    return_plan_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'borrowed', 'returned', 'late')),
    reject_reason TEXT,
    approved_at TEXT,
    returned_at TEXT,
    return_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS borrow_request_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrow_request_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (borrow_request_id) REFERENCES borrow_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id INTEGER,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

// ─── Seed default settings ────────────────────────────
const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)`);
const defaultPassword = bcrypt.hashSync('rnd123', 10);

insertSetting.run('rnd_password_hash', defaultPassword);
insertSetting.run('printer_name', 'PRINTER_RND');
insertSetting.run('printer_ip', '192.168.1.50');
insertSetting.run('printer_port', '9100');
insertSetting.run('print_mode', 'manual');
insertSetting.run('letter_number_prefix', 'RND/PINJAM');

// ─── Seed sample data if empty ────────────────────────
const isSeeded = db.prepare("SELECT setting_value FROM settings WHERE setting_key = 'is_seeded'").get();
if (!isSeeded) {
  insertSetting.run('is_seeded', 'true');
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get();
  if (itemCount.count === 0) {
    const insertItem = db.prepare(`INSERT INTO items (item_code, item_name, category, item_type, quantity) VALUES (?, ?, ?, ?, ?)`);
    const insertContent = db.prepare(`INSERT INTO item_contents (item_id, content_name, quantity, content_note) VALUES (?, ?, ?, ?)`);

    insertItem.run('RND-0001', 'Multimeter Digital', 'Alat Ukur', 'single', 1);
    insertItem.run('RND-0002', 'Power Supply 12V', 'Alat Ukur', 'single', 1);
    insertItem.run('RND-0003', 'Solder Station', 'Tools', 'single', 1);
    insertItem.run('RND-0004', 'ESP32 DevKit V1', 'Modul Elektronik', 'single', 5);
    insertItem.run('RND-0005', 'Arduino Mega 2560', 'Modul Elektronik', 'single', 3);
    insertItem.run('RND-0006', 'Oscilloscope Rigol DS1054Z', 'Alat Ukur', 'single', 1);
    insertItem.run('RND-0007', 'Logic Analyzer 8CH', 'Alat Ukur', 'single', 2);
    insertItem.run('RND-0008', 'Crimping Tool RJ45', 'Tools', 'single', 1);

    const boxResult = insertItem.run('RND-0009', 'Kotak Riset Sensor Air', 'Project Riset', 'box', 1);
    const boxId = boxResult.lastInsertRowid;
    insertContent.run(boxId, 'Sensor pH', 2, 'Analog pH meter');
    insertContent.run(boxId, 'Sensor TDS', 1, 'Total Dissolved Solids');
    insertContent.run(boxId, 'ESP32', 1, 'DevKit V1');
    insertContent.run(boxId, 'Kabel Jumper', 20, 'Male-to-male');
    insertContent.run(boxId, 'Modul Relay 4CH', 1, '5V active low');

    const boxResult2 = insertItem.run('RND-0010', 'Kit Weather Station', 'Project Riset', 'box', 1);
    const boxId2 = boxResult2.lastInsertRowid;
    insertContent.run(boxId2, 'Sensor BME280', 2, 'Temperature + Humidity + Pressure');
    insertContent.run(boxId2, 'Anemometer', 1, 'RS485 output');
    insertContent.run(boxId2, 'Rain Gauge', 1, 'Tipping bucket');
    insertContent.run(boxId2, 'STM32F407 Board', 1, 'Custom PCB');
    insertContent.run(boxId2, 'Solar Panel 10W', 1, '12V output');
    insertContent.run(boxId2, 'Battery 18650', 4, '3.7V 2600mAh');

    console.log('[DB] Seeded 10 sample items');
  }
}

export default db;
