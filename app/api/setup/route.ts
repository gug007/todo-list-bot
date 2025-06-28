import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/telegram`
  : process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/telegram`
  : null;

async function telegramRequest(method: string, data: Record<string, unknown> = {}) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Telegram API error: ${result.description || response.status}`);
  }
  
  return result;
}

export async function POST() {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ 
        error: 'TELEGRAM_BOT_TOKEN environment variable not found',
        instructions: 'Add your bot token to Vercel environment variables'
      }, { status: 400 });
    }

    if (!WEBHOOK_URL) {
      return NextResponse.json({ 
        error: 'Could not determine webhook URL',
        instructions: 'Make sure your app is deployed to Vercel'
      }, { status: 400 });
    }

    const results = [];

    // 1. Get bot info
    try {
      const botInfo = await telegramRequest('getMe');
      results.push({ step: 'Bot Info', success: true, data: botInfo.result });
    } catch (error) {
      results.push({ step: 'Bot Info', success: false, error: (error as Error).message });
      return NextResponse.json({ results }, { status: 400 });
    }

    // 2. Set webhook
    try {
      const webhookResult = await telegramRequest('setWebhook', {
        url: WEBHOOK_URL,
        allowed_updates: ['inline_query', 'message']
      });
      results.push({ step: 'Set Webhook', success: true, data: webhookResult });
    } catch (error) {
      results.push({ step: 'Set Webhook', success: false, error: (error as Error).message });
    }

    // 3. Set commands
    try {
      const commandsResult = await telegramRequest('setMyCommands', {
        commands: [
          {
            command: 'start',
            description: 'Start the bot and see options'
          }
        ]
      });
      results.push({ step: 'Set Commands', success: true, data: commandsResult });
    } catch (error) {
      results.push({ step: 'Set Commands', success: false, error: (error as Error).message });
    }

    // 4. Get webhook info
    try {
      const webhookInfo = await telegramRequest('getWebhookInfo');
      results.push({ step: 'Webhook Info', success: true, data: webhookInfo.result });
    } catch (error) {
      results.push({ step: 'Webhook Info', success: false, error: (error as Error).message });
    }

    return NextResponse.json({ 
      success: true,
      webhook_url: WEBHOOK_URL,
      results,
      next_steps: [
        '1. Go to @BotFather in Telegram',
        '2. Send /setinline',
        '3. Select your bot',
        '4. Set placeholder text like "Create todo item..."',
        '5. Test by typing @yourbotname in any chat'
      ]
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Telegram Bot Setup Endpoint',
    instructions: 'Send a POST request to this endpoint to configure your bot',
    required_env_vars: {
      TELEGRAM_BOT_TOKEN: BOT_TOKEN ? '✅ Set' : '❌ Missing',
      VERCEL_URL: WEBHOOK_URL ? '✅ Set' : '❌ Missing'
    },
    webhook_url: WEBHOOK_URL
  });
} 