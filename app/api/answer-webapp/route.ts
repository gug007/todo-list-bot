import bot from "@/lib/bot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { query_id, text } = await request.json();

  if (!query_id || !text) {
    return NextResponse.json(
      { error: "query_id and text are required" },
      { status: 400 }
    );
  }

  try {
    await bot.answerWebAppQuery(query_id, {
      type: "article",
      id: Date.now().toString(),
      title: "Updated message",
      input_message_content: {
        message_text: text,
      },
    } as any);

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("answerWebAppQuery error", err);
    return NextResponse.json({ error: "Failed to answer web app query" }, { status: 500 });
  }
} 