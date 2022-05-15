<template>
    <div class="main-container">
        <header-box :icon="icon" align="left" :title="title" @windowMin="windowMinimize"
                    @windowClose="windowClose"></header-box>
        <div class="main-box">
            <div class="main-user-box" v-loading="userLoading">
                <img class="user-avatar" :src="userInfo.avatar||noface">
                <div class="user-info">
                    <el-row class="user-info-item" style="margin-bottom: 4px">
                        <span class="user-name">{{userInfo.uname||'userName'}}</span>
                        <span :class="'user-level level-'+(userInfo.level||'0')">Level {{userInfo.level||'0'}}</span>
                    </el-row>
                    <el-row class="user-info-item" style="margin-bottom: 4px">
                        <span class="user-stat">
                            关注 :<span :title="userInfo.follow">{{handleNumber(userInfo.follow||0)}}</span>
                        </span>
                        <span class="user-stat">
                            粉丝 :<span :title="userInfo.fans">{{handleNumber(userInfo.fans||0)}}</span>
                        </span>
                    </el-row>
                    <el-row class="user-info-item">
                        <el-link icon="el-icon-refresh" @click="refreshInfo">刷新</el-link>
                        <el-link icon="el-icon-setting" @click="infoSetting">设置</el-link>
                        <el-link icon="el-icon-chat-dot-round" @click="toggleBarrageWindow">弹幕</el-link>
                    </el-row>
                </div>
            </div>
            <div class="box-live-info" v-loading="liveLoading">
                <div class="live-info-item margin-b-5">
                    <span class="live-info-label">地址</span>
                    <el-link class="live-info-link" @click="openUrl" @click.right.native="copyRoom"
                             title="左键点击打开,右键点击复制房间号"
                             :type="loadFail?'info':'default'"
                             :disabled="loadFail">{{liveInfo.link}}
                    </el-link>
                </div>
                <div class="live-info-item margin-b-5">
                    <span class="live-info-label">标题</span>
                    <el-link class="live-info-link" @click="openDialog(true)" title="点击修改"
                             :type="loadFail?'info':'default'" :disabled="loadFail">{{liveInfo.title}}
                    </el-link>
                </div>
                <div class="live-info-item margin-b-5">
                    <span class="live-info-label">区域</span>
                    <el-link class="live-info-link" @click="openDialog(false)" title="点击修改"
                             :type="loadFail?'info':'default'" :disabled="loadFail">{{liveInfo.areaName}}
                    </el-link>
                </div>
                <div class="live-info-item margin-b-5">
                    <span class="live-info-label">状态</span>
                    <el-link @click="toggleLiveStatus" :type="liveInfo.status===1?'danger':'primary'"
                             :icon="liveInfo.status === 1?'el-icon-video-pause':'el-icon-video-play'"
                             :disabled="loadFail">
                        {{liveInfo.status === 1?'下播':'开播'}}
                    </el-link>
                </div>
                <div class="live-rtmp-item live-addr" v-if="liveInfo.status === 1">
                    <p>
                        rtmp: <span :title="liveRtmp.rtmp"
                                    @click="copyToClip(liveRtmp.rtmp, 'rtmp')">{{liveRtmp.rtmp}}</span>
                    </p>
                </div>
                <div class="live-rtmp-item live-code" v-if="liveInfo.status === 1">
                    <p>
                        code: <span :title="liveRtmp.code"
                                    @click="copyToClip(liveRtmp.code, 'code')">{{liveRtmp.code}}</span>
                    </p>
                </div>
            </div>
        </div>

        <header-log top="30" ref="logs"></header-log>

        <div class="main-download-box" v-if="downloadVisible">
            <span class="main-download-title">{{downloadTitle}}</span>
            <span class="main-download-process">{{handleSize(downloadSize)}}/{{handleSize(downloadTotalSize)}}</span>
            <el-progress :percentage="downloadPercent" text-inside :show-text="false" :stroke-width="20"
                         :status="downloadStatus"></el-progress>
        </div>

        <el-dialog :visible.sync="dialogVisible" center :title="editTitle?'修改直播标题':'修改直播区域'" width="100%"
                   @closed="dialogClosed">
            <el-input v-if="editTitle" class="live-info-input" v-model="titleTemp"></el-input>
            <el-select v-else class="live-info-input" v-model="areaIdTemp" filterable clearable ref="area"
                       popper-class="live-info-select-inner" :popper-append-to-body="false"
                       :filter-method="areaFilter" @change="initAreaOptions">
                <el-option v-for="item of areaOptions" :key="item.value" :label="item.label"
                           :value="item.value"></el-option>
            </el-select>
            <el-divider content-position="left">历史记录</el-divider>
            <el-select class="live-info-input" v-model="cacheTemp" ref="cache"
                       :placeholder="cacheOptions.length>0?'请选择...':'无历史记录'" @change="cacheChanged">
                <el-option v-for="item of cacheOptions" :key="item.value" :label="item.label"
                           :value="item.value"></el-option>
            </el-select>
            <div slot="footer">
                <el-link v-if="editTitle" icon="el-icon-check" @click="updateLiveTitle">保存</el-link>
                <el-link v-else icon="el-icon-check" @click="updateLiveArea">保存</el-link>
            </div>
        </el-dialog>

        <el-drawer :visible.sync="settingVisible" direction="btt" size="360px" :with-header="false" center
                   @closed="initRegisterForm"
                   class="main-setting-box">
            <el-tabs v-model="activeTab" type="border-card" :stretch="true">
                <el-tab-pane label="用户信息" name="user">
                    <div class="setting-item">
                        <span class="setting-item-label">Uid</span>
                        <el-input class="setting-item-input" v-model="registerForm.uid"></el-input>
                    </div>
                    <div class="setting-item">
                        <span class="setting-item-label">Token/Csrf</span>
                        <el-input type="textarea" class="setting-item-input" :rows="2" resize="none"
                                  v-model="registerForm.token"></el-input>
                    </div>
                    <div class="setting-item">
                        <span class="setting-item-label">Cookie</span>
                        <el-input type="textarea" class="setting-item-input" :rows="5" resize="none"
                                  v-model="registerForm.cookie"></el-input>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="快捷键" name="shortcut">
                    <div class="setting-item">
                        <div class="setting-item-row">
                            <span class="setting-item-label" style="width: 60px">发送弹幕</span>
                            <el-tag size="small">{{shortcutOps.sendMsg[3]}}</el-tag>
                            <el-link icon="el-icon-check" @click.native="shortcutApply('sendMsg')"
                                     :disabled="shortcutOps.sendMsg[3]===settingMain.sendMsgShortcut[3]">应用
                            </el-link>
                        </div>
                        <el-select v-model="shortcutOps.sendMsg[0]" size="small" class="setting-shortcut-select"
                                   @change="shortcutFirstChange($event, 'sendMsg')">
                            <el-option value="" label="-"></el-option>
                            <el-option value="Ctrl" label="Ctrl"></el-option>
                            <el-option value="Alt" label="Alt"></el-option>
                            <el-option value="Shift" label="Shift"></el-option>
                        </el-select>
                        <el-select v-model="shortcutOps.sendMsg[1]"
                                   :disabled="shortcutOps.sendMsg[0] === '' || shortcutOps.sendMsg[0]==='Shift'"
                                   size="small" class="setting-shortcut-select"
                                   @change="shortcutChange($event, 'sendMsg')">
                            <el-option value="" label="-"></el-option>
                            <el-option value="Ctrl" label="Ctrl"
                                       :disabled="shortcutOps.sendMsg[0] === 'Ctrl'"></el-option>
                            <el-option value="Alt" label="Alt" :disabled="shortcutOps.sendMsg[0] === 'Alt'"></el-option>
                            <el-option value="Shift" label="Shift"
                                       :disabled="shortcutOps.sendMsg[0] === 'Shift'"></el-option>
                        </el-select>
                        <el-input size="small" class="setting-shortcut-input" :value="shortcutOps.sendMsg[2]"
                                  :disabled="shortcutOps.sendMsg[0] === ''"
                                  @keydown.tab.prevent.native="" @keydown.esc.prevent.native=""
                                  @input.native="shortcutUpdate($event, 'sendMsg')"
                                  @keydown.native="shortcutListener($event, 'sendMsg')" ref="sendMsg"></el-input>
                    </div>
                    <div class="setting-item">
                        <div class="setting-item-row">
                            <span class="setting-item-label" style="width: 60px">点击穿透</span>
                            <el-tag size="small">{{shortcutOps.clickThrough[3]}}</el-tag>
                            <el-link icon="el-icon-check" @click.native="shortcutApply('clickThrough')"
                                     :disabled="shortcutOps.clickThrough[3]===settingMain.clickThroughShortcut[3]">应用
                            </el-link>
                        </div>
                        <el-select v-model="shortcutOps.clickThrough[0]" size="small" class="setting-shortcut-select"
                                   @change="shortcutFirstChange($event, 'clickThrough')">
                            <el-option value="" label="-"></el-option>
                            <el-option value="Ctrl" label="Ctrl"></el-option>
                            <el-option value="Alt" label="Alt"></el-option>
                            <el-option value="Shift" label="Shift"></el-option>
                        </el-select>
                        <el-select v-model="shortcutOps.clickThrough[1]"
                                   :disabled="shortcutOps.clickThrough[0] === '' || shortcutOps.clickThrough[0]==='Shift'"
                                   size="small" class="setting-shortcut-select"
                                   @change="shortcutChange($event, 'clickThrough')">
                            <el-option value="" label="-"></el-option>
                            <el-option value="Ctrl" label="Ctrl"
                                       :disabled="shortcutOps.clickThrough[0] === 'Ctrl'"></el-option>
                            <el-option value="Alt" label="Alt"
                                       :disabled="shortcutOps.clickThrough[0] === 'Alt'"></el-option>
                            <el-option value="Shift" label="Shift"
                                       :disabled="shortcutOps.clickThrough[0] === 'Shift'"></el-option>
                        </el-select>
                        <el-input size="small" class="setting-shortcut-input" :value="shortcutOps.clickThrough[2]"
                                  :disabled="shortcutOps.clickThrough[0] === ''"
                                  @keydown.tab.prevent.native="" @keydown.esc.prevent.native=""
                                  @input.native="shortcutUpdate($event, 'clickThrough')"
                                  @keydown.native="shortcutListener($event, 'clickThrough')"
                                  ref="clickThrough"></el-input>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="其他设置" name="setting">
                    <div class="setting-item">
                        <el-checkbox v-model="settingMain.liveToConnect" label="开播自动连接到自己直播间"></el-checkbox>
                    </div>
                    <div class="setting-item">
                        <el-checkbox v-model="settingMain.liveToDisconnect" label="下播自动断开自己直播间连接"></el-checkbox>
                    </div>
                    <el-divider></el-divider>
                    <div class="setting-item">
                        <el-checkbox v-model="settingMain.runForUpdate" label="启动检查更新"></el-checkbox>
                    </div>
                    <div class="setting-item" v-if="settingMain.runForUpdate">
                        <span class="setting-item-label">更新源</span><br>
                        <el-radio-group v-model="settingMain.updateSource" size="small">
                            <el-radio label="github">Github(国外)</el-radio>
                            <el-radio label="gitee">Gitee(国内)</el-radio>
                        </el-radio-group>
                    </div>
                    <el-divider></el-divider>
                    <div class="setting-item">
                        <span class="setting-item-label" style="width: 60px">关闭动作</span><br>
                        <el-radio-group v-model="settingMain.closeAction" size="small">
                            <el-radio label="toClose">退出程序</el-radio>
                            <el-radio label="toTray">最小化到托盘</el-radio>
                        </el-radio-group>
                    </div>
                    <div class="setting-item">
                        <el-checkbox v-model="settingMain.dontAskMe" label="关闭时不再询问"></el-checkbox>
                    </div>
                </el-tab-pane>
            </el-tabs>
            <div class="main-setting-footer">
                <el-link class="main-setting-checkbox" icon="el-icon-close" style="margin-right: 15px" type="danger"
                         @click.native="closeSetting">取消
                </el-link>
                <el-link class="main-setting-checkbox" icon="el-icon-check" type="primary" @click.native="saveSetting">
                    保存
                </el-link>
            </div>
        </el-drawer>
    </div>
