const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");

exports.setup2FA = async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    // Gera um novo segredo usando speakeasy
    const secret = speakeasy.generateSecret({ name: `Hotspot (${adminEmail})` });
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Salva o segredo base32 temporariamente (totp_enabled continua 0 até verificar)
    await Admin.updateTotpSecret(adminId, secret.base32);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (err) {
    console.error("Erro ao configurar 2FA:", err);
    res.status(500).json({ error: "Erro ao configurar 2FA" });
  }
};

exports.verify2FASetup = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: "Código deve conter 6 dígitos" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin || !admin.totp_secret) {
      return res.status(400).json({ error: "2FA não configurado ou iniciado" });
    }

    const isValid = speakeasy.totp.verify({
      secret: admin.totp_secret,
      encoding: "base32",
      token: code,
      window: 1 // Permite variação de 1 janela de tempo (30s) para tolerância
    });

    if (!isValid) {
      return res.status(400).json({ error: "Código de autenticação inválido ou expirado" });
    }

    await Admin.enableTotp(adminId);
    res.json({ success: true, message: "Autenticação em dois fatores ativada com sucesso!" });
  } catch (err) {
    console.error("Erro ao verificar 2FA:", err);
    res.status(500).json({ error: "Erro ao ativar 2FA" });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Senha é obrigatória para desativar o 2FA" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: "Administrador não encontrado" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(400).json({ error: "Senha incorreta" });
    }

    await Admin.disableTotp(adminId);
    res.json({ success: true, message: "Autenticação em dois fatores desativada com sucesso." });
  } catch (err) {
    console.error("Erro ao desativar 2FA:", err);
    res.status(500).json({ error: "Erro ao desativar 2FA" });
  }
};

exports.get2FAStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: "Administrador não encontrado" });
    }
    res.json({ enabled: admin.totp_enabled === 1 });
  } catch (err) {
    console.error("Erro ao buscar status do 2FA:", err);
    res.status(500).json({ error: "Erro ao buscar status do 2FA" });
  }
};
