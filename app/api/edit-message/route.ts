import bot from "@/lib/bot";
import { NextRequest, NextResponse } from "next/server";

// Import the getDirectMiniAppLink function from the telegram utility file
import { getDirectMiniAppLink } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const { inline_message_id, text } = await request.json();

  if (!inline_message_id || !text) {
    return NextResponse.json(
      { error: "inline_message_id and text are required" },
      { status: 400 }
    );
  }

  try {
    await bot.editMessageText(text, {
      inline_message_id: inline_message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Edit",
              url: getDirectMiniAppLink({ id: inline_message_id, q: text }),
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