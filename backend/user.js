// backend/user.js
require('dotenv').config() // <-- ESSENCIAL

const bcrypt = require('bcryptjs')
const db = require('./src/config/db')

async function criarAdmin() {
  const hash = await bcrypt.hash('admin123', 10)
  await db.execute('INSERT INTO admins (email, password) VALUES (?, ?)', ['admin@empresa.com', hash])
  console.log('✅ Admin criado com sucesso')
  process.exit(0)
}

criarAdmin().catch(err => {
  console.error('❌ Erro ao criar admin:', err)
  process.exit(1)
})
