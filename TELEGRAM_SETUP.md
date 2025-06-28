# 🤖 Telegram Bot Setup Guide

## 📋 **Step 1: Get Your Bot Token**

1. Message [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/newbot` (if you haven't created a bot yet)
3. Follow the instructions to create your bot
4. Copy the bot token (looks like `1234567890:ABCDEFghijklmnopQRSTUVwxyz1234567890`)

## ⚙️ **Step 2: Add Environment Variables to Vercel**

### In Vercel Dashboard:
1. Go to your project settings
2. Click **Environment Variables**
3. Add this variable:

```
Name: TELEGRAM_BOT_TOKEN
Value: your_bot_token_here
```

### Or using Vercel CLI:
```bash
vercel env add TELEGRAM_BOT_TOKEN
# Paste your bot token when prompted
```

## 🚀 **Step 3: Deploy and Setup**

1. **Deploy your app to Vercel:**
```bash
vercel --prod
```

2. **Run the setup script:**
Go to: `https://your-app.vercel.app/api/setup`

Click the setup button or send a POST request.

## 📱 **Step 4: Enable Inline Mode**

1. Message [@BotFather](https://t.me/BotFather)
2. Send `/setinline`
3. Select your bot
4. Set placeholder text: `"Create todo item..."`

## 🧪 **Step 5: Test**

1. Go to any Telegram chat
2. Type: `@yourbotname test`
3. You should see options appear
4. Select "📝 Create Todo Item" to open the mini app

## 🔍 **Troubleshooting**

### Check webhook status:
Visit: `https://your-app.vercel.app/api/telegram`

### Check setup status:
Visit: `https://your-app.vercel.app/api/setup`

### Common issues:
- **"Bot token not configured"**: Add `TELEGRAM_BOT_TOKEN` to Vercel environment variables
- **"Loading with X button"**: Webhook not properly configured
- **"No inline results"**: Inline mode not enabled with @BotFather

## 📝 **What the Backend Does**

When someone types `@yourbotname something`:

1. **Telegram sends** inline query to your Vercel function
2. **Your backend responds** with options including your mini app
3. **User selects** "📝 Create Todo Item"
4. **Mini app opens** and user can create todos
5. **User shares** the todo in the chat

## 🔄 **Two Usage Modes**

### Inline Mode (with backend):
- Type `@yourbotname` in any chat
- Select mini app option
- Create and share todos

### Direct Mode (frontend only):
- Go to bot's chat directly  
- Click menu button to open mini app
- Send todos to bot chat

Both modes now work with your setup! 