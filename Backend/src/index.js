const path = require('path');
require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT;
console.log(`PORT: ${PORT}`);


app.get('/', (req, res) => {
  res.send('Express backend çalışıyor! 🚀');
});

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} üzerinde çalışıyor`);
});
