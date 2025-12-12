const db = require("../../db");
const { RouterOSAPI } = require("node-routeros");
const axios = require("axios");
async function obterInformacoes(req, res) {
  const { id } = req.params;

  try {
    const [[mikrotik]] = await db.execute("SELECT * FROM mikrotiks WHERE id = ?", [id]);
    if (!mikrotik) return res.status(404).json({ message: "Mikrotik não encontrado" });

    const conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.usuario,
      password: mikrotik.senha,
      port: mikrotik.porta || 8728,
      keepalive: false,
      timeout: 5000,
    });

    await conn.connect();

    const [resource] = await conn.write("/system/resource/print");
    await conn.close();

    return res.json({
      modelo: resource["board-name"] || "Desconhecido",
      versao: resource.version || "N/A",
      uptime: resource.uptime || "N/A",
      cpu: resource["cpu"] || "N/A",
    });
  } catch (err) {
    console.error("Erro ao obter informações do Mikrotik:", err.message);
    return res.status(500).json({ message: "Falha na conexão com o Mikrotik" });
  }
}

async function liberarUsuario({ mac, ip, plano }) {
  try {
    // Tenta obter o CPF e telefone
    const [lgpd] = await db.query(
      `SELECT cpf, telefone
       FROM lgpd_logins
       WHERE mac = ? AND ip = ?
       ORDER BY criado_em DESC, id DESC
       LIMIT 1`,
      [mac, ip]
    );

    const rawCpf = lgpd[0]?.cpf || null;
    const telefoneBruto = lgpd[0]?.telefone || null;
    const cpfNumeros = rawCpf?.replace(/\D/g, "");

    const username = cpfNumeros || mac;
    const senha = cpfNumeros || mac;

    // Consulta plano
    const [planos] = await db.query(
      "SELECT * FROM planos WHERE nome = ? LIMIT 1",
      [plano]
    );
    const p = planos[0];
    if (!p) throw new Error("Plano não encontrado");

    const rateLimit = `${p.velocidade_up}M/${p.velocidade_down}M`;
    const tempoSegundos = p.duracao_minutos * 60;

    // Remove entradas antigas
    await db.query("DELETE FROM radcheck WHERE username = ?", [username]);
    await db.query("DELETE FROM radreply WHERE username = ?", [username]);
    await db.query("DELETE FROM radusergroup WHERE username = ?", [username]);

	  // Limpa sessões atuais do dia (reinicia contador do dailycounter)
    await db.query(
      `DELETE FROM radacct
       WHERE username = ?
       AND acctstarttime >= CURDATE()`,
      [username]
    );
    // Insere autenticação
    await db.query(
      `INSERT INTO radcheck (username, attribute, op, value)
       VALUES
       (?, 'Cleartext-Password', ':=', ?),
       (?, 'Max-Daily-Session', ':=', ?)`,
      [username, senha, username, tempoSegundos]
    );

    // Insere perfil
    await db.query(
      `INSERT INTO radreply (username, attribute, op, value) VALUES
        (?, 'Mikrotik-Rate-Limit', ':=', ?),
        (?, 'Session-Timeout', ':=', ?)`,
      [username, rateLimit, username, tempoSegundos]
    );

    // Associa a grupo/plano
    await db.query(
      "INSERT INTO radusergroup (username, groupname) VALUES (?, ?)",
      [username, p.id]
    );

    // Atualiza ou insere vínculo visível no painel
    await db.query(`
      INSERT INTO radius_users (username, plano_id, nas_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE plano_id = VALUES(plano_id), nas_id = VALUES(nas_id)
    `, [username, p.id, p.mikrotik_id]);

    // Envia mensagem WhatsApp se telefone existir
    if (telefoneBruto) {
      const numeroLimpo = telefoneBruto.replace(/\D/g, "");
      const numeroComDDI = `55${numeroLimpo}`;

      const texto = `✅ Acesso liberado!\nUsuário: ${username}\nSenha: ${senha}\nPlano: ${p.nome}\nDuração: ${p.duracao_minutos} min.`;

      await axios.post("https://hotspot.forumtelecom.com.br/api/whatsapp/send", {
        telefone: numeroComDDI,
        mensagem: texto,
      });

      console.log(`📲 Mensagem enviada para ${numeroComDDI}`);
    }

    console.log(`✅ Usuário ${username} liberado com plano ${plano}`);
  } catch (error) {
    console.error("Erro ao liberar usuário:", error.message);
    throw error;
  }
}

