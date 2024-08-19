<template>
    <div>
        <header-box :btn-min="false" :btn-close="false" title="提示"></header-box>
        <div class="close-box">
            <el-row>
                <span>您点击了关闭按钮,想要</span>
            </el-row>
            <el-row class="text-align-c">
                <el-radio v-model="closeAction_" label="toClose">关闭程序</el-radio>
                <el-radio v-model="closeAction_" label="toTray">最小化到托盘</el-radio>
            </el-row>
            <el-checkbox class="close-box-checkbox" v-model="dontAskMe_" label="记住我的选择"></el-checkbox>
            <el-button class="close-box-btn" size="mini" icon="el-icon-check" @click="save">确定</el-button>
        </div>
    </div>
</template>

<script>
    export default {
        name: "Close",
        data() {
            const state = this.$store.state
            return {
                state,
                closeAction_: 'toClose',
                dontAskMe_: false
            }
        },
        computed:{
            closeAction(){
                return this.state['mConfig'].setting.closeAction
            },
            dontAskMe() {
                return this.state['mConfig'].setting.dontAskMe
            }
        },
        methods: {
            save() {
                this.ipcRenderer.send('save-close-action', {action: this.closeAction_, dontAskMe: this.dontAskMe_})
            }
        },
        created() {
            // this.ipcRenderer.on('settingMainUpdate', (e, setting) => {
                this.closeAction_ = this.closeAction
                this.dontAskMe_ = this.dontAskMe
            // })
            // this.ipcRenderer.send('update-setting-main')
        }
    }
</script>

<style scoped>
    .close-box {
        padding: 10px;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        height: 105px;
        border-radius: 8px;
        overflow: hidden;
    }

    .close-box >>> .el-row {
        margin-bottom: 10px;
    }

    .text-align-c {
        text-align: center;
    }

    .close-box-checkbox {
        position: absolute;
        left: 15px;
        bottom: 10px;
    }

    .close-box-btn {
        position: absolute;
        font-family: "Microsoft YaHei", sans-serif;
        right: 15px;
        bottom: 10px;
    }
</style>