This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

I have implemented the Telegram Mini App with inline mode and message editing functionality as you requested. Here is a summary of the work done and how to get it running:

### What has been done:

1.  **Project Setup**:
    *   Added `node-telegram-bot-api` to handle Telegram API interactions.
    *   Structured the code into a `lib` directory for bot logic (`bot.ts`, `telegram.ts`), `app/api` for backend routes, and `types` for TypeScript definitions.

2.  **Backend Implementation**:
    *   **Bot Initialization**: The bot is initialized in `lib/bot.ts`.
    *   **Webhook Handler**: An API route at `app/api/bot/route.ts` is set up to receive updates from Telegram. It has a `GET` endpoint to set the webhook and a `POST` endpoint to process updates.
    *   **Inline Query Handling**: The bot listens for `inline_query` events in `lib/telegram.ts`. When a user types `@your_bot_username query`, it returns an article result with a button to open the Mini App.
    *   **Message Editing API**: An API route at `app/api/edit-message/route.ts` is created to handle requests from the Mini App to update a message.

3.  **Frontend (Mini App) Implementation**:
    *   The main page at `app/page.tsx` is now a Telegram Mini App.
    *   It includes a script to load Telegram's `telegram-web-app.js` in `app/layout.tsx`.
    *   The app's UI allows users to edit a message in a text area and submit the changes.
    *   It securely gets the `inline_message_id` from Telegram to identify which message to edit.
    *   On submission, it calls the `/api/edit-message` endpoint and closes the Mini App.
    *   Added TypeScript definitions for the Telegram Web App object in `types/telegram.d.ts` for type safety.

### How to Run the Project:

1.  **Set up Environment Variables**:
    *   Create a file named `.env.local` in the root of your project.
    *   Add your Telegram bot token and your public URLs to this file. You can use a service like `ngrok` to get a public URL for your local server.

        ```
        TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
        NEXT_PUBLIC_APP_URL=https://your-public-url.com
        NEXT_PUBLIC_WEBHOOK_URL=https://your-public-url.com/api/bot
        ```

2.  **Expose your local server to the internet**:
    *   If you are not deploying to a service like Vercel, you need to expose your local server. Tools like `ngrok` can be used for this.

3.  **Set the Webhook**:
    *   Run your Next.js application (`npm run dev`).
    *   Open your browser and navigate to `https://your-public-url.com/api/bot`. This will set the webhook for your bot. You should see a success message.

4.  **Use the Bot in Telegram**:
    *   Open any chat in Telegram.
    *   Type `@your_bot_username` followed by some text (e.g., `@your_bot_username Hello world`).
    *   You will see an inline result. Tap on it to send a message.
    *   The message will have an "Edit message" button. Tap this button to open your Mini App.
    *   Edit the message in the app and press "Update Message".
    *   The original message in the chat will be updated.

This setup provides a complete workflow for your Telegram Mini App. Let me know if you have any other questions.