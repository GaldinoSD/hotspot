const db = require("../db");

async function check() {
  try {
    console.log("=== radius_users ===");
    const [ru] = await db.query("SELECT * FROM radius_users");
    console.log(ru);

    console.log("=== radcheck ===");
    const [rc] = await db.query("SELECT * FROM radcheck");
    console.log(rc);

    console.log("=== radreply ===");
    const [rr] = await db.query("SELECT * FROM radreply");
    console.log(rr);

    console.log("=== radusergroup ===");
    const [rug] = await db.query("SELECT * FROM radusergroup");
    console.log(rug);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
