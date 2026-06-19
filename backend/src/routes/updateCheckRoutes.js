const express = require('express');
const router = express.Router();
const db = require('../../db');

// Middleware para validar o token da OTA (Senha Padrão)
const validateOtaToken = (req, res, next) => {
  const serverToken = process.env.UPDATE_TOKEN || '26828021';
  const clientToken = req.headers['x-update-token'] || req.body.token;

  if (!clientToken || clientToken !== serverToken) {
    return res.status(401).json({
      authorized: false,
      message: 'Token de atualizacao invalido ou nao fornecido.'
    });
  }
  next();
};

// POST /api/updates/check
// Called by client servers — token required
router.post('/check', validateOtaToken, async (req, res) => {
  const { email, last_update_id } = req.body;

  try {
    const [updates] = await db.execute(
      'SELECT id, descricao, changelog, criado_em FROM updates WHERE id > ? ORDER BY id ASC',
      [last_update_id || '']
    );

    res.json({ authorized: true, updates });
  } catch (err) {
    console.error('updateCheck /check error:', err);
    res.status(500).json({ authorized: false, message: err.message });
  }
});

// POST /api/updates/download/:updateId
// Called by client servers — token required
router.post('/download/:updateId', validateOtaToken, async (req, res) => {
  const { updateId } = req.params;

  try {
    const [[update]] = await db.execute(
      'SELECT id, descricao FROM updates WHERE id = ?',
      [updateId]
    );
    if (!update) {
      return res.status(404).json({ message: 'Update nao encontrado' });
    }

    const [files] = await db.execute(
      'SELECT file_path AS path, file_content AS content, action FROM update_files WHERE update_id = ? ORDER BY id ASC',
      [updateId]
    );
    const [migrations] = await db.execute(
      'SELECT sql_content AS `sql`, ordem FROM update_migrations WHERE update_id = ? ORDER BY ordem ASC',
      [updateId]
    );

    res.json({ id: update.id, descricao: update.descricao, files, migrations });
  } catch (err) {
    console.error('updateCheck /download error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
