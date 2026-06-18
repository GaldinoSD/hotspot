const express = require("express");
const router = express.Router();
const { getFinanceiroDashboard } = require("../controllers/dashboardFinanceiroController");

router.get("/", getFinanceiroDashboard);

module.exports = router;
