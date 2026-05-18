import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

try {
  const content = fs.readFileSync('SURAT PEMINJAMAN BARANG.docx', 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  console.log("Template parsed successfully!");
} catch (error) {
  if (error.properties && error.properties.errors instanceof Array) {
    const errorMessages = error.properties.errors.map(function (e) {
        return e.properties.explanation;
    }).join("\n");
    console.error('Template Error:\n' + errorMessages);
  } else {
    console.error(error);
  }
}
