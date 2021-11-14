<template>
    <div class="main-container">
        <header-box :icon="icon" align="left" :title="title" @windowMin="windowMinimize"
                    @windowClose="windowClose"></header-box>
        <div class="main-box">
            <div class="main-user-box" v-loading="userLoading">
                <img class="user-avatar" :src="avatar">
                <div class="user-info">
                    <el-row class="user-info-item" style="margin-bottom: 4px">
                        <span class="user-name">{{userInfo.uname}}</span>
                        <span :class="'user-level level-'+userInfo.level">Level {{userInfo.level}}</span>
                    </el-row>
                    <el-row class="user-info-item" style="margin-bottom: 4px">
                        <span class="user-stat">
                            关注 :<span :title="userInfo.follow">{{handleNumber(userInfo.follow)}}</span>
                        </span>
                        <span class="user-stat">
                            粉丝 :<span :title="userInfo.fans">{{handleNumber(userInfo.fans)}}</span>
                        </span>
                    </el-row>
                    <el-row class="user-info-item">
                        <el-link icon="el-icon-refresh" @click="refreshInfo">刷新</el-link>
                        <el-link icon="el-icon-setting" @click="infoSetting">配置</el-link>
                        <el-link icon="el-icon-chat-dot-round" @click="toggleBarrageWindow">弹幕</el-link>
                    </el-row>
                </div>
            </div>

            <div class="box-live-info" v-loading="liveLoading">
                <div class="live-info-item margin-b-5">
                    <span class="live-info-label">地址</span>
                    <el-link class="live-info-link" @click="openUrl" title="点击打开" :type="loadFail?'info':'default'"
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

        <el-dialog :visible.sync="dialogVisible" fullscreen :title="editTitle?'修改直播标题':'修改直播区域'" center
                   @closed="dialogClosed">
            <el-input v-if="editTitle" class="live-info-input" v-model="titleTemp"></el-input>
            <el-select v-else class="live-info-input" v-model="areaIdTemp" filterable clearable ref="area"
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

        <el-dialog :visible.sync="settingVisible" fullscreen title="配置" center @closed="initSettingForm">
            <div class="setting-item">
                <span class="setting-item-label">Uid</span>
                <el-input class="setting-item-input" v-model="settingForm.uid"></el-input>
            </div>
            <div class="setting-item">
                <span class="setting-item-label">Token/Csrf</span>
                <el-input type="textarea" class="setting-item-input" :rows="2" resize="none"
                          v-model="settingForm.token"></el-input>
            </div>
            <div class="setting-item">
                <span class="setting-item-label">Cookie</span>
                <el-input type="textarea" class="setting-item-input" :rows="5" resize="none"
                          v-model="settingForm.cookie"></el-input>
            </div>
            <div slot="footer">
                <el-link icon="el-icon-check" @click="saveSetting">保存</el-link>
            </div>
        </el-dialog>
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
            return {
                icon: live,
                title: 'Bilive Manager',
                userLoading: false,
                uid: "",
                token: "",
                cookie: "",
                avatar: noface,
                userInfo: {
                    uname: 'userName',
                    level: 0,
                    follow: 0,
                    fans: 0
                },
                liveLoading: false,
                liveInfo: {
                    link: '-',
                    title: '-',
                    areaId: 0,
                    status: 0,
                    roomId: 0,
                    areaName: '-'
                },
                liveRtmp: {
                    rtmp: null,
                    code: null
                },
                liveArea: {},
                liveAreaOptions: {},
                dialogVisible: false,
                editTitle: '',
                titleTemp: '',
                areaIdTemp: 0,
                areaOptions: [],
                cacheTemp: '',
                cacheOptions: [],
                settingVisible: false,
                settingForm: {
                    uid: '',
                    token: '',
                    cookie: ''
                },
                minToTay: true
            }
        },
        computed: {
            loadFail() {
                return this.liveInfo.roomId === 0
            }
        },
        methods: {
            initConfig() {
                this.uid = this.$setting.get('uid')
                this.token = this.$setting.get('token')
                this.cookie = this.$setting.get('cookie')
                this.ipcRenderer.send('save-setting', {
                    uid: this.uid, token: this.token, cookie: this.cookie
                })
            },
            windowMinimize() {
                this.ipcRenderer.send('min-main', this.minToTay)
            },
            windowClose() {
                this.ipcRenderer.send('close-main')
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
                this.userInfo = {
                    uid: 0,
                    uname: 'userName',
                    level: 0,
                    follow: 0,
                    fans: 0,
                    roomId: 0
                }
                this.avatar = noface
            },
            initLiveInfo() {
                this.liveInfo = {
                    link: '-',
                    title: '-',
                    areaId: 0,
                    status: 0,
                    roomId: 0,
                    areaName: '-'
                }
            },
            initSettingForm() {
                this.settingForm = {
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
                await this.$api.getUserInfoByCookie(this.uid, this.cookie).then(res => {
                    this_.userInfo.uid = parseInt(this_.uid)
                    this_.userInfo.uname = res.name
                    this_.userInfo.level = res.level
                    this_.userInfo.roomId = res['live_room']['roomid']
                    this.$api.getUserStatByCookie(this.uid, this.cookie).then(r => {
                        this_.userInfo.follow = r['following']
                        this_.userInfo.fans = r['follower']
                    }).catch(() => {
                        this_.userInfo.follow = 0
                        this_.userInfo.fans = 0
                    })
                    this.$api.getAvatarContentByUrl(res.face).then(r => {
                        this_.avatar = r
                    }).catch(() => {
                        this_.avatar = noface
                    })
                    this.getLiveInfo()
                }).catch(e => {
                    this.addHeadLog(`加载失败:${e}, 请检查配置`, 1)
                    this.initUserInfo()
                    this.initLiveInfo()
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
                await this.$api.getLiveInfoByCookie(this.cookie).then(res => {
                    this.liveInfo = res
                    this.liveInfo.areaName = this.liveArea[this.liveInfo.areaId].label
                    this.areaIdTemp = res.areaId
                    this.titleTemp = res.title
                    if (flag) this.ipcRenderer.send('toggle-live-status', this.liveInfo.status)
                    if (this.liveInfo.status === 1) {
                        this.$api.getLiveRtmpByCookie(res.roomId, this.cookie).then(r => {
                            this.liveRtmp = r
                        })
                    }
                }).catch(e => {
                    this.addHeadLog(e.message)
                    this.initLiveInfo()
                })
                this.liveLoading = false
            },
            infoSetting() {
                this.settingVisible = true
                this.initSettingForm()
            },
            toggleBarrageWindow() {
                this.ipcRenderer.send('toggle-barrage')
            },
            openUrl() {
                if (this.liveInfo.link !== '-') {
                    cp.exec('start ' + this.liveInfo.link)
                }
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
                await this.$api.updateLiveStatus(this.liveInfo.roomId, this.liveInfo.status, this.liveInfo.areaId, this.token, this.cookie).then(async (res) => {
                    if (res) {
                        this_.liveInfo.status = Math.abs(this_.liveInfo.status - 1)
                        this_.addHeadLog(this_.liveInfo.status ? '开播成功' : '下播成功')
                        this_.ipcRenderer.send('toggle-live-status', this_.liveInfo.status)
                        this_.icon = this_.liveInfo.status ? liveOn : live
                        if (this_.liveInfo.status === 1) {
                            await this_.$api.getLiveRtmpByCookie(this_.liveInfo.roomId, this_.cookie).then(r => {
                                this_.liveRtmp = r
                            })
                        }
                    }
                }).catch(e => {
                    this.addHeadLog(e, 1)
                })
                this.liveLoading = false
            },
            updateLiveTitle() {
                if (this.titleTemp === this.liveInfo.title) {
                    this.dialogVisible = false
                    return
                }
                this.liveInfo.title = this.titleTemp
                this.$api.updateLiveTitle(this.liveInfo.roomId, this.liveInfo.title, this.token, this.cookie).then(res => {
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
                this.liveInfo.areaId = this.areaIdTemp
                this.$api.updateLiveArea(this.liveInfo.roomId, this.liveInfo.areaId, this.token, this.cookie).then(res => {
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
            saveSetting() {
                this.$setting.set('uid', this.settingForm.uid)
                this.$setting.set('token', this.settingForm.token)
                this.$setting.set('cookie', this.settingForm.cookie)
                this.$setting.save()
                this.initConfig()
                this.settingVisible = false
                this.getUserInfo()
            },
            addHeadLog(message, isError = false) {
                this.$refs.logs.logCountdown(message, isError)
            },
            initCache() {
                this.cacheOptions = this.$cache.get(this.editTitle ? 'liveTitle' : 'liveArea')
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
                    this.$cache.set('liveTitle', this.cacheOptions)
                    this.$cache.save()
                } else {
                    const index = this.cacheOptions.findIndex((o) => o.value === this.areaIdTemp)
                    if (index > -1) {
                        this.cacheOptions.splice(index, 1)
                    } else if (this.cacheOptions.length >= 5) {
                        this.cacheOptions.pop()
                    }
                    this.cacheOptions.unshift(this.areaOptions.find((o) => o.value === this.areaIdTemp))
                    this.$cache.set('liveArea', this.cacheOptions)
                    this.$cache.save()
                }
            }
        },
        created() {
            this.initConfig()
            this.getLiveArea()
            this.getUserInfo()
            this.ipcRenderer.on('toggleLiveStatus', (e) => {
                this.toggleLiveStatus()
            })
            this.ipcRenderer.on('toggleMinToTray', (e, flag) => {
                this.minToTay = flag
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

    .setting-item-label {
        text-decoration: underline;
        display: inline-block;
        width: 50px;
        text-align: center;
        vertical-align: top;
        line-height: 24px;
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
</style>