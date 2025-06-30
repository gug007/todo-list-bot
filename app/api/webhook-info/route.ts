import bot from "@/lib/bot";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const info = await bot.getWebHookInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error("Failed to fetch webhook info", error);
    return NextResponse.json({ error: "Failed to fetch webhook info" }, { status: 500 });
  }
} 