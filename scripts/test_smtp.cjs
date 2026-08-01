const nodemailer = require("nodemailer");
const user = "verify.lumorai@gmail.com";
const pass = "zgul chiv dims vcfi";
console.log("Testing password len=", pass.length, "hex=", Buffer.from(pass, "utf-8").toString("hex"));
const t = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user, pass: pass },
  pool: false,
});
try {
  const res = await t.verify();
  console.log("VERIFY SUCCESS:", res);
} catch (e) {
  console.error("ERR:", e.message?.slice(0, 200));
}
t.close();
