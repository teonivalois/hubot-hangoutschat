# There's now an official guide for Chat integration. Check it out here: https://developers.google.com/hangouts/chat/how-tos/integrate-hubot
---

# hubot-hangoutschat
The Hangouts Chat provider for Github's Hubot

## How to use

Make sure to set the GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to the JSON file that you received for the Google Service Account.

```
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
./bin/hubot -a hangoutschat
