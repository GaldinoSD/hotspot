const express = require("express")
const router = express.Router()
const pool = require('../db');
const db = require("../db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const SECRET_KEY = process.env.JWT_SECRET || "chave_secreta_muito_forte"

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  console.log("📩 Requisição recebida:", { email, senha });

  try {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
    const admin = rows[0];
    console.log("📡 Admin encontrado:", admin);

    if (!admin) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    if (!senha || !admin.password) {
      console.error("❌ Dados faltando para comparar:", { senha, hash: admin.password });
      return res.status(500).json({ message: 'Erro interno: dados incompletos' });
    }

    const isSenhaValida = await bcrypt.compare(senha, admin.password);

    if (!isSenhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
});

module.exports = router
