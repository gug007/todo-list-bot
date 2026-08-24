

ngrok http 3000 --domain=todo-list-bot.ngrok-free.app --log=stdout


enabled inline feedback in @BotFather (/setinlinefeedback → 100%)

Telegram truncates inline queries (@bot ...) at 256 characters. For longer
lists, send the text directly to the bot's private chat — it replies with the
formatted checklist (with an Edit button) that can be forwarded. The inline
result shows a ⚠️ warning in its title when the query hits the limit.


  curl -X POST "https://api.telegram.org/bot7734813129:AAqweqweqweqweGq2Ga-OrULSxkVmfc/setWebhook" \
     -d '{
           "url":"https://todo-list-bot-theta.vercel.app/api/bot",
           "allowed_updates":["inline_query","chosen_inline_result","callback_query","message"]
         }' \
     -H "Content-Type: application/json"