async function removerUsuarioPorMac(mac) {
    if (!mac || typeof mac !== 'string') {
        console.error("❌ MAC address inválido ou não fornecido");
        return { success: false, message: "MAC address inválido" };
    }

    let conn;
    let resultados = {
        user: { removed: false },
        active: { removed: false },
        host: { removed: false }
    };

    try {
        // Busca a MikroTik associada ao MAC
        const [[mikrotik]] = await db.query(`
            SELECT m.* FROM mikrotiks m
            JOIN pagamentos p ON p.nome_plano = (
                SELECT nome FROM planos WHERE id = p.plano_id LIMIT 1
            )
            WHERE p.mac = ? LIMIT 1
        `, [mac]);

        if (!mikrotik) {
            console.error("❌ Mikrotik não encontrada para o MAC:", mac);
            return { success: false, message: "Mikrotik não encontrada para este usuário" };
        }

        conn = new RouterOSAPI({
            host: mikrotik.ip,
            user: mikrotik.usuario,
            password: mikrotik.senha,
            port: mikrotik.porta || 8728,
            keepalive: false,
            timeout: 15000, // Timeout aumentado
        });

        // Conecta ao MikroTik com tratamento específico
        try {
            await conn.connect();
            console.log(`✅ Conectado à MikroTik ${mikrotik.ip}`);
        } catch (connectError) {
            console.error("❌ Falha na conexão com o MikroTik:", connectError.message);
            return { 
                success: false, 
                message: "Falha na conexão com o MikroTik",
                error: connectError.message 
            };
        }

        // Função auxiliar melhorada para lidar com respostas do MikroTik
        const processarRemocao = async (caminho) => {
            try {
                // Primeiro verifica se existe o usuário
                const [user] = await conn.write(`${caminho}/print`, [`?mac-address=${mac}`]);
                
                // Se não encontrou o usuário ou recebeu resposta vazia
                if (!user || user === '!done' || user === '!empty' || !user['.id']) {
                    console.log(`ℹ️ [${caminho}] Usuário não encontrado: ${mac}`);
                    return { removed: false, message: "Usuário não encontrado" };
                }

                // Se encontrou, procede com a remoção
                await conn.write(`${caminho}/remove`, [`=.id=${user['.id']}`]);
                console.log(`✅ [${caminho}] Removido com sucesso: ${mac}`);
                return { removed: true };

            } catch (err) {
                // Tratamento específico para diferentes tipos de erro
                if (err.message.includes('UNKNOWNREPLY') || err.message.includes('!empty')) {
                    console.log(`ℹ️ [${caminho}] Usuário já removido: ${mac}`);
                    return { removed: false, message: "Usuário já não existe" };
                }
                
                if (err.message.includes('no such item')) {
                    console.log(`ℹ️ [${caminho}] Usuário não existe: ${mac}`);
                    return { removed: false, message: "Usuário não existe" };
                }

                console.error(`⚠️ [${caminho}] Erro durante a remoção:`, err.message);
                return { 
                    removed: false, 
                    error: err.message,
                    details: `Erro ao processar ${caminho}`
                };
            }
        };

        // Processa cada seção do Hotspot de forma sequencial
        resultados.user = await processarRemocao("/ip/hotspot/user");
        resultados.active = await processarRemocao("/ip/hotspot/active");
        resultados.host = await processarRemocao("/ip/hotspot/host");

        // Considera sucesso se pelo menos uma operação foi bem-sucedida
        // ou se o usuário simplesmente não existia em nenhuma seção
        const sucessoGlobal = Object.values(resultados).some(r => r.removed) ||
                             Object.values(resultados).every(r => 
                                r.message && (r.message.includes("não encontrado") || 
                                             r.message.includes("já removido") || 
                                             r.message.includes("não existe"))
                             );

        return { 
            success: sucessoGlobal,
            message: sucessoGlobal ? "Operação concluída" : "Falha na remoção",
            results: resultados
        };

    } catch (err) {
        console.error("❌ Erro geral:", err.message);
        return { 
            success: false, 
            message: "Erro durante o processo",
            error: err.message,
            results: resultados
        };
    } finally {
        if (conn) {
            try {
                await conn.close();
                console.log("🔌 Conexão encerrada");
            } catch (err) {
                console.error("⚠️ Erro ao fechar conexão:", err.message);
            }
        }
    }
}


module.exports = { obterInformacoes, liberarUsuario, removerUsuarioPorMac };
