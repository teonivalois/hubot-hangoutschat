'use strict';

// export GOOGLE_APPLICATION_CREDENTIALS="/PATH/TO/JSON/FILE_FROM_GOOGLE.json"
// export GOOGLE_HANGOUTS_CHAT_TOKEN="TOKEN_TO_VALIDATE_IF_YOU_WISH"

const {
    Robot,
    Adapter,
    TextMessage,
    TextListener,
    User
} = require('hubot');

const {
    auth
} = require('google-auth-library');

class HangoutsChat extends Adapter {
    constructor(robot) {
        super(robot);
        this._prepareClient();
    }

    async send(envelope /* , ...strings */ ) {
        const lines = [].slice.call(arguments, 1);
        await this.client.request({
            url: `https://chat.googleapis.com/v1/spaces/${envelope.room}/messages`,
            method: 'post',
            data: {
                text: lines.join('\n')
            }
        });
    }

    async reply(envelope /* , ...strings */ ) {
        const lines = [].slice.call(arguments, 1);
        await this.client.request({
            url: `https://chat.googleapis.com/v1/spaces/${envelope.room}/messages`,
            method: 'post',
            data: {
                text: lines.join('\n'),
                thread: {
                    name: `spaces/${envelope.room}/threads/${envelope.message.id}`
                }
            }
        });
    }

    async _prepareClient() {
        this.client = await auth.getClient({
            scopes: 'https://www.googleapis.com/auth/chat.bot'
        });
    }

    async handleRequest(event) {
        //TODO: Review why instanceof was having issues... I had to tweak the matcher function.
        if (!this.matchersWereAdjusted) {
            this.robot.listeners.forEach(listener => {
                if (listener.constructor.name == 'TextListener') {
                    listener.matcher = (message) => {
                        if (message.constructor.name == 'TextMessage') {
                            return message.match(listener.regex)
                        }
                    }
                }
            });
            this.matchersWereAdjusted = true;
        }

        if (!this.client) {
            this.robot.logger.info('I\'m not ready yet');
            return;
        }

        const token = process.env.GOOGLE_HANGOUTS_CHAT_TOKEN;
        if (token && event.token !== token) {
            this.robot.logger.info('Received request with bad token');
            return;
        }

        const spaceKey = event.space.name.split('/').pop();
        switch (event.type) {
            case 'MESSAGE':
                const user = this.robot.brain.userForId(event.message.sender.name, {
                    name: event.message.sender.displayName,
                    room: spaceKey
                });

                const threadKey = event.message.thread.name.split('/').pop();
                const message = new TextMessage(user, event.message.text, threadKey);
                this.receive(message);
                break;
        }
    }

    run() {
        const self = this
        this.robot.router.post("/hangoutschat/", (req, res) => {
            if (req.body) {
                self.handleRequest(req.body);
            } else {
                this.requestData = '';
                req.on('data', chunk => requestData += chunk);
                req.on('end', () => self.handleRequest(requestData));
            }
            return res.send(200, {});
        });

        this.emit('connected');
    }
}

exports.use = robot => new HangoutsChat(robot);