<template>
    <div class="log-header" :style="{top: top+'px'}" v-show="currentLog!==''">
        <span>{{currentLog}}</span>
        <div class="count-down-box">
            <div :class="countdown?'count-down':''" :style="{backgroundColor: isError?'red':'#19b32c'}"></div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "LogHeader",
        props: {
            top: 0
        },
        data() {
            return {
                countdown: 0,
                currentLog: '',
                isError: false
            }
        },
        methods: {
            log(msg) {
                this.logCountdown(msg, false)
            },
            err(msg) {
                this.logCountdown(msg, true)
            },
            logCountdown(msg, isErr) {
                this.currentLog = msg
                this.countdown = true
                this.isError = isErr
                setTimeout(() => {
                    this.countdown = false
                    this.currentLog = ''
                }, 2000)
            }
        }
    }
</script>

<style scoped>

    .log-header {
        display: inline-block;
        position: absolute;
        left: 0;
        height: 27px;
        width: 100%;
        background-color: #e8e8e8;
        z-index: 99;
    }

    .log-header span {
        display: block;
        width: 100%;
        font-size: 14px;
        text-align: center;
        line-height: 24px;
        word-break: break-all;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .count-down-box {
        width: 100%;
        height: 3px;
        position: relative;
        overflow: hidden;
    }

    .count-down-box > div {
        position: absolute;
        width: 100%;
        height: 3px;
        background-color: #19b32c;
    }

    .count-down {
        left: 0;
        -webkit-animation: 2s count_down;
        animation: 2s count_down;
    }

    @-webkit-keyframes count_down {
        from {
            left: 0;
        }
        to {
            left: 100%;
        }
    }

    @keyframes count_down {
        from {
            left: 0;
        }
        to {
            left: -100%;
        }
    }
</style>