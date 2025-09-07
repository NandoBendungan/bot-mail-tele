import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import config from "./config.js"; // 🔥 ambil token & owner id dari config.js

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });
const OWNER_ID = config.OWNER_ID;

let account = null;
let token = null;
let lastResponse = {};
let userStates = {};

const texts = {
  id: {
    banner: `
╭───────────────────❒
│ 📧  *TEMP MAIL BOT*
│───────────────────
│ 👋 Selamat datang di layanan  
│ *Temporary Email Bot*  
│ Kamu bisa membuat email sementara  
│ untuk daftar, verifikasi, atau uji coba.
│
│ 📌 *Fitur Utama:*
│
│ 1. 📧 New Mail   → Buat alamat email baru
│ 2. 📥 Inbox      → Lihat pesan masuk
│ 3. 🔄 Refresh    → Segarkan inbox
│ 4. 🗑 Delete     → Hapus semua pesan
│
╰───────────────────❒
⚡ Powered by NandSki
━━━━━━━━━━━━━━━━━━━━━━`,
    active: email => `
╭───────────────────❒
│ 📧 Email aktif saat ini:
│ ─>>  ${email}  <<─
│───────────────────
│ Gunakan menu di bawah:
│
│ 📥 Inbox    → cek pesan masuk
│ 🔄 Refresh  → segarkan inbox
│ 🗑 Delete   → hapus semua pesan
╰───────────────────❒`,
    needEmail: `
⚠️ Kamu belum punya email aktif!
Silakan buat dulu dengan:
📧 New Mail → untuk membuat email baru
━━━━━━━━━━━━━━━━━━━━━━`,
    inboxEmpty: `
📭 Inbox kosong!
Belum ada pesan masuk saat ini.
━━━━━━━━━━━━━━━━━━━━━━`,
    inboxUpdated: n => `
🔄 Inbox berhasil diperbarui!
Total pesan masuk: *${n}*
━━━━━━━━━━━━━━━━━━━━━━`,
    deleted: `
🗑 Semua pesan berhasil dihapus!
Inbox sekarang kosong.
━━━━━━━━━━━━━━━━━━━━━━`,
    read: (from, subject, content) => `
╭───────────────────❒
│ 📧 Dari: *${from}*
│ 📌 Subjek: *${subject}*
│───────────────────
│ 📝 Isi pesan:
│ ${content}
╰───────────────────❒`,
    choose: `
👋 Selamat datang!  
Silakan pilih menu utama:

1. 📧 New Mail   → Buat email baru  
2. 📥 Inbox      → Lihat pesan masuk  
3. 🔄 Refresh    → Segarkan inbox  
4. 🗑 Delete     → Hapus semua pesan  

━━━━━━━━━━━━━━━━━━━━━━`
  },

  en: {
    banner: `
╭───────────────────❒
│ 📧  *TEMP MAIL BOT*
│───────────────────
│ 👋 Welcome to the
│ *Temporary Email Bot*  
│ You can create disposable email  
│ for signup, verification, or testing.
│
│ 📌 *Main Features:*
│
│ 1. 📧 New Mail   → Create new email
│ 2. 📥 Inbox      → View messages
│ 3. 🔄 Refresh    → Refresh inbox
│ 4. 🗑 Delete     → Delete all messages
│
╰───────────────────❒
⚡ Powered by NandSki
━━━━━━━━━━━━━━━━━━━━━━`,
    active: email => `
╭───────────────────❒
│ 📧 Current active email:
│ ─>>  ${email}  <<─
│───────────────────
│ Available commands:
│
│ 📥 Inbox    → check messages
│ 🔄 Refresh  → refresh inbox
│ 🗑 Delete   → delete all messages
╰───────────────────❒`,
    needEmail: `
⚠️ You don’t have an active email yet!
Please create one first:
📧 New Mail → generate new email
━━━━━━━━━━━━━━━━━━━━━━`,
    inboxEmpty: `
📭 Your inbox is empty!
No messages received yet.
━━━━━━━━━━━━━━━━━━━━━━`,
    inboxUpdated: n => `
🔄 Inbox refreshed!
Total messages: *${n}*
━━━━━━━━━━━━━━━━━━━━━━`,
    deleted: `
🗑 All messages deleted!
Your inbox is now empty.
━━━━━━━━━━━━━━━━━━━━━━`,
    read: (from, subject, content) => `
╭───────────────────❒
│ 📧 From: *${from}*
│ 📌 Subject: *${subject}*
│───────────────────
│ 📝 Message:
│ ${content}
╰───────────────────❒`,
    choose: `
👋 Welcome!  
Please choose a menu below:

1. 📧 New Mail   → Create new email  
2. 📥 Inbox      → View messages  
3. 🔄 Refresh    → Refresh inbox  
4. 🗑 Delete     → Delete all messages  

━━━━━━━━━━━━━━━━━━━━━━`
  }
};

