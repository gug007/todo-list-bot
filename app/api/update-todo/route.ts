import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac } from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://your-app.vercel.app";

// Validate Telegram WebApp initData
function validateTelegramData(initData: string, botToken: string): any {
  if (!initData) return null;
  
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Create the data-check-string
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create the secret key
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Create the hash
    const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) {
      console.log('Hash validation failed');
      return null;
    }
    
    // Parse the user and query data
    const result: any = {};
    for (const [key, value] of urlParams) {
      if (key === 'user' || key === 'chat') {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 500 }
      );
    }

    const { content, originalContent, initData } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    console.log('Update todo request:', { content, originalContent, hasInitData: !!initData });

    // Try to validate and parse Telegram data
    let telegramData = null;
    if (initData) {
      telegramData = validateTelegramData(initData, BOT_TOKEN);
      console.log('Parsed Telegram data:', telegramData);
    }

    // For now, let's create a simple response since we may not have chat context
    // In a production app, you'd want to store the chat ID when the todo is first created
    
    // If we have user data, we could try to send a message to the user directly
    if (telegramData?.user?.id) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramData.user.id,
            text: `✅ Todo Updated!\n\nOld: ${originalContent || 'N/A'}\nNew: ${content}`,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✏️ Edit Again",
                    url: `${MINI_APP_URL}?edit=true&content=${encodeURIComponent(content)}`,
                  },
                ],
              ],
            },
          }),
        });

        if (response.ok) {
          console.log('Successfully sent update message to user');
          return NextResponse.json({ 
            success: true, 
            message: "Todo updated and notification sent" 
          });
        } else {
          const errorText = await response.text();
          console.error("Error sending message to user:", response.status, errorText);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }

    // Fallback: just return success even if we couldn't send a message
    console.log('Todo update processed (no message sent)');
    return NextResponse.json({ 
      success: true, 
      message: "Todo updated successfully",
      debug: {
        hasTelegramData: !!telegramData,
        hasUserId: !!telegramData?.user?.id
      }
    });

  } catch (error) {
    console.error("Update todo error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Update todo endpoint is running",
    description: "POST to this endpoint with content, originalContent, and initData to update a todo",
  });
} 