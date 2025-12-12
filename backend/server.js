const cors = require('cors')
const express = require('express')
const app = express()

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

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/planos', planRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/mikrotiks", mikrotikRoutes);
app.use("/api/efi", efiRoutes);
app.use("/api/config-mercadopago", mercadoPagoRoutes);
app.use("/api/planos-publicos", planPublicRoutes);
app.use("/api/pagamentos", pagamentoRoutes);
app.use('/api/radius', radiusRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/lgpd", lgpdRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/auth", authTempRoutes);
app.use("/api/limpeza", limpezaRoutes);

// ✅ ROTA QUE RESOLVE O "Cannot GET /"
app.get('/', (req, res) => {
  res.send('API funcionando ✔️');
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`🚀 API rodando na porta ${process.env.PORT || 3001}`)
})

