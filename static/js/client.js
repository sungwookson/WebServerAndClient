import { MqttClient, MqttEvent } from "./mqtt";

import { TopicObserver } from "./topic-observer";

export class Client extends TopicObserver {

    constructor(host, port, clientId) {
        this.mqttClient = new MqttClient(host, port, clientId);
        this.event_observer = null;
    }

    connect(username, options) {

        // return if already connected
        if (this.mqttClient.isConnected)
            return;

        // retrieve temporary password for mqttClient and connect to broker
        $.getJSON(APIBaseUrl + 'user/' + this.username + '/password/',
            (password) => {

                // override options
                options['username'] = username;
                options['password'] = password;

                // connect to client
                this.mqttClient.connect(options);

                // register observer
                this.event_observer = (event) => this.eventHandler(event);
                this.mqttClient.observe(this.observer);

            });
    }

    disconnect() {

        // return if not connected
        if (!this.mqttClient.isConnected)
            return;

        // remove observer
        this.mqttClient.remove(this.observer);
        this.event_observer = null;

        // connect to client
        this.mqttClient.disconnect();

    }

    eventHandler(event) {

        if (event.event === 'messageReceived') {

            const topic = event.object.destinationName;
            const payload = event.object.payloadString;

            // Is this a registered topic?
            if (this.observers.hasTopic(topic))
                this.observers.broadcast(payload, topic);
            else
                this.observers.broadcast(payload);

        }

    }

}