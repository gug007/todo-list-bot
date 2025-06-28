import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 500 }
      );
    }

    const { chatId, messageId, newText } = await request.json();

    if (!chatId || !messageId || !newText) {
      return NextResponse.json(
        { error: "Missing required fields: chatId, messageId, newText" },
        { status: 400 }
      );
    }

    // Update the message using Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: `✅ Todo: ${newText}`,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✏️ Edit Again",
                  url: `${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://your-app.vercel.app"}?edit=true&content=${encodeURIComponent(newText)}&messageId=${messageId}`,
                },
              ],
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to update message", details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Update message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Update message endpoint is running",
    description: "POST to this endpoint with chatId, messageId, and newText to update a Telegram message",
  });
} 