const path = require('path');
require('dotenv').config();
const cors = require('cors'); //communication between domains 
const helmet = require('helmet');  // for security 
const express = require('express');

const app = express();
const PORT = process.env.PORT;

app.use(helmet());
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Express backend çalışıyor! 🚀');
});

app.use('/api/health', require('./routes/health'));
app.use('/api/classify', require('./routes/classify'));

app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} üzerinde çalışıyor`);
});
