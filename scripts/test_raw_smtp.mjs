import tls from "tls";
const user = "verify.lumorai@gmail.com";
const pass = "zgulchivdimsvcfi";
const auth = Buffer.from(`\x00${user}\x00${pass}`, "utf-8").toString("base64");
console.log("AUTH base64:", auth);

const socket = tls.connect(465, "smtp.gmail.com", { rejectUnauthorized: false }, () => {
  let buf = "";
  socket.on("data", (chunk) => {
    buf += chunk.toString();
    const lines = buf.split("\r\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      console.log("S:", line);
      if (line.startsWith("220 ")) {
        socket.write("EHLO local\r\n");
      } else if (line.startsWith("250 ")) {
        socket.write("AUTH PLAIN " + auth + "\r\n");
      } else if (line.startsWith("235 ")) {
        console.log("*** AUTH SUCCESS! ***");
        socket.write("QUIT\r\n");
      } else if (line.startsWith("535 ")) {
        console.log("*** AUTH FAILED ***");
        socket.write("QUIT\r\n");
      } else if (line.startsWith("221 ")) {
        socket.end();
      }
    }
  });
});
setTimeout(() => process.exit(1), 15_000);
