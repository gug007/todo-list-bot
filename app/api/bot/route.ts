import bot from "@/lib/bot";
import "@/lib/telegram"; // Import to register listeners
import { NextRequest, NextResponse } from "next/server";

// Use VERCEL_URL if available, otherwise use the ngrok URL from env variables.
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/bot`
  : process.env.NEXT_PUBLIC_WEBHOOK_URL;

export async function GET() {
  if (!WEBHOOK_URL) {
    return NextResponse.json(
      {
        message:
          "Webhook URL not configured. Please set NEXT_PUBLIC_WEBHOOK_URL in .env.local",
      },
      { status: 400 }
    );
  }
  const response = await bot.setWebHook(WEBHOOK_URL, {
    allowed_updates: [
      "inline_query",
      "chosen_inline_result",
      "callback_query",
      "message",
    ],
  });
  console.log(response);
  return NextResponse.json({
    message: `Webhook set to ${WEBHOOK_URL}`,
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();

  bot.processUpdate(payload);

  return NextResponse.json({ status: "ok" });
}
