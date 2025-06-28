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

async function sendTelegramRequest(method: string, data: Record<string, unknown>) {
  console.log(`Making Telegram API request: ${method}`, JSON.stringify(data, null, 2));
  
  if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not defined');
  }
  
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  console.log(`Request URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const responseText = await response.text();
    console.log(`Telegram API response status: ${response.status}`);
    console.log(`Telegram API response: ${responseText}`);
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status} - ${responseText}`);
    }
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error in sendTelegramRequest:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 POST handler started');
  
  try {
    console.log('🔍 Checking BOT_TOKEN...');
    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found');
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }
    console.log('✅ BOT_TOKEN exists');

    console.log('📝 Parsing request body...');
    const update: TelegramUpdate = await request.json();
    console.log('✅ Request parsed successfully');
    console.log('📨 Received update:', JSON.stringify(update, null, 2));

    // Handle inline queries
    if (update.inline_query) {
      console.log('🔍 Processing inline query...');
      
      const query = update.inline_query.query;
      const queryId = update.inline_query.id;
      const userName = update.inline_query.from.first_name;

      console.log(`👤 Inline query from ${userName}: "${query}"`);
      console.log(`🆔 Query ID: ${queryId}`);
      console.log(`🌐 MINI_APP_URL: ${MINI_APP_URL}`);

      console.log('🔨 Building results array...');
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
        console.log('📝 Adding quick todo option...');
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

      console.log(`✅ Built ${results.length} results`);
      console.log('🚀 Calling sendTelegramRequest...');

      await sendTelegramRequest('answerInlineQuery', {
        inline_query_id: queryId,
        results: results,
        cache_time: 0, // Don't cache for development
        is_personal: true
      });

      console.log(`✅ Answered inline query with ${results.length} results`);
      return NextResponse.json({ success: true });
    }

    // Handle regular messages (optional)
    if (update.message) {
      console.log('💬 Processing regular message...');
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;

      console.log(`👤 Message from ${message.from.first_name}: "${text}"`);

      // Send a response with mini app button
      if (text === '/start') {
        console.log('🚀 Sending start message...');
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

    console.log('❓ Update received but no action taken');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('💥 Webhook error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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