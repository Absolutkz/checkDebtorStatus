// server.js
const express = require("express");
const fetch   = require("node-fetch");
const cheerio = require("cheerio");

const app = express();

async function scrapeDebts(iin) {
  const url  = `https://aisoip.adilet.gov.kz/debtors?iin=${iin}`;
  const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const $    = cheerio.load(html);

  // 1) Парсим строки таблицы
  const table = $("table").first();
  const rows  = table.find("tbody tr");
  const details = rows.map((i, tr) => {
    const tds = $(tr).find("td");
    return {
      debtor:      $(tds[0]).text().trim(),
      date:        $(tds[1]).text().trim(),
      executor:    $(tds[2]).text().trim(),
      document:    $(tds[3]).text().trim(),
      restriction: $(tds[4]).text().trim(),
    };
  }).get();

  // 2) Вычленяем общее число записей по тексту «1-3 из 3»
  //    Ищем любой элемент, содержащий «из X»
  let total = details.length;
  const summaryText = $("body")
    .find("*")
    .filter((i, el) => {
      const t = $(el).text().trim();
      return /\d+\s*[-–]\s*\d+\s*из\s*\d+/.test(t);
    })
    .first()
    .text();
  const m = summaryText.match(/из\s*(\d+)/);
  if (m) total = parseInt(m[1], 10);

  return { total, details };
}

app.get("/check-debtor-status", async (req, res) => {
  const iin = req.query.iin;
  if (!iin) {
    return res.status(400).json({ message: "Параметр iin обязателен" });
  }
  try {
    const { total, details } = await scrapeDebts(iin);
    const status = total
      ? `Найдено ${total} производств`
      : "Должник не найден";
    return res.json({ status, total, details });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ message: "Ошибка при обращении к AISOIP" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
