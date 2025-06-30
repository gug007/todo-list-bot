

ngrok http 3000 --domain=todo-list-bot.ngrok-free.app --log=stdout



  curl -X POST "https://api.telegram.org/bot7734813129:AAqweqweqweqweGq2Ga-OrULSxkVmfc/setWebhook" \
     -d '{
           "url":"https://todo-list-bot-theta.vercel.app/api/bot",
           "allowed_updates":["inline_query","chosen_inline_result","callback_query","message"]
         }' \
     -H "Content-Type: application/json"