#!/bin/bash

echo "🚀 Telegram Bot Deployment Script"
echo "=================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Check if bot token is provided
if [ -z "$1" ]; then
    echo "❌ Error: Telegram bot token required"
    echo ""
    echo "Usage: ./scripts/deploy.sh YOUR_BOT_TOKEN"
    echo ""
    echo "To get your bot token:"
    echo "1. Message @BotFather in Telegram"
    echo "2. Send /newbot and follow instructions"
    echo "3. Copy the token and run: ./scripts/deploy.sh TOKEN_HERE"
    exit 1
fi

BOT_TOKEN=$1

echo "📋 Setting up environment variables..."
vercel env add TELEGRAM_BOT_TOKEN production <<< "$BOT_TOKEN"

echo "🔧 Building project..."
npm run build

echo "🚀 Deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Go to your app URL and visit /setup"
echo "2. Click 'Run Setup' to configure webhook"
echo "3. Message @BotFather and send /setinline"
echo "4. Select your bot and set placeholder text"
echo "5. Test by typing @yourbotname in any chat"
echo ""
echo "🔍 Useful URLs:"
echo "- Setup page: https://your-app.vercel.app/setup"
echo "- Webhook status: https://your-app.vercel.app/api/telegram"
echo "- Mini app: https://your-app.vercel.app" 