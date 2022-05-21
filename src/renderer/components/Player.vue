<template>
    <div class="player-container">
        <header-box :btn-min="true" :btn-small="true" title="Bili Player" v-show="!isFullscreen&&!isSmall"
                    @windowClose="playerClose" @windowSmall="playerSmall"
                    @windowMin="playerMin"></header-box>
        <div id="videoBox" v-loading="loading"
             :element-loading-text="loadFailed?'加载失败':'拼命加载中'"
             element-loading-background="rgba(0, 0, 0, 0.8)"
             @mouseenter="mouseEnter" @mouseleave="mouseLeave"
             :class="videoBoxClass">
            <!--            <video id="videoPlayer" class="video-js"></video>-->
            <div :class="mouseOn?'mask-small opacity':'mask-small'" v-show="isSmall" @mousedown="mouseDown"
                 @mouseup="mouseUp" @mousemove="mouseMove" @mouseleave="mouseUp">
                <div class="mask-header">
                    <el-icon :class="onTop?'btn-top-on':'btn-top'" name="upload2" @click.native="handleOnTop"></el-icon>
                </div>
                <div class="mask-tools">
                    <span class="to-large" @click="toLarge">
                        <span class="btn-to-large">↑</span>
                        <span>返回至播放器</span>
                    </span>
                </div>
                <div class="mask-footer">
                    <span :class="paused?'btn-play':'btn-pause'" @click="handlePause"></span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Videojs from "video.js"; // 引入Videojs
    import '../../plugins/videojs-flvjs-es6';

    export default {
        name: "Player",
        data() {
            const state = this.$store.state
            return {
                state,
                videoSrc: '',
                sourceType: '',
                playerObj: null,
                isFullscreen: false,
                loading: false,
                loadFailed: false,
                videoHeight: 0,
                videoWidth: 0,
                isSmall: false,
                mouseOn: false,
                dragFlag: false,
                mousePos: {x: 0, y: 0},
                paused: true,
                onTop: true,
                volume: 1
            }
        },
        computed: {
            videoBoxClass() {
                if (this.isFullScreen) {
                    return 'video-box-fullscreen'
                } else if (this.isSmall) {
                    return 'video-box-small'
                } else {
                    return 'video-box'
                }
            }
        },
        methods: {
            initVideo() {
                this.loading = true
                const this_ = this
                const sourceType = {
                    'flv': 'video/x-flv',
                    'hls': 'application/x-mpegURL'
                }
                if (this.playerObj) {
                    // this.playerObj.src(null)
                    this.playerObj.dispose()
                    this.playerObj = null
                    // this.playerObj.src({
                    //     src: this.videoSrc,
                    //     type: sourceType[this.sourceType]
                    // })
                }
                let options = {
                    autoplay: true, // 设置自动播放
                    controls: true, // 显示播放的控件
                    fluid: true,
                    controlBar: {
                        children: [
                            'playToggle', // 播放按钮
                            //'currentTimeDisplay', // 当前已播放时间
                            //'progressControl', // 播放进度条
                            //'durationDisplay', // 总时间
                            {
                                name: 'volumePanel', // 音量控制
                                inline: false, // 不使用水平方式
                            },
                            // 'FullscreenToggle'// 全屏
                        ]
                    },
                    techOrder: ["html5", "flvjs"],// 兼容顺序
                    sources: [
                        // 注意，如果是以option方式设置的src,是不能实现 换台的 (即使监听了nowPlayVideoUrl也没实现)
                        {
                            src:
                            this_.videoSrc,
                            // "https://cn-hbcd-cu-02-11.bilivideo.com/live-bvc/414829/live_15417398_20094336/index.m3u8?expires=1652630338&len=0&oi=2346917254&pt=web&qn=10000&trid=1007e5356c2a40d94aa6a06c85fa02e26235&sigparams=cdn,expires,len,oi,pt,qn,trid&cdn=cn-gotcha01&sign=9951fd24718a67a06f674ad8cb0dfa45&sk=95e87b11faffe8bb2c16a96c2b180e28&flvsk=0b7ae274aae39cbffd2593a2b5666fae&p2p_type=1&src=57345&sl=2&free_type=0&flowtype=1&machinezone=jd&pp=srt&sid=cn-hbcd-cu-02-11&chash=0&sche=ban&source=onetier&order=2&site=b08b29d2e3a377dd3959ad66d6afe0d4",
                            type: sourceType[this_.sourceType] // 告诉videojs,这是一个hls流
                        }
                    ]
                    // ,flvjs:{
                    //     mediaDataSource: {
                    //         isLive: true,
                    //         cors: true,
                    //         withCredentials: false
                    //     }
                    // }
                };
                if (this.sourceType === 'flv') {
                    options.flvjs = {
                        mediaDataSource: {
                            isLive: false,
                            cors: true,
                            withCredentials: true
                        }
                    }
                }
                const elem = document.createElement('video')
                elem.setAttribute('id', 'videoPlayer')
                elem.setAttribute('class', 'video-js css-hide video-fluid')
                elem.setAttribute('style', 'display:none')
                document.getElementById('videoBox').appendChild(elem)
                this.playerObj = Videojs("videoPlayer", options, () => {
                    this_.playerObj.on('loadedmetadata', () => {
                        document.querySelector('#videoPlayer').setAttribute('style', 'display: block')
                        document.querySelector('#videoPlayer video').setAttribute('style', 'display: block')
                        this_.loading = false
                        const width = this_.playerObj.videoWidth(), height = this_.playerObj.videoHeight()
                        this_.videoHeight = height
                        this_.videoWidth = width
                        this_.ipcRenderer.send('video-loaded', {width, height})
                        this_.playerObj.volume(this_.volume)
                    })
                    this_.playerObj.on('play', () => {
                        this_.paused = false
                    })
                    this_.playerObj.on('pause', () => {
                        this_.paused = true
                    })
                    this_.playerObj.on('volumechange', () => {
                        this_.volume = this_.playerObj.volume().toFixed(2)
                    })
                    this_.playerObj.on('fullscreenchange', () => {
                        console.log('fullscreen')
                        // this_.ipcRenderer.send('fullscreen-change', {
                        //     flag: this_.playerObj.isFullscreen(),
                        //     width: this_.playerObj.videoWidth(),
                        //     height: this_.playerObj.videoHeight()
                        // })
                        // console.log('fullscreenchange')
                        this_.ipcRenderer.send('fullscreen-change', this_.playerObj.isFullscreen())
                    })
                    this_.playerObj.on('error', (err) => {
                        this_.loadFailed = true
                        console.log('error:' + err)
                    })
                    const triggerFullscreen = function () {
                        console.log('fullscreen')
                        this_.ipcRenderer.send('fullscreen-change', !this_.playerObj.isFullscreen())
                    }
                    const btn = this_.playerObj.controlBar.addChild('button', {
                        clickHandler: triggerFullscreen
                    });
                    btn.addClass('vjs-fullscreen-control');
                    btn.addClass('vjs-control');
                    btn.addClass('vjs-button');
                    btn.addClass('btn-full');
                    const triggerReplay = function () {
                        console.log('replay')
                        this_.initVideo()
                    }
                    const btn1 = this_.playerObj.controlBar.addChild('button', {
                        clickHandler: triggerReplay
                    })
                    btn1.addClass('vjs-icon-replay');
                    btn1.addClass('vjs-control');
                    btn1.addClass('vjs-button');
                    btn1.addClass('btn-replay')
                    if (this_.playerObj.isFullscreen()){
                        this_.playerObj.exitFullscreen()
                        this_.ipcRenderer.send('fullscreen-change', false)
                    }
                })
            },
            playerClose() {
                if (this.playerObj) {
                    this.playerObj.src(null)
                    this.playerObj.dispose()
                    this.playerObj = null
                }
                this.ipcRenderer.send('player-close')
            },
            playerMin() {
                this.ipcRenderer.send('player-min')
            },
            playerSmall() { // 浮窗
                this.isSmall = true
                this.ipcRenderer.send('player-small')
            },
            toLarge() {
                this.isSmall = false
                this.ipcRenderer.send('player-large')
            },
            mouseEnter() {
                this.mouseOn = true
            },
            mouseLeave() {
                this.mouseOn = false
            },
            mouseDown(e) {
                this.mousePos = {x: e.x, y: e.y}
                this.dragFlag = true
            },
            mouseUp() {
                this.dragFlag = false
            },
            mouseMove(e) {
                if (this.dragFlag) {
                    this.ipcRenderer.send('move-small-window', [e.screenX - this.mousePos.x, e.screenY - this.mousePos.y])
                }
            },
            handleOnTop() {
                this.ipcRenderer.send('small-window-on-top')
            },
            handlePause() {
                if (!this.playerObj) return
                if (this.playerObj.paused()) {
                    this.playerObj.play()
                } else
                    this.playerObj.pause()
            }
        },
        created() {
            const this_ = this
            this.ipcRenderer.on('playSource', (_, {type, source}) => {
                this_.sourceType = type
                this_.videoSrc = source
                this_.initVideo()
            })
            this.ipcRenderer.on('wsClosed', () => {
                this_.playerClose()
            })
            document.addEventListener('click', (e) => {
                const target = e.target
                if (target.parentElement.className.split(' ').indexOf('btn-full') > -1) {
                    // if (target.className.split(' ').indexOf('btn-full') > -1) {
                    if (this_.playerObj.isFullscreen()) {
                        this_.playerObj.exitFullscreen()
                    } else {
                        const element = document.querySelector('#videoPlayer')
                        if ('requestFullscreen' in element) {
                            element.requestFullscreen()
                        } else if ('webkitRequestFullScreen' in element) {
                            element.webkitRequestFullScreen()
                        } else if ('mozRequestFullScreen' in element) {
                            element.mozRequestFullScreen()
                        } else if ('msRequestFullscreen' in element) {
                            element.msRequestFullscreen()
                        }
                    }
                }
            })

            document.addEventListener('keypress', (e) => {
                if (this_.isSmall) return
                switch (e.code) {
                    case 'Space':
                        if (this_.playerObj.paused())
                            this_.playerObj.play()
                        else this_.playerObj.pause()
                        e.preventDefault()
                        break
                    case 'Enter':
                        const isFullscreen = this_.playerObj.isFullscreen()
                        this_.ipcRenderer.send('fullscreen-change', !isFullscreen)
                        if (isFullscreen) {
                            this_.playerObj.exitFullscreen()
                        } else {
                            const element = document.querySelector('#videoPlayer')
                            if ('requestFullscreen' in element) {
                                element.requestFullscreen()
                            } else if ('webkitRequestFullScreen' in element) {
                                element.webkitRequestFullScreen()
                            } else if ('mozRequestFullScreen' in element) {
                                element.mozRequestFullScreen()
                            } else if ('msRequestFullscreen' in element) {
                                element.msRequestFullscreen()
                            }
                        }
                        e.preventDefault()
                        break
                }
            })

            this.ipcRenderer.on('changeSmallWindowOnTop', (_, onTop) => {
                this.onTop = onTop
            })

            this.$nextTick(() => {
                // this_.videoSrc = "https://cn-hbcd-cu-02-10.bilivideo.com/live-bvc/421911/live_15417398_20094336.flv?expires=1652625967&len=0&oi=2346917254&pt=web&qn=10000&trid=100038afc318dc6341c48b7d383022a84f4a&sigparams=cdn,expires,len,oi,pt,qn,trid&cdn=cn-gotcha01&sign=3950dee50d1335ccbcdaa29d8760b6c4&sk=0b7ae274aae39cbffd2593a2b5666fae&p2p_type=1&src=57345&sl=2&free_type=0&flowtype=1&machinezone=jd&pp=srt&sid=cn-hbcd-cu-02-10&chash=1&sche=ban&source=onetier&order=1&site=c657d75b89f6ac2a305bd99c0b93862b"
                // this_.sourceType = 'hls'
                // this_.initVideo()
            })
        }
    }
