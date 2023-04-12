msg-channel-js - Sequencing async message processing
=======

This is inspired by Go channels.

Channels allows separating the code for sending messages from the code for processing messages.

Messages are processed in the order they arrive. Each message is fully processed before the next message is picked up, even if the handler has async calls, resulting in sequential message processing.

The sender does not wait for the message to be processed (the sending is fire-and-forget).


## The typical scenario

The web page begins to send user analytics events as soon as loaded, but the analytics library requires some delay to be properly initialized, so the events need to be queued.

Processing of a single event involves modifying some internal data structures, and having 2 events being processed at a time can lead to race condition due to async calls, so you want to process them in sequence.

## Usage

Import:

```js
const { makeChannel } = require('msg-channel-js');
```

Basic usage:

```js
const ch = makeChannel();
ch.attachHandler(async msg => { console.log(msg.id); });
ch.write({ id: 1 });
```

You can write messages to the channel as soon as you create it, in that case they will be queued until you attach the handler:

```js
const ch = makeChannel();
ch.write({ id: 1 });
ch.attachHandler(async msg => { console.log(msg.id); });
```

This becomes truly useful when the handler is an async function, but you still want to make sure you completely processed one message before you start processing the next one.

Example:

```js
const msg1 = { id: 1 };
const msg2 = { id: 2 };
const msg3 = { id: 3 };

const delay = (delayInms) => {
    return new Promise(resolve => setTimeout(resolve, delayInms));
}

const handler = async msg => {
    console.log(`START ${msg.id}`);
    await delay(100);
    console.log(`MID ${msg.id}`);
    await delay(100);
    console.log(`FINISH ${msg.id}`);
}

const ch = makeChannel();

// no handler attached -> the messages will be queued
// you don't wait for messages to be processed
ch.write(msg1);
ch.write(msg2);

// here the processing starts
ch.attachHandler(handler);

// meanwhile, you can queue more messages
ch.write(msg3);

// prints:
// START 1
// MID 1
// FINISH 1
// START 2
// MID 2
// FINISH 2
// START 3
// MID 3
// FINISH 3
```