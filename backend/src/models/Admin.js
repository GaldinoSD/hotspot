const db = require('../config/db')

const findByEmail = async (email) => {
  const [rows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email])
  return rows[0]
}

const create = async (email, passwordHash) => {
  await db.execute('INSERT INTO admins (email, password) VALUES (?, ?)', [email, passwordHash])
}

module.exports = { findByEmail, create }
