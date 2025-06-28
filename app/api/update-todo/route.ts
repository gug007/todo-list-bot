import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://your-app.vercel.app";

export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 500 }
      );
    }

    const { content, originalContent, userId, initData } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    console.log('Update todo request:', { content, originalContent, userId, hasInitData: !!initData });

    // Use the provided userId, or try to extract from initData as fallback
    let finalUserId = userId;
    if (!finalUserId && initData) {
      try {
        const urlParams = new URLSearchParams(initData);
        const userParam = urlParams.get('user');
        if (userParam) {
          const userObj = JSON.parse(userParam);
          finalUserId = userObj.id;
        }
      } catch {
        console.log('Could not parse user data from initData');
      }
    }

    // If we have a user ID, send them a notification
    if (finalUserId) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: finalUserId,
            text: `✅ Todo Updated!\n\nOld: ${originalContent || 'N/A'}\nNew: ${content}`,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✏️ Edit Again",
                    url: `${MINI_APP_URL}?edit=true&content=${encodeURIComponent(content)}&userId=${finalUserId}`,
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
      } catch (err) {
        console.error("Error sending message:", err);
      }
    }

    // Return success even if we couldn't send a message
    return NextResponse.json({ 
      success: true, 
      message: "Todo updated successfully",
      debug: {
        hasUserId: !!finalUserId,
        providedUserId: !!userId,
        extractedFromInitData: !userId && !!finalUserId
      }
    });

  } catch (err) {
    console.error("Update todo error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
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