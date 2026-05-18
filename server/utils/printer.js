import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function printDocxTemplate(request, templatePath, printerName) {
  return new Promise((resolve, reject) => {
    try {
      // 1. Baca template docx
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 2. Siapkan data dari request
      const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
        return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
      };
      
      const formatDateShort = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
      };

      const items = (request.items || []).map((it, i) => ({
        no: i + 1,
        kode: it.item_code || '-',
        nama: it.item_name || '-',
        jumlah: it.quantity || 1,
        satuan: 'Unit',
        kembali: formatDateShort(request.return_plan_date)
      }));

      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const todayDate = new Date();
      const bulan_romawi = romanMonths[todayDate.getMonth()];
      const tahun_yyyy = todayDate.getFullYear().toString();

      doc.render({
        nomor_surat: request.borrow_number || '',
        bulan_romawi: bulan_romawi,
        tahun_yyyy: tahun_yyyy,
        tujuan_pinjam: request.purpose || '-',
        tanggal_pinjam: formatDate(request.borrow_date),
        nama_peminjam: request.borrower_name || '-',
        divisi_peminjam: request.division || '-',
        tanggal_hari_ini: formatDateShort(new Date().toISOString()),
        items: items
      });

      // 3. Simpan file sementara
      const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      const tempPath = path.resolve(__dirname, '../../temp_print.docx');
      fs.writeFileSync(tempPath, buf);

      // 4. Print menggunakan PowerShell (Microsoft Word)
      // Jika printerName kosong, biarkan Word pakai default printer Windows
      let psCommand = `
        $word = New-Object -ComObject Word.Application;
        $word.Visible = $false;
        $doc = $word.Documents.Open('${tempPath}');
      `;
      
      if (printerName) {
        psCommand += ` $word.ActivePrinter = '${printerName}'; `;
      }

      psCommand += `
        $doc.PrintOut();
        Start-Sleep -Seconds 3;
        $doc.Close($false);
        $word.Quit();
      `;

      exec(`powershell -Command "${psCommand.replace(/\n/g, ' ')}"`, (err, stdout, stderr) => {
        if (err) {
          return reject(new Error('Gagal print via Word: ' + err.message));
        }
        resolve(stdout);
      });

    } catch (error) {
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors.map(function (e) {
            return e.properties.explanation;
        }).join("\\n");
        console.log('errorMessages', errorMessages);
        // errorMessages -> "The tag beginning with '{' is unopened"
        reject(new Error('Template Error: ' + errorMessages));
      } else {
        reject(error);
      }
    }
  });
}
