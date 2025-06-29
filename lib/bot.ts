import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN || "";

// Initialize the bot without polling. Webhooks will be used instead.
const bot = new TelegramBot(token);

export default bot; 