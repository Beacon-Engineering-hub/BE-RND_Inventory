import db from './server/database.js';
db.prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'printer_name'").run('EPSON8A4A53 (L3250 Series)');
console.log('Printer name updated in DB');
