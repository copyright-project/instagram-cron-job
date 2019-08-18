const { syncBackJob, syncForwardJob } = require('./src/jobs');
const cron = require('node-cron');
const express = require('express');

const PORT = process.env.PORT || 5678;

const app = express();

cron.schedule('5 * * * *', syncBackJob, {
  timezone: 'Asia/Jerusalem'
});

cron.schedule('35 * * * *', syncForwardJob, {
  timezone: 'Asia/Jerusalem'
});

app.listen(PORT, () => console.log('Cron job is running on port ' + PORT));