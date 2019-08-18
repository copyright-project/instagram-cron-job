# Instagram Cron Jobs
> Sync images backward and forward

## Sync backward
The job registers all previous images of a user starting from now up to the beginning. <br />
The job runs once an hour and runs only once per user. <br />
After the job is done, the user is marked as synced. 

## Sync forward
When a user registered new media, we need to register it too. Therefore, we run a job that registers new images starting from last synced id. <br />
Job runs once an hour.