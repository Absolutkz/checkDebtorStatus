```js
// server.js
const express = require("express");
const fetch = require("node-fetch");
const app = express();
app.use(express.json());

/**
 * Простая валидация формата ИИН/БИН (12 цифр)
 */
function isValidFormat(iin_bin) {
  return /^\d{12}$/.test(iin_bin);
}

/**
 * Ваш основной endpoint: проверка задолженности по ИИН/БИН
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
    // Если есть доступ к реальному гос-API, раскомментируйте и настройте URL:
    // const apiRes = await fetch(`https://aisoip.adilet.gov.kz/api/debt-status?iin_bin=${iin_bin}`);
    // const data = await apiRes.json();
    // const { debtorStatus, details } = data;

    // Пока вернём заглушку:
    const debtorStatus = "Должник не найден";
    const details = "";

    return res.json({ debtorStatus, details });
  } catch (err) {
    console.error("Error fetching debt status:", err);
    return res.status(500).json({ message: "Внутренняя ошибка сервиса" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Debt-checker listening on port ${PORT}`);
});
```
