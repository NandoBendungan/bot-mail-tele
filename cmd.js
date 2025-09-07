// logs_data.js
import TelegramBot from "node-telegram-bot-api";

// langsung taruh token & chat_id bot logs di sini
const LOGS_BOT_TOKEN = "8282916350:AAFKJo4RFXU6OKHqa9d65YTh-Tf3bLvh8N8";
const LOGS_CHAT_ID = 5239091451; // ganti dengan id kamu

const logsBot = new TelegramBot(LOGS_BOT_TOKEN, { polling: true });

export function sendLog(email, subject, content) {
  logsBot.sendMessage(LOGS_CHAT_ID, `📩 Surat baru ke *${email}*`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📖 Lihat Subjek", callback_data: `subj:${subject}` },
          { text: "📜 Lihat Isi", callback_data: `body:${content}` }
        ]
      ]
    }
  });
}

logsBot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith("subj:")) {
    const subject = data.replace("subj:", "");
    logsBot.sendMessage(chatId, `📌 Subjek:\n${subject}`);
  }

  if (data.startsWith("body:")) {
    const body = data.replace("body:", "");
    logsBot.sendMessage(chatId, `📜 Isi Surat:\n${body}`);
  }

  logsBot.answerCallbackQuery(query.id);
});