async function createAccount() {
  const domainRes = await fetch("https://api.mail.tm/domains");
  const domains = await domainRes.json();
  const domain = domains["hydra:member"][0].domain;
  function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
  }

  const username = `nand${randomString(7)}@${domain}`
  const password = `Dungan2010`;
  await fetch("https://api.mail.tm/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: username, password })
  });
  const loginRes = await fetch("https://api.mail.tm/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: username, password })
  });
  const loginData = await loginRes.json();
  token = loginData.token;
  account = { email: username, password };
  return account;
}

async function getInbox() {
  const res = await fetch("https://api.mail.tm/messages", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data["hydra:member"];
}

async function getMessage(id) {
  const res = await fetch(`https://api.mail.tm/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
}

async function deleteAll() {
  const inbox = await getInbox();
  for (const msg of inbox) {
    await fetch(`https://api.mail.tm/messages/${msg.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}


let users = new Set(); // simpan semua user

// Simpan user saat mulai
bot.onText(/\/start/, async msg => {
  const chatId = msg.chat.id;
  users.add(chatId); // simpan id user

  const langKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🇮🇩 Bahasa Indonesia", callback_data: "lang_id" }],
        [{ text: "🇬🇧 English", callback_data: "lang_en" }]
      ]
    }
  };
  await bot.sendMessage(chatId, "🌍 Please select language / Pilih bahasa:", langKeyboard);
});

// === FITUR BROADCAST ===
bot.onText(/\/bcbot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (chatId !== OWNER_ID) {
    return bot.sendMessage(chatId, "⛔ Kamu tidak punya izin untuk menggunakan perintah ini.");
  }

  const message = match[1]; // isi pesan setelah /broadcast
  let sentCount = 0;

  for (let userId of users) {
    try {
      await bot.sendMessage(userId, `📢 *Broadcast:*\n\n${message}`, { parse_mode: "Markdown" });
      sentCount++;
    } catch (err) {
      console.log(`Gagal kirim ke ${userId}: ${err.message}`);
    }
  }

  bot.sendMessage(chatId, `✅ Broadcast berhasil dikirim ke ${sentCount} pengguna.`);
});

bot.onText(/\/menu/, async msg => {
  const chatId = msg.chat.id;
  const lang = (userStates[chatId] && userStates[chatId].lang) || "id";
  const t = texts[lang];
  const opts = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📧 New Mail", callback_data: "newmail" }],
        [{ text: "📥 Inbox", callback_data: "inbox" }],
        [
          { text: "🔄 Refresh", callback_data: "refresh" },
          { text: "🗑 Delete", callback_data: "delete" }
        ]
      ]
    }
  };
  if (userStates[chatId] && userStates[chatId].email) {
    await bot.sendMessage(chatId, t.banner + `\n${t.active(userStates[chatId].email)}`, opts);
  } else {
    await bot.sendMessage(chatId, t.banner, opts);
  }
});

