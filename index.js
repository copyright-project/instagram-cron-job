const {
  syncBackJob,
  syncForwardJob,
  syncBackUser,
  syncUserForward
} = require('./src/jobs');
const { getUser } = require('./src/db');
const cron = require('node-cron');
const express = require('express');
const Sentry = require('@sentry/node');

const PORT = process.env.PORT || 5678;

Sentry.init({
  dsn: 'https://13b6af852aa74adb953730f775edd27e@sentry.io/1537409'
});

const app = express();

cron.schedule('35 * * * *', syncBackJob, {
  timezone: 'Asia/Jerusalem'
});

cron.schedule('5 * * * *', syncForwardJob, {
  timezone: 'Asia/Jerusalem'
});

app.post('/triggers/sync/back/:userId', async (req, res) => {
  req.setTimeout(1000 * 60 * 10);
  const { userId } = req.params;
  const user = await getUser(userId);
  res.send(200);
  await syncBackUser(userId, user['accessToken'], user['copyrightAttribution']);
});

app.post('/triggers/sync/forward/:userId', async (req, res) => {
  req.setTimeout(1000 * 60 * 10);
  const { userId } = req.params;
  const user = await getUser(userId);
  res.send(200);
  await syncUserForward(
    userId,
    user['accessToken'],
    user['lastSyncedMaxId'],
    user['copyrightAttribution']
  )
});

app.listen(PORT, () => console.log('Cron job is running on port ' + PORT));