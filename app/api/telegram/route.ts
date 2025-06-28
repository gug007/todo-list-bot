import { NextRequest, NextResponse } from 'next/server';

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
    inline_keyboard: Array<Array<{
      text: string;
      web_app: {
        url: string;
      };
    }>>;
  };
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : 'https://your-app.vercel.app'; // Fallback

async function sendTelegramRequest(method: string, data: any) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    console.error(`Telegram API error: ${response.status}`, await response.text());
    throw new Error(`Telegram API error: ${response.status}`);
  }
  
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not found');
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const update: TelegramUpdate = await request.json();
    console.log('Received update:', JSON.stringify(update, null, 2));

    // Handle inline queries
    if (update.inline_query) {
      const query = update.inline_query.query;
      const queryId = update.inline_query.id;
      const userName = update.inline_query.from.first_name;

      console.log(`Inline query from ${userName}: "${query}"`);

      const results: InlineQueryResult[] = [
        {
          type: 'article',
          id: 'create_todo',
          title: '📝 Create Todo Item',
          description: query 
            ? `Create todo: "${query}"` 
            : 'Open mini app to create a new todo item',
          input_message_content: {
            message_text: query 
              ? `✅ Todo: ${query}` 
              : '✅ New todo item created'
          },
          reply_markup: {
            inline_keyboard: [[{
              text: '📝 Open Todo App',
              web_app: {
                url: MINI_APP_URL
              }
            }]]
          }
        }
      ];

      // If user typed something, also offer a quick option
      if (query.trim()) {
        results.unshift({
          type: 'article',
          id: 'quick_todo',
          title: `✅ Quick Todo: ${query}`,
          description: 'Send this todo directly',
          input_message_content: {
            message_text: `✅ Todo: ${query}\n\n📅 Created: ${new Date().toLocaleDateString()}`
          }
        });
      }

      await sendTelegramRequest('answerInlineQuery', {
        inline_query_id: queryId,
        results: results,
        cache_time: 0, // Don't cache for development
        is_personal: true
      });

      console.log(`Answered inline query with ${results.length} results`);
      return NextResponse.json({ success: true });
    }

    // Handle regular messages (optional)
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;

      console.log(`Message from ${message.from.first_name}: "${text}"`);

      // Send a response with mini app button
      if (text === '/start') {
        await sendTelegramRequest('sendMessage', {
          chat_id: chatId,
          text: `👋 Welcome ${message.from.first_name}!\n\n📝 Use this bot in two ways:\n\n1️⃣ **Inline mode**: Type @createtodolistbot in any chat\n2️⃣ **Direct mode**: Use the button below`,
          reply_markup: {
            inline_keyboard: [[{
              text: '📝 Open Todo App',
              web_app: {
                url: MINI_APP_URL
              }
            }]]
          }
        });
      }

      return NextResponse.json({ success: true });
    }

    console.log('Update received but no action taken');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Telegram webhook endpoint is running',
    timestamp: new Date().toISOString(),
    miniAppUrl: MINI_APP_URL
  });
} 