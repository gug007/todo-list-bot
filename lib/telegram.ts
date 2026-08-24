import bot from "./bot";
import { encodeStartParam } from "./startParams";
import { formatTodoText } from "./todoFormatter";
import type {
  InlineQuery,
  CallbackQuery,
  ChosenInlineResult,
  Message,
  InlineQueryResultArticle,
} from "node-telegram-bot-api";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// Bot username and Mini App short name for generating direct Mini App links.
const botUsername = process.env.TELEGRAM_BOT_USERNAME || "";
const miniAppName = process.env.TELEGRAM_MINI_APP_NAME || "";

/**
 * Generates a direct Mini App link in the form:
 *   https://t.me/<bot_username>/<short_name>?startapp=<start_parameter>
 * Falls back to the classic web-app URL when required env vars are missing.
 */
export function getDirectMiniAppLink(
  startParamObj: Record<string, unknown>
): string {
  const startParam = encodeStartParam(startParamObj);
  console.log(botUsername, miniAppName);
  if (botUsername && miniAppName) {
    console.log(
      `https://t.me/${botUsername}/${miniAppName}?startapp=${encodeURIComponent(
        startParam
      )}`
    );
    return `https://t.me/${botUsername}/${miniAppName}?startapp=${encodeURIComponent(
      startParam
    )}`;
  }
  // Fallback to the traditional hosted web-app URL (mainly for local development).
  if (!appUrl) {
    throw new Error(
      "App URL is not defined and direct Mini App env vars are missing."
    );
  }
  return `${appUrl}?id=${encodeURIComponent(startParam)}`;
}

// Telegram truncates inline queries at 256 characters before they reach the bot.
const INLINE_QUERY_LIMIT = 256;

bot.on("inline_query", async (query: InlineQuery) => {
  const queryText = query.query || "";
  if (!appUrl) {
    console.error("App URL is not defined. Please set NEXT_PUBLIC_APP_URL.");
    // Optionally, inform the user via the inline query result
    await bot.answerInlineQuery(
      query.id,
      [
        {
          type: "article",
          id: "error",
          title: "Configuration Error",
          input_message_content: {
            message_text:
              "The application is not configured correctly. Missing APP_URL.",
          },
        },
      ],
      { cache_time: 0 }
    );
    return;
  }

  const formattedQueryText = formatTodoText(queryText);

  // A query at (or one short of) the limit was almost certainly cut off by Telegram.
  const isLikelyTruncated = queryText.length >= INLINE_QUERY_LIMIT - 1;

  const results: InlineQueryResultArticle[] = [
    {
      type: "article",
      id: "1",
      title: isLikelyTruncated
        ? "⚠️ Text cut off at 256 characters"
        : "📝 Create Todo List",
      description: isLikelyTruncated
        ? "Telegram limits inline text to 256 chars. Send the full text to the bot chat instead, then forward the list."
        : queryText
        ? formattedQueryText
        : "Create a new todo list",
      input_message_content: {
        message_text: formattedQueryText,
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Edit",
              url: getDirectMiniAppLink({ q: formattedQueryText }),
            },
          ],
        ],
      },
    },
  ];

  await bot.answerInlineQuery(query.id, results, { cache_time: 0 });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
bot.on("callback_query", async (_callbackQuery: CallbackQuery) => {
  // Currently not used
});

// Handle when the user selects an inline result so we have the inline_message_id
// after the inline message is sent.
bot.on("chosen_inline_result", async (chosen: ChosenInlineResult) => {
  const inlineId = chosen.inline_message_id;
  console.log(44444444, chosen);
  if (!inlineId || !appUrl) return;

  const updatedUrl = getDirectMiniAppLink({ id: inlineId, q: chosen.query });

  try {
    await bot.editMessageReplyMarkup(
      {
        inline_keyboard: [
          [
            {
              text: "Edit",
              url: updatedUrl,
            },
          ],
        ],
      },
      {
        inline_message_id: inlineId,
      }
    );
  } catch (err) {
    console.error("Failed to update button markup", err);
  }
});

// Direct-chat fallback: inline queries are capped at 256 characters by
// Telegram, so longer lists must be sent to the bot's private chat. The bot
// replies with the formatted checklist, which can then be forwarded.
bot.on("message", async (msg: Message) => {
  // Only plain text sent directly to the bot in a private chat; ignore
  // messages sent *via* the bot (inline results) so we don't reply to our
  // own checklists. `via_bot` is missing from the outdated library typings.
  const viaBot = (msg as Message & { via_bot?: { id: number } }).via_bot;
  if (msg.chat.type !== "private" || !msg.text || viaBot) return;

  if (msg.text.startsWith("/")) {
    if (msg.text.startsWith("/start")) {
      await bot.sendMessage(
        msg.chat.id,
        "Send me any text and I'll turn it into a todo list you can forward.\n\n" +
          `Tip: inline mode (@${botUsername} ...) is limited to ${INLINE_QUERY_LIMIT} characters by Telegram — for longer lists send the text here.`
      );
    }
    return;
  }

  const formattedText = formatTodoText(msg.text);

  try {
    const sent = await bot.sendMessage(msg.chat.id, formattedText);
    // The Edit link needs the message id, which is only known after sending.
    await bot.editMessageReplyMarkup(
      {
        inline_keyboard: [
          [
            {
              text: "Edit",
              url: getDirectMiniAppLink({
                c: sent.chat.id,
                m: sent.message_id,
                q: formattedText,
              }),
            },
          ],
        ],
      },
      {
        chat_id: sent.chat.id,
        message_id: sent.message_id,
      }
    );
  } catch (err) {
    console.error("Failed to send todo list reply", err);
  }
});
