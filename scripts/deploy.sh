#!/usr/bin/env bash

heroku container:login
heroku container:push web -a media-registry-cron-job
heroku container:release web -a media-registry-cron-job