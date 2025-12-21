const path = require('path');
require('dotenv').config();
const cors = require('cors'); //communication between domains 
const helmet = require('helmet');  // for security 
const express = require('express');
const hf_classifier = require('./routes/hf_classifier');

const app = express();

// Pull from .env
const HOST = process.env.HOST;
const PORT = process.env.PORT;

app.use(helmet());
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Express backend çalışıyor! 🚀');
});

app.use('/api/classify', require('./routes/classify'));
app.use('/api/hf_predict', require('./routes/hf_classifier'));
app.use('/api/mail_predict', require('./routes/mail_predict'));
app.use('/api/read&send_mail', require('./routes/read&send_mail'));

app.listen(PORT, HOST, () => {
  console.log(`Server http://${HOST}:${PORT} üzerinde çalışıyor`);
});