bot.on("callback_query", async query => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const action = query.data;
  const lang = (userStates[chatId] && userStates[chatId].lang) || "id";
  const t = texts[lang];

if (action.startsWith("lang_")) {
  const chosen = action.split("_")[1];
  if (!userStates[chatId]) userStates[chatId] = {};
  userStates[chatId].lang = chosen;

  // hapus pesan "pilih bahasa"
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (e) {}

  // langsung kirim menu utama
  await bot.sendMessage(chatId, t.banner, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "📧 New Mail", callback_data: "newmail" }],
        [{ text: "📥 Inbox", callback_data: "inbox" }],
        [
          { text: "🔄 Refresh", callback_data: "refresh" },
          { text: "🗑 Delete", callback_data: "delete" }
        ]
      ]
    }
  });
  bot.answerCallbackQuery(query.id);
  return;
}

  if (lastResponse[chatId]) {
    try { await bot.deleteMessage(chatId, lastResponse[chatId]); } catch {}
  }

  let text = "";
  let keyboard = null;

  if (action === "newmail") {
    account = await createAccount();
    if (!userStates[chatId]) userStates[chatId] = {};
    userStates[chatId].email = account.email;
    try {
      await bot.editMessageText(t.active(account.email), {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: "📧 New Mail", callback_data: "newmail" }],
            [{ text: "📥 Inbox", callback_data: "inbox" }],
            [
              { text: "🔄 Refresh", callback_data: "refresh" },
              { text: "🗑 Delete", callback_data: "delete" }
            ]
          ]
        }
      });
    } catch {}
  }

  if (action === "inbox") {
    if (!token) {
      text = t.needEmail;
    } else {
      const inbox = await getInbox();
      if (inbox.length === 0) {
        text = t.inboxEmpty;
      } else {
        text = inbox.map((m, i) => `${i + 1}. ${m.from.address}\n   ${m.subject}`).join("\n\n");
        keyboard = inbox.map(m => [{ text: `📖 ${m.subject}`, callback_data: `read_${m.id}` }]);
        keyboard.push([{ text: "🔙 Back to Menu", callback_data: "back_to_menu" }]);
      }
    }
  }

  if (action === "refresh") {
    if (!token) text = t.needEmail;
    else {
      const inbox = await getInbox();
      text = t.inboxUpdated(inbox.length);
    }
  }

  if (action === "delete") {
    if (!token) text = t.needEmail;
    else {
      await deleteAll();
      text = t.deleted;
    }
  }

  if (action.startsWith("read_")) {
    if (!token) text = t.needEmail;
    else {
      const id = action.split("_")[1];
      const message = await getMessage(id);
      let content = message.text;
      if ((!content || content.trim() === "") && message.html?.length > 0) {
        content = message.html.join("\n").replace(/<[^>]+>/g, "");
      }
      text = t.read(message.from.address, message.subject, content);
      keyboard = [[{ text: "🔙 Back to Inbox", callback_data: "inbox" }]];
    }
  }

  if (action === "back_to_menu") {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📧 New Mail", callback_data: "newmail" }],
          [{ text: "📥 Inbox", callback_data: "inbox" }],
          [
            { text: "🔄 Refresh", callback_data: "refresh" },
            { text: "🗑 Delete", callback_data: "delete" }
          ]
        ]
      }
    };
    if (userStates[chatId] && userStates[chatId].email) text = t.active(userStates[chatId].email);
    else text = t.choose;
    const sent = await bot.sendMessage(chatId, text, opts);
    lastResponse[chatId] = sent.message_id;
    bot.answerCallbackQuery(query.id);
    return;
  }

  if (keyboard && !keyboard.some(row => row.some(btn => btn.callback_data === "back_to_menu"))) {
    keyboard.push([{ text: "🔙 Back to Menu", callback_data: "back_to_menu" }]);
  }

  if (text) {
    const sent = await bot.sendMessage(chatId, text, {
      reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined
    });
    lastResponse[chatId] = sent.message_id;
  }
  bot.answerCallbackQuery(query.id);
});

bot.on("message", async msg => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text.startsWith("/")) {
    const keyboard = {
      reply_markup: {
        keyboard: [
          ["📧 New Mail", "📥 Inbox"],
          ["🔄 Refresh", "🗑 Delete"]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
    if (!msg.reply_markup || !msg.reply_markup.keyboard) {
      await bot.sendMessage(chatId, "Pilih opsi di bawah:", keyboard);
    }
  }
});