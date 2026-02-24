import Database from 'better-sqlite3';
const db = new Database('ebd.db', { readonly: true });
const rows = db.prepare('SELECT * FROM churches ORDER BY id').all();
console.log(JSON.stringify(rows, null, 2));
db.close();
