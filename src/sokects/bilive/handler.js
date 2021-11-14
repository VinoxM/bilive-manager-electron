const zlib = require("zlib");

const textDecoder = new TextDecoder('utf-8');

const blank = Buffer.alloc(16);

const readInt = function (buffer, start, len) {
    let result = 0
    for (let i = len - 1; i >= 0; i--) {
        result += Math.pow(256, len - i - 1) * buffer[start + i]
    }
    return result
}

const decoder = function (blob) {
    let buffer = new Uint8Array(blob)
    let result = {}
    result.packetLen = readInt(buffer, 0, 4)
    result.headerLen = readInt(buffer, 4, 2)
    result.ver = readInt(buffer, 6, 2)
    result.op = readInt(buffer, 8, 4)
    result.seq = readInt(buffer, 12, 4)
    if (result.op === 5) {
        result.body = []
        let offset = 0;
        while (offset < buffer.length) {
            let packetLen = readInt(buffer, offset, 4)
            let headerLen = 16// readInt(buffer,offset + 4,4)
            if (result.ver === 2) {
                let data = buffer.slice(offset + headerLen, offset + packetLen);
                let newBuffer = zlib.inflateSync(new Uint8Array(data));
                const obj = decoder(newBuffer);
                const body = obj.body;
                result.body = result.body.concat(body);
            } else {
                let data = buffer.slice(offset + headerLen, offset + packetLen);
                let body = textDecoder.decode(data);
                if (body) {
                    result.body.push(JSON.parse(body));
                }
            }
            // let body = textDecoder.decode(pako.inflate(data));
            // if (body) {
            //     result.body.push(JSON.parse(body.slice(body.indexOf("{"))));
            // }
            offset += packetLen;
        }
    } else if (result.op === 3) {
        result.body = {
            count: readInt(buffer, 16, 4)
        };
    }
    return result;
}


export const browserDecode = function ({data: blob}) {
    return new Promise((resolve, reject) => {
        // let reader = new FileReader();
        // reader.onload = (e) => {
        //     const result = decode(e.target.result)
        //     resolve(result)
        // }
        // reader.readAsArrayBuffer(blob)
        resolve(decoder(blob))
    })
}


export const decode = function (blob) {
    return new Promise(function (resolve, reject) {
        const result = decoder(blob);
        resolve(result)
    });
}


export const encode = function (type, body) {
    if (typeof body !== 'string') {
        body = JSON.stringify(body);
    }
    const head = Buffer.from(blank);
    const buffer = Buffer.from(body);
    head.writeInt32BE(buffer.length + head.length, 0);
    head.writeInt16BE(16, 4);
    head.writeInt16BE(1, 6);
    if (type === 'heartbeat') {
        head.writeInt32BE(2, 8);
    }
    if (type === 'join') {
        head.writeInt32BE(7, 8);
    }
    head.writeInt32BE(1, 12);
    return Buffer.concat([head, buffer]);
}

encode.join = (roomId) => {
    return encode('join', {roomid: roomId});
}

encode.heartbeat = () => {
    return encode('heartbeat', '');
}