</script>

<style scoped>
    .player-container {
        width: 100%;
        height: 100%;
    }

    .video-box {
        width: 100%;
        height: calc(100% - 30px);
    }

    .video-box-small,
    .video-box-fullscreen {
        width: 100%;
        height: 100%;
    }

    .video-box-small >>> .vjs-control-bar {
        display: none !important;
    }

    .mask-small {
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: 2001;
        opacity: 0;
        background: rgba(0, 0, 0, 0.6);
        transition: 600ms;
    }

    .opacity {
        opacity: 1;
        transition: 600ms;
    }

    .mask-tools {
        height: 36px;
        width: 100%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-size: 18px;
    }

    .mask-tools > span {
        display: inline-block;
        color: #ffffff;
        cursor: pointer;
        padding: 3px 10px 3px 5px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 16px;
    }

    .mask-tools span:hover {
        color: #67e1f3;
    }

    .mask-tools .btn-to-large {
        display: inline-block;
        width: 24px;
        height: 24px;
        line-height: 24px;
        text-align: center;
        user-select: none;
        -webkit-user-select: none;
        transform: rotate(-45deg);
    }

    .mask-header {
        width: 100%;
        height: 32px;
        position: absolute;
        top: 10px;
        text-align: right;
        font-size: 20px;
        color: white;
        padding: 0 15px 0 0;
        box-sizing: border-box;
    }

    .mask-header .btn-top-on,
    .mask-header .btn-top {
        cursor: pointer;
        border-radius: 50%;
        height: 32px;
        width: 32px;
        line-height: 32px;
        text-align: center;
    }

    .mask-header .btn-top-on {
        background: rgba(255, 255, 255, 0.2);
        color: #67e1f3;
    }

    .mask-header .btn-top:hover {
        color: #67e1f3;
        background: rgba(255, 255, 255, 0.2);
    }

    .mask-footer {
        width: 100%;
        height: 48px;
        position: absolute;
        bottom: 20px;
        text-align: center;
        font-size: 24px;
        color: white;
    }

    .mask-footer span {
        border-radius: 50%;
        width: 48px;
        height: 48px;
        line-height: 48px;
        display: inline-block;
        cursor: pointer;
        transition: 0.6s;
    }

    .mask-footer span:hover {
        background: #555555;
        color: #67e1f3;
    }

    .mask-footer .btn-pause {
        transform: rotate(90deg);
    }

    .mask-footer .btn-pause:after {
        content: '＝';
        position: relative;
        top: -1px;
        font-weight: bolder;
    }

    .mask-footer .btn-play:after {
        content: '▷';
        position: relative;
        left: 2px;
        top: -1px;
    }

    /* #videoBox{*/
    /*     padding-top: 30px;*/
    /*     box-sizing: border-box;*/
    /*}*/

    /* >>> .header-box {*/
    /*     position: absolute !important;*/
    /* }*/

    #videoBox >>> .vjs-big-play-button {
        height: 3em;
        width: 3em;
        line-height: 3em;
        border-radius: 50%;
        bottom: 0;
        top: 0;
        left: 0;
        right: 0;
        margin: auto;
        display: none;
    }

    >>> .vjs-tech {
        pointer-events: none;
    }

    >>> .btn-replay {
        position: relative;
        left: -5px;
        cursor: pointer;
    }

    >>> .btn-replay:before {
        font-size: 1.6em;
    }

    >>> .vjs-volume-panel-vertical {
        position: absolute !important;
        right: 36px;
    }

    >>> .btn-full {
        position: absolute !important;
        right: 0;
    }

    >>> .video-fluid {
        width: 100% !important;
        height: 100% !important;
    }
</style>