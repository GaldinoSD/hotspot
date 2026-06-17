require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db');

async function migrate() {
  const conn = await db.getConnection();
  try {
    console.log('=== Migration 016: Unique RADIUS Users ===\n');

    // 1. Deduplicar registros existentes na tabela radius_users
    console.log('Deduplicando registros existentes em radius_users...');
    const [dupResult] = await conn.query(`
      DELETE t1 FROM radius_users t1
      INNER JOIN radius_users t2 
      ON t1.username = t2.username AND t1.id < t2.id
    `);
    console.log(`Registros duplicados removidos: ${dupResult.affectedRows}`);

    // 2. Verificar se o índice UNIQUE já existe
    console.log('Verificando se o índice UNIQUE em username já existe...');
    const [indexes] = await conn.query(`
      SHOW INDEXES FROM radius_users WHERE Key_name = 'uk_radius_users_username'
    `);

    if (indexes.length === 0) {
      console.log('Adicionando constraint UNIQUE (username) na tabela radius_users...');
      await conn.query(`
        ALTER TABLE radius_users 
        ADD UNIQUE KEY uk_radius_users_username (username)
      `);
      console.log('Índice UNIQUE criado com sucesso!');
    } else {
      console.log('Índice UNIQUE uk_radius_users_username já existe. Nenhuma alteração necessária.');
    }

    console.log('\nMigration 016 concluída com sucesso!');
  } catch (err) {
    console.error('Erro na migration 016:', err);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
