const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

exports.login = async (req, res) => {
  const { email, password } = req.body
  const user = await Admin.findByEmail(email)

  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' })

  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.status(401).json({ error: 'Senha incorreta' })

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' })

  res.json({ token })
}
