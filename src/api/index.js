const request = require('request');
const querystring = require('querystring')

const http = {
    get: (url, params, headers) => {
        if (headers) {
            headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
        }
        return new Promise((resolve) => {
            request({
                method: 'GET',
                url,
                qs: params,
                headers,
                json: true
            }, (err, res, body) => {
                if (!err) {
                    resolve(body)
                }
                resolve({code: -1, message: '请求出错'})
            })
        })
    },
    post: (url, data, headers) => {
        if (headers) {
            headers['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
            headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
        }
        return new Promise((resolve) => {
            request({
                method: 'POST',
                url,
                form: data,
                headers,
                json: true
            }, (err, res, body) => {
                if (!err) {
                    resolve(body)
                } else
                    resolve({code: -1, message: '请求出错'})
            })
        })
    }
}

export default {
    getLiveArea: async () => {
        const url = 'https://api.live.bilibili.com/room/v1/Area/getList'
        const params = {show_pinyin: 1}
        const res = await http.get(url, params)
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    getUserInfoByCookie: async (uid, cookie) => {
        const url = 'https://api.bilibili.com/x/space/wbi/acc/info'
        const params = await handleWbiParams({mid: uid})
        let res = await http.get(url + '?' + params, null, {cookie})
        console.log(res)
        // if (typeof res === "string" && res.startsWith("{\"code\":-509")) {
        //    res = JSON.parse(res.substring(res.indexOf("}") + 1))
        // }
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    getUserStatByCookie: async (uid, cookie) => {
        const url = 'https://api.bilibili.com/x/relation/stat'
        const params = {'vmid': uid, 'jsonp': 'jsonp'}
        const headers = {'cookie': cookie, 'Content-type': 'application/json'}
        const res = await http.get(url, params, headers)
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    getLiveInfoByCookie: async (cookie) => {
        const url = 'https://api.live.bilibili.com/xlive/web-ucenter/user/live_info'
        const headers = {'cookie': cookie, 'Content-type': 'application/json'}
        const res = await http.get(url, null, headers)
        if (res.code === 0) {
            const roomId = res.data['room_id']
            const url1 = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo'
            const params = {'req_biz': 'link-center', 'room_ids': roomId}
            const headers1 = {'Content-type': 'application/json'}
            const res1 = await http.get(url1, params, headers1)
            if (res1.code === 0) {
                const data = res1.data['by_room_ids'][String(roomId)]
                return {
                    link: data['live_url'],
                    title: data['title'],
                    areaId: data['area_id'],
                    areaName: data['area_name'],
                    status: data['live_status'],
                    roomId: roomId
                }
            }
            return Promise.reject(res1.message)
        }
        return Promise.reject(res.message)
    },
    getLiveInfoByRoomId: async (roomId) => {
            const url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo'
            const params = {'req_biz': 'link-center', 'room_ids': roomId}
            const headers1 = {'Content-type': 'application/json'}
            const res1 = await http.get(url, params, headers1)
            if (res1.code === 0) {
                const data = res1.data['by_room_ids'][String(roomId)]
                return {
                    link: data['live_url'],
                    title: data['title'],
                    areaId: data['area_id'],
                    areaName: data['area_name'],
                    status: data['live_status'],
                    roomId: roomId
                }
            }
            return Promise.reject(res1.message)
    },
    getLiveRtmpByCookie: async (roomId, cookie) => {
        const url = 'https://api.live.bilibili.com/live_stream/v1/StreamList/get_stream_by_roomId'
        const params = {'room_id': roomId}
        const headers = {'cookie': cookie, 'Content-type': 'application/json'}
        const res = await http.get(url, params, headers)
        if (res.code === 0) {
            const data = res.data['rtmp']
            return {
                rtmp: data['addr'],
                code: data['code']
            }
        }
        return Promise.reject(res.message)
    },
    getAvatarContentByUid: async (uid, cookie) => {
        const url = 'https://api.bilibili.com/x/space/wbi/acc/info'
        const params = await handleWbiParams({mid: uid})
        let res = await http.get(url + '?' + params, null, {cookie})
        if (res.code === 0) {
            const face = res.data.face
            return await getFaceContent(face).catch(e => {
                return Promise.reject('失败')
            })
        }
        return Promise.reject('失败')
    },
    getAvatarContentByUrl: (face) => {
        return getFaceContent(face)
    },
    getRealRoomInfo: async (roomId) => {
        const url = 'https://api.live.bilibili.com/room/v1/Room/room_init'
        const params = {id: roomId}
        const res = await http.get(url, params)
        if (res.code === 0) {
            const realRoomId = res.data['room_id']
            const url1 = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo'
            const params1 = {'req_biz': 'link-center', 'room_ids': realRoomId}
            const headers1 = {'Content-type': 'application/json'}
            const res1 = await http.get(url1, params1, headers1)
            if (res1.code === 0) {
                const data = res1.data['by_room_ids'][realRoomId]
                return {
                    link: data['live_url'],
                    title: data.title,
                    status: data['live_status'],
                    roomId: realRoomId,
                    uid: data.uid,
                    uname: data.uname,
                    areaId: data['area_id'],
                    areaName: data['area_name']
                }
            } else
                return Promise.reject(res1.message)
        } else
            return Promise.reject(res.message)
    },
    getLastTenBarrage: async (roomId) => {
        const url = 'http://api.live.bilibili.com/ajax/msg'
        const params = {'roomid': roomId}
        const res = await http.get(url, params)
        if (res.code === 0) {
            const result = []
            const data = res.data['room']
            console.log(data)
            for (const elem of data) {
                result.push({
                    uid: elem.uid,
                    uname: elem['nickname'],
                    message: elem.text,
                    timestamp: elem['check_info']['ts'],
                    timeline: new Date(elem['check_info']['ts'] * 1000),
                    admin: elem['isadmin'],
                    medal: {
                        has: elem.medal.length > 0,
                        expired: elem.medal.length > 0 && elem.medal[11] === 0,
                        name: elem.medal[1] || '',
                        level: elem.medal[0] || '',
                        borderColor: parseInt(elem.medal[7]).toString(16).padStart(6, '0') || '',
                        backgroundColor: parseInt(elem.medal[9]).toString(16).padStart(6, '0') || '',
                        color: parseInt(elem.medal[8]).toString(16).padStart(6, '0') || '',
                        guardLevel: elem.medal[10] || 0
                    },
                    emoticon: {
                        has: elem.emoticon && elem.emoticon.url !== '',
                        url: elem.emoticon.url || '',
                        height: elem.emoticon.height || 0,
                        width: elem.emoticon.width || 0,
                    }
                })
            }
            return result
        } else
            return Promise.reject(res.message)
    },
    getRoomBaseInfo: async (roomId) => {
        const url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo'
        const params = {'req_biz': 'link-center', 'room_ids': roomId}
        const headers = {'Content-type': 'application/json'}
        const res = await http.get(url, params, headers)
        if (res.code === 0) {
            const data = res.data['by_room_ids'][roomId]
            return {
                link: data['live_url'],
                title: data.title,
                status: data['live_status'],
                roomId: roomId,
                uid: data.uid,
                uname: data.uname,
                areaId: data['area_id'],
                areaName: data['area_name']
            }
        } else
            return Promise.reject(res.message)
    },
    getRelease: async (source = 'gitee', curVersion) => {
        let url = ''
        let res = null
        switch (source) {
            case "github":
                url = 'https://api.github.com/repos/VinoxM/bilive-manager-electron/releases/latest'
                break
            case 'gitee':
                url = 'https://gitee.com/api/v5/repos/VinoxM/bilive-manager-electron/releases/latest'
                break
        }
        res = await http.get(
            url, null,
            {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'

            })
        const result = {hasNew: false, downloadUrl: '', message: null}
        if (res.assets) {
            const version = res.tag_name
            if (checkUpdate(version, curVersion)) {
                result.hasNew = true
                result.downloadUrl = res.assets[0]['browser_download_url']
            }
            return result
        }
        return Promise.reject(res.message || res)
    },
    updateLiveTitle: async (roomId, title, token, cookie) => {
        const url = 'https://api.live.bilibili.com/room/v1/Room/update'
        const params = {
            'csrf_token': token,
            'csrf': token,
            'room_id': roomId,
            'title': title
        }
        const headers = {'cookie': cookie}
        const res = await http.post(url, params, headers)
        return res.code === 0 ? 1 : Promise.reject(res.message)
    },
    updateLiveArea: async (roomId, areaId, token, cookie) => {
        const url = 'https://api.live.bilibili.com/room/v1/Room/update'
        const params = {
            'csrf_token': token,
            'csrf': token,
            'room_id': roomId,
            'area_id': areaId
        }
        const headers = {'cookie': cookie}
        const res = await http.post(url, params, headers)
        return res.code === 0 ? 1 : Promise.reject(res.message)
    },
    updateLiveStatus: async (roomId, status, areaId, token, cookie) => {
        const url = `https://api.live.bilibili.com/room/v1/Room/${status === 0 ? 'startLive' : 'stopLive'}`
        const params = {
            'room_id': roomId,
            // 'platform': 'web_link',
            'platform':'android_link',
            'area_v2': areaId,
            'csrf_token': token,
            'csrf': token
        }
        const headers = {'cookie': cookie}
        const res = await http.post(url, params, headers)
        return res.code === 0 ? 1 : Promise.reject(res.message)
    },
    sendBiliBarrage: async (message, roomId, token, cookie) => {
        const url = 'https://api.live.bilibili.com/msg/send'
        const params = {
            'bubble': 0,
            'msg': message,
            'color': 16777215,
            'mode': 1,
            'fontsize': 25,
            'rnd': 1621495631,
            'roomid': roomId,
            'csrf': token,
            'csrf_token': token
        }
        const headers = {cookie}
        const res = await http.post(url, params, headers)
        if (res.code === 0) {
            return (res.data && res.message !== 'f') ? '发送弹幕成功' : Promise.reject('弹幕好像被吃掉了')
        }
        return Promise.reject(res.message)
    },
    getRoomLiveInfo: async ({cid, qn}, cookie) => {
        const url = 'https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo'
        const res = await http.get(url, {
            room_id: cid,
            protocol: '0',
            format: '0',
            codec: '0,1',
            qn,
            platform: 'web',
            ptype: 8,
            dolby: 5,
            panorama: 1
        }, {cookie})
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    getUserCardByUid: async (uid, cookie) => {
        const url = 'http://api.bilibili.com/x/web-interface/card'
        const params = {
            mid: uid,
            photo: 1
        }
        const headers = {cookie}
        const res = await http.post(url, params, headers)

    },
    getLoginQrCode: async () => {
        const url = 'http://passport.bilibili.com/x/passport-login/web/qrcode/generate'
        const res = await http.get(url)
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    gotoLogin: async (qrcode_key) => {
        const url = 'http://passport.bilibili.com/x/passport-login/web/qrcode/poll'
        const res = await http.get(url, {qrcode_key})
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    getLoginQrCodeOld: async () =>{
        const url = 'http://passport.bilibili.com/qrcode/getLoginUrl'
        const res = await http.get(url)
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    gotoLoginOld: async ({oauthKey, gourl})=>{
        const url = 'http://passport.bilibili.com/qrcode/getLoginInfo'
        const res = await http.post(url, {oauthKey, gourl} , {})
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    getLoginTVQrCode: async () => {
        const url = 'http://passport.snm0516.aisee.tv/x/passport-tv-login/qrcode/auth_code'
        const res = await http.post(url, {appkey:'4409e2ce8ffd12b8', local_id: 0, ts: 0, sign:'e134154ed6add881d28fbdf68653cd9c'} , {})
        return res.code === 0 ? res.data : Promise.reject(res.message)
    },
    getDanmuInfo: async (roomId, cookie)=>{
        const url = "https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo"
        const headers = {cookie}
        const res = await http.get(url, {id: roomId, type: 0}, headers)
        return res.code === 0 ? res.data : Promise.reject(res.message)
    }
}

function getFaceContent(face) {
    return new Promise((resolve, reject) => {
        request({
            url: face,
            method: 'GET',
            encoding: null,
            headers: {
                "Content-Type": 'image/png;'
            }
        }, (err, res, body) => {
            if (!err) {
                const blob = new Blob([body], {type: `image/jpeg`})
                const src = window.URL.createObjectURL(blob)
                resolve(src)
            }
            reject()
        })
    })
}

function checkUpdate(version, curVersion) {
    const ver = String(version).replace('v', '').split('.')
    const curVer = String(curVersion).replace('v', '').split('.')
    return ver.some((o, i) => o - curVer[i] > 0)
}


/**
 * BiliBili 新版API使用wbi鉴权方式
 * 参考: https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/docs/user/info.md
 *
 * 开始
 */
import md5 from 'md5'

const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
    33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
    61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
    36, 20, 34, 44, 52
]

// 对 imgKey 和 subKey 进行字符顺序打乱编码
function getMixinKey(orig) {
    let temp = ''
    mixinKeyEncTab.forEach((n) => {
        temp += orig[n]
    })
    return temp.slice(0, 32)
}

function encWbi(params, img_key, sub_key) {
    const mixin_key = getMixinKey(img_key + sub_key),
        curr_time = Math.round(Date.now() / 1000),
        chr_filter = /[!'()*]/g
    let query = []
    params = Object.assign(params, {wts: curr_time})    // 添加 wts 字段
    // 按照 key 重排参数
    Object.keys(params).sort().forEach((key) => {
        query.push(
            encodeURIComponent(key) +
            '=' +
            // 过滤 value 中的 "!'()*" 字符
            encodeURIComponent(('' + params[key]).replace(chr_filter, ''))
        )
    })
    query = query.join('&')
    const wbi_sign = md5(query + mixin_key) // 计算 w_rid
    return query + '&w_rid=' + wbi_sign
}

async function getWbiKeys() {
    const url = 'https://api.bilibili.com/x/web-interface/nav'
    const res = await http.get(url)
    const img_url = res.data['wbi_img']['img_url']
    const sub_url = res.data['wbi_img']['sub_url']
    return {
        img_key: img_url.substring(img_url.lastIndexOf('/') + 1, img_url.length).split('.')[0],
        sub_key: sub_url.substring(sub_url.lastIndexOf('/') + 1, sub_url.length).split('.')[0]
    }
}

async function handleWbiParams(params) {
    const {img_key, sub_key} = await getWbiKeys()
    return encWbi(params, img_key, sub_key)
}

/**
 * BiliBili 新版API的wbi鉴权
 * 结束
 */