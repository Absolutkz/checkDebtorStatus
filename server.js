// server.js
const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const app = express();
app.use(express.json());

// Валидация по ИИН (12 цифр) и по БИН (12 цифр для РК)
function isValidIin(iin) {
  return /^\d{12}$/.test(iin);
}
function isValidBin(bin) {
  return /^\d{12}$/.test(bin);
}

// Общая функция-скрапер таблицы из AISOIP
async function scrapeDebts(paramName, paramValue) {
  const url = `https://aisoip.adilet.gov.kz/debtors?${paramName}=${paramValue}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const table = $("table").first();
  const rows = table.find("tbody tr");

  if (rows.length === 0) {
    return [];
  }
  const records = [];
  rows.each((_, tr) => {
    const cols = $(tr).find("td");
    records.push({
      debtor:      $(cols[0]).text().trim(),
      date:        $(cols[1]).text().trim(),
      executor:    $(cols[2]).text().trim(),
      document:    $(cols[3]).text().trim(),
      restriction: $(cols[4]).text().trim(),
    });
  });
  return records;
}

/**
 * GET /check-iin?iin=...
 */
app.get("/check-iin", async (req, res) => {
  const iin = req.query.iin;
  if (!iin) return res.status(400).json({ message: "iin обязателен" });
  if (!isValidIin(iin)) {
    return res.status(400).json({ message: "Неверный формат ИИН (12 цифр)" });
  }
  try {
    const details = await scrapeDebts("iin", iin);
    const status = details.length
      ? `${details.length} исполнительных производств найдено`
      : "Должник не найден";
    return res.json({ status, details });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ message: "Ошибка при обращении к AISOIP" });
  }
});

/**
 * GET /check-bin?bin=...
 */
app.get("/check-bin", async (req, res) => {
  const bin = req.query.bin;
  if (!bin) return res.status(400).json({ message: "bin обязателен" });
  if (!isValidBin(bin)) {
    return res.status(400).json({ message: "Неверный формат БИН (12 цифр)" });
  }
  try {
    // У AISOIP нет прямого bin-параметра, но обычно BIN = ИИН юрлица => тоже “iin”
    // Если у вас другой источник для БИН — замените paramName/URL.
    const details = await scrapeDebts("iin", bin);
    const status = details.length
      ? `${details.length} исполнительных производств найдено`
      : "Должник не найден";
    return res.json({ status, details });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ message: "Ошибка при обращении к AISOIP" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Debt-checker listening on port ${PORT}`);
});
