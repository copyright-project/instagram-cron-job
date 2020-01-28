# Open Rights Cron Jobs [![Build Status](https://travis-ci.org/copyright-project/instagram-cron-jobs.svg?branch=master)](https://travis-ci.org/copyright-project/instagram-cron-jobs)
> Sync images backward and forward

## Sync backward
The job registers all previous images of a user starting from now up to the beginning. <br />
The job runs once an hour and runs only once per user. <br />
After the job is done, the user is marked as synced. 

### POST `/triggers/sync/back/:userId`
Triggers the manual sync backwards for a given user id.

## Sync forward
When a user registered new media, we need to register it too. Therefore, we run a job that registers new images starting from last synced id. <br />
Job runs once an hour.

### POST `/triggers/sync/forward/:userId`
Triggers the manual sync forward for a given user id.
