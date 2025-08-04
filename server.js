// server.js
const express = require("express");
const fetch   = require("node-fetch");
const cheerio = require("cheerio");

const app = express();

async function scrapeDebts(iin) {
  const url  = `https://aisoip.adilet.gov.kz/debtors?iin=${iin}`;
  const html = await (await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  })).text();
  const $    = cheerio.load(html);

  // Парсим строки таблицы
  const table = $("table").first();
  const rows  = table.find("tbody tr");
  const details = rows.map((_, tr) => {
    const tds = $(tr).find("td");
    return {
      debtor:      $(tds[0]).text().trim(),
      date:        $(tds[1]).text().trim(),
      executor:    $(tds[2]).text().trim(),
      document:    $(tds[3]).text().trim(),
      restriction: $(tds[4]).text().trim(),
    };
  }).get();

  // Надёжно парсим общее число из info-блока DataTables
  let total = details.length;
  const info = $("div.dataTables_info").text();
  const m = info.match(/из\s+(\d+)/i);
  if (m) {
    total = parseInt(m[1], 10);
  }

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
    return res.status(502).json({ message: "Ошибка при скрапинге AIS ОИП" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
