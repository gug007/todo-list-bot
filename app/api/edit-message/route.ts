import bot from "@/lib/bot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { inline_message_id, text } = await request.json();

  if (!inline_message_id || !text) {
    return NextResponse.json(
      { error: "inline_message_id and text are required" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "App URL is not configured" },
      { status: 500 }
    );
  }

  try {
    await bot.editMessageText(text, {
      inline_message_id: inline_message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Edit message",
              url: `${appUrl}?id=${inline_message_id}&text=${encodeURIComponent(text)}`,
            },
          ],
        ],
      },
    });
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
} 