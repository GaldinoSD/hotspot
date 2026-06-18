const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { setup2FA, verify2FASetup, disable2FA, get2FAStatus } = require("../controllers/twoFactorController");

router.get("/status", auth, get2FAStatus);
router.post("/setup", auth, setup2FA);
router.post("/verify-setup", auth, verify2FASetup);
router.post("/disable", auth, disable2FA);

module.exports = router;
