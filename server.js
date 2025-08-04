// server.js
const express = require("express");
const app = express();
app.use(express.json());

/**
 * Простейшая валидация формата ИИН/БИН — ровно 12 цифр
 */
function isValidFormat(iin_bin) {
  return /^\d{12}$/.test(iin_bin);
}

/**
 * Эндпоинт проверки задолженности по ИИН/БИН
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
    // Здесь мог бы быть реальный вызов к Гос-API, но пока — заглушка:
    const debtorStatus = "Должник не найден";
    const details = "";

    return res.json({ debtorStatus, details });
  } catch (err) {
    console.error("Error in /check:", err);
    return res.status(500).json({ message: "Внутренняя ошибка сервиса" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Debt-checker listening on port ${PORT}`);
});
