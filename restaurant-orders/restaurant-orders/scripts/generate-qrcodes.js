require('dotenv').config();
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const queries = require('../src/db/queries');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const outDir = path.join(__dirname, '..', 'public', 'qrcodes');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const tables = queries.listTables();
  if (tables.length === 0) {
    console.log('Nenhuma mesa cadastrada. Rode "npm run seed" primeiro.');
    return;
  }

  for (const table of tables) {
    const url = `${BASE_URL}/mesa/${table.code}`;
    const filePath = path.join(outDir, `${table.code}.png`);
    await QRCode.toFile(filePath, url, { width: 400, margin: 2 });
    console.log(`${table.label} (${table.code}) -> ${url} -> ${filePath}`);
  }

  console.log('QR Codes gerados em public/qrcodes/');
}

run();
