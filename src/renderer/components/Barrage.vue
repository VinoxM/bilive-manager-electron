<template>
    <div class="barrage-container" @mouseup="dividerFlag=false" @mousemove="dividerMove"
         @mouseleave="dividerFlag=false" :style="{cursor: dividerFlag?'ns-resize':'default', background: bColor}">
        <div class="barrage-header" v-show="!throughFlag">
            <div class="live-avatar-model" :style="avatarColor" :title="roomTitle" @click="openUrl"
                 @contextmenu="handleRightClick"></div>
            <img class="live-avatar" :src="avatar" draggable="false">
            <span class="live-title" :style="{width:titleWidth+'px'}">
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
                <el-icon title="左键打开设置,右键关闭窗口" name="setting" class="tool-btn btn-close"
                         @click.native="settingVisible = true"
                         @click.right.native="barrageClose"></el-icon>
            </div>
        </div>
        <div style="height: 36px" v-if="!throughFlag"></div>
        <div :class="heartbeatClass"><span>{{roomLiveStatus}}</span></div>
        <div class="barrage-effect" :style="{height:boxHeight+'px'}">
            <div class="barrage-effect-sc" id="effect-sc">
            </div>
            <div class="barrage-effect-box" id="effect" :style="{maxHeight: (boxHeight-36) +'px'}">
            </div>
        </div>
        <div :class="bScrollHide?'barrage-box scroll-hide':'barrage-box'"
             :style="{height:boxHeight+'px',top: throughFlag?0:'36px'}"
             @wheel="handleBarrageWheel" @mouseleave="bScrollCountdown"
             draggable="false" id="barrage">
        </div>
        <div class="barrage-divider" :style="{height: dividerHeight+'px'}"
             v-show="joinShow"
             @mousedown="dividerFlag=true" draggable="false">
        </div>
        <div :class="jScrollHide?'barrage-join scroll-hide':'barrage-join'"
             :style="{height:joinHeight+'px'}"
             @wheel="handleJoinWheel" @mouseleave="jScrollCountdown"
             v-show="joinShow"
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
                               :value="item.value" :disabled="item.roomId===0"></el-option>
                </el-option-group>
            </el-select>
            <div slot="footer">
                <el-link icon="el-icon-check" @click="saveAndConnect" :disabled="connectFlag">保存</el-link>
            </div>
        </el-dialog>

        <el-drawer :visible.sync="settingVisible" width="100%" direction="ttb" title="设置"
                   size="500px" class="barrage-setting">
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">窗口宽高</span>
                <span>{{clientWidth}}</span> x <span>{{clientHeight}}</span>
            </el-row>
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">窗口位置</span>
                (<span>{{posX}}</span>, <span>{{posY}}</span>)
            </el-row>
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">粉丝勋章</span>
                <el-switch active-text="显示" inactive-text="隐藏" v-model="medalVisible"></el-switch>
            </el-row>
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">进场特效</span>
                <el-switch active-text="显示" inactive-text="隐藏" v-model="effectFlag"></el-switch>
            </el-row>
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">进场/礼物</span>
                <el-switch active-text="显示" inactive-text="隐藏" v-model="joinShow"></el-switch>
            </el-row>
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">背景颜色</span>
                <el-color-picker v-model="bColor" show-alpha></el-color-picker>
                <el-link style="margin-left: 20px" @click.native="bColor='rgba(0,0,0,0.5)'">重置默认</el-link>
            </el-row>
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">用户颜色</span>
                <el-color-picker v-model="uNameColor"></el-color-picker>
                <el-link style="margin-left: 20px" @click.native="uNameColor='#a6c0e8'">重置默认</el-link>
            </el-row>
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">弹幕颜色</span>
                <el-color-picker v-model="bMessageColor"></el-color-picker>
                <el-link style="margin-left: 20px" @click.native="bMessageColor='#ffffff'">重置默认</el-link>
            </el-row>
            <el-row class="barrage-setting-row">
                <span class="barrage-setting-label">礼物颜色</span>
                <el-color-picker v-model="giftColor"></el-color-picker>
                <el-link style="margin-left: 20px" @click.native="giftColor='#a6c0e8'">重置默认</el-link>
            </el-row>
            <el-link class="barrage-setting-save" icon="el-icon-check" type="primary" @click.native="saveSetting">
                保存到本地
            </el-link>
        </el-drawer>
    </div>
</template>

