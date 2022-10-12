<template>
    <div class="full">
        <header-box :btn-min="false" :btn-close="true" title="打开哔哩哔哩App扫码" @windowClose="close"></header-box>
        <qrcode v-if="src!=null" :value="src" :options="{width: 300, margin: 2}"></qrcode>
        <div class="cover" @click="login" v-show="failed">
            <span :class="{fail: failed}">{{failed ? '点击重新加载' : '加载中...'}}</span>
        </div>
        <div class="message">{{message}}</div>
    </div>
</template>

<script>
    export default {
        name: "Login",
        data() {
            return {
                src: null,
                qrCode: '',
                message: '加载中...',
                failed: true,
                interval: null
            }
        },
        methods: {
            login() {
                const this_ = this
                this.message = '加载中...'
                this.$api.getLoginQrCode().then(res => {
                    console.log(res)
                    this.src = res.url
                    this.qrCode = res['qrcode_key']
                    this.failed = false
                    this.message = '未扫码'
                    this.interval = setInterval(() => {
                        this_.$api.gotoLogin(this.qrCode).then(r => {
                            console.log(r)
                            switch (r.code) {
                                case 0:
                                    this_.message = '扫码登录成功'
                                    clearInterval(this_.interval)
                                    this_.interval = null
                                    const {cookie, data} = this_.$plugins.urlToCookie(r.url)
                                    const uid = data['DedeUserID']
                                    const token = data['bili_jct']
                                    this_.close()
                                    this_.ipcRenderer.send('login-success', {uid, token, cookie})
                                    break
                                case 86038:
                                    this_.message = '二维码已失效'
                                    clearInterval(this_.interval)
                                    this_.interval = null
                                    this_.src = null
                                    this_.failed = true
                                    break
                                case 86090:
                                    this_.message = '二维码已扫码未确认'
                                    break
                                case 86101:
                                    this_.message = '未扫码'
                                    break
                            }
                            console.log(this_.message)
                        }).catch(e => {
                            console.log(e)
                        })
                    }, 2000)
                }).catch(e => {
                    this_.failed = true
                    this_.message = e
                    console.log(this_.message)
                })
            },
            close() {
                if (this.interval) {
                    clearInterval(this.interval)
                    this.interval = null
                }
                this.ipcRenderer.send('close-login-window')
            }
        },
        created() {
            this.ipcRenderer.on('login', () => {
                this.login()
            })
        }
    }
</script>

<style scoped>
    .full {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .message {
        text-align: center;
        line-height: 36px;
        height: 36px;
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 0;
    }

    .cover {
        height: 280px;
        width: 280px;
        position: absolute;
        left: 0;
        right: 0;
        top: 40px;
        margin: 0 auto;
        z-index: 10;
        background: rgba(0, 0, 0, 0.7);
        text-align: center;
    }

    .cover:hover {
        cursor: pointer;
    }

    .cover span {
        line-height: 280px;
        color: #409EFF;
    }

    .cover .fail {
        color: #ff5151 !important;
    }
</style>