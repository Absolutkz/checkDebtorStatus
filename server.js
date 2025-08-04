// server.js
const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const app = express();
app.use(express.json());

function isValidFormat(iin_bin) {
  return /^\d{12}$/.test(iin_bin);
}

app.get("/check", async (req, res) => {
  const iin_bin = req.query.iin_bin;
  if (!iin_bin) {
    return res.status(400).json({ message: "iin_bin обязателен" });
  }
  if (!isValidFormat(iin_bin)) {
    return res.status(400).json({ message: "Неверный формат ИИН/БИН" });
  }

  try {
    // 1) Получаем HTML со страницы результатов
    const searchUrl = `https://aisoip.adilet.gov.kz/debtors?iin_bin=${iin_bin}`;
    const htmlRes = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await htmlRes.text();

    // 2) Парсим таблицу с результатами
    const $ = cheerio.load(html);
    const rows = $("#debtors-table tbody tr");
    if (rows.length === 0) {
      // Ничего не найдено
      return res.json({ debtorStatus: "Должник не найден", details: "" });
    }

    // 3) Собираем все записи в массив
    const records = [];
    rows.each((_, tr) => {
      const cols = $(tr).find("td");
      records.push({
        debtor:   $(cols[0]).text().trim(),
        date:     $(cols[1]).text().trim(),
        executor: $(cols[2]).text().trim(),
        document: $(cols[3]).text().trim(),
        restriction: $(cols[4]).text().trim()
      });
    });

    return res.json({
      debtorStatus: `${records.length} исполнительных производств найдено`,
      details: records
    });
  } catch (err) {
    console.error("Error in /check:", err);
    return res.status(502).json({ message: "Ошибка при обращении к AISOIP" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Debt-checker listening on port ${PORT}`);
});
