const token = process.env.PLATFORM_TELEGRAM_BOT_TOKEN;
const chatId = process.env.PLATFORM_TELEGRAM_CHAT_ID;
if (!token || !chatId) {
  console.log("Notificação ignorada: secrets do Telegram não configurados.");
  process.exit(0);
}
const text = `Deploy falhou. Consulte: ${process.env.GITHUB_RUN_URL ?? "GitHub Actions"}`;
const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ chat_id: chatId, text }),
});
if (!response.ok) throw new Error(`Telegram respondeu ${response.status}`);
