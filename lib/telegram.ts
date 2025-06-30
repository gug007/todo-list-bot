import bot from "./bot";
import { encodeStartParam } from "./startParams";
import type {
  InlineQuery,
  CallbackQuery,
  ChosenInlineResult,
  Message,
  InlineQueryResultArticle,
} from "node-telegram-bot-api";

const vercelUrl = process.env.VERCEL_URL;
// Use VERCEL_URL if available, otherwise use the app URL from env variables.
const appUrl = vercelUrl
  ? `https://${vercelUrl}`
  : process.env.NEXT_PUBLIC_APP_URL;

// Bot username and Mini App short name for generating direct Mini App links.
const botUsername = process.env.TELEGRAM_BOT_USERNAME || "";
const miniAppName = process.env.TELEGRAM_MINI_APP_NAME || "";

/**
 * Generates a direct Mini App link in the form:
 *   https://t.me/<bot_username>/<short_name>?startapp=<start_parameter>
 * Falls back to the classic web-app URL when required env vars are missing.
 */
export function getDirectMiniAppLink(startParamObj: Record<string, unknown>): string {
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

  const results: InlineQueryResultArticle[] = [
    {
      type: "article",
      id: "1",
      title: "Create a new message",
      input_message_content: {
        message_text: queryText,
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Edit message",
              url: getDirectMiniAppLink({ q: queryText }),
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
              text: "Edit message",
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

// We can listen to any message to extract text and provide a way to edit it.
// This is not part of the original request, but it's a good example.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
bot.on("message", (_msg: Message) => {
  // Not used
});
