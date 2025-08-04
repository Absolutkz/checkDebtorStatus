// server.js
const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const app = express();
app.use(express.json());

// Проверка, что IIN — ровно 12 цифр
function isValidIin(iin) {
  return /^\d{12}$/.test(iin);
}

// Скрипер HTML-таблицы
async function scrapeDebts(iin) {
  const url = `https://aisoip.adilet.gov.kz/debtors?iin=${iin}`;
  const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const $ = cheerio.load(html);
  const table = $("table").first();
  const rows = table.find("tbody tr");

  if (!rows.length) return [];
  return rows.map((_, tr) => {
    const cols = $(tr).find("td");
    return {
      debtor:      $(cols[0]).text().trim(),
      date:        $(cols[1]).text().trim(),
      executor:    $(cols[2]).text().trim(),
      document:    $(cols[3]).text().trim(),
      restriction: $(cols[4]).text().trim(),
    };
  }).get();
}

app.get("/check-iin", async (req, res) => {
  const { iin } = req.query;
  if (!iin) return res.status(400).json({ message: "iin обязателен" });
  if (!isValidIin(iin)) return res.status(400).json({ message: "Неверный формат IIN (12 цифр)" });

  try {
    const details = await scrapeDebts(iin);
    const status  = details.length
      ? `${details.length} исполнительных производств найдено`
      : "Должник не найден";
    return res.json({ status, details });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ message: "Ошибка при обращении к AISOIP" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
