import bot from "@/lib/bot";
import { NextRequest, NextResponse } from "next/server";

// Import the getDirectMiniAppLink function from the telegram utility file
import { getDirectMiniAppLink } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const { inline_message_id, chat_id, message_id, text } = await request.json();

  if (!text || (!inline_message_id && !(chat_id && message_id))) {
    return NextResponse.json(
      {
        error:
          "text and either inline_message_id or chat_id + message_id are required",
      },
      { status: 400 }
    );
  }

  try {
    if (inline_message_id) {
      // Message sent via inline mode.
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
    } else {
      // Message sent by the bot in a private chat.
      await bot.editMessageText(text, {
        chat_id: chat_id,
        message_id: message_id,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Edit",
                url: getDirectMiniAppLink({ c: chat_id, m: message_id, q: text }),
              },
            ],
          ],
        },
      });
    }
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
}