</template>

<script>
    const cp = require('child_process')
    const iconv = require('iconv-lite')

    import live from '../assets/live.png'
    import liveOn from '../assets/live-on.png'
    import noface from '../assets/noface.jpg'

    export default {
        name: "Main",
        data() {
            const state = this.$store.state
            return {
                state,
                icon: live,
                title: 'Bilive Manager',
                userLoading: false,
                noface: noface,
                // avatar: noface,
                // userInfo: {
                //     uname: 'userName',
                //     avatar: noface,
                //     level: 0,
                //     follow: 0,
                //     fans: 0
                // },
                liveLoading: false,
                // liveInfo: {
                //     link: '-',
                //     title: '-',
                //     areaId: 0,
                //     status: 0,
                //     roomId: 0,
                //     areaName: '-'
                // },
                liveRtmp: {
                    rtmp: null,
                    code: null
                },
                liveArea: {},
                liveAreaOptions: {},
                dialogVisible: false,
                editTitle: false,
                titleTemp: '',
                areaIdTemp: 0,
                areaOptions: [],
                cacheTemp: '',
                cacheOptions: [],
                settingVisible: false,
                registerForm: {
                    uid: '',
                    token: '',
                    cookie: ''
                },
                minToTay: true,
                activeTab: 'user',
                settingMain: {
                    dontAskMe: false,
                    closeAction: 'toClose',
                    liveToConnect: true,
                    liveToDisconnect: true,
                    runForUpdate: true,
                    updateSource: 'gitee',
                    sendMsgShortcut: ['', '', '', '无'],
                    clickThroughShortcut: ['', '', '', '无']
                },
                shortcutOps: {
                    sendMsg: ['', '', '', '无'],
                    clickThrough: ['', '', '', '无']
                },
                downloadVisible: false,
                downloadTitle: '正在下载更新...',
                downloadStatus: '',
                downloadPercent: 0,
                downloadSize: 0,
                downloadTotalSize: 0
            }
        },
        computed: {
            loadFail() {
                return this.liveInfo.roomId === 0
            },
            uid() {
                return this.state['mConfig'].register.uid
            },
            token() {
                return this.state['mConfig'].register.token
            },
            cookie() {
                return this.state['mConfig'].register.cookie
            },
            userInfo() {
                return this.state['Info'].user
            },
            liveInfo() {
                return this.state['Info'].live
            }
        },
        methods: {
            initConfigMain(isCreated = false) {
                this.settingMain = this.state['mConfig'].setting
                this.shortcutOps.sendMsg = Array.from(this.settingMain.sendMsgShortcut)
                this.shortcutOps.clickThrough = Array.from(this.settingMain.clickThroughShortcut)
                if (isCreated) {
                    this.ipcRenderer.send('update-shortcut-sendMsg', {
                        old: '无',
                        new_: this.settingMain.sendMsgShortcut[3]
                    })
                    this.ipcRenderer.send('update-shortcut-clickThrough', {
                        old: '无',
                        new_: this.settingMain.clickThroughShortcut[3]
                    })
                }
            },
            saveConfigMain() {
                this.$store.dispatch('mConfig.updateSetting', this.settingMain)
                this.$store.dispatch('mConfig.persistence')
                this.initConfigMain()
            },
            windowMinimize() {
                this.ipcRenderer.send('min-main')
            },
            windowClose() {
                if (this.settingMain.dontAskMe)
                    this.ipcRenderer.send('close-main', this.settingMain.closeAction === 'toTray')
                else
                    this.ipcRenderer.send('close-window-show')
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
            initUserInfo() {
                const userInfo = {
                    uid: 0,
                    uname: 'userName',
                    level: 0,
                    follow: 0,
                    fans: 0,
                    roomId: 0,
                    avatar: noface
                }
                this.$store.dispatch('Info.updateInfoByKey', {key: 'user', data: userInfo})
            },
            initLiveInfo() {
                const liveInfo = {
                    link: '-',
                    title: '-',
                    areaId: 0,
                    status: 0,
                    roomId: 0,
                    areaName: '-'
                }
                this.$store.dispatch('Info.updateInfoByKey', {key: 'live', data: liveInfo})
            },
            initRegisterForm() {
                this.registerForm = {
                    uid: this.uid,
                    token: this.token,
                    cookie: this.cookie
                }
            },
            refreshInfo() {
                this.getUserInfo()
            },
            async getUserInfo() {
                this.userLoading = true
                const this_ = this
                let userInfo = {}
                await this.$api.getUserInfoByCookie(this.uid, this.cookie).then(res => {
                    userInfo.uid = parseInt(this_.uid)
                    userInfo.uname = res.name
                    userInfo.level = res.level
                    userInfo.roomId = res['live_room'] ? res['live_room']['roomid'] : 0
                    this.$api.getUserStatByCookie(this.uid, this.cookie).then(r => {
                        userInfo.follow = r['following']
                        userInfo.fans = r['follower']
                    }).catch(() => {
                        userInfo.follow = 0
                        userInfo.fans = 0
                    })
                    this.$api.getAvatarContentByUrl(res.face).then(r => {
                        userInfo.avatar = r
                    }).catch(() => {
                        userInfo.avatar = noface
                    })
                    this.$store.dispatch('Info.updateInfoByKey', {key: 'user', data: userInfo})
                    this.getLiveInfo()
                }).catch(e => {
                    this.addHeadLog(`加载失败:${e}, 请检查配置`, 1)
                    this.initUserInfo()
                    this.initLiveInfo()
                    this.settingVisible = true
                    this.activeTab = 'user'
                })
                this.ipcRenderer.send('save-user-info', this.userInfo)
                this.userLoading = false
            },
            getLiveArea() {
                this.$api.getLiveArea().then(res => {
                    const liveArea = {}
                    const areaOptions = {}
                    for (let elem of res) {
                        for (let l of elem.list) {
                            let obj = {
                                value: parseInt(l.id),
                                label: '[' + elem.name + ']' + l.name,
                                pinyin: l.pinyin,
                                name: l.name,
                                group: elem.name
                            }
                            liveArea[l.id] = obj
                            if (!areaOptions[elem.name]) {
                                areaOptions[elem.name] = []
                            }
                            areaOptions[elem.name].push(obj)
                        }
                    }
                    this.liveArea = liveArea
                    this.liveAreaOptions = areaOptions
                    this.initAreaOptions()
                }).catch(e => {
                    this.addHeadLog(`直播区域加载失败:${e}`, 1)
                })
            },
            initAreaOptions() {
                let areaOption = []
                Object.values(this.liveAreaOptions).forEach((obj) => {
                    areaOption = [...areaOption, ...obj]
                })
                this.areaOptions = areaOption
            },
            async getLiveInfo(flag = true) {
                this.liveLoading = true
                let liveInfo = {}
                await this.$api.getLiveInfoByCookie(this.cookie).then(res => {
                    liveInfo = res
                    if (this.liveArea[liveInfo.areaId]) {
                        liveInfo.areaName = this.liveArea[liveInfo.areaId].label
                        this.areaIdTemp = res.areaId
                    } else {
                        liveInfo.areaName = res.areaId > 0 ? '分区已被隐藏' : '未选择分区'
                        liveInfo.areaId = ''
                        this.areaIdTemp = ''
                    }
                    this.titleTemp = res.title
                    if (flag) {
                        this.ipcRenderer.send('toggle-live-status', this.liveInfo.status)
                        if (liveInfo.status && this.settingMain.liveToConnect) this.ipcRenderer.send('connect-ws-self')
                    }
                    if (liveInfo.status === 1) {
                        this.$api.getLiveRtmpByCookie(res.roomId, this.cookie).then(r => {
                            this.liveRtmp = r
                        })
                    }
                    this.$store.dispatch('Info.updateInfoByKey', {key: 'live', data: liveInfo})
                }).catch(e => {
                    this.addHeadLog(e.message)
                    this.initLiveInfo()
                })
                this.liveLoading = false
            },
            infoSetting() {
                this.settingVisible = true
                this.initRegisterForm()
            },
            toggleBarrageWindow() {
                this.ipcRenderer.send('toggle-barrage')
            },
            openUrl() {
                if (this.liveInfo.link !== '-') {
                    cp.exec('start ' + this.liveInfo.link)
                }
            },
            copyRoom() {
                let this_ = this
                cp.exec('clip').stdin.end(iconv.encode(this_.liveInfo.roomId, 'gbk'));
                this.addHeadLog(`已复制直播间号: ${this_.liveInfo.roomId} 到剪贴板`)
            },
            copyToClip(msg, type) {
                cp.exec('clip').stdin.end(iconv.encode(msg, 'gbk'));
                this.addHeadLog(`已复制${type}到剪贴板`)
            },
            openDialog(val) {
                if (this.liveInfo.roomId === 0) {
                    return
                }
                this.editTitle = val
                this.dialogVisible = true
                this.initCache()
            },
            dialogClosed() {
                if (this.editTitle) {
                    this.titleTemp = this.liveInfo.title
                } else {
                    this.areaIdTemp = this.liveInfo.areaId
                }
                this.cacheTemp = ''
            },
            areaFilter(val) {
                if (val && val !== '') {
                    this.areaOptions = Object.values(this.liveArea).filter(obj => {
                        return obj.pinyin.indexOf(val) > -1 || obj.label.toUpperCase().indexOf(val.toUpperCase()) > -1
                    })
                } else {
                    this.initAreaOptions()
                }
            },
            async toggleLiveStatus() {
                if (this.liveInfo.roomId === 0) {
                    return
                }
                if (this.liveInfo.status === 0) {
                    await this.getLiveInfo(false)
                }
                this.liveLoading = true
                let this_ = this
                const liveInfo = JSON.parse(JSON.stringify(this.liveInfo))
                await this.$api.updateLiveStatus(this.liveInfo.roomId, this.liveInfo.status, this.liveInfo.areaId, this.token, this.cookie).then(async (res) => {
                    if (res) {
                        liveInfo.status = Math.abs(liveInfo.status - 1)
                        this_.addHeadLog(liveInfo.status ? '开播成功' : '下播成功')
                        this_.ipcRenderer.send('toggle-live-status', liveInfo.status)
                        this_.icon = liveInfo.status ? liveOn : live
                        if (liveInfo.status === 1) {
                            await this_.$api.getLiveRtmpByCookie(liveInfo.roomId, this_.cookie).then(r => {
                                this_.liveRtmp = r
                            })
                            if (this_.settingMain.liveToConnect) this_.ipcRenderer.send('connect-ws-self')
                        } else {
                            if (this_.settingMain.liveToDisconnect) this_.ipcRenderer.send('disconnect-ws-self')
                        }
                        await this_.$store.dispatch('Info.updateInfoByKey', {key: 'live', data: liveInfo})
                    }
                }).catch(e => {
                    this.addHeadLog(e, 1)
                })
                this.liveLoading = false
            },
            updateLiveTitle() {
                // const liveInfo = JSON.parse(JSON.stringify(this.liveInfo))
                if (this.titleTemp === this.liveInfo.title) {
                    this.dialogVisible = false
                    return
                }
                // liveInfo.title = this.titleTemp
                this.$api.updateLiveTitle(this.liveInfo.roomId, this.titleTemp, this.token, this.cookie).then(res => {
                    this.saveCache()
                    this.dialogVisible = false
                    if (res) {
                        this.addHeadLog('修改直播标题成功')
                        this.getLiveInfo()
                    }
                }).catch(e => {
                    this.addHeadLog(e, 1)
                })
            },
            updateLiveArea() {
                if (this.liveInfo.areaId === this.areaIdTemp) {
                    this.dialogVisible = false
                    return
                }
                // this.liveInfo.areaId = this.areaIdTemp
                this.$api.updateLiveArea(this.liveInfo.roomId, this.areaIdTemp, this.token, this.cookie).then(res => {
                    this.saveCache()
                    this.dialogVisible = false
                    if (res) {
                        this.addHeadLog('修改直播区域成功')
                        this.getLiveInfo()
                    }
                }).catch(e => {
                    this.addHeadLog(e, 1)
                })
            },
            closeSetting() {
                // this.initConfig()
                this.initConfigMain()
                this.settingVisible = false
            },
            saveSetting() {
                // this.$token.set('uid', this.registerForm.uid)
                // this.$token.set('token', this.registerForm.token)
                // this.$token.set('cookie', this.registerForm.cookie)
                // this.$token.save()
                // this.initConfig()

                this.$store.dispatch('mConfig.updateRegister', this.registerForm)
                this.$store.dispatch('mConfig.persistence')
                this.saveConfigMain()
                this.settingVisible = false
                this.getUserInfo()
            },
            addHeadLog(message, isError = false) {
                this.$refs.logs.logCountdown(message, isError)
            },
            initCache() {
                // this.cacheOptions = this.$cache.get(this.editTitle ? 'liveTitle' : 'liveArea')
                this.cacheOptions = JSON.parse(JSON.stringify(this.state.Cache[this.editTitle ? 'liveTitle' : 'liveArea']))
            },
            cacheChanged() {
                if (this.editTitle) {
                    this.titleTemp = this.cacheTemp
                } else {
                    this.areaIdTemp = this.cacheTemp
                }
            },
            saveCache() {
                if (this.editTitle) {
                    const index = this.cacheOptions.findIndex((o) => o.label === this.titleTemp)
                    if (index > -1) {
                        this.cacheOptions.splice(index, 1)
                    } else if (this.cacheOptions.length >= 5) {
                        this.cacheOptions.pop()
                    }
                    this.cacheOptions.unshift({
                        value: this.titleTemp,
                        label: this.titleTemp
                    })
                    // this.$cache.set('liveTitle', this.cacheOptions)
                    // this.$cache.save()
                } else {
                    const index = this.cacheOptions.findIndex((o) => o.value === this.areaIdTemp)
                    if (index > -1) {
                        this.cacheOptions.splice(index, 1)
                    } else if (this.cacheOptions.length >= 5) {
                        this.cacheOptions.pop()
                    }
                    this.cacheOptions.unshift(this.areaOptions.find((o) => o.value === this.areaIdTemp))
                    // this.$cache.set('liveArea', this.cacheOptions)
                    // this.$cache.save()
                }
                this.$store.dispatch('Cache.updateCache', {
                    type: this.editTitle ? 'liveTitle' : 'liveArea',
                    data: this.cacheOptions
                })
                this.$store.dispatch('Cache.persistence')
            },
            checkUpdate(flag = false) {
                let this_ = this
                this.$api.getRelease(this.settingMain.updateSource, this.$version).then(res => {
                    if (res.hasNew) {
                        this_.ipcRenderer.send('download', res.downloadUrl)
                    } else {
                        if (flag) this_.ipcRenderer.send('no-more-updates')
                        else this_.addHeadLog('未发现版本更新')
                    }
                }).catch(e => {
                    if (flag) this_.ipcRenderer.send('check-update-fail', e)
                    else this_.addHeadLog('检查更新失败, 请切换更新源或稍后重试', true)
                })
            },
            handleSize(size) {
                if (size < 1024) {
                    return `${size} b`
                } else if (size >= 1024 && size < 1024 * 1024) {
                    return `${(size / 1024).toFixed(2)} kb`
                } else {
                    return `${(size / (1024 * 1024)).toFixed(2)} mb`
                }
            },
            initDownload() {
                const this_ = this
                setTimeout(() => {
                    this_.downloadVisible = false
                    this_.downloadPercent = 0
                    this_.downloadTotalSize = 0
                    this_.downloadSize = 0
                    this_.downloadTitle = '正在下载更新...'
                    this_.downloadStatus = ''
                }, 3000)
            },
            shortcutFirstChange(val, key) {
                if (val === '') {
                    this.shortcutOps[key][1] = ''
                    this.shortcutOps[key][2] = ''
                } else if (val === 'Shift')
                    this.shortcutOps[key][1] = ''
                this.shortcutOps[key][3] = this.shortcutString(key)
            },
            shortcutChange(val, key) {
                this.shortcutOps[key][3] = this.shortcutString(key)
            },
            shortcutListener(val, k) {
                const codes = ['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight',
                    'Escape', 'Tab', 'CapsLock', 'Backspace', 'Delete', 'Home', 'End', 'PageUp', 'PageDown',
                    'NumLock', 'NumpadEnter', 'Enter']
                let code = val.code
                if (codes.indexOf(code) === -1 && !code.startsWith('Numpad')) {
                    code = code.replace('Key', '').replace('Digit', '').replace('Minus', '-').replace('Equal', '=')
                        .replace('BracketLeft', '[').replace('BracketRight', ']').replace('Backslash', '\\')
                        .replace('Semicolon', ';').replace('Quote', '\'').replace('Comma', ',')
                        .replace('Period', '.').replace('Slash', '/')
                    this.shortcutOps[k][2] = code
                }
            },
            shortcutUpdate(val, k) {
                val.target.value = this.shortcutOps[k][2]
                this.shortcutOps[k][3] = this.shortcutString(k)
                this.$forceUpdate()
            },
            shortcutString(key) {
                const elem = this.shortcutOps[key]
                if (elem[0] === '') return '无'
                if (elem[1] === '') return elem[0] + '+' + elem[2]
                return elem.slice(0, 3).join('+')
            },
            shortcutApply(key) {
                this.ipcRenderer.send(`update-shortcut-${key}`, {
                    old: this.settingMain[`${key}Shortcut`][3],
                    new_: this.shortcutOps[key][3]
                })
                this.settingMain[`${key}Shortcut`] = Array.from(this.shortcutOps[key])
                this.addHeadLog('应用成功')
            }
        },
        created() {
            // this.initConfig()
            this.initConfigMain(1)
            this.getLiveArea()
            this.getUserInfo()
            this.ipcRenderer.on('toggleLiveStatus', (e) => {
                this.toggleLiveStatus()
            })
            if (this.settingMain.runForUpdate) {
                this.checkUpdate()
            }
            this.ipcRenderer.on('updateProgressing', (e, {value, curSize, totalSize}) => {
                this.$nextTick(() => {
                    this.downloadVisible = true; // 开启进度弹窗
                    this.downloadPercent = value; // 设置下载百分比
                    this.downloadSize = curSize;
                    this.downloadTotalSize = totalSize;
                });
            })
            this.ipcRenderer.on('downloadError', () => {
                this.downloadTitle = '下载出错'
                this.downloadStatus = 'error'
                this.initDownload()
            })
            this.ipcRenderer.on('downloadOver', (e) => {
                this.downloadTitle = '下载完成'
                this.downloadStatus = 'success'
                this.initDownload()
            })
            this.ipcRenderer.on('checkUpdate', (e) => {
                this.checkUpdate(true)
            })
            this.ipcRenderer.on('saveCloseAction', (e, {action, dontAskMe}) => {
                this.settingMain.dontAskMe = dontAskMe
                this.settingMain.closeAction = action
                this.saveConfigMain()
                this.ipcRenderer.send('close-main', this.settingMain.closeAction === 'toTray')
            })
            this.ipcRenderer.on('updateLiveStatus', () => {
                this.getLiveInfo()
            })
        }
    }
</script>

<style scoped>
    .main-container {
        position: relative;
        background: white;
        height: 100%;
        /*border: 1px solid saddlebrown;*/
        box-sizing: border-box;
        border-radius: 8px;
        box-shadow: inset 0 0 2px 2px #afafaf;
    }

    .main-box {
        padding: 5px;
        height: 370px;
        width: 100%;
    }

    .main-user-box {
        width: 280px;
        height: 80px;
        /*margin: 5px;*/
        padding: 4px;
        border: #dcdfe6 solid 1px;
        border-radius: 5px;
    }

    .user-avatar {
        width: 80px;
        height: 80px;
        display: inline-block;
        border-radius: 50%;
    }

    .user-info {
        width: 195px;
        height: 80px;
        vertical-align: top;
        float: right;
    }

    .user-info-item {
        width: 195px;
        height: 24px;
    }

    .user-name {
        width: 135px;
        height: 24px;
        line-height: 24px;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;
        overflow: hidden;
        text-align: left;
        vertical-align: center;
    }

    .user-level {
        width: 50px;
        color: white;
        background-color: black;
        float: right;
        line-height: 24px;
        height: 24px;
        padding: 0 4px;
        display: inline-block;
        border-radius: 4px;
        text-align: center;
        vertical-align: center;
    }

    .level-0, .level-1 {
        background-color: #bfbfbf;
    }

    .level-2 {
        background-color: #95ddb2;
    }

    .level-3 {
        background-color: #92d1e5;
    }

    .level-4 {
        background-color: #ffb37c;
    }

    .level-5 {
        background-color: #ff6c00;
    }

    .level-6 {
        background-color: #ff0000;
    }

    .user-stat {
        display: inline-block;
        width: 95px;
        height: 24px;
        line-height: 24px;
        text-align: left;
        vertical-align: center;
    }

    .user-stat > span {
        display: inline-block;
        width: 55px;
        text-align: right;
    }

    .user-info-item .el-link {
        margin-right: 15px;
    }

    .box-live-info {
        width: 280px;
        height: 257px;
        margin-top: 3px;
        padding: 4px;
        border: #dcdfe6 solid 1px;
        border-radius: 5px;
    }

    .live-info-item {
        width: 270px;
        height: 30px;
        line-height: 30px;
    }

    .live-info-link {
        width: 225px;
    }

    .margin-b-5 {
        margin-bottom: 5px;
    }

    .live-rtmp-item {
        width: 270px;
        height: 50px;
        line-height: 24px;
        vertical-align: center;
    }

    .live-addr {
        height: 50px;
    }

    .live-code {
        height: 70px;
    }

    .live-rtmp-item p {
        word-break: break-all;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
    }

    .live-addr p {
        height: 50px;
        -webkit-line-clamp: 2;
    }

    .live-code p {
        height: 70px;
        -webkit-line-clamp: 3;
    }

    .live-rtmp-item span {
        text-decoration: underline;
    }

    .live-rtmp-item span:hover {
        color: #a6a9ad;
        cursor: pointer;
    }

    .live-info-label {
        width: 40px;
        text-align: left;
        display: inline-block;
    }

    .live-info-label:after {
        content: ":";
    }

    .live-info-input >>> .el-input__inner {
        padding: 0 5px !important;
        font-family: 'Microsoft YaHei', serif;
    }

    .live-info-input {
        width: 100%;
        text-align: center;
    }

    >>> .live-info-select-inner .el-select-dropdown__wrap {
        max-height: 200px;
    }

    .link-ellipsis >>> .el-link--inner {
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;
        overflow: hidden;
        font-family: 'Microsoft YaHei', serif;
    }

    .setting-item {
        width: 250px;
        margin-bottom: 8px;
    }

    .setting-item-row {
        position: relative;
        margin-bottom: 5px;
    }

    .setting-item-row >>> .el-link {
        vertical-align: top !important;
        position: absolute;
        right: 5px;
    }

    .setting-item-label {
        text-decoration: underline;
        display: inline-block;
        width: 50px;
        text-align: center;
        vertical-align: top;
        line-height: 24px;
        word-wrap: break-word;
    }

    .setting-item-label:after {
        content: ':';
    }

    .setting-item-input {
        width: 190px;
    }

    >>> .el-textarea__inner {
        font-size: 14px;
        font-family: 'Microsoft YaHei', serif;
    }

    .main-setting-box >>> .el-drawer {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: inset 0 0 1em 1px black;
        padding: 10px;
    }

    .main-setting-box >>> .el-dialog__body {
        padding: 0 10px 10px 10px;
    }

    .main-setting-box >>> .el-tabs {
        height: 300px;
    }

    .main-setting-footer {
        padding: 6px 0;
        line-height: 24px;
        text-align: center;
    }

    .main-download-box {
        position: absolute;
        bottom: 10px;
        left: 0;
        width: 100%;
        height: 20px;
        padding: 0 15px;
        box-sizing: border-box;
    }

    .main-download-title {
        display: block;
        width: 100%;
        text-align: left;
        line-height: 20px;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        padding: 0 22px;
        font-size: 12px;
        box-sizing: border-box;
    }

    .main-download-process {
        display: block;
        width: 100%;
        text-align: right;
        line-height: 20px;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        padding: 0 22px;
        font-size: 12px;
        box-sizing: border-box;
    }

    .main-setting-box >>> .el-divider {
        margin: 10px 0;
    }

    .setting-shortcut-select {
        width: 70px;
    }

    .setting-shortcut-select >>> .el-input {
        width: 54px;
        display: inline-block;
    }

    .setting-shortcut-select >>> input {
        padding: 0 0 0 5px;
    }

    .setting-shortcut-select >>> .el-input__suffix {
        right: 0 !important;
    }

    .setting-shortcut-select:after {
        padding-left: 4px;
        content: "+";
        display: inline-block;
    }

    .setting-shortcut-input {
        width: 80px;
    }

    .setting-shortcut-input >>> input {
        padding: 0 0 0 5px;
    }
</style>