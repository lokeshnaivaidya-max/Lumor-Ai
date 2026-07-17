import nodemailer from "nodemailer";
const user = "verify.lumorai@gmail.com";

async function test(label, pass) {
  console.log(`\n--- ${label} (len=${pass.length}) ---`);
  const t = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user, pass }, pool: false,
    socketTimeout: 10_000,
  });
  try {
    await t.verify();
    console.log("*** VERIFY: SUCCESS ***");
    const info = await t.sendMail({
      from: `"Lumor AI" <${user}>`,
      replyTo: user,
      to: "test-verify-lumorai@yopmail.com",
      subject: `Test ${label}`,
      html: "<p>Test</p>",
    });
    console.log("SEND: SUCCESS", { messageId: info.messageId });
  } catch (e) {
    console.log("FAIL:", e.message?.slice(0, 100));
  }
  t.close();
}

await test("mail-spaces", "dlkn oygw vldj dyij");
await test("mail-nospace", "dlknoygwvldjdyij");
await test("other-spaces", "whsn nxpn owod wmzx");
await test("other-nospace", "whsnxpnxowodwmzx");
