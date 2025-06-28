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
    web_app_data?: {
      data: string;
    };
  };
  web_app_data?: {
    data: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
    };
    data?: string;
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
    
    // Debug: Log all incoming updates
    console.log('Webhook received update:', JSON.stringify(update, null, 2));

    // Handle web app data (when mini app sends data back)
    if (update.message?.web_app_data) {
      console.log('Found web_app_data in message:', update.message.web_app_data);
      const chatId = update.message.chat.id;
      const webAppData = update.message.web_app_data.data;
      
      // Try to parse the data to see if it contains a message ID to edit
      let todoData = webAppData;
      let messageIdToEdit = null;
      
      try {
        const parsedData = JSON.parse(webAppData);
        if (parsedData.content) {
          todoData = parsedData.content;
        }
        if (parsedData.messageId) {
          messageIdToEdit = parsedData.messageId;
        }
      } catch {
        // If parsing fails, treat the entire data as todo content
        todoData = webAppData;
      }

      try {
        if (messageIdToEdit && messageIdToEdit !== 'PLACEHOLDER') {
          // Edit existing message
          console.log('Editing existing message:', messageIdToEdit);
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: parseInt(messageIdToEdit),
              text: `✅ Updated Todo: ${todoData}`,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "✏️ Edit Again",
                      url: `${MINI_APP_URL}?edit=true&content=${encodeURIComponent(todoData)}&userId=${update.message.from.id}&messageId=${messageIdToEdit}`,
                    },
                  ],
                ],
              },
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Error editing message:", response.status, errorText);
            // If edit fails, fall back to sending a new message
            throw new Error('Edit failed, falling back to new message');
          } else {
            console.log('Successfully edited existing todo message');
            return NextResponse.json({ success: true });
          }
        } else {
          // Send new message and store the message ID for future edits
          throw new Error('No valid message ID provided, sending new message');
        }
      } catch {
        console.log('Sending new todo message to chat:', chatId);
        console.log('Initial edit URL (without messageId):', `${MINI_APP_URL}?edit=true&content=${encodeURIComponent(todoData)}&userId=${update.message.from.id}`);
        
        // Send the updated todo as a new message
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ Todo: ${todoData}`,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✏️ Edit Todo",
                    url: `${MINI_APP_URL}?edit=true&content=${encodeURIComponent(todoData)}&userId=${update.message.from.id}`,
                  },
                ],
              ],
            },
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error sending message:", response.status, errorText);
        } else {
          const responseData = await response.json();
          const newMessageId = responseData.result?.message_id;
          console.log('New message sent with ID:', newMessageId);
          
          if (newMessageId) {
            const updatedEditUrl = `${MINI_APP_URL}?edit=true&content=${encodeURIComponent(todoData)}&userId=${update.message.from.id}&messageId=${newMessageId}`;
            console.log('Updating edit URL with messageId:', updatedEditUrl);
            
            // Update the button with the actual message ID
            const updateResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                message_id: newMessageId,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "✏️ Edit Todo",
                        url: updatedEditUrl,
                      },
                    ],
                  ],
                },
              }),
            });
            
            if (!updateResponse.ok) {
              const updateErrorText = await updateResponse.text();
              console.error("Error updating message buttons:", updateResponse.status, updateErrorText);
            } else {
              console.log('Successfully updated edit button with message ID:', newMessageId);
            }
          }
          console.log('Successfully sent new todo message');
        }
      }

      return NextResponse.json({ success: true });
    }
    
    // Check for other possible web app data formats
    if (update.web_app_data) {
      console.log('Found web_app_data at root level:', update.web_app_data);
    }
    
    // Check for callback query from mini app
    if (update.callback_query?.data) {
      console.log('Found callback query:', update.callback_query);
    }

    // Handle inline queries with fast response
    if (update.inline_query) {
      const query = update.inline_query.query;
      const queryId = update.inline_query.id;
      const userId = update.inline_query.from.id;

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
                text: "📝 Open Todo App",
                url: MINI_APP_URL,
              },
            ],
            [
              {
                text: "✏️ Edit Todo",
                url: `${MINI_APP_URL}?edit=true&content=${encodeURIComponent(query || "New todo item")}&userId=${userId}`,
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
                  [
                    {
                      text: "ℹ️ How to use inline mode",
                      url: "https://core.telegram.org/bots/inline",
                    },
                  ],
                ],
              },
            }),
          });
        } catch (error) {
          console.error("Error sending start message:", error);
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

export async function GET() {
  return NextResponse.json({
    status: "Telegram webhook endpoint is running",
    timestamp: new Date().toISOString(),
    miniAppUrl: MINI_APP_URL,
  });
}
