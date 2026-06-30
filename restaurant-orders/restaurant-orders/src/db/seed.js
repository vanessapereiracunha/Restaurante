const queries = require('./queries');

const existing = queries.listTables();
if (existing.length > 0) {
  console.log(`Ja existem ${existing.length} mesas cadastradas. Seed ignorado.`);
  process.exit(0);
}

const TOTAL_TABLES = 10;
for (let i = 1; i <= TOTAL_TABLES; i++) {
  const t = queries.createTable(`Mesa ${i}`);
  console.log(`Criada: ${t.label} -> codigo: ${t.code}`);
}

console.log('Seed concluido.');