<script>
    const cp = require('child_process')
    const iconv = require('iconv-lite')
    import noface from '../assets/noface.jpg'
    import guard1 from '../assets/icon-guard1.png'
    import guard2 from '../assets/icon-guard2.png'
    import guard3 from '../assets/icon-guard3.png'

    const {remote} = require('electron')
    const Menu = remote.Menu
    const MenuItem = remote.MenuItem

    export default {
        name: "Barrage",
        data() {
            return {
                dividerFlag: false,
                boxHeight: 600,
                throughFlag: false,
                clientHeight: 0,
                clientWidth: 0,
                posX: 0,
                posY: 0,
                bColor: 'rgba(0,0,0, 0.5)',
                uNameColor: '#a6c0e8',
                bMessageColor: '#ffffff',
                giftColor: '#a6c0e8',
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
                    roomId: 0,
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
                guardLevel: {
                    2: guard2,
                    3: guard3
                },
                settingVisible: false,
                medalVisible: false,
                effectFlag: true,
                joinShow: false,
                joinHeightTemp: 200,
                statusTitle: {
                    0: '停播中',
                    1: '直播中',
                    2: '轮播中'
                },
                barrageWait: [],
                joinWait: [],
                connectFlag: false
            }
        },
        watch: {
            medalVisible(val) {
                for (let elem of document.getElementsByClassName('barrage-medal')) {
                    elem.setAttribute('class', val ? 'barrage-medal' : 'barrage-medal hide')
                }
                if (this.bScrollHide) {
                    document.getElementById('barrage').scrollTop = document.getElementById('barrage').scrollHeight
                }
            },
            joinShow(val) {
                if (val) {
                    this.boxHeight = this.clientHeight - (this.throughFlag ? 0 : 36) - this.dividerHeight - this.joinHeightTemp
                } else {
                    this.joinHeightTemp = this.clientHeight - (this.throughFlag ? 0 : 36) - this.boxHeight - this.dividerHeight
                    this.boxHeight = this.clientHeight - (this.throughFlag ? 0 : 36)
                }
            },
            uNameColor(val) {
                for (let elem of document.getElementsByClassName('barrage-uname')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
                for (let elem of document.getElementsByClassName('barrage-sc-uname')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
                for (let elem of document.getElementsByClassName('join-uname')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
                for (let elem of document.getElementsByClassName('gift-uname')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
            },
            bMessageColor(val) {
                for (let elem of document.getElementsByClassName('barrage-message')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
                for (let elem of document.getElementsByClassName('barrage-sc-message')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
            },
            giftColor(val) {
                for (let elem of document.getElementsByClassName('gift-num')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
                for (let elem of document.getElementsByClassName('gift-name')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
                for (let elem of document.getElementsByClassName('barrage-effect-gift-info')) {
                    elem.setAttribute('style', `color: ${val}`)
                }
            }
        },
        computed: {
            heartbeatClass() {
                if (this.throughFlag && this.connected) {
                    switch (this.roomInfo.status) {
                        case 0:
                            return 'heartbeat-box heartbeat-off'
                        case 1:
                            return 'heartbeat-box heartbeat-on'
                        case 2:
                            return 'heartbeat-box heartbeat-loop'
                    }
                } else {
                    return 'hide'
                }
            },
            roomLiveStatus() {
                switch (this.roomInfo.status) {
                    case 0:
                        return '未直播'
                    case 1:
                        return '直播中'
                    case 2:
                        return '轮播中'
                }
            },
            titleWidth() {
                return this.clientWidth - 210
            },
            joinHeight() {
                return this.clientHeight - (this.throughFlag ? 0 : 36) - this.boxHeight - this.dividerHeight
            },
            popTitle() {
                return this.connected ? '断开连接' : '连接弹幕'
            },
            avatarColor() {
                if (this.connected)
                    switch (this.roomInfo.status) {
                        case 0:
                            return {boxShadow: '0 0 2em 0 red'}
                        case 1:
                            return {boxShadow: '0 0 2em 0 green'}
                        case 2:
                            return {boxShadow: '0 0 2em 0 #92d1e5'}
                    }
                else
                    return {}
            },
            roomTitle() {
                if (this.roomInfo.uid !== 0) {
                    return `${this.statusTitle[this.roomInfo.status]}\n${this.roomInfo.uname}\n${this.roomInfo.areaName}\n${this.roomInfo.title}`
                } else
                    return ''
            }
        },
        methods: {
            initSetting() {
                this.clientHeight = this.$bSetting.get('clientHeight') || 0
                this.clientWidth = this.$bSetting.get('clientWidth') || 0
                this.posX = this.$bSetting.get('posX') || 0
                this.posY = this.$bSetting.get('posY') || 0
                this.medalVisible = this.$bSetting.get('medalVisible') || false
                this.effectFlag = this.$bSetting.get('effectFlag') || false
                this.joinShow = this.$bSetting.get('joinShow') || false
                this.bColor = this.$bSetting.get('bColor') || 'rgba(0,0,0,0.5)'
                this.uNameColor = this.$bSetting.get('uNameColor') || '#a6c0e8'
                this.bMessageColor = this.$bSetting.get('bMessageColor') || '#ffffff'
                this.giftColor = this.$bSetting.get('giftColor') || '#a6c0e8'
            },
            saveSetting() {
                this.$bSetting.set('clientHeight', this.clientHeight)
                this.$bSetting.set('clientWidth', this.clientWidth)
                this.$bSetting.set('posX', this.posX)
                this.$bSetting.set('posY', this.posY)
                this.$bSetting.set('medalVisible', this.medalVisible)
                this.$bSetting.set('effectFlag', this.effectFlag)
                this.$bSetting.set('joinShow', this.joinShow)
                this.$bSetting.set('bColor', this.bColor)
                this.$bSetting.set('uNameColor', this.uNameColor)
                this.$bSetting.set('bMessageColor', this.bMessageColor)
                this.$bSetting.set('giftColor', this.giftColor)
                this.$bSetting.save()
                this.settingVisible = false
            },
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
                        this.boxHeight = y - 36
                    } else if (joinHeight > this.joinRange[1]) {
                        this.boxHeight = this.clientHeight - this.joinRange[1] - 36 - this.dividerHeight
                    } else if (joinHeight < this.joinRange[0]) {
                        this.boxHeight = this.clientHeight - this.joinRange[0] - 36 - this.dividerHeight
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
                    this.ipcRenderer.send('click-through-off')
                }
                this.ipcRenderer.send('update-ws-connect', this.$ws.connected)
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
                this_.connectFlag = true
                if (this.roomTemp === 0) {
                    this.addHeadLog('请输入正确的房间号码', 1)
                    this.dialogVisible = false
                    this.connectFlag = false
                } else {
                    this.ipcRenderer.send('barrage-open')
                    if (this.roomTemp === this.$ws.roomId && this.$ws.connected) return
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
                            }).catch(() => {
                                this_.avatar = noface
                            })
                        }
                        this_.dialogVisible = false
                        this_.connectFlag = false
                    }).catch(e => {
                        this.addHeadLog(e, 1)
                        this_.dialogVisible = false
                        this_.connectFlag = false
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
                let medal = ''
                if (data.medal && data.medal.has && !data.medal.expired) {
                    medal += `<span class="${this.medalVisible ? 'barrage-medal' : 'barrage-medal hide'}" style="border-color: #${data.medal.borderColor}">`
                    medal += `<span class="barrage-medal-name" style="background-image:linear-gradient(45deg, #${data.medal.color}, #${data.medal.backgroundColor});${data.medal.guardLevel > 0 ? 'padding-left:18px' : ''}">`
                    if (data.medal.guardLevel > 0) {
                        medal += `<img class="barrage-medal-guard" src="${this.guardLevel[data.medal.guardLevel]}"/>`
                    }
                    medal += `${data.medal.name}</span><span class="barrage-medal-level" style="color: #${data.medal.color}">${data.medal.level}</span>`
                    medal += '</span>'
                }
                const host = `<span class="barrage-host">主</span>`
                const admin = `<span class="barrage-admin">房</span>`
                const uname = `<span class="barrage-uname" style="color:${this.uNameColor}" uid="${data.uid}">${data.uname}</span><span class="barrage-colon"></span>`
                let innerHtml = medal
                if (data.uid === this.roomInfo.uid)
                    innerHtml += host
                else if (data.admin)
                    innerHtml += admin
                innerHtml += uname
                const p = document.createElement('p')
                p.setAttribute('class', data.uid === this.userInfo.uid ? 'barrage-p barrage-self' : 'barrage-p')
                p.setAttribute('title', this.dateFormat(data.timeline))
                p.setAttribute('uid', data.uid)
                p.innerHTML = innerHtml
                if (data.emoticon.has) {
                    const message = document.createElement('img')
                    message.setAttribute('class', 'barrage-message-image')
                    this.$api.getAvatarContentByUrl(data.emoticon.url).then(res => {
                        message.src = res
                    }).catch(e => {
                        message.remove()
                        const msg1 = document.createElement('span')
                        msg1.setAttribute('class', 'barrage-message')
                        msg1.setAttribute('style', `color:${this.bMessageColor}`)
                        msg1.innerText = data.message
                        p.appendChild(msg1)
                    })
                    p.appendChild(message)
                } else {
                    const message = document.createElement('span')
                    message.setAttribute('class', 'barrage-message')
                    message.setAttribute('style', `color:${this.bMessageColor}`)
                    message.innerText = data.message
                    p.appendChild(message)
                }
                document.getElementById('barrage').appendChild(p)
                if (this.bScrollHide) {
                    document.getElementById('barrage').scrollTop = document.getElementById('barrage').scrollHeight
                    this.deleteFirstItem('barrage', 50)
                }
            },
            addSc(data) {
                console.log('add sc')
                const user = document.createElement('div')
                user.setAttribute('class', 'barrage-sc-user')
                const avatar = document.createElement('img')
                avatar.setAttribute('class', 'barrage-sc-avatar')
                user.appendChild(avatar)
                const uname = document.createElement('span')
                uname.setAttribute('class', 'barrage-sc-uname')
                uname.setAttribute('uid', data.uid)
                uname.setAttribute('style', `color:${this.uNameColor}`)
                if (data.medal.has && !data.medal.expired) {
                    let medal = `<span class="${this.medalVisible ? 'barrage-medal' : 'barrage-medal hide'}" style="border-color: #${data.medal.borderColor}">`
                    medal += `<span class="barrage-medal-name" style="background-image:linear-gradient(45deg, ${data.medal.color}, #${data.medal.backgroundColor});${data.medal.guardLevel > 0 ? 'padding-left:18px' : ''}">`
                    if (data.medal.guardLevel > 0) {
                        medal += `<img class="barrage-medal-guard" src="${this.guardLevel[data.medal.guardLevel]}"/>`
                    }
                    medal += `${data.medal.name}</span><span class="barrage-medal-level" style="color: ${data.medal.color}">${data.medal.level}</span></span>`
                    uname.innerHTML = medal + data.uname
                } else
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
                p.setAttribute('style', `color:${this.bMessageColor}`)
                p.innerText = data.message
                sc.appendChild(p)
                document.getElementById('barrage').appendChild(sc)
                if (this.bScrollHide) {
                    document.getElementById('barrage').scrollTop = document.getElementById('barrage').scrollHeight
                    this.deleteFirstItem('barrage', 50)
                }

                const effectSc = document.getElementById('effect-sc')
                effectSc.setAttribute('class', 'barrage-effect-sc z-index-80')
                const eSc = document.createElement('div')
                eSc.setAttribute('class', 'barrage-effect-sc-item')
                const scUser = document.createElement('div')
                scUser.setAttribute('class', 'barrage-effect-sc-header')
                const scCountdown = document.createElement('div')
                scCountdown.setAttribute('class', 'barrage-effect-sc-countdown')
                scUser.appendChild(scCountdown)
                const scAvatar = document.createElement('img')
                scAvatar.setAttribute('class', 'barrage-effect-sc-avatar')
                scUser.appendChild(scAvatar)
                const scUname = document.createElement('span')
                scUname.setAttribute('class', 'barrage-effect-sc-uname')
                scUname.setAttribute('style', `color:${this.uNameColor}`)
                if (data.medal.has && !data.medal.expired) {
                    let medal = `<span class="${this.medalVisible ? 'barrage-medal' : 'barrage-medal hide'}" style="border-color: #${data.medal.borderColor}">`
                    medal += `<span class="barrage-medal-name" style="background-image:linear-gradient(45deg, ${data.medal.color}, #${data.medal.backgroundColor});${data.medal.guardLevel > 0 ? 'padding-left:18px' : ''}">`
                    if (data.medal.guardLevel > 0) {
                        medal += `<img class="barrage-medal-guard" src="${this.guardLevel[data.medal.guardLevel]}"/>`
                    }
                    medal += `${data.medal.name}</span><span class="barrage-medal-level" style="color: ${data.medal.color}">${data.medal.level}</span></span>`
                    scUname.innerHTML = medal + data.uname
                } else
                    scUname.innerText = data.uname
                scUser.appendChild(scUname)
                const scPrice = document.createElement('span')
                scPrice.setAttribute('class', 'barrage-effect-sc-price')
                scPrice.innerText = '￥ ' + data.price
                scUser.appendChild(scPrice)
                eSc.appendChild(scUser)
                const p1 = document.createElement('p')
                p1.setAttribute('class', 'barrage-effect-sc-message')
                p1.setAttribute('style', `color:${this.bMessageColor}`)
                p1.innerText = data.message
                eSc.appendChild(p1)
                effectSc.appendChild(eSc)

                scUser.addEventListener('click', () => {
                    eSc.setAttribute('class', 'barrage-sc barrage-sc-effect')
                    scUser.setAttribute('class', 'barrage-sc-user')
                    scAvatar.setAttribute('class', 'barrage-sc-avatar')
                    scUname.setAttribute('class', 'barrage-sc-uname')
                    scPrice.setAttribute('class', 'barrage-sc-price')
                    p1.setAttribute('class', 'barrage-sc-message')
                    if (sc) {
                        scCountdown.setAttribute('class', 'barrage-effect-sc-countdown hide')
                        sc.setAttribute('style', 'display: none')
                        for (const element of document.getElementsByClassName('barrage-effect-sc-item')) {
                            element.setAttribute('style', 'display: none')
                        }
                    }
                })

                effectSc.addEventListener('mouseleave', () => {
                    eSc.setAttribute('class', 'barrage-effect-sc-item')
                    scUser.setAttribute('class', 'barrage-effect-sc-header')
                    scAvatar.setAttribute('class', 'barrage-effect-sc-avatar')
                    scUname.setAttribute('class', 'barrage-effect-sc-uname')
                    scPrice.setAttribute('class', 'barrage-effect-sc-price')
                    p1.setAttribute('class', 'barrage-effect-sc-message')
                    if (sc) {
                        scCountdown.setAttribute('class', 'barrage-effect-sc-countdown')
                        sc.setAttribute('style', 'display: block')
                        for (const element of document.getElementsByClassName('barrage-effect-sc-item')) {
                            element.setAttribute('style', '')
                        }
                    }
                })

                const handleCountdown = function (time) {
                    if (time === data.time) return
                    scCountdown.setAttribute('style', `right: ${time++ * (76 / data.time)}px`)
                    setTimeout(() => {
                        handleCountdown(time)
                    }, 1000)
                }

                handleCountdown(0)

                setTimeout(() => {
                    eSc.remove()
                    if (sc) {
                        sc.setAttribute('style', 'display: block')
                        for (const element of document.getElementsByClassName('barrage-effect-sc-item')) {
                            element.setAttribute('style', '')
                        }
                    }
                    if (document.getElementById('effect-sc').childElementCount === 0) {
                        document.getElementById('effect-sc').setAttribute('class', 'barrage-effect-sc')
                    }
                }, data.time * 1000)

                this.$api.getAvatarContentByUrl(data.face).then((res) => {
                    avatar.src = res
                    scAvatar.src = res
                }).catch(e => {
                    avatar.src = noface
                    scAvatar.src = noface
                })
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
                const uname = `<span class="join-uname" style="color:${this.uNameColor}" uid="${data.uid}">${data.uname}</span>`
                const innerHtml = '欢迎 ' + uname + ' 进入直播间'
                const p = document.createElement('p')
                p.setAttribute('class', 'join-p')
                p.setAttribute('title', this.dateFormat(data.timeline))
                p.innerHTML = innerHtml
                document.getElementById('join').appendChild(p)
                if (this.jScrollHide) {
                    document.getElementById('join').scrollTop = document.getElementById('join').scrollHeight
                    this.deleteFirstItem('join', 20)
                }
            },
            addGift(data) {
                const uname = `<span class="gift-uname" style="color:${this.uNameColor}" uid="${data.uid}">${data.uname}</span>`
                const innerHtml = uname + ` ${data.action}了 <span class="gift-name" style="color:${this.giftColor}">${data.giftName}</span> x <span class="gift-num" style="color:${this.giftColor}">${data.num}</span>`
                const p = document.createElement('p')
                p.setAttribute('class', 'join-p')
                p.setAttribute('title', this.dateFormat(data.timeline))
                p.innerHTML = innerHtml
                document.getElementById('join').appendChild(p)
                if (this.jScrollHide) {
                    document.getElementById('join').scrollTop = document.getElementById('join').scrollHeight
                    this.deleteFirstItem('join', 20)
                }
                if (this.joinShow) return
                const item = document.createElement('div')
                item.setAttribute('class', 'barrage-effect-item effect-slide-in')
                const avatarBox = document.createElement('div')
                avatarBox.setAttribute('class', 'barrage-effect-gift-avatar')
                const avatar = document.createElement('img')
                if (data.face) {
                    this.$api.getAvatarContentByUrl(data.face).then(res => {
                        avatar.src = res
                    }).catch(e => {
                        avatar.src = noface
                    })
                } else {
                    this.$api.getAvatarContentByUid(data.uid).then(res => {
                        avatar.src = res
                    }).catch(e => {
                        avatar.src = noface
                    })
                }
                avatarBox.appendChild(avatar)
                item.appendChild(avatarBox)
                const giftBox = document.createElement('div')
                giftBox.setAttribute('class', 'barrage-effect-gift-info')
                giftBox.setAttribute('style', `background: ${this.giftColor};box-shadow: 0 0 1em 2px ${this.giftColor};`)
                const giftName = document.createElement('span')
                giftName.setAttribute('class', 'barrage-effect-gift-uname')
                giftName.setAttribute('uid', data.uid)
                giftName.innerText = data.uname
                giftBox.appendChild(giftName)
                const gift = document.createElement('span')
                gift.setAttribute('class', 'barrage-effect-gift')
                gift.innerHTML = `<span class="barrage-effect-gift-name">${data.giftName}</span> x <span class="barrage-effect-gift-num">${data.num}</span>`
                giftBox.appendChild(gift)
                item.appendChild(giftBox)
                document.getElementById('effect').appendChild(item)
                setTimeout(() => {
                    item.setAttribute('class', 'barrage-effect-item effect-slide-leave')
                }, 4400)
                setTimeout(() => {
                    item.remove()
                }, 5000)
                this.setEffectScroll()
            },
            addEffect(data) {
                // join area
                let message = String(data.message).replace('<%', ` <span class="join-uname" uid="${data.uid}">`)
                message = message.replace('%>', '</span> ')
                const p = document.createElement('p')
                p.setAttribute('class', 'join-p')
                p.setAttribute('title', this.dateFormat(data.timeline))
                p.innerHTML = message
                document.getElementById('join').appendChild(p)
                if (this.jScrollHide)
                    document.getElementById('join').scrollTop = document.getElementById('join').scrollHeight
                this.deleteFirstItem('join', 20)
                if (!this.effectFlag) return
                // effect area
                const item = document.createElement('div')
                item.setAttribute('class', 'barrage-effect-item effect-slide-in')
                const back = document.createElement('img')
                back.setAttribute('class', 'barrage-effect-background')
                this.$api.getAvatarContentByUrl(data.mapUrl).then(res => {
                    back.src = res
                })
                item.appendChild(back)
                const avatar = document.createElement('img')
                avatar.setAttribute('class', 'barrage-effect-avatar')
                this.$api.getAvatarContentByUrl(data.face).then(res => {
                    avatar.src = res
                })
                item.appendChild(avatar)
                const msg = document.createElement('span')
                msg.setAttribute('class', 'barrage-effect-message')
                msg.setAttribute('style', `color: ${data.color}`)
                const message1 = data.message.replace('<%', `<span style="color: ${data.highlightColor}">`)
                msg.innerHTML = message1.replace('%>', '</span>')
                item.appendChild(msg)
                setTimeout(() => {
                    item.setAttribute('class', 'barrage-effect-item effect-slide-leave')
                }, (data.duration + 1) * 1000 - 600)

                setTimeout(() => {
                    item.remove()
                }, (data.duration + 1) * 1000)
                document.getElementById('effect').appendChild(item)
                this.setEffectScroll()
            },
            setEffectScroll() {
                document.getElementById('effect').scrollTop = document.getElementById('effect').scrollHeight
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
                    this.ipcRenderer.send('update-live-status', this.roomInfo)
                })
                this.$ws.event.on('stop', () => {
                    this.roomInfo.status = 0
                    this.addHeadLog('直播已结束')
                    this.ipcRenderer.send('update-live-status', this.roomInfo)
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
                document.getElementById('effect').innerHTML = ''
            },
            handleResize(size) {
                if (size) this.clientHeight = size.height
                if (!this.joinShow) {
                    this.boxHeight = this.clientHeight - (this.throughFlag ? 0 : 36)
                } else {
                    const joinHeight = this.clientHeight - this.boxHeight - this.dividerHeight
                    if (joinHeight < this.joinRange[0]) {
                        this.boxHeight = this.clientHeight - this.joinRange[0] - this.dividerHeight
                    } else if (joinHeight > this.joinRange[1]) {
                        this.boxHeight = this.clientHeight - this.joinRange[1] - this.dividerHeight
                    }
                }
                if (size) this.clientWidth = size.width
            },
            async handleRightClick() {
                const this_ = this
                if (this.roomInfo.roomId !== 0) {
                    this.getRoomStream(this.roomInfo.roomId).then(ops => {
                        // console.log(ops)
                        ops.forEach(obj => {
                            obj.submenu = obj.submenu.map(o => {
                                return {
                                    label: o.label,
                                    i: o.index,
                                    click: function () {
                                        this_.getRoomStream(this_.roomInfo.roomId, o.qn).then(options => {
                                            console.log(options)
                                            let url = ''
                                            options.some(obj1 => {
                                                return obj1.submenu.some(o1 => {
                                                    if (o1.index === o.index) {
                                                        url = o1.url
                                                        return true
                                                    }
                                                    return false
                                                })
                                            })
                                            cp.exec('clip').stdin.end(iconv.encode(url, 'gbk'));
                                            this_.addHeadLog('已复制直播流地址到剪贴板')
                                        }).catch(e => {
                                            this_.addHeadLog(e, 1)
                                        })
                                    }
                                }
                            })
                        })
                        const menu = Menu.buildFromTemplate(ops)
                        menu.popup(remote.getCurrentWindow());
                    }).catch(e => {
                        this_.addHeadLog(e, 1)
                    })
                }
            },
            getRoomStream(roomId, qn) {
                // console.log(qn)
                return new Promise((resolve, reject) => {
                    const ops = []
                    this.$api.getRoomLiveInfo({cid: roomId, qn: qn}).then(res => {
                        console.log(res)
                        if (res.live_status !== 1)
                            reject('直播未开始')
                        const stream = res.playurl_info.playurl.stream
                        if (stream) {
                            const qn_desc = {}
                            const format_dict = {
                                'flv': '.flv?',
                                'ts': '.m3u8?',
                                'fmp4': '/index.m3u8?'
                            }
                            res.playurl_info.playurl.g_qn_desc.map(o => {
                                qn_desc[o.qn] = o.desc
                            })
                            try {
                                let index = 0
                                stream.map((o, i) => {
                                    o.format.map(o1 => {
                                        o1.codec.map(codec => {
                                            if (codec.codec_name === 'avc') {
                                                const qns = []
                                                const base_url = String(codec.base_url)
                                                // let index = base_url.indexOf(format_dict[o1.format_name])
                                                // const base_url_suf = base_url.substring(index)
                                                // const re_str = codec.current_qn === 10000 ? base_url_suf : `_${codec.current_qn}0${base_url_suf}`
                                                // const base_url_pre = base_url.replace(re_str, '')
                                                codec.accept_qn.map(o2 => {
                                                    qns.push({
                                                        label: qn_desc[o2],
                                                        // base_url: base_url_pre + (o2 === 10000 ? '' : `_${o2}0`) + base_url_suf
                                                        base_url: base_url,
                                                        qn: o2
                                                    })
                                                })
                                                // console.log(qns)
                                                codec.url_info.map((o3) => {
                                                    const sub = {
                                                        label: index === 0 ? '主线路' : `备线路${index}`,
                                                        submenu: qns.map((o4, i1)=> {
                                                            return {
                                                                label: o4.label,
                                                                index: index * qns.length + i1,
                                                                qn: o4.qn,
                                                                url: o3.host + o4.base_url + o3.extra
                                                            }
                                                        })
                                                    }
                                                    ops.push(sub)
                                                    index++
                                                })
                                            }
                                        })
                                    })
                                })
                                console.log(ops)
                                resolve(ops)
                            } catch (e) {
                                // this.addHeadLog('获取直播流失败', 1)
                                reject(e)
                            }
                        } else {
                            // this.addHeadLog('获取直播流失败', 1)
                            reject('获取直播流失败')
                        }
                    }).catch(e => {
                        // this.addHeadLog(e, 1)
                        reject(e)
                    })
                })
            }
        },
        created() {
            const this_ = this
            this.initCache()
            this.ipcRenderer.on('resize', (e, size) => {
                this_.handleResize(size)
            })
            this.ipcRenderer.on('move', (e, pos) => {
                this.posX = pos.x
                this.posY = pos.y
            })
            this.initSetting()
            if (this.clientHeight === 0 || this.clientWidth === 0)
                this.ipcRenderer.send('get-size')
            else {
                this.ipcRenderer.send('update-size', [this.clientWidth, this.clientHeight])
                this.handleResize(null)
            }
            if (this.posX === 0 || this.posY === 0)
                this.ipcRenderer.send('get-pos')
            else
                this.ipcRenderer.send('update-pos', [this.posX, this.posY])
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
                for (const elem of document.getElementsByClassName('barrage-p')) {
                    elem.setAttribute('class', parseInt(elem.getAttribute('uid')) === this_.userInfo.uid ? 'barrage-p barrage-self' : 'barrage-p')
                }
            })
            this.ipcRenderer.send('update-user-info')
            this.ipcRenderer.on('updateOnTop', (e, flag) => {
                this.onTop = flag
            })
            this.ipcRenderer.on('toggleClickThrough', (e, flag) => {
                if (this.throughFlag !== flag) {
                    this.throughFlag = flag
                    this.boxHeight += 36 * (flag ? 1 : -1)
                }
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
            this.ipcRenderer.on('connectWsSelf', (e, uInfo) => {
                if (this.$ws.connected) {
                    if (this.$ws.roomId !== uInfo.roomId) {
                        this.$ws.close()
                    } else {
                        return
                    }
                }
                this.roomTemp = uInfo.roomId
                this.saveAndConnect()
            })
            this.ipcRenderer.on('disconnectWsSelf', (e, uInfo) => {
                console.log(uInfo)
                if (this.$ws.connected && this.$ws.roomId === uInfo.roomId)
                    this.$ws.close()
            })
            //     barrage-sc-uname:hover,
            // >>> .barrage-uname:hover,
            // >>> .join-uname:hover,
            // >>> .gift-uname:
            document.addEventListener('click', (ev => {
                const className = ev.target.className
                const classList = ['barrage-sc-uname', 'barrage-uname', 'join-uname', 'gift-uname', 'barrage-effect-gift-uname']
                if (classList.indexOf(className) > -1) {
                    const uid = ev.target.getAttribute('uid')
                    cp.exec('start ' + `https://space.bilibili.com/${uid}`)
                }
            }))
            this.$nextTick(() => {
            })
        }
    }
</script>

<style scoped>
    .barrage-container {
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
        position: absolute;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: auto;
        padding-top: 10px;
        z-index: 10;
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
        /*width: 190px;*/
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
        margin: 0 0 10px 0;
        padding: 0 8px;
        /*box-shadow: 0 8px 10px -8px #a6c0e8;*/
        border-radius: 6px;
        line-height: 30px;
    }

    >>> .barrage-self .barrage-uname {
        text-decoration: underline;
    }

    >>> .barrage-p:hover {
        /*box-shadow: 0 0 2em 1px #a6c0e8;*/
    }

    >>> .barrage-host {
        border: #fb7299 1px solid;
        font-weight: bold;
        color: white;
        margin-right: 5px;
        padding: 0 4px;
        font-size: 12px;
    }

    >>> .barrage-admin {
        border: #f8b647 1px solid;
        font-weight: bold;
        color: white;
        margin-right: 5px;
        padding: 0 4px;
        font-size: 12px;
    }

    >>> .barrage-medal {
        font-size: 12px;
        margin-right: 5px;
        color: white;
        border-width: 1px;
        border-style: solid;
        position: relative;
    }

    >>> .hide {
        display: none;
    }

    >>> .barrage-medal-guard {
        height: 28px;
        width: 28px;
        position: absolute;
        left: -10px;
        top: -8px;
    }

    >>> .barrage-medal-name {
        font-weight: bold;
        padding: 0 4px;
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
    }

    >>> .barrage-medal-level {
        padding: 0 2px;
        background-color: white;
    }

    >>> .barrage-uname {
        color: #a6c0e8;
        font-weight: bold;
        text-shadow: 1px -1px 5px black;
    }

    >>> .barrage-colon:after {
        content: " : ";
        color: white;
    }

    >>> .barrage-message {
        color: white;
    }

    >>> .barrage-message-image {
        height: 32px;
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
        margin-right: 12px;
    }

    >>> .barrage-sc-uname {
        display: inline-block;
        line-height: 36px;
        vertical-align: top;
        color: #a6c0e8;
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
        margin: 0 0 8px 0;
        padding: 4px 8px 0 8px;
        color: white;
    }

    >>> .join-uname,
    >>> .gift-uname {
        color: #a6c0e8;
        font-weight: bold;
        text-shadow: 1px -1px 5px black;
    }

    >>> .barrage-sc-uname:hover,
    >>> .barrage-uname:hover,
    >>> .join-uname:hover,
    >>> .barrage-effect-gift-uname:hover,
    >>> .gift-uname:hover {
        cursor: pointer;
        text-decoration: underline;
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

    .barrage-setting {
        border-radius: 8px;
        overflow: hidden;
    }

    .barrage-setting >>> .el-drawer {
        box-shadow: inset 0 0 2em 0 black;
    }

    .barrage-setting >>> .el-drawer__header {
        /*text-align: center;*/
        margin: 0;
        padding: 10px 10px 5px 20px;
        box-shadow: 0 15px 10px -15px black;
    }

    .barrage-setting >>> .el-drawer__body {
        position: relative;
        padding: 15px;
    }

    .barrage-setting-row {
        line-height: 24px;
        padding: 0 6px;
        margin-bottom: 12px;
    }

    .barrage-setting-label {
        margin-right: 5px;
        width: 80px;
        display: inline-block;
    }

    .barrage-setting-label:after {
        content: " : ";
    }

    .barrage-setting-save {
        position: absolute;
        right: 30px;
        bottom: 30px;
    }

    .barrage-effect {
        width: 100%;
        box-sizing: border-box;
        overflow: hidden;
        background-repeat: repeat;
        position: relative;
    }

    .barrage-effect-sc {
        display: inline-block;
        vertical-align: middle;
        width: 100%;
        position: absolute;
        top: 0;
        height: 36px;
    }

    >>> .z-index-80 {
        z-index: 80;
    }

    >>> .barrage-sc-effect {
        margin-top: 10px;
        background: rgba(166, 192, 232, 0.6);
        box-shadow: 0 0 5px 1px #a6c0e8 !important;
    }

    >>> .barrage-effect-sc-item {
        display: inline-block;
        border-radius: 14px;
    }

    >>> .barrage-effect-sc-header {
        height: 28px;
        width: 100px;
        margin: 4px;
        box-shadow: 0 0 1em 2px #a6c0e8;
        border-radius: 14px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }

    >>> .barrage-effect-sc-countdown {
        width: 90px;
        position: absolute;
        right: 76px;
        top: 0;
        height: 28px;
        background: #a6c0e8;
        z-index: -1;
        border-radius: 4px 14px 14px 4px;
    }

    >>> .barrage-effect-sc-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: inline-block;
    }

    >>> .barrage-effect-sc-uname {
        display: none;
    }

    >>> .barrage-effect-sc-price {
        display: inline-block;
        line-height: 28px;
        vertical-align: top;
        height: 28px;
        width: 70px;
        margin-left: 2px;
        text-align: center;
        padding-right: 14px;
        box-sizing: border-box;
        color: gold;
    }

    >>> .barrage-effect-sc-message {
        display: none;
    }

    .barrage-effect-box {
        display: inline-block;
        vertical-align: bottom;
        width: 100%;
        position: absolute;
        bottom: 0;
        /*flex-direction: column;*/
        overflow: hidden;
    }

    >>> .barrage-effect-item {
        display: inline-block;
        width: 360px;
        height: 70px;
        float: right;
        position: relative;
        overflow: hidden;
        vertical-align: bottom;
        /*flex-shrink: 0;*/
    }

    >>> .effect-slide-in {
        right: -50px;
        animation-duration: 0.6s;
        animation-name: slide-in;
        animation-timing-function: ease-out;
    }

    >>> .effect-slide-leave {
        right: -360px;
        animation-duration: 0.6s;
        animation-name: slide-leave;
        animation-timing-function: ease-out;
    }

    >>> .barrage-effect-background {
        width: 360px;
        height: 80px;
        position: absolute;
        bottom: 0;
        z-index: 20;
    }

    @keyframes slide-in {
        from {
            right: -360px;
        }

        to {
            right: -50px;
        }
    }

    @keyframes slide-leave {
        from {
            right: -50px;
        }

        to {
            right: -360px;
        }
    }

    >>> .barrage-effect-avatar {
        width: 36px;
        height: 36px;
        position: absolute;
        border-radius: 50%;
        left: 14px;
        top: 18px;
        z-index: 30;
    }

    >>> .barrage-effect-message {
        line-height: 36px;
        height: 36px;
        position: absolute;
        display: inline-block;
        top: 20px;
        left: 60px;
        z-index: 30;
    }

    >>> .barrage-effect-gift-avatar {
        height: 40px;
        width: 40px;
        box-sizing: border-box;
        position: absolute;
        right: 60px;
        top: 15px;
        background-repeat: repeat;
        /*box-shadow: 0 0 2em 0 red;*/
        border-radius: 0 50% 50% 0;
        z-index: 30;
    }

    >>> .barrage-effect-gift-avatar img {
        height: 40px;
        width: 40px;
        border-radius: 50%;
    }

    >>> .barrage-effect-gift-info {
        position: absolute;
        right: 60px;
        top: 15px;
        box-sizing: border-box;
        padding: 0 48px 0 8px;
        text-align: right;
        color: white;
        background: #a6c0e8;
        box-shadow: 0 0 1em 2px #a6c0e8;
        border-radius: 20px 20px 20px 20px;
        z-index: 20;
    }

    >>> .barrage-effect-gift-uname {
        /*color: #a6c0e8;*/
        display: block;
        line-height: 20px;
        font-size: 12px;
        padding-left: 8px;
        text-shadow: 1px -1px 5px black;
    }

    >>> .barrage-effect-gift {
        display: block;
        line-height: 20px;
        padding-left: 8px;
        font-size: 14px;
    }

    >>> .barrage-effect-gift-name {
        /*color: #a6c0e8;*/
    }

    >>> .barrage-effect-gift-num {
        text-decoration: underline;
        /*color: #a6c0e8;*/
    }

    .heartbeat-box {
        position: absolute;
        right: 0;
        top: 0;
        height: 48px;
        width: 70px;
        transform: translate(15px, -50%);
        border-radius: 10px;
    }

    .heartbeat-box span {
        height: 24px;
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        padding: 0 0 0 8px;
        line-height: 24px;
        text-align: left;
        color: white;
        box-sizing: border-box;
    }

    .heartbeat-off {
        box-shadow: 0 0 2px 1px red;
        background: rgba(255, 0, 0, 0.2);
        animation: heartbeat-red 2.5s linear 1s;
        animation-iteration-count: infinite;
    }

    .heartbeat-on {
        box-shadow: 0 0 2px 1px #008000;
        background: rgba(0, 128, 0, 0.2);
        animation: heartbeat-green 2.5s linear 1s;
        animation-iteration-count: infinite;
    }

    .heartbeat-loop {
        box-shadow: 0 0 2px 1px #92d1e5;
        background: rgba(146, 209, 229, 0.2);
        animation: heartbeat-gray 2.5s linear 1s;
        animation-iteration-count: infinite;
    }

    @keyframes heartbeat-red {
        0% {
            box-shadow: 0 0 2px 1px red;
        }

        20% {
            box-shadow: 0 0 4px 2px red;
        }

        40% {
            box-shadow: 0 0 1em 3px red;
        }

        50% {
            box-shadow: 0 0 1em 3px red;
        }

        60% {
            box-shadow: 0 0 1em 3px red;
        }

        80% {
            box-shadow: 0 0 4px 2px red;
        }
    }

    @keyframes heartbeat-gray {
        0% {
            box-shadow: 0 0 2px 1px #92d1e5;
        }

        20% {
            box-shadow: 0 0 4px 2px #92d1e5;
        }

        40% {
            box-shadow: 0 0 6px 4px #92d1e5;
        }

        50% {
            box-shadow: 0 0 6px 4px #92d1e5;
        }

        60% {
            box-shadow: 0 0 6px 4px #92d1e5;
        }

        80% {
            box-shadow: 0 0 4px 2px #92d1e5;
        }
    }

    @keyframes heartbeat-green {
        0% {
            box-shadow: 0 0 2px 1px #008000;
        }

        20% {
            box-shadow: 0 0 4px 2px #008000;
        }

        40% {
            box-shadow: 0 0 6px 4px #008000;
        }

        50% {
            box-shadow: 0 0 6px 4px #008000;
        }

        60% {
            box-shadow: 0 0 6px 4px #008000;
        }

        80% {
            box-shadow: 0 0 4px 2px #008000;
        }
    }
</style>