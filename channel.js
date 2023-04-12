"use strict";

const makeChannel = () => {
    let handler = void 0;
    let isExecuting = false;
    const q = [];

    const exec = async msg => {
        isExecuting = true;
        try {
            await handler(msg);
        } catch (err) {
            console.error(err);
        }

        if (q.length > 0) {
            const msgNext = q.shift();
            setImmediate(() => exec(msgNext));
        } else {
            isExecuting = false;
        }
    };

    return {
        write: msg => {
            if (handler && !isExecuting) {
                exec(msg);
            } else {
                q.push(msg);
            }
        },
        attachHandler: h => {
            if (handler) {
                throw Error('Handler already attached');
            }
            if (!h) {
                throw Error('Handler cannot be undefined');
            }
            handler = h;
            if (q.length > 0 && !isExecuting) {
                const msg = q.shift();
                exec(msg);
            }
        }
    };
}

module.exports = {
    makeChannel
};