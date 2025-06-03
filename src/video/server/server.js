const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

app.post('/api/get-direct-link', async (req, res) => {
  const { publicKey } = req.body;
  try {
    const response = await axios.get(
      'https://cloud-api.yandex.net/v1/disk/public/resources/download',
      {
        params: { public_key: publicKey },
      }
    );
    res.json({ directLink: response.data.href });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Не удалось получить прямую ссылку' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
