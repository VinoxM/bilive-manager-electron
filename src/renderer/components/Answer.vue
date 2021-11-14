<template>
    <div class="answer-container">
        <header-box :btn-min="false" title="发送弹幕" @windowClose="answerClose"></header-box>
        <el-input ref="message" class="answer-input" type="textarea" :rows="3" resize="none" v-model="message"
                  @keydown.enter.native.prevent="sendBarrage" @keydown.esc.native.prevent="answerClose"
                  aria-placeholder="Enter键发送,ESC键取消"
                  maxlength="30">
        </el-input>
        <span class="answer-length">{{message.length}}/30</span>
        <el-row class="answer-footer">
            <el-link icon="el-icon-check" @click="sendBarrage">发送</el-link>
        </el-row>
    </div>
</template>

<script>
    export default {
        name: "Answer",
        data() {
            return {
                message: '',
                roomInfo: {
                    roomId: 0
                },
                setting: {
                    uid: '',
                    token: '',
                    cookie: ''
                }
            }
        },
        methods: {
            sendBarrage() {
                if (this.message === '')
                    return
                const token = this.setting.token
                const cookie = this.setting.cookie
                this.$api.sendBiliBarrage(this.message, this.roomInfo.roomId, token, cookie).then(res => {
                    this.ipcRenderer.send('add-barrage-log', res)
                    this.answerClose()
                }).catch(e => {
                    this.ipcRenderer.send('add-barrage-err', e)
                })
            },
            answerClose() {
                this.message = ''
                this.ipcRenderer.send('answer-close')
            }
        },
        created() {
            this.ipcRenderer.send('update-room-info')
            this.ipcRenderer.on('updateRoomInfo', (e, rInfo) => {
                this.roomInfo = rInfo
            })
            this.ipcRenderer.on('wsClosed', () => {
                this.roomInfo = {roomId: 0}
                this.answerClose()
            })
            this.ipcRenderer.on('focusInput', () => {
                this.$refs.message.focus()
            })
            this.ipcRenderer.on('updateSetting', (e, s) => {
                this.setting = s
            })
            this.ipcRenderer.send('update-setting')
        }
    }
</script>

<style scoped>
    .answer-container {
        position: relative;
    }

    .answer-input {
        padding: 5px;
        box-sizing: border-box;
    }

    .answer-input >>> textarea {
        font-family: "Microsoft YaHei", sans-serif;
    }

    .answer-length {
        position: absolute;
        right: 8px;
        top: 116px;
        text-align: right;
    }

    .answer-footer {
        text-align: center;
    }

</style>