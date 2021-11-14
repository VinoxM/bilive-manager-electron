<template>
    <div class="barrage-container" @mouseup="dividerFlag=false" @mousemove="dividerMove"
         @mouseleave="dividerFlag=false" :style="{cursor: dividerFlag?'ns-resize':'default'}">
        <div class="barrage-header" v-show="!throughFlag">
            <div class="live-avatar-model" :style="avatarColor" :title="roomTitle" @click="openUrl"></div>
            <img class="live-avatar" :src="avatar" draggable="false">
            <span class="live-title">
                {{roomInfo.title}}
            </span>
            <div class="barrage-header-tool">
                <el-icon :title="popTitle" name="connection"
                         :class="connected ? 'tool-btn tool-disconnect' : 'tool-btn tool-connect'"
                         @click.native="toggleConnect"></el-icon>
                <span class="tool-pop" :title="'人气 : '+pop">
                    {{handleNumber(pop)}}
                </span>
                <el-icon title="置顶" name="upload2" class="tool-btn btn-on-top"
                         :style="{color:onTop?'#92e5de':'white'}" @click.native="toggleOnTop"></el-icon>
                <el-icon title="点击穿透" name="mouse" class="tool-btn btn-through"
                         :style="{color:throughFlag?'#92e5de':'white'}" @click.native="clickThrough"></el-icon>
                <el-icon title="关闭" name="close" class="tool-btn btn-close" @click.native="barrageClose"></el-icon>
            </div>
        </div>
        <div style="height: 36px" v-if="!throughFlag"></div>
        <div :class="bScrollHide?'barrage-box scroll-hide':'barrage-box'"
             :style="{height:boxHeight+'px'}"
             @wheel="handleBarrageWheel" @mouseleave="bScrollCountdown"
             draggable="false" id="barrage">
        </div>
        <div class="barrage-divider" :style="{height: dividerHeight+'px'}"
             @mousedown="dividerFlag=true" draggable="false">
        </div>
        <div :class="jScrollHide?'barrage-join scroll-hide':'barrage-join'"
             :style="{height:joinHeight+'px'}"
             @wheel="handleJoinWheel" @mouseleave="jScrollCountdown"
             draggable="false" id="join">

        </div>
        <header-log :top="throughFlag?0:36" ref="logs"></header-log>
        <el-dialog :visible.sync="dialogVisible" title="连接到直播间" center width="100%" @closed="cacheTemp=''">
            <el-input class="barrage-connect-input" v-model="roomTemp"></el-input>
            <el-divider content-position="left">历史记录</el-divider>
            <el-select class="barrage-connect-input" v-model="cacheTemp" ref="cache"
                       placeholder="请选择..." @change="cacheChanged">
                <el-option-group v-for="group in cacheGroups" :label="group.label" :key="group.label">
                    <el-option v-for="item in group.children" :key="item.value" :label="item.label"
                               :value="item.value"></el-option>
                </el-option-group>
            </el-select>
            <div slot="footer">
                <el-link icon="el-icon-check" @click="saveAndConnect">保存</el-link>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    const cp = require('child_process')
    import noface from '../assets/noface.jpg'

    export default {
        name: "Barrage",
        data() {
            return {
                dividerFlag: false,
                boxHeight: 600,
                throughFlag: false,
                clientHeight: 0,
                joinRange: [200, 260],
                dividerHeight: 6,
                avatar: noface,
                onTop: true,
                dialogVisible: false,
                roomTemp: 0,
                cacheTemp: '',
                cacheGroups: [{
                    label: '历史',
                    children: []
                }, {
                    label: '自己',
                    children: []
                }],
                cacheOptions: [],
                userInfo: {
                    uid: 0,
                    uname: '',
                    roomId: 0
                },
                pop: 0,
                roomInfo: {
                    areaId: 0,
                    areaName: '',
                    link: '',
                    roomId: '',
                    status: 0,
                    title: '',
                    uid: 0,
                    uname: ''
                },
                connected: false,
                bScrollHide: true,
                bScrollCd: false,
                jScrollHide: true,
                jScrollCd: false,
            }
        },
        computed: {
            joinHeight() {
                return this.clientHeight - this.boxHeight - this.dividerHeight
            },
            popTitle() {
                return this.connected ? '断开连接' : '连接弹幕'
            },
            avatarColor() {
                if (!this.connected)
                    return {}
                else if (this.connected && this.roomInfo.status)
                    return {boxShadow: '0 0 2em 0 green'}
                else
                    return {boxShadow: '0 0 2em 0 red'}
            },
            roomTitle() {
                if (this.roomInfo.uid !== 0) {
                    return `${this.roomInfo.uname}\n${this.roomInfo.areaName}\n${this.roomInfo.title}`
                } else
                    return ''
            }
        },
        methods: {
            handleNumber(num) {
                if (num < 10000) {
                    return num
                } else if (num > 10000000) {
                    return (num / 10000000).toFixed(1) + ' kw'
                } else {
                    return (num / 10000).toFixed(1) + ' w'
                }
            },
            dividerMove(e) {
                if (this.dividerFlag) {
                    const y = e.y
                    const joinHeight = this.clientHeight - y - this.dividerHeight
                    if (joinHeight >= this.joinRange[0] && joinHeight <= this.joinRange[1]) {
                        this.boxHeight = y
                    } else if (joinHeight > this.joinRange[1]) {
                        this.boxHeight = this.clientHeight - this.joinRange[1] - this.dividerHeight
                    } else if (joinHeight < this.joinRange[0]) {
                        this.boxHeight = this.clientHeight - this.joinRange[0] - this.dividerHeight
                    }
                }
            },
            initCache() {
                this.cacheOptions = this.$cache.get('liveRoom')
                this.cacheGroups[0].children = this.cacheOptions
            },
            cacheChanged() {
                this.roomTemp = this.cacheTemp
            },
            toggleConnect() {
                if (this.$ws.connected) {
                    this.$ws.close()
                } else {
                    this.dialogVisible = true
                }
            },
            toggleOnTop() {
                this.ipcRenderer.send('toggle-on-top')
            },
            clickThrough() {
                this.ipcRenderer.send('click-through')
            },
            barrageClose() {
                this.ipcRenderer.send('barrage-close')
            },
            saveAndConnect() {
                let this_ = this
                if (this.roomTemp === 0) {
                    this.addHeadLog('请输入正确的房间号码', 1)
                    this.dialogVisible = false
                } else {
                    this.$api.getRealRoomInfo(this.roomTemp).then(res => {
                        this_.roomInfo = res
                        this_.roomTemp = res.roomId
                        if (this_.roomInfo.roomId !== 0) {
                            this_.$ws.open(this_.roomInfo.roomId)
                            if (this_.roomInfo.uid !== this_.userInfo.uid)
                                this_.saveCache(this_.roomInfo)
                            this_.emptyBarrageAndJoin()
                            this_.$api.getLastTenBarrage(this_.roomInfo.roomId).then(res => {
                                for (const r of res) {
                                    this_.addBarrage(r)
                                }
                            }).catch(e => {
                                this_.addHeadLog(e, 1)
                            })
                            this_.$api.getAvatarContentByUid(this_.roomInfo.uid).then(res => {
                                this_.avatar = res
                            }).catch(e => {
                                this_.avatar = noface
                            })
                        }
                        this_.dialogVisible = false
                    }).catch(e => {
                        this.addHeadLog(e, 1)
                    })
                }
            },
            addHeadLog(message, isError = false) {
                this.$refs.logs.logCountdown(message, isError)
            },
            dateFormat(date) {
                let d = new Date(date)
                return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} `
                    + `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
            },
            addBarrage(data) {
                const host = `<span class="barrage-host">主播</span>`
                const admin = `<span class="barrage-admin">房管</span>`
                const uname = `<span class="barrage-uname">${data.uname}</span><span class="barrage-colon"></span>`
                const message = `<span class="barrage-message">${data.message}</span>`
                let innerHtml = ''
                if (data.uid === this.roomInfo.uid)
                    innerHtml += host
                else if (data.admin)
                    innerHtml += admin
                innerHtml += uname + message
                const p = document.createElement('p')
                p.setAttribute('class', 'barrage-p')
                p.setAttribute('title', this.dateFormat(data.timeline))
                p.innerHTML = innerHtml
                document.getElementById('barrage').appendChild(p)
                if (this.bScrollHide)
                    document.getElementById('barrage').scrollTop = document.getElementById('barrage').scrollHeight
                this.deleteFirstItem('barrage', 50)
            },
            addSc(data) {
                const user = document.createElement('div')
                user.setAttribute('class', 'barrage-sc-user')
                const avatar = document.createElement('img')
                avatar.setAttribute('class', 'barrage-sc-avatar')
                user.appendChild(avatar)
                const uname = document.createElement('span')
                uname.setAttribute('class', 'barrage-sc-uname')
                uname.innerText = data.uname
                user.appendChild(uname)
                const price = document.createElement('span')
                price.setAttribute('class', 'barrage-sc-price')
                price.innerText = '￥ ' + data.price
                user.appendChild(price)
                const sc = document.createElement('div')
                sc.setAttribute('class', 'barrage-sc')
                sc.appendChild(user)
                const p = document.createElement('p')
                p.setAttribute('class', 'barrage-sc-message')
                p.innerText = data.message
                sc.appendChild(p)
                this.$api.getAvatarContentByUrl(data.face).then((res) => {
                    avatar.src = res
                }).catch(e => {
                    console.log(e)
                })
                document.getElementById('barrage').appendChild(sc)
                if (this.bScrollHide)
                    document.getElementById('barrage').scrollTop = document.getElementById('barrage').scrollHeight
                this.deleteFirstItem('barrage', 50)
            },
            deleteFirstItem(id, num) {
                if (document.getElementById(id).childElementCount >= num) {
                    document.getElementById(id).children.item(0).remove()
                }
            },
            handleBarrageWheel() {
                this.bScrollHide = false
            },
            hideBScroll() {
                this.bScrollHide = true
                this.bScrollCd = false
                document.getElementById('barrage').scrollTop = document.getElementById('barrage').scrollHeight
            },
            bScrollCountdown() {
                if (this.bScrollCd || this.bScrollHide) return
                this.bScrollCd = true
                let this_ = this
                setTimeout(() => {
                    this_.hideBScroll()
                }, 2000)
            },
            addJoin(data) {
                const uname = `<span class="join-uname">${data.uname}</span>`
                const innerHtml = '欢迎 ' + uname + ' 进入直播间'
                const p = document.createElement('p')
                p.setAttribute('class', 'join-p')
                p.setAttribute('title', this.dateFormat(data.timeline))
                p.innerHTML = innerHtml
                document.getElementById('join').appendChild(p)
                if (this.jScrollHide)
                    document.getElementById('join').scrollTop = document.getElementById('join').scrollHeight
                this.deleteFirstItem('join', 20)
            },
            addGift(data) {
                const uname = `<span class="gift-uname">${data.uname}</span>`
                const innerHtml = uname + ` ${data.action}了 <span class="gift-num">${data.num}</span> 个 <span class="gift-name">${data.giftName}</span>`
                const p = document.createElement('p')
                p.setAttribute('class', 'join-p')
                p.setAttribute('title', this.dateFormat(data.timeline))
                p.innerHTML = innerHtml
                document.getElementById('join').appendChild(p)
                if (this.jScrollHide)
                    document.getElementById('join').scrollTop = document.getElementById('join').scrollHeight
                this.deleteFirstItem('join', 20)
            },
            addEffect(data) {
                let message = String(data.message).replace('<%', ' <span class="join-uname">')
                message = message.replace('%>', '</span> ')
                const p = document.createElement('p')
                p.setAttribute('class', 'join-p')
                p.setAttribute('title', this.dateFormat(data.timeline))
                p.innerHTML = message
                document.getElementById('join').appendChild(p)
                if (this.jScrollHide)
                    document.getElementById('join').scrollTop = document.getElementById('join').scrollHeight
                this.deleteFirstItem('join', 20)
            },
            handleJoinWheel() {
                this.jScrollHide = false
            },
            hideJScroll() {
                this.jScrollHide = true
                this.jScrollCd = false
                document.getElementById('join').scrollTop = document.getElementById('join').scrollHeight
            },
            jScrollCountdown() {
                if (this.jScrollCd || this.jScrollHide) return
                this.jScrollCd = true
                let this_ = this
                setTimeout(() => {
                    this_.hideJScroll()
                }, 2000)
            },
            addWsListeners() {
                this.$ws.event.on('open', () => {
                    this.connected = true
                    this.addHeadLog('连接到直播间')
                    this.ipcRenderer.send('update-ws-connect', true)
                    this.ipcRenderer.send('save-room-info', this.roomInfo)
                })
                this.$ws.event.on('close', () => {
                    this.connected = false
                    this.addHeadLog('断开直播间连接')
                    this.ipcRenderer.send('update-ws-connect', false)
                })
                this.$ws.event.on('pop', (num) => {
                    this.pop = num
                })
                this.$ws.event.on('start', () => {
                    this.roomInfo.status = 1
                    this.addHeadLog('直播开始了')
                })
                this.$ws.event.on('stop', () => {
                    this.roomInfo.status = 0
                    this.addHeadLog('直播已结束')
                })
                this.$ws.event.on('change', (data) => {
                    if (this.roomInfo.title !== data.title) {
                        this.addHeadLog('直播标题修改')
                        this.roomInfo.title = data.title
                    }
                    if (this.roomInfo.areaId !== data.area_id) {
                        this.addHeadLog(`直播分区修改:[${data['parent_area_name']}] ${data['area_name']}`)
                        this.roomInfo.areaId = data.area_id
                        this.roomInfo.areaName = data['area_name']
                    }
                })
                this.$ws.event.on('message', (data) => {
                    this.addBarrage(data)
                })
                this.$ws.event.on('join', (data) => {
                    this.addJoin(data)
                })
                this.$ws.event.on('gift', (data) => {
                    this.addGift(data)
                })
                this.$ws.event.on('effect', (data) => {
                    this.addEffect(data)
                })
                this.$ws.event.on('sc', (data) => {
                    this.addSc(data)
                })
            },
            openUrl() {
                if (this.roomInfo.link !== '') {
                    cp.exec('start ' + this.roomInfo.link)
                }
            },
            saveCache(rInfo) {
                const index = this.cacheOptions.findIndex(o => o.value === this.roomTemp)
                if (index > -1) {
                    this.cacheOptions.splice(index, 1)
                } else if (this.cacheOptions.length >= 5) {
                    this.cacheOptions.pop()
                }
                this.cacheOptions.unshift({
                    value: rInfo.roomId,
                    uname: rInfo.uname,
                    uid: rInfo.uid,
                    label: `[${rInfo.roomId}] ${rInfo.uname}`
                })
                this.$cache.set('liveRoom', this.cacheOptions)
                this.$cache.save()
                this.cacheGroups[0].children = this.cacheOptions
            },
            emptyBarrageAndJoin() {
                document.getElementById('barrage').innerHTML = ''
                document.getElementById('join').innerHTML = ''
            }
        },
        created() {
            const this_ = this
            this.initCache()
            this.ipcRenderer.on('resize', (e, size) => {
                this.clientHeight = size.height
                const joinHeight = this.clientHeight - this.boxHeight - this.dividerHeight
                if (joinHeight < this.joinRange[0]) {
                    this.boxHeight = this.clientHeight - this.joinRange[0] - this.dividerHeight
                } else if (joinHeight > this.joinRange[1]) {
                    this.boxHeight = this.clientHeight - this.joinRange[1] - this.dividerHeight
                }
            })
            this.ipcRenderer.send('get-size')
            this.ipcRenderer.on('updateUserInfo', (e, uInfo) => {
                if (!uInfo) return
                this_.userInfo = uInfo
                this_.roomTemp = this_.userInfo.roomId
                this_.cacheGroups[1].children = [{
                    value: uInfo.roomId,
                    uname: uInfo.uname,
                    uid: uInfo.uid,
                    label: `[${uInfo.roomId}] ${uInfo.uname}`
                }]
            })
            this.ipcRenderer.send('update-user-info')
            this.ipcRenderer.on('updateOnTop', (e, flag) => {
                this.onTop = flag
            })
            this.ipcRenderer.on('toggleClickThrough', (e, flag) => {
                this.throughFlag = flag
                this.boxHeight += 36 * (flag ? 1 : -1)
            })
            this.ipcRenderer.on('toggleWsConnect', () => {
                this.toggleConnect()
            })
            this.ipcRenderer.on('toggleBarrageOnTop', () => {
                this.toggleOnTop()
            })
            this.ipcRenderer.on('addBarrageLog', (e, msg) => {
                this.addHeadLog(msg)
            })
            this.ipcRenderer.on('addBarrageErr', (e, msg) => {
                this.addHeadLog(msg, 1)
            })
            this.addWsListeners()
            if (!this.$ws.connected) {
                this.ipcRenderer.send('update-ws-connect', false)
            }
        }
    }
