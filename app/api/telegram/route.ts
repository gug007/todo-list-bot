import { NextRequest, NextResponse } from "next/server";

interface TelegramUpdate {
  inline_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    query: string;
    offset: string;
  };
  message?: {
    text: string;
    from: {
      id: number;
      first_name: string;
    };
    chat: {
      id: number;
    };
  };
}

interface InlineQueryResult {
  type: string;
  id: string;
  title: string;
  description: string;
  input_message_content: {
    message_text: string;
  };
  reply_markup?: {
    inline_keyboard: Array<
      Array<{
        text: string;
        url?: string;
        web_app?: {
          url: string;
        };
      }>
    >;
  };
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://your-app.vercel.app"; // Fallback

export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 500 }
      );
    }

    const update: TelegramUpdate = await request.json();

    // Handle inline queries with fast response
    if (update.inline_query) {
      const query = update.inline_query.query;
      const queryId = update.inline_query.id;

      // Build response quickly
      const results: InlineQueryResult[] = [];

      // Always add mini app option
      results.push({
        type: "article",
        id: "create_todo",
        title: "📝 Create Todo List",
        description: query
          ? `Create todo: "${query}"`
          : "Open mini app to create a new todo item",
        input_message_content: {
          message_text: query
            ? `✅ Todo: ${query}`
            : "✅ New todo item created",
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📝 Open Todo List",
                url: query 
                  ? `${MINI_APP_URL}?text=${encodeURIComponent(query)}`
                  : MINI_APP_URL,
              },
            ],
          ],
        },
      });

      // Respond to Telegram immediately
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/answerInlineQuery`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inline_query_id: queryId,
              results: results,
              cache_time: 0,
              is_personal: true,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Telegram API error:", response.status, errorText);
        }
      } catch (error) {
        console.error("Error responding to inline query:", error);
      }

      return NextResponse.json({ success: true });
    }

    // Handle regular messages
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;

      if (text === "/start") {
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `👋 Welcome ${message.from.first_name}!\n\n📝 Use this bot in two ways:\n\n1️⃣ **Inline mode**: Type @CreateTodoListBot in any chat\n2️⃣ **Direct mode**: Use the button below`,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "📝 Open Todo App",
                      web_app: { url: MINI_APP_URL },
                    },
                  ],
                ],
              },
            }),
          });
        } catch (error) {
          console.error("Error sending start message:", error);
        }
      } else if (text && text !== "/start") {
        // Handle any other text message by creating a todo app link with pre-filled content
        try {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `✅ Todo: ${text}`,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "✏️ Edit Todo",
                      web_app: { url: `${MINI_APP_URL}?text=${encodeURIComponent(text)}&chatId=${chatId}&mode=edit` },
                    },
                  ],
                ],
              },
            }),
          });

          // Get the message ID from the response for future editing
          if (response.ok) {
            const result = await response.json();
            if (result.result?.message_id) {
              const messageId = result.result.message_id;
              
              // Update the message to include the message ID for editing
              await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "✏️ Edit Todo",
                          web_app: { 
                            url: `${MINI_APP_URL}?text=${encodeURIComponent(text)}&messageId=${messageId}&chatId=${chatId}&mode=edit`
                          },
                        },
                      ],
                    ],
                  },
                }),
              });
            }
          }
        } catch (error) {
          console.error("Error sending message response:", error);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 500 }
      );
    }

    const { messageId, chatId, text } = await request.json();

    if (!messageId || !chatId || !text) {
      return NextResponse.json(
        { error: "Missing required fields: messageId, chatId, text" },
        { status: 400 }
      );
    }

    // Edit the message using Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `✅ Todo: ${text}`,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✏️ Edit Again",
                  web_app: { 
                    url: `${MINI_APP_URL}?text=${encodeURIComponent(text)}&messageId=${messageId}&chatId=${chatId}&mode=edit`
                  },
                },
              ],
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram edit message error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to edit message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Edit message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Telegram webhook endpoint is running",
    timestamp: new Date().toISOString(),
    miniAppUrl: MINI_APP_URL,
  });
}
