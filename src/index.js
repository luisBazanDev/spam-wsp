const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
var advancement = {
  pending: [],
  ready: [],
};

const client = new Client({
  authStrategy: new LocalAuth(),
});

var qrcode = require("qrcode-terminal");

const msgs = ["Hellow world"];

client.on("qr", (qr) => {
  // Generate and scan this code with your phone
  console.log("QR RECEIVED");
  qrcode.generate(qr, {
    small: true,
  });
});

client.on("ready", async () => {
  console.log("Client is ready!");

  // load advancement
  if (fs.existsSync("./db.json")) {
    advancement = require("../db.json");
    let i = 1;
    for (const number of advancement.ready) {
      console.log(`#${i} Omit ${number}`);
      i++;
    }
  } else {
    saveAdvancement();
  }

  var contacts = (await client.getContacts())
    .filter((cont) => cont.number != null)
    .filter((cont) => cont.name != undefined)
    .filter((cont) => {
      if (advancement.ready.indexOf(cont.number) === -1) return true;
      else return false;
    });
  for (const pending of advancement.pending) {
    if (contacts.filter((c) => c.number == pending.number).length <= 0) {
      contacts.push(pending);
    }
  }
  console.log(`Loaded ${contacts.length} valid contacts.`);
  console.log(`Messages are:\n${msgs}`);

  const index = 0;
  setInterval(() => {
    const contact = contacts[index];
    if (contact == undefined) {
      console.log("Finish! :D");
      return process.exit();
    }
    console.log(
      `#${index + 1} Send msg to ${contact.name} - ${contact.number}`
    );
    client
      .sendMessage(contact.number, getMsg)
      .then(() => {
        advancement.ready.push(contact.number);
        saveAdvancement();
        console.log(`#${index + 1} Sendding, next!`);
      })
      .catch(() => {
        advancement.pending.push(contact);
        saveAdvancement();
        console.log(`#${index + 1} Error.`);
      });
    index + 1;
  }, 600);
});

function getMsg() {
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function saveAdvancement() {
  fs.writeFileSync("./db.json", JSON.stringify(advancement), {
    encoding: "utf-8",
  });
}

client.initialize();