</script>

<style scoped>
    .barrage-container {
        background: rgba(0, 0, 0, 0.55);
        height: 100%;
        width: 100%;
        position: relative;
    }

    .barrage-header {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        -webkit-app-region: drag;
        height: 36px;
        background: rgba(0, 0, 0, 0.3);
        box-shadow: 0 0 2em 1px rgb(0, 0, 0);
    }

    .barrage-header-tool {
        position: absolute;
        right: 0;
        top: 0;
        height: 100%;
        -webkit-app-region: no-drag;
    }

    .tool-btn {
        height: 30px;
        width: 20px;
        margin: 3px;
        line-height: 30px;
        text-align: center;
        font-size: 15px;
    }

    .tool-connect {
        cursor: pointer;
        color: white;
        width: 15px !important;
        margin: 3px 0 !important;
    }

    .tool-connect:hover {
        color: #92e5de;
    }

    .tool-disconnect {
        cursor: pointer;
        color: #92e5de;
        width: 15px !important;
        margin: 3px 0 !important;
    }

    .tool-disconnect:hover {
        color: red;
    }

    .tool-pop {
        display: inline-block;
        width: 48px;
        height: 36px;
        line-height: 36px;
        vertical-align: top;
        text-align: right;
        margin-right: 6px;
        font-size: 13px;
        color: white;
        user-select: none;
        -webkit-user-select: none;
    }

    .btn-on-top {
        cursor: pointer;
    }

    .btn-through {
        cursor: pointer;
        color: white;
    }

    .btn-through:hover {
        color: #92e5de;
    }

    .btn-close {
        color: white;
        cursor: pointer;
        margin-right: 6px;
    }

    .btn-close:hover {
        color: #92e5de;
    }

    .barrage-box {
        width: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: auto;
        padding-top: 10px;
    }

    .barrage-divider {
        width: 100%;
        background: rgba(0, 0, 0, 0.45);
        cursor: ns-resize;
        user-select: none;
        -webkit-user-select: none;
        box-shadow: 0 0 2em 1px black;
    }

    .barrage-join {
        width: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: auto;
    }

    .live-avatar-model {
        position: absolute;
        height: 28px;
        width: 28px;
        left: 4px;
        top: 4px;
        border-radius: 50%;
        z-index: 9;
        cursor: pointer;
        -webkit-app-region: no-drag;
    }

    .live-avatar {
        margin: 3px;
        width: 30px;
        height: 30px;
        display: inline-block;
        border-radius: 50%;
        z-index: 1;
    }

    .live-title {
        vertical-align: top;
        display: inline-block;
        width: 190px;
        height: 36px;
        line-height: 36px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        color: white;
    }

    .barrage-connect-input {
        width: 100%;
    }

    .barrage-connect-input >>> input {
        font-family: "Microsoft YaHei", sans-serif;
    }

    >>> .barrage-p {
        font-family: "Microsoft YaHei", sans-serif;
        font-size: 14px;
        margin: 0 10px 15px 10px;
        padding: 5px;
        /*box-shadow: 0 8px 10px -8px #a6c0e8;*/
        border-radius: 6px;
    }

    >>> .barrage-p:hover {
        /*box-shadow: 0 0 2em 1px #a6c0e8;*/
    }

    >>> .barrage-host {
        border: #fb7299 1px solid;
        font-weight: bold;
        color: white;
        margin-right: 5px;
        padding: 0 5px;
        font-size: 12px;
    }

    >>> .barrage-admin {
        border: #f8b647 1px solid;
        font-weight: bold;
        color: white;
        margin-right: 5px;
        padding: 0 5px;
        font-size: 12px;
    }

    >>> .barrage-uname {
        color: #a6c0e8;
        font-weight: bold;
    }

    >>> .barrage-colon:after {
        content: " : ";
        color: white;
    }

    >>> .barrage-message {
        color: white;
    }

    >>> .barrage-sc {
        margin: 0 10px 10px 10px;
        border-radius: 10px;
        box-shadow: 0 0 4px 1px #a6c0e8;
        box-sizing: border-box;
    }

    >>> .barrage-sc:hover {
        /*box-shadow: 0 0 2em 1px #a6c0e8;*/
    }

    >>> .barrage-sc-user {
        height: 36px;
        padding: 5px;
        position: relative;
        line-height: 36px;
        box-shadow: 0 15px 10px -15px black;
    }

    >>> .barrage-sc-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
    }

    >>> .barrage-sc-uname {
        display: inline-block;
        line-height: 36px;
        vertical-align: top;
        color: #a6c0e8;
        margin-left: 5px;
    }

    >>> .barrage-sc-price {
        position: absolute;
        right: 10px;
        display: inline-block;
        color: black;
        top: 11px;
        padding: 0 8px;
        background: gold;
        border-radius: 10px;
        line-height: 24px;
        box-shadow: 0 0 2em 1px gold;
    }

    >>> .barrage-sc-message {
        color: white;
        margin: 0 5px;
        padding: 5px;
    }


    >>> .join-p {
        font-family: "Microsoft YaHei", sans-serif;
        font-size: 14px;
        margin: 0 0 12px 0;
        padding: 6px 8px 0 8px;
        color: white;
    }

    >>> .join-uname,
    >>> .gift-uname {
        color: #a6c0e8;
        font-weight: bold;
    }

    >>> .gift-num {
        color: #a6c0e8;
        font-weight: bold;
        text-decoration: underline;
    }

    >>> .gift-name {
        color: #a6c0e8;
        font-weight: bold;
    }

    .scroll-hide::-webkit-scrollbar {
        width: 0 !important
    }
</style>