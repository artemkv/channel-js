const { makeChannel } = require('./channel');

const msg1 = { id: 1 };
const msg2 = { id: 2 };
const msg3 = { id: 3 };
const msg4 = { id: 4 };
const msg5 = { id: 5 };

const delay = (delayInms) => {
    return new Promise(resolve => setTimeout(resolve, delayInms));
}

function getHandler(q) {
    return async msg => {
        q.push(`START ${msg.id}`);
        await delay(100);
        q.push(`MID ${msg.id}`);
        await delay(100);
        q.push(`FINISH ${msg.id}`);
    }
}

test('Attach handler immediately', async () => {
    const q = [];

    const ch = makeChannel();
    ch.attachHandler(getHandler(q));

    ch.write(msg1);
    ch.write(msg2);

    await delay(1000);

    console.log(q);

    expect(q).toStrictEqual(['START 1', 'MID 1', 'FINISH 1', 'START 2', 'MID 2', 'FINISH 2']);
});

test('Attach handler later', async () => {
    const q = [];

    const ch = makeChannel();

    ch.write(msg1);
    ch.write(msg2);

    ch.attachHandler(getHandler(q));

    await delay(1000);

    console.log(q);

    expect(q).toStrictEqual(['START 1', 'MID 1', 'FINISH 1', 'START 2', 'MID 2', 'FINISH 2']);
});

test('Attach handler later and add more messages', async () => {
    const q = [];

    const ch = makeChannel();

    ch.write(msg1);
    ch.write(msg2);

    ch.attachHandler(getHandler(q));

    ch.write(msg3);
    delay(1000).then(_ => { ch.write(msg4); ch.write(msg5) });

    await delay(3000);

    console.log(q);

    expect(q).toStrictEqual(['START 1', 'MID 1', 'FINISH 1', 'START 2', 'MID 2', 'FINISH 2',
        'START 3', 'MID 3', 'FINISH 3', 'START 4', 'MID 4', 'FINISH 4',
        'START 5', 'MID 5', 'FINISH 5']);
});

test('Try attaching handler second time', () => {
    let actual;
    try {
        const q = [];

        const ch = makeChannel();
        ch.attachHandler(getHandler(q));
        ch.attachHandler(getHandler(q));
    } catch (err) {
        actual = err;
    }

    const expected = Error('Handler already attached');
    expect(actual).toStrictEqual(expected);
});

test('Try attaching empty handler', () => {
    let actual;
    try {
        const ch = makeChannel();
        ch.attachHandler(void 0);
    } catch (err) {
        actual = err;
    }

    const expected = Error('Handler cannot be undefined');
    expect(actual).toStrictEqual(expected);
});