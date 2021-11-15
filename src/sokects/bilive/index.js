const Socket = require('isomorphic-ws');
import {encode, decode, browserDecode} from "./handler";

const EventEmitter = require("events").EventEmitter

export class BiliSocket {
    constructor(roomId) {
        this.ws = null;
        this.internal = null;
        this.roomId = roomId;
        this.connected = false;
        this.event = new EventEmitter()
    }

    open(roomId) {
        const ws = new Socket('wss://broadcastlv.chat.bilibili.com/sub');

        ws.onopen = () => {
            let rid = roomId || this.roomId
            ws.send(encode.join(rid));
            this.connected = true;
            this.roomId = rid;
            this.event.emit('open')
        }

        ws.onmessage = async (data) => {
            const packet = await browserDecode(data)
                .catch(err => {
                    this.event.emit('err', err)
                });
            // console.log(packet)
            switch (packet.op) {
                case 8:
                    ws.send(encode.heartbeat())
                    break;
                case 3:
                    this.event.emit('pop', packet.body.count)
                    break;
                case 5:
                    packet.body.forEach((body) => {
                        let timestamp = 0
                        // console.log(body)
                        switch (body['cmd']) {
                            case 'DANMU_MSG':
                                this.event.emit('message', {
                                    uid: body.info[2][0],
                                    uname: body.info[2][1],
                                    message: body.info[1],
                                    timestamp: body.info[9]['ts'],
                                    timeline: new Date(body.info[9]['ts'] * 1000),
                                    admin: body.info[2][2],
                                    medal: {
                                        has: body.info[3].length > 0,
                                        expired: body.info[3].length > 0 && body.info[3][11] === 0,
                                        name: body.info[3][1] || '',
                                        level: body.info[3][0] || '',
                                        borderColor: parseInt(body.info[3][7]).toString(16).padStart(6, '0') || '',
                                        backgroundColor: parseInt(body.info[3][9]).toString(16).padStart(6, '0') || '',
                                        color: parseInt(body.info[3][8]).toString(16).padStart(6, '0') || '',
                                        guardLevel: body.info[3][10] || 0
                                    },
                                    emoticon: {
                                        has: body.info[0][13] !== '{}',
                                        url: body.info[0][13].url || '',
                                        height: body.info[0][13].height || 0,
                                        width: body.info[0][13].width || 0
                                    }
                                })
                                console.log(body)
                                break;
                            case 'SEND_GIFT':
                                this.event.emit('gift', {
                                    uid: body.data.uid,
                                    face: body.data.face,
                                    uname: body.data.uname,
                                    action: body.data.action,
                                    giftName: body.data.giftName,
                                    num: body.data.num,
                                    timestamp: body.data.timestamp,
                                    timeline: new Date(body.data.timestamp * 1000)
                                })
                                break;
                            case 'COMBO_SEND':
                                timestamp = String(body.data.combo_id).split(":").pop()
                                this.event.emit('gift', {
                                    uid: body.data.uid,
                                    face: body.data.face,
                                    uname: body.data.uname,
                                    action: body.data.action,
                                    giftName: body.data.gift_name,
                                    num: body.data.combo_num,
                                    timestamp: timestamp,
                                    timeline: new Date(timestamp * 1000)
                                })
                                console.log(body)
                                break;
                            case "LIVE_INTERACTIVE_GAME":
                                this.event.emit('gift1', {
                                    uid: body.data.uid,
                                    uname: body.data.uname,
                                    action: body.data.action || '送出',
                                    giftName: body.data['gift_name'],
                                    num: body.data['gift_num'],
                                    timestamp: body.data.timestamp,
                                    timeline: new Date(body.data.timestamp * 1000)
                                })
                                break;
                            case 'INTERACT_WORD':
                            case 'WELCOME':
                                this.event.emit('join', {
                                    uid: body.data.uid,
                                    uname: body.data.uname,
                                    timestamp: body.data.timestamp,
                                    timeline: new Date(body.data.timestamp * 1000)
                                })
                                break;
                            case 'ENTRY_EFFECT':
                                timestamp = parseInt(String(body.data.trigger_time).substr(0, 10))
                                this.event.emit('effect', {
                                    uid: body.data.uid,
                                    mapUrl: body.data.basemap_url,
                                    message: body.data.copy_writing,
                                    duration: body.data.effective_time,
                                    face: body.data.face,
                                    color: body.data['copy_color'],
                                    highlightColor: body.data['highlight_color'],
                                    timestamp,
                                    timeline: new Date(timestamp * 1000),
                                })
                                break;
                            case 'SUPER_CHAT_MESSAGE_JPN':
                                this.event.emit('sc', {
                                    uid: body.data.uid,
                                    uname: body.data.user_info.uname,
                                    face: body.data.user_info.face,
                                    message: body.data.message || body.data['message_jpn'],
                                    price: body.data.price,
                                    time: body.data.time,
                                    timestamp: body.data.ts,
                                    timeline: new Date(body.data.ts * 1000),
                                    medal: {
                                        has: body.data['medal_info'] && body.data['medal_info']['anchor_roomid'],
                                        expired: !body.data['medal_info']['is_lighted'],
                                        name: body.data['medal_info']['medal_name'],
                                        level: body.data['medal_info']['medal_level'],
                                        borderColor: parseInt(body.data['medal_info']['medal_color_border']).toString(16).padStart(6, '0'),
                                        backgroundColor: parseInt(body.data['medal_info']['medal_color_end']).toString(16).padStart(6, '0'),
                                        color: body.data['medal_info']['medal_color'],
                                        guardLevel: body.data['medal_info']['guard_level']
                                    }
                                })
                                break;
                            case 'LIVE':
                                this.event.emit('start')
                                break;
                            case 'PREPARING':
                                this.event.emit('stop')
                                break;
                            case 'ROOM_CHANGE':
                                this.event.emit('change', body.data)
                                break;

                            /*天选之人*/
                            case 'ANCHOR_LOT_START':
                                break
                            case 'ANCHOR_LOT_END':
                                break
                            case 'ANCHOR_LOT_AWARD':
                                break

                            /*舰长类*/
                            case 'GUARD_BUY':
                                // 'guardBuy'
                                break
                            case 'USER_TOAST_MSG':
                                break
                            case 'NOTICE_MSG':
                                break

                            /*小时榜变动*/
                            case 'ACTIVITY_BANNER_UPDATE_V2':
                                break

                            /*粉丝关注变化*/
                            case 'ROOM_REAL_TIME_MESSAGE_UPDATE':
                                console.log(body)
                                break
                            default:
                                console.log(body)
                                break
                        }
                    })
                    break;
            }
        }


        ws.onclose = () => {
            this.event.emit('log', "连接关闭")
            this.event.emit('close')
            this.ws = null;
            this.connected = false;
            clearInterval(this.internal);
            this.internal = null;
        }

        this.internal = setInterval(() => {
            ws.send(encode.heartbeat());
        }, 30000);

        this.ws = ws;
    }

    close() {
        if (this.ws && this.ws.readyState === 1) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
            clearInterval(this.internal);
            this.internal = null;
        }
    }

}
