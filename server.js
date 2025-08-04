// server.js
const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

/**
 * Проверяем, что строка — ровно 12 цифр
 */
function isValidFormat(iin_bin) {
  return /^\d{12}$/.test(iin_bin);
}

/**
 * Эндпоинт проверки задолженности по ИИН/БИН через АИСОИП
 */
app.get("/check", async (req, res) => {
  const iin_bin = req.query.iin_bin;
  if (!iin_bin) {
    return res.status(400).json({ message: "iin_bin обязателен" });
  }
  if (!isValidFormat(iin_bin)) {
    return res.json({
      debtorStatus: null,
      details: null,
      error: "Неверный формат ИИН/БИН (ожидается 12 цифр)"
    });
  }

  try {
    // реальный запрос к АИСОИП
    const url = `https://aisoip.adilet.gov.kz/debtors?iin_bin=${iin_bin}`;
    const apiRes = await fetch(url);
    if (!apiRes.ok) {
      // если 404 — значит нет долгов, вернём clean-вариант
      if (apiRes.status === 404) {
        return res.json({ debtorStatus: "Должник не найден", details: "" });
      }
      // иначе — пробрасываем ошибку
      throw new Error(`HTTP ${apiRes.status}`);
    }
    const data = await apiRes.json();
    // Предположим, API возвращает { status: "...", info: "..." }
    const debtorStatus = data.status || "Неизвестный статус";
    const details     = data.info   || "";

    return res.json({ debtorStatus, details });
  } catch (err) {
    console.error("Error fetching debt status:", err);
    return res.status(502).json({ message: "Ошибка при обращении к АИСОИП" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Debt-checker listening on port ${PORT}`);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Debt-checker listening on port ${PORT}`);
});
