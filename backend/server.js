require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()

// Prevenir crash do processo por erros não tratados do node-routeros (!empty)
process.on('uncaughtException', (err) => {
  if (err.errno === 'UNKNOWNREPLY' || (err.message && err.message.includes('!empty'))) {
    console.warn('RouterOS !empty reply handled (non-fatal)');
    return;
  }
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Middlewares
const auth = require('./src/middleware/auth')
const tenant = require('./src/middleware/tenant')

// Rotas
const authRoutes = require('./src/routes/authRoutes')
const planRoutes = require('./src/routes/planRoutes')
const adminRoutes = require("./routes/admin")
const mikrotikRoutes = require("./src/routes/mikrotikRoutes");
const efiRoutes = require("./src/routes/efiRoutes");
const mercadoPagoRoutes = require("./src/routes/mercadoPagoRoutes");
const planPublicRoutes = require("./src/routes/planPublicRoutes");
const pagamentoRoutes = require("./src/routes/pagamentoRoutes");
const radiusRoutes = require('./src/routes/radiusRoutes');
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const lgpdRoutes = require("./src/routes/lgpdRoutes");
const whatsappRoutes = require("./src/routes/whatsappRoutes");
const authTempRoutes = require("./src/routes/authTempRoutes");
const limpezaRoutes = require("./src/routes/limpezaRoutes");
const radiusLogsRoutes = require("./src/routes/radiusLogsRoutes");
const adminUserRoutes = require("./src/routes/adminUserRoutes");
const wireguardRoutes = require("./src/routes/wireguardRoutes");
const portalRoutes = require("./src/routes/portalRoutes");
const portalTemplateRoutes = require("./src/routes/portalTemplateRoutes");
const campanhasRoutes = require("./src/routes/campanhasRoutes");
const campanhasPublicRoutes = require("./src/routes/campanhasPublicRoutes");
const leadRoutes = require("./src/routes/leadRoutes");
const complianceRoutes = require("./src/routes/complianceRoutes");
const empresaRoutes = require("./src/routes/empresaRoutes");
const empresaConfigRoutes = require("./src/routes/empresaConfigRoutes");
const registroRoutes = require("./src/routes/registroRoutes");
const grupoPermissaoRoutes = require("./src/routes/grupoPermissaoRoutes");
const loginPortalRoutes = require("./src/routes/loginPortalRoutes");
const systemBackupRoutes = require("./src/routes/systemBackupRoutes");
const systemUpdateRoutes = require("./src/routes/systemUpdateRoutes");
const logsRoutes = require("./src/routes/logsRoutes");
const db = require("./db");

// Rotas exclusivas do servidor principal (OTA updates) - não existem nos servidores de alunos
const fs = require('fs');
const updatePublishRoutes = fs.existsSync(__dirname + '/src/routes/updatePublishRoutes.js') ? require("./src/routes/updatePublishRoutes") : null;
const updateCheckRoutes = fs.existsSync(__dirname + '/src/routes/updateCheckRoutes.js') ? require("./src/routes/updateCheckRoutes") : null;

app.use(cors())
app.use(express.json())

// Servir arquivos de campanhas (publicos, com cache de 1 dia)
app.use('/uploads/campanhas',
  express.static(path.join(__dirname, 'uploads', 'campanhas'), {
    maxAge: '1d',
    fallthrough: false,
  })
);

// --- Rotas públicas (sem auth) ---
app.use('/api/admin', adminRoutes)          // Login
app.use('/api/auth', authRoutes)            // Auth
app.use('/api/auth', authTempRoutes)        // Acesso temporário
app.use("/api/planos-publicos", planPublicRoutes);
app.use("/api/pagamentos", pagamentoRoutes);  // Inclui webhook público
app.use("/api/lgpd", lgpdRoutes);             // LGPD login/cadastro são públicos
app.use("/api/registro", registroRoutes);       // Registro público de empresas

app.use("/api/public/campanha", campanhasPublicRoutes);

// Rota pública para login do portal Lead (sem auth)
const { leadLogin, capturaPassiva, cadastroCliente } = require("./src/controllers/leadController");
app.post("/api/lead-portal/login", leadLogin);
app.post("/api/lead-portal/passivo", capturaPassiva);
app.post("/api/clientes/cadastro", cadastroCliente);

// Rota pública para login do portal Wifi/Radius
app.use("/api/login-portal", loginPortalRoutes);

// --- Rotas protegidas (auth + tenant + permissão) ---
const checkPermissao = require('./src/middleware/checkPermissao');
app.use('/api/planos', auth, tenant, checkPermissao('planos'), planRoutes)
app.use("/api/mikrotiks", auth, tenant, checkPermissao('mikrotiks'), mikrotikRoutes);
app.use("/api/efi", auth, tenant, checkPermissao('configuracoes'), efiRoutes);
app.use("/api/config-mercadopago", auth, tenant, checkPermissao('configuracoes'), mercadoPagoRoutes);
app.use('/api/radius', auth, tenant, radiusRoutes);
app.use("/api/dashboard", auth, tenant, checkPermissao('dashboard'), dashboardRoutes);
app.use("/api/whatsapp", auth, tenant, checkPermissao('configuracoes'), whatsappRoutes);
app.use("/api/limpeza", auth, tenant, checkPermissao('configuracoes'), limpezaRoutes);
app.use("/api/radius-logs", auth, tenant, checkPermissao('sessoeslog'), radiusLogsRoutes);
app.use("/api/admins", auth, tenant, checkPermissao('usuarios'), adminUserRoutes);
app.use("/api/wireguard", auth, tenant, checkPermissao('vpn'), wireguardRoutes);
app.use("/api/portais", auth, tenant, checkPermissao('portais'), portalRoutes);
app.use("/api/campanhas", auth, tenant, checkPermissao('portais'), campanhasRoutes);
app.use("/api/portal-templates", auth, tenant, checkPermissao('portais'), portalTemplateRoutes);
app.use("/api/leads", auth, tenant, checkPermissao('leads'), leadRoutes);
app.use("/api/compliance", auth, tenant, checkPermissao('compliance'), complianceRoutes);
app.use("/api/empresa-config", auth, tenant, checkPermissao('configuracoes'), empresaConfigRoutes);

// Rota pública: config visual do portal (sem auth)
const portalCtrl = require("./src/controllers/portalController");
app.get("/api/portal-config/:tipo", portalCtrl.getPortalConfig);

// --- Rotas super admin ---
app.use("/api/empresas", empresaRoutes);  // Auth + authorize interno
app.use("/api/grupos-permissao", grupoPermissaoRoutes); // Auth + authorize interno
app.use("/api/system-backup", systemBackupRoutes);
app.use("/api/system-update", systemUpdateRoutes);
app.use("/api/logs", logsRoutes);
if (updatePublishRoutes) app.use("/api/update-publish", updatePublishRoutes);
if (updateCheckRoutes) app.use("/api/updates", updateCheckRoutes);

// Endpoint público: serve login.html para MikroTik baixar via /tool/fetch
// Este HTML é salvo como hotspot/login.html no MikroTik
// O RouterOS substitui $(mac), $(ip), $(username) etc antes de servir ao cliente
app.get("/api/hotspot-login/:mikrotikId", async (req, res) => {
  const { mikrotikId } = req.params;
  try {
    const [[mikrotik]] = await db.execute(
      `SELECT m.empresa_id, e.slug AS empresa_slug FROM mikrotiks m
       LEFT JOIN empresas e ON m.empresa_id = e.id WHERE m.id = ?`,
      [mikrotikId]
    );
    const empresaId = mikrotik?.empresa_id || '';
    const empresaSlug = mikrotik?.empresa_slug || 'default';
    const systemDomain = process.env.SYSTEM_DOMAIN || req.hostname;
    const portalUrl = `https://${systemDomain}/hotspot/redirect/${mikrotikId}`;
    const fullUrl = `${portalUrl}?mac=$(mac)&ip=$(ip)&mikrotik_id=${mikrotikId}&empresa_id=${empresaId}&empresa=${empresaSlug}`;

    // HTML no padrão MikroTik hotspot login.html
    // $(mac), $(ip), $(username), $(link-login), $(link-orig) são variáveis do RouterOS
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="pragma" content="no-cache">
  <meta http-equiv="expires" content="-1">
  <title>Hotspot Login</title>
  <style>
    body { background: #0f111a; color: #fff; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { text-align: center; padding: 40px; max-width: 400px; }
    .spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    a { color: #3b82f6; }
    .info { font-size: 12px; color: #666; margin-top: 15px; }
  </style>
  <script>
    // Se ja tem username = usuario ja autenticou, ir para status
    var params = new URLSearchParams(window.location.search);
    if (params.has("username") && params.get("username") !== "") {
      window.location.href = "/status";
    } else {
      // Redirect para o portal da empresa
      setTimeout(function() {
        window.location.href = "${fullUrl}";
      }, 1500);
    }
  </script>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <h2>Conectando...</h2>
    <p>Redirecionando para o portal de acesso</p>
    <p class="info">MAC: $(mac) | IP: $(ip)</p>
    <p class="info">Se nao for redirecionado, <a href="${fullUrl}">clique aqui</a></p>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.send(html);
  } catch (err) {
    res.status(500).send("<h1>Erro</h1>");
  }
});

app.get("/api/hotspot-status/:mikrotikId", async (req, res) => {
  const { mikrotikId } = req.params;
  try {
    const systemDomain = process.env.SYSTEM_DOMAIN || req.hostname;
    // Detectar protocolo com base no domínio de produção vs ip/localhost local
    const protocol = (systemDomain.includes("localhost") || systemDomain.match(/^\d+\.\d+\.\d+\.\d+$/)) ? "http" : "https";
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Status - Hotspot</title>
  <script>
    var domain = "${systemDomain}";
    var finalUrl = "${protocol}://" + domain + "/api/hotspot-status/redirect/${mikrotikId}?mac=$(mac)&ip=$(ip)&username=$(username)&link_logout=$(link-logout)&link_orig=$(link-orig)&uptime=$(uptime)&bytes_in=$(bytes-in-nice)&bytes_out=$(bytes-out-nice)";
    window.location.replace(finalUrl);
  </script>
</head>
<body style="background: #0f111a; color: #fff; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center;">
    <h2 style="font-weight: 500; font-size: 18px;">Autenticado com sucesso!</h2>
    <p style="color: #64748b; font-size: 13px; margin-top: 5px;">Redirecionando para o painel de navegação...</p>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.send(html);
  } catch (err) {
    res.status(500).send("<h1>Erro</h1>");
  }
});

// Novo endpoint público para tratamento dinâmico pós-login (redirecionamento ou status estilizado)
app.get("/api/hotspot-status/redirect/:mikrotikId", async (req, res) => {
  const { mikrotikId } = req.params;
  const { mac, ip, username, link_logout, link_orig, uptime, bytes_in, bytes_out } = req.query;

  try {
    const [[mikrotik]] = await db.execute(
      "SELECT portal_id FROM mikrotiks WHERE id = ?",
      [mikrotikId]
    );

    let action = "status";
    let redirectUrl = "";
    let logoUrl = "";
    let corPrimaria = "#3B82F6";
    let corFundo = "#0f111a";

    // Novas customizações da página de status
    let statusTitle = "Conectado à Internet";
    let statusSubtitle = "Sua sessão está ativa e segura";
    let statusBlur = "8px";
    let statusCardOpacity = "0.9";
    let statusCustomCss = "";

    if (mikrotik && mikrotik.portal_id) {
      const [[portal]] = await db.execute(
        "SELECT empresa_id, configuracoes FROM portais WHERE id = ?",
        [mikrotik.portal_id]
      );
      if (portal) {
        if (portal.configuracoes) {
          try {
            const cfg = typeof portal.configuracoes === 'string' ? JSON.parse(portal.configuracoes) : portal.configuracoes;
            action = cfg.post_login_action || "status";
            redirectUrl = cfg.post_login_redirect_url || "";
          } catch (e) {}
        }

        // Buscar a Página de Status dedicada da empresa
        const [[statusPortal]] = await db.execute(
          "SELECT logo_url, cor_primaria, cor_fundo, configuracoes FROM portais WHERE empresa_id = ? AND tipo = 'status' LIMIT 1",
          [portal.empresa_id]
        );
        if (statusPortal) {
          corPrimaria = statusPortal.cor_primaria || "#3B82F6";
          corFundo = statusPortal.cor_fundo || "#0f111a";
          logoUrl = statusPortal.logo_url || "";
          if (statusPortal.configuracoes) {
            try {
              const cfg = typeof statusPortal.configuracoes === 'string' ? JSON.parse(statusPortal.configuracoes) : statusPortal.configuracoes;
              if (cfg.status_title) statusTitle = cfg.status_title;
              if (cfg.status_subtitle) statusSubtitle = cfg.status_subtitle;
              if (cfg.status_blur !== undefined) statusBlur = `${cfg.status_blur}px`;
              if (cfg.status_card_opacity !== undefined) statusCardOpacity = String(cfg.status_card_opacity);
              if (cfg.status_custom_css) statusCustomCss = cfg.status_custom_css;
            } catch (e) {}
          }
        }
      }
    }

    if (action === "redirect" && redirectUrl) {
      // Normalizar URL (garantir protocolo HTTP/HTTPS)
      let target = redirectUrl.trim();
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = `http://${target}`;
      }
      return res.redirect(target);
    }

    // Renderizar a página de status estilizada de acordo com a identidade visual do portal
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${corFundo};
      background-image: linear-gradient(135deg, ${corFundo} 0%, #060814 100%);
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(26, 29, 39, ${statusCardOpacity});
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 36px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(${statusBlur});
    }
    .logo-area {
      margin-bottom: 24px;
    }
    .logo-img {
      max-height: 50px;
      max-width: 200px;
      object-fit: contain;
      margin-bottom: 12px;
    }
    .logo-fallback {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: ${corPrimaria};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
      margin-bottom: 16px;
      box-shadow: 0 10px 20px -5px ${corPrimaria}66;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 4px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 24px 0;
    }
    .stat {
      background: rgba(13, 17, 23, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 16px;
    }
    .stat-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      word-break: break-all;
    }
    .stat-value.primary {
      color: ${corPrimaria};
    }
    .info-list {
      background: rgba(13, 17, 23, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 14px 18px;
      margin-bottom: 24px;
      text-align: left;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
    }
    .info-value {
      color: #cbd5e1;
      font-family: monospace;
      font-weight: 500;
    }
    .btn-logout {
      display: block;
      width: 100%;
      padding: 14px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-logout:hover {
      background: #ef4444;
      transform: translateY(-1px);
    }
    .footer {
      font-size: 11px;
      color: #475569;
    }
    ${statusCustomCss}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-area">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo-img" />` : '<div class="logo-fallback">📶</div>'}
      <h1>${statusTitle}</h1>
      <p class="subtitle">${statusSubtitle}</p>
      <div class="badge">
        <span class="badge-dot"></span>
        Dispositivo Autorizado
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Tempo Online</div>
        <div class="stat-value primary">${uptime || '00:00:00'}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Usuário</div>
        <div class="stat-value">${username || 'Conectado'}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Download</div>
        <div class="stat-value primary">${bytes_out || '0 KB'}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Upload</div>
        <div class="stat-value">${bytes_in || '0 KB'}</div>
      </div>
    </div>

    <div class="info-list">
      <div class="info-row">
        <span class="info-label">Endereço IP</span>
        <span class="info-value">${ip || '—'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Endereço MAC</span>
        <span class="info-value">${mac || '—'}</span>
      </div>
    </div>

    ${link_logout ? `
    <form action="${link_logout}" method="post">
      <button type="submit" class="btn-logout">Desconectar da Rede</button>
    </form>
    ` : ''}
    
    <div style="margin-top: 20px;" class="footer">
      Powered by Hotspot WiFi &bull; LGPD Compliant
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.send(html);

  } catch (err) {
    console.error("Erro na rota de status remota:", err);
    res.redirect(link_orig || "http://google.com");
  }
});

// Endpoint público para preview da página de status estilizada do portal
app.get("/api/hotspot-status/preview/:portalId", async (req, res) => {
  const { portalId } = req.params;

  try {
    const [[portal]] = await db.execute(
      "SELECT configuracoes, logo_url, cor_primaria, cor_fundo FROM portais WHERE id = ?",
      [portalId]
    );

    let logoUrl = "";
    let corPrimaria = "#3B82F6";
    let corFundo = "#0f111a";

    // Novas customizações da página de status
    let statusTitle = "Conectado à Internet";
    let statusSubtitle = "Sua sessão está ativa e segura";
    let statusBlur = "8px";
    let statusCardOpacity = "0.9";
    let statusCustomCss = "";

    if (portal) {
      corPrimaria = portal.cor_primaria || "#3B82F6";
      corFundo = portal.cor_fundo || "#0f111a";
      logoUrl = portal.logo_url || "";
      if (portal.configuracoes) {
        try {
          const cfg = typeof portal.configuracoes === 'string' ? JSON.parse(portal.configuracoes) : portal.configuracoes;
          if (cfg.status_title) statusTitle = cfg.status_title;
          if (cfg.status_subtitle) statusSubtitle = cfg.status_subtitle;
          if (cfg.status_blur !== undefined) statusBlur = `${cfg.status_blur}px`;
          if (cfg.status_card_opacity !== undefined) statusCardOpacity = String(cfg.status_card_opacity);
          if (cfg.status_custom_css) statusCustomCss = cfg.status_custom_css;
        } catch (e) {}
      }
    }

    // Dados simulados
    const uptime = "01:23:45";
    const bytes_in = "124.5 MB";
    const bytes_out = "18.2 MB";
    const username = "visitante_demo";
    const ip = "192.168.88.254";
    const mac = "AA:BB:CC:DD:EE:FF";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: ${corFundo};
      background-image: linear-gradient(135deg, ${corFundo} 0%, #060814 100%);
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(26, 29, 39, ${statusCardOpacity});
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 36px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(${statusBlur});
    }
    .logo-area {
      margin-bottom: 24px;
    }
    .logo-img {
      max-height: 50px;
      max-width: 200px;
      object-fit: contain;
      margin-bottom: 12px;
    }
    .logo-fallback {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: ${corPrimaria};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
      margin-bottom: 16px;
      box-shadow: 0 10px 20px -5px ${corPrimaria}66;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 13px;
      margin-top: 4px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 24px 0;
    }
    .stat {
      background: rgba(13, 17, 23, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 16px;
    }
    .stat-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      word-break: break-all;
    }
    .stat-value.primary {
      color: ${corPrimaria};
    }
    .info-list {
      background: rgba(13, 17, 23, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 14px 18px;
      margin-bottom: 24px;
      text-align: left;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #64748b;
    }
    .info-value {
      color: #cbd5e1;
      font-family: monospace;
      font-weight: 500;
    }
    .btn-logout {
      display: block;
      width: 100%;
      padding: 14px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      text-align: center;
    }
    .btn-logout:hover {
      background: #ef4444;
      transform: translateY(-1px);
    }
    .footer {
      font-size: 11px;
      color: #475569;
    }
    ${statusCustomCss}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-area">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo-img" />` : '<div class="logo-fallback">📶</div>'}
      <h1>${statusTitle}</h1>
      <p class="subtitle">${statusSubtitle}</p>
      <div class="badge">
        <span class="badge-dot"></span>
        Dispositivo Autorizado
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Tempo Online</div>
        <div class="stat-value primary">${uptime}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Identificação</div>
        <div class="stat-value">${username}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Download</div>
        <div class="stat-value primary">${bytes_out}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Upload</div>
        <div class="stat-value">${bytes_in}</div>
      </div>
    </div>

    <div class="info-list">
      <div class="info-row">
        <span class="info-label">Endereço IP</span>
        <span class="info-value">${ip}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Endereço MAC</span>
        <span class="info-value">${mac}</span>
      </div>
    </div>

    <a href="#" class="btn-logout" onclick="alert('Isso é uma simulação de desconexão.'); return false;">Desconectar da Rede</a>
    
    <div style="margin-top: 20px;" class="footer">
      Powered by Hotspot WiFi &bull; LGPD Compliant
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.send(html);

  } catch (err) {
    console.error("Erro na rota de preview do status:", err);
    res.status(500).send("<h1>Erro de Carregamento</h1>");
  }
});

// Endpoint público: redirect dinâmico do captive portal
app.get("/hotspot/redirect/:mikrotikId", async (req, res) => {
  const { mikrotikId } = req.params;
  const { mac, ip } = req.query;

  try {
    // Busca MikroTik com dados da empresa
    const [[mikrotik]] = await db.execute(
      `SELECT m.*, e.slug AS empresa_slug, e.id AS eid
       FROM mikrotiks m
       LEFT JOIN empresas e ON m.empresa_id = e.id
       WHERE m.id = ?`,
      [mikrotikId]
    );
    if (!mikrotik || !mikrotik.portal_id) {
      return res.status(404).send("<h1>Portal não configurado para este hotspot</h1>");
    }

    const [[portal]] = await db.execute("SELECT * FROM portais WHERE id = ?", [mikrotik.portal_id]);
    if (!portal) {
      return res.status(404).send("<h1>Portal não encontrado</h1>");
    }

    const empresaId = mikrotik.empresa_id;
    const empresaSlug = mikrotik.empresa_slug || 'default';

    // Pré-portal: se o portal tem campanha ativa e usuario ainda nao viu, redireciona
    if (portal.campanha_ativa_id && req.query.campanha_vista !== '1') {
      const qs = new URLSearchParams({
        mac: mac || '',
        ip: ip || '',
        mikrotik_id: mikrotikId,
        empresa_id: empresaId,
        empresa: empresaSlug,
      }).toString();
      return res.redirect(302, `/campanha/${portal.id}?${qs}`);
    }

    const params = `mac=${encodeURIComponent(mac || "")}&ip=${encodeURIComponent(ip || "")}&mikrotik_id=${mikrotikId}&empresa_id=${empresaId}&empresa=${empresaSlug}`;

    if (portal.tipo === "custom" && portal.html_content) {
      let html = portal.html_content
        .replace(/\$\(mac\)/g, mac || "")
        .replace(/\$\(ip\)/g, ip || "")
        .replace(/\$\(mikrotik_id\)/g, mikrotikId)
        .replace(/\$\(empresa_id\)/g, empresaId)
        .replace(/\$\(empresa\)/g, empresaSlug);

      // Injetar CSS customizado se existir
      if (portal.custom_css) {
        html = html.replace('</head>', `<style>${portal.custom_css}</style></head>`);
      }

      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    }

    if (portal.url_redirect) {
      const separator = portal.url_redirect.includes("?") ? "&" : "?";
      return res.redirect(`${portal.url_redirect}${separator}${params}`);
    }

    res.status(400).send("<h1>Portal sem configuração de redirect</h1>");
  } catch (err) {
    console.error("Erro no redirect do captive portal:", err);
    res.status(500).send("<h1>Erro interno</h1>");
  }
});


const cron = require('node-cron');
const syncConnectionLogs = require('./src/jobs/syncConnectionLogs');

// Sincronizar logs de conexão do RADIUS (Marco Civil) a cada 5 minutos
cron.schedule('*/5 * * * *', () => {
  console.log('[CRON] Iniciando syncConnectionLogs...');
  syncConnectionLogs().catch(err => console.error('[CRON] Erro:', err));
});

// --- Tela de emergencia (SEM auth) ---
app.get('/emergency', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/emergency.html'));
});
const systemBackupCtrl = require('./src/controllers/systemBackupController');
app.get('/api/emergency/backups', systemBackupCtrl.listarBackups);
app.post('/api/emergency/backup', systemBackupCtrl.criarBackup);
app.post('/api/emergency/restore/:id', systemBackupCtrl.restaurarBackup);

try {
  const { ensureFreeradiusDict } = require('./src/utils/ensureFreeradiusDict');
  ensureFreeradiusDict();
} catch (err) {
  console.warn('[freeradius-dict] erro inesperado:', err.message);
}

app.listen(process.env.PORT || 3001, () => {
  console.log(`API rodando na porta ${process.env.PORT || 3001}`)
})
