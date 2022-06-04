<template>
    <div class="player-container">
        <header-box :btn-min="true" title="Bilive Player" v-show="!isFullscreen&&!isSmall"
                    @windowClose="playerClose"
                    @windowMin="playerMin"></header-box>
        <div id="videoBox" @mouseenter="mouseEnter" @mouseleave="mouseLeave" @mousemove="handleCountdown"
             :class="videoBoxClass">
            <!--            <video id="videoPlayer" class="video-js"></video>-->
            <div class="mask-large" v-show="!isSmall" :style="{background: loading?'rgba(0, 0, 0, 0.6)':''}">
                <div :class="loadFailed?'loading-box loading-error' : 'loading-box'" v-show="loading">
                    <div class="loading-icon">
                        <el-icon :name="loadFailed?'warning':'loading'"></el-icon>
                    </div>
                    <div class="loading-text">{{loadFailed? '加载失败' : '加载中...'}}</div>
                </div>
                <div class="video-control-bar" :style="{opacity: mouseOn ? 1: 0}">
                    <div class="btn-box" v-if="playerObj">
                        <span :class="!playerObj?'btn-to-large disable':'btn-to-large'" title="小窗播放"
                              @click="playerSmall"></span>
                        <el-icon name="refresh" :class="!playerObj?'btn-refresh disable':'btn-refresh'" title="重新加载"
                                 @click.native="handleReplay"></el-icon>
                        <span :class="pauseClass" :title="paused?'播放':'暂停'" @click="handlePause"></span>
                        <div class="btn-volume-box" @mouseenter="volumeLargeHover = true"
                             @mouseleave="volumeLargeHover = false">
                            <div :class="!playerObj?'btn-volume disable':'btn-volume'"
                                 :style="{background:volumeLargeHover?'#2d2d2d':'',borderRadius: playerObj?'0 0 50% 50%':'50%',boxShadow: volumeLargeHover? '0 -5px 10px -1px rgba(255, 255, 255, 0.3), inset 0 -1px 3px 1px rgba(255, 255, 255, 0.4)' :''}"
                                 title="音量">
                                <img :src="volumeLargeSrc" @click="handleVolumeOff">
                            </div>
                            <el-slider class="btn-volume-bar" v-model="volume" :max="1" :step="0.01"
                                       v-show="playerObj&&volumeLargeHover"
                                       :show-tooltip="false" :format-tooltip="formatVolume" vertical
                                       height="130px" @input="volumeChange"></el-slider>
                        </div>
                        <div :class="!playerObj?'btn-fullscreen btn-full disable':'btn-fullscreen btn-full'"
                             @mouseenter="fullscreenHover = true"
                             @mouseleave="fullscreenHover = false" :title="isFullscreen?'退出全屏':'全屏'">
                            <img :src="fullscreenSrc" class="btn-full">
                        </div>
                    </div>
                </div>
            </div>
            <div :class="mouseOn?'mask-small opacity':'mask-small'" v-show="isSmall" @mousedown="mouseDown"
                 @mouseup="mouseUp" @mousemove="mouseMove" @mouseleave="mouseUp">
                <div class="mask-header">
                    <el-icon :title="onTop?'取消置顶':'置顶'" :class="onTop?'btn-top-on':'btn-top'" name="upload2"
                             @click.native="handleOnTop"></el-icon>
                </div>
                <div class="mask-tools">
                    <span class="to-large" @click="toLarge">
<!--                        <span class="btn-to-large">↑</span>-->
                        <!--                        <span class="to-large-text">返回至播放器</span>-->
                    </span>
                </div>
                <div class="mask-footer">
                    <el-icon :class="!playerObj?'btn-refresh disable':'btn-refresh'" name="refresh"
                             @click.native="handleReplay" title="重新加载"></el-icon>
                    <span :class="pauseClass" @click="handlePause" :title="paused?'播放':'暂停'"></span>
                    <img @mouseenter="volumeHover = true" @mouseleave="volumeHover = false"
                         :class="!playerObj?'btn-volume disable':'btn-volume'"
                         :title="volumeOff?'取消禁音':'禁音'"
                         :src="volumeSrc" @click="handleVolumeOff"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import volumeOff from "../assets/volume/volume-off.png";
    import volumeHigh from "../assets/volume/volume-high.png";
    import volumeLow from "../assets/volume/volume-low.png";
    import volumeOffHover from "../assets/volume/volume-off-hover.png";
    import volumeHighHover from "../assets/volume/volume-high-hover.png";
    import volumeLowHover from "../assets/volume/volume-low-hover.png";
    import iconFullscreen from "../assets/fullscreen/fullscreen.png";
    import iconFullscreenHover from "../assets/fullscreen/fullscreen-hover.png";
    import iconFullscreenCancel from "../assets/fullscreen/fullscreen-cancel.png";
    import iconFullscreenCancelHover from "../assets/fullscreen/fullscreen-cancel-hover.png";
    import Videojs from "video.js"; // 引入Videojs
    import '../../plugins/videojs-flvjs-es6';

    export default {
        name: "Player",
        data() {
            const state = this.$store.state
            return {
                state,
                volumeIcon: {
                    high: volumeHigh,
                    off: volumeOff,
                    low: volumeLow,
                    highHover: volumeHighHover,
                    offHover: volumeOffHover,
                    lowHover: volumeLowHover,
                },
                fullscreenIcon: {
                    fullscreen: iconFullscreen,
                    fullscreenHover: iconFullscreenHover,
                    fullscreenCancel: iconFullscreenCancel,
                    fullscreenCancelHover: iconFullscreenCancelHover
                },
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
                volume: 1,
                volumeOff: false,
                volumeHover: false,
                volumeLargeHover: false,
                isClosed: true,
                fullscreenHover: false,
                countdown: null
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
            },
            volumeSrc() {
                if (!this.playerObj) return this.volumeIcon.high
                if (this.volumeOff) {
                    return this.volumeHover ? this.volumeIcon.offHover : this.volumeIcon.off
                } else {
                    return this.volumeHover ? this.volumeIcon.highHover : this.volumeIcon.high
                }
            },
            pauseClass() {
                if (this.paused) {
                    return !this.playerObj ? 'btn-play disable' : 'btn-play'
                } else {
                    return !this.playerObj ? 'btn-pause disable' : 'btn-pause'
                }
            },
            volumeLargeSrc() {
                if (this.volumeOff) return this.playerObj && this.volumeLargeHover ? this.volumeIcon.offHover : this.volumeIcon.off
                if (this.volume > 0.5) {
                    return this.playerObj && this.volumeLargeHover ? this.volumeIcon.highHover : this.volumeIcon.high
                } else {
                    return this.playerObj && this.volumeLargeHover ? this.volumeIcon.lowHover : this.volumeIcon.low
                }
            },
            fullscreenSrc() {
                if (this.isFullscreen) {
                    return this.fullscreenHover ? this.fullscreenIcon.fullscreenCancelHover : this.fullscreenIcon.fullscreenCancel
                } else {
                    return this.fullscreenHover ? this.fullscreenIcon.fullscreenHover : this.fullscreenIcon.fullscreen
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
                    document.querySelector('#videoPlayer').setAttribute('style', 'display: block')
                    document.querySelector('#videoPlayer video').setAttribute('style', 'display: block')
                    this_.loadFailed = false
                    this_.loading = true
                    this_.playerObj.on("loadstart", function () {
                        this_.loading = true
                        console.log("开始请求数据 ")
                    })
                    this_.playerObj.on("waiting", function () {
                        this_.loading = true
                        console.log("等待数据")
                    })
                    this_.playerObj.on('playing', () => {
                        this_.loading = false
                        console.log("正在播放")
                    })
                    this_.playerObj.on('loadedmetadata', () => {
                        console.log("加载完成")
                        const width = this_.playerObj.videoWidth(), height = this_.playerObj.videoHeight()
                        this_.videoHeight = height
                        this_.videoWidth = width
                        if (this_.volumeOff) {
                            this_.playerObj.muted(true)
                        } else {
                            this_.playerObj.volume(this_.volume)
                        }
                        // if (this_.isClosed)
                        //     this_.isFullscreen = false
                        this_.isClosed = false
                        this_.ipcRenderer.send('video-loaded', {
                            width,
                            height,
                            isFullscreen: this_.isFullscreen,
                            isClosed: this_.isClosed
                        })
                    })
                    this_.playerObj.on('play', () => {
                        this_.paused = false
                    })
                    this_.playerObj.on('pause', () => {
                        this_.paused = true
                    })
                    this_.playerObj.on('volumechange', () => {
                        // this_.volume = this_.playerObj.volume().toFixed(2)
                        this_.volumeOff = this_.playerObj.muted()
                    })
                    // this_.playerObj.on('fullscreenchange', () => {
                    //     console.log('fullscreen')
                    //     this_.isFullscreen = this_.playerObj.isFullscreen()
                    //     this_.ipcRenderer.send('fullscreen-change', this_.playerObj.isFullscreen())
                    // })
                    this_.playerObj.on('error', (err) => {
                        this_.loadFailed = true
                        this_.loading = true
                        console.log('error:' + err)
                    })
                    // const triggerFullscreen = function () {
                    //     console.log('fullscreen')
                    //     this_.ipcRenderer.send('fullscreen-change', !this_.playerObj.isFullscreen())
                    // }
                    // const btn = this_.playerObj.controlBar.addChild('button', {
                    //     clickHandler: triggerFullscreen
                    // });
                    // btn.addClass('vjs-fullscreen-control');
                    // btn.addClass('vjs-control');
                    // btn.addClass('vjs-button');
                    // btn.addClass('btn-full');
                    // const triggerReplay = function () {
                    //     console.log('replay')
                    //     this_.initVideo()
                    // }
                    // const btn1 = this_.playerObj.controlBar.addChild('button', {
                    //     clickHandler: triggerReplay
                    // })
                    // btn1.addClass('vjs-icon-replay');
                    // btn1.addClass('vjs-control');
                    // btn1.addClass('vjs-button');
                    // btn1.addClass('btn-replay')
                    // if (this_.playerObj.isFullscreen()) {
                    //     this_.playerObj.exitFullscreen()
                    //     this_.ipcRenderer.send('fullscreen-change', false)
                    // }
                })
            },
            playerClose() {
                this.isClosed = true
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
            },
            handleReplay() {
                if (!this.playerObj) return
                this.initVideo()
            },
            handleVolumeOff() {
                if (!this.playerObj) return
                this.playerObj.muted(!this.playerObj.muted())
            },
            formatVolume(val) {
                return (100 * val).toFixed(0)
            },
            volumeChange(val) {
                this.volumeOff = val === 0
                this.playerObj.volume(val)
                this.playerObj.muted(this.volumeOff)
            },
            handleCountdown() {
                this.mouseOn = true
                const this_ = this
                if (this.countdown) {
                    clearTimeout(this.countdown)
                    this.countdown = null
                }
                this.countdown = setTimeout(() => {
                    this_.mouseOn = false
                }, 3000)
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
            this.ipcRenderer.on('liveEnd', () => {
                this_.playerClose()
            })
            document.addEventListener('click', (e) => {
                const target = e.target
                if (!this_.playerObj) return
                // if (target.parentElement.className.split(' ').indexOf('btn-full') > -1) {
                if (target.className.split(' ').indexOf('btn-full') > -1) {
                    this_.ipcRenderer.send('fullscreen-change', !this_.isFullscreen)
                    if (this_.isFullscreen) {
                        if ('exitFullscreen' in document) {
                            document.exitFullscreen()
                        } else if ('mozCancelFullScreen' in document) {
                            document.mozCancelFullScreen()
                        } else if ('webkitExitFullscreen' in document) {
                            document.webkitExitFullscreen()
                        }
                    } else {
                        const element = document.querySelector('#videoBox')
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
                    this_.isFullscreen = !this_.isFullscreen
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
                    case 'NumpadEnter':
                        this_.ipcRenderer.send('fullscreen-change', !this_.isFullscreen)
                        if (this_.isFullscreen) {
                            if ('exitFullscreen' in document) {
                                document.exitFullscreen()
                            } else if ('mozCancelFullScreen' in document) {
                                document.mozCancelFullScreen()
                            } else if ('webkitExitFullscreen' in document) {
                                document.webkitExitFullscreen()
                            }
                        } else {
                            const element = document.querySelector('#videoBox')
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
                        this_.isFullscreen = !this_.isFullscreen
                        e.preventDefault()
                        break
                }
            })

            this.ipcRenderer.on('changeSmallWindowOnTop', (_, onTop) => {
                this.onTop = onTop
            })

            this.ipcRenderer.on('closePlayer', () => {
                this.playerClose()
            })

            this.$nextTick(() => {
                // this_.videoSrc = "https://cn-hbcd-cu-02-08.bilivideo.com/live-bvc/374601/live_173515738_43574662/index.m3u8?expires=1654134561&len=0&oi=2346917254&pt=web&qn=10000&trid=100789c0cc4164544f24ac12193c87f2325e&sigparams=cdn,expires,len,oi,pt,qn,trid&cdn=cn-gotcha01&sign=e2f7341277501c36095e6f04324cc199&sk=c3a569d0367953ea6c851afff04f6d2e&flvsk=7db1a32e08f19b48d8544eecd33a71c4&p2p_type=1&src=8&sl=3&free_type=0&flowtype=0&machinezone=jd&pp=rtmp&sid=cn-hbcd-cu-02-08&chash=0&sche=ban&source=onetier&order=2&site=0a047963932a33d6de0643796c793e35"
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
        position: relative;
    }

    .video-box-small,
    .video-box-fullscreen {
        width: 100%;
        height: 100%;
    }

    .video-box-small >>> .vjs-control-bar {
        display: none !important;
    }

    .mask-large {
        width: 100%;
        height: 100%;
        z-index: 2001;
        position: absolute;
        user-select: none;
    }

    .loading-box {
        width: 100%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-size: 14px;
        color: #409EFF;
    }

    .loading-error {
        color: #a10000 !important;
    }

    .loading-icon {
        font-size: 24px;
    }

    .loading-text {
        margin-top: 5px;
    }

    .video-control-bar {
        width: 260px;
        position: absolute;
        transition: 600ms;
        left: 0;
        right: 0;
        margin: 0 auto;
        bottom: 40px;
        text-align: center;
        color: white;
    }

    .video-control-bar .btn-box {
        height: 36px;
        border-radius: 18px;
        background: #555555;
        /*box-shadow: -1px -1px 2px 0 rgba(214, 214, 214, 0.35), inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2), inset 2px 2px 3px 1px rgba(0, 0, 0, 0.3);*/
        box-shadow: 0 15px 25px -4px rgba(0, 0, 0, 0.5), inset 0 -3px 4px -1px rgba(0, 0, 0, 0.2), 0 -5px 15px -1px rgba(255, 255, 255, 0.6), inset 0 3px 4px -1px rgba(255, 255, 255, 0.2), inset 0 0 3px 1px rgba(255, 255, 255, 0.4), inset 0 20px 30px 0 rgba(255, 255, 255, 0.2);
    }

    .video-control-bar .btn-box .disable {
        cursor: not-allowed !important;
    }

    .video-control-bar .btn-box .disable:hover {
        color: white !important;
    }

    .video-control-bar .btn-box > span,
    .video-control-bar .btn-box > div {
        display: inline-block;
        vertical-align: top;
    }

    .video-control-bar .btn-box .btn-to-large {
        height: 36px;
        width: 36px;
        line-height: 36px;
        font-size: 18px;
        transform: rotate(-45deg);
        border-radius: 50%;
        cursor: pointer;
        transition: 400ms;
        margin-right: 5px;
    }

    .video-control-bar .btn-box .btn-to-large:after {
        content: '↓';
    }

    .video-control-bar .btn-box .btn-to-large:hover {
        color: #67e1f3;
        background: linear-gradient(to top, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.5));
        box-shadow: 0 15px 25px -4px rgba(0, 0, 0, 0.5), inset 0 -3px 4px -1px rgba(0, 0, 0, 0.2), 0 -5px 10px -1px rgba(255, 255, 255, 0.3), inset 0 3px 4px -1px rgba(255, 255, 255, 0.2), inset 0 0 3px 1px rgba(255, 255, 255, 0.4), inset 0 20px 30px 0 rgba(255, 255, 255, 0.2);
    }

    .video-control-bar .btn-box .btn-refresh {
        height: 36px;
        width: 36px;
        line-height: 36px;
        font-size: 18px;
        cursor: pointer;
        border-radius: 50%;
        transition: 400ms;
    }

    .video-control-bar .btn-box .btn-refresh:hover {
        color: #67e1f3;
        background: linear-gradient(to top, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.5));
        transform: rotate(90deg);
        box-shadow: 0 15px 25px -4px rgba(0, 0, 0, 0.5), inset 0 -3px 4px -1px rgba(0, 0, 0, 0.2), 0 -5px 10px -1px rgba(255, 255, 255, 0.3), inset 0 3px 4px -1px rgba(255, 255, 255, 0.2), inset 0 0 3px 1px rgba(255, 255, 255, 0.4), inset 0 20px 30px 0 rgba(255, 255, 255, 0.2);
    }

    .video-control-bar .btn-box .btn-pause,
    .video-control-bar .btn-box .btn-play {
        height: 56px;
        width: 56px;
        line-height: 56px;
        font-size: 24px;
        cursor: pointer;
        border-radius: 50%;
        transition: 400ms;
        transform: translateY(-10px);
        background: #555555;
        margin: 0 10px;
        /*box-shadow: -1px -1px 2px 0 rgba(214, 214, 214, 0.35), inset -1px -1px 2px 1px rgba(255, 255, 255, 0.2), inset 2px 2px 3px 1px rgba(0, 0, 0, 0.3);*/
        box-shadow: 0 15px 25px -4px rgba(0, 0, 0, 0.5), inset 0 -3px 4px -1px rgba(0, 0, 0, 0.2), 0 -5px 15px -1px rgba(255, 255, 255, 0.6), inset 0 3px 4px -1px rgba(255, 255, 255, 0.2), inset 0 0 3px 1px rgba(255, 255, 255, 0.4), inset 0 20px 30px 0 rgba(255, 255, 255, 0.2);
    }

    .video-control-bar .btn-box .btn-pause {
        transform: translateY(-10px) rotate(90deg);
    }

    .video-control-bar .btn-box .btn-pause:after {
        content: '＝';
    }

    .video-control-bar .btn-box .btn-play:after {
        content: '▷';
    }

    .video-control-bar .btn-box .btn-play:hover,
    .video-control-bar .btn-box .btn-pause:hover {
        color: #67e1f3;
        background: #2d2d2d;
    }

    .video-control-bar .btn-box .btn-volume-box {
        width: 36px;
        height: 36px;
        position: relative;
    }

    .video-control-bar .btn-box .btn-volume {
        display: inline-block;
        width: 36px;
        height: 36px;
        position: relative;
        cursor: pointer;
        text-align: center;
        padding: 8px;
        box-sizing: border-box;
    }

    .video-control-bar .btn-box .btn-volume:hover {

    }

    .video-control-bar .btn-box .btn-volume img {
        display: inline-block;
        width: 20px;
        height: 20px;
    }

    .video-control-bar .btn-box .btn-volume-box .btn-volume-bar {
        position: absolute;
        bottom: 35px;
        background: #2d2d2d;
        border-radius: 18px 18px 0 0;
        padding: 18px 0 0 0;
        transition: 400ms;
        box-shadow: 0 15px 25px -4px rgba(0, 0, 0, 0.5), inset 0 2px 3px 1px rgba(255, 255, 255, 0.4);
    }

    .video-control-bar .btn-box .btn-volume-box .btn-volume-bar >>> .el-slider__bar {
        background-color: #67e1f3;
        width: 4px;
    }

    .video-control-bar .btn-box .btn-volume-box .btn-volume-bar >>> .el-slider__runway {
        width: 4px;
    }

    .video-control-bar .btn-box .btn-volume-box .btn-volume-bar >>> .el-slider__button-wrapper {
        left: -16px;
    }

    .video-control-bar .btn-box .btn-volume-box .btn-volume-bar >>> .el-slider__button {
        width: 8px;
        height: 8px;
        border-color: #67e1f3;
    }

    .video-control-bar .btn-box .btn-fullscreen {
        width: 36px;
        height: 36px;
        cursor: pointer;
        border-radius: 50%;
        padding: 8px;
        box-sizing: border-box;
        margin-left: 5px;
        transition: 400ms;
    }

    .video-control-bar .btn-box .btn-fullscreen:hover {
        background: linear-gradient(to top, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0.5));
        transform: rotate(90deg);
        box-shadow: 0 15px 25px -4px rgba(0, 0, 0, 0.5), inset 0 -3px 4px -1px rgba(0, 0, 0, 0.2), 0 -5px 10px -1px rgba(255, 255, 255, 0.3), inset 0 3px 4px -1px rgba(255, 255, 255, 0.2), inset 0 0 3px 1px rgba(255, 255, 255, 0.4), inset 0 20px 30px 0 rgba(255, 255, 255, 0.2);
    }

    .video-control-bar .btn-box .btn-fullscreen img {
        display: inline-block;
        width: 20px;
        height: 20px;
        line-height: 20px;
    }

    .mask-small {
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: 2001;
        opacity: 0;
        /*opacity: 1;*/
        background: rgba(0, 0, 0, 0.6);
        transition: 600ms;
    }

    .opacity {
        opacity: 1;
        transition: 600ms;
    }

    .mask-tools {
        height: 28px;
        width: 100%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-size: 14px;
    }

    .mask-tools .to-large {
        display: inline-block;
        color: #ffffff;
        cursor: pointer;
        padding: 3px;
        font-size: 16px;
        position: relative;
        border-radius: 17px;
        background: rgba(255, 255, 255, 0.2);
        overflow: hidden;
        width: 28px;
        height: 28px;
        line-height: 28px;
        transition: 0.6s;
        white-space: nowrap;
    }

    .mask-tools .to-large:hover {
        color: #67e1f3;
        width: 136px;
        /*padding: 3px 5px 3px 0;*/
    }

    .mask-tools .to-large:before {
        content: '↑';
        display: inline-block;
        width: 28px;
        height: 28px;
        text-align: center;
        user-select: none;
        -webkit-user-select: none;
        transform: rotate(-45deg);
        border-radius: 16px;
        vertical-align: top;
        transition: 0.6s;
    }

    .mask-tools .to-large:after {
        content: '返回至播放器';
        display: inline-block;
        transition: 0.6s;
        overflow: hidden;
        text-align: left;
        width: 98px;
        margin-left: 4px;
    }

    .mask-tools .to-large:hover:after {
        margin-left: 0;
    }

    .mask-header {
        width: 100%;
        height: 32px;
        position: absolute;
        top: 10px;
        text-align: right;
        font-size: 24px;
        color: white;
        padding: 0 15px 0 0;
        box-sizing: border-box;
    }

    .mask-header .btn-top-on,
    .mask-header .btn-top {
        cursor: pointer;
        height: 40px;
        width: 40px;
        line-height: 40px;
        text-align: center;
        box-sizing: border-box;
        transition: 0.6s;
    }

    .mask-header .btn-top-on {
        background: rgba(255, 255, 255, 0.2);
        color: #67e1f3;
        border-radius: 50%;
    }

    .mask-header .btn-top:hover {
        border-radius: 50%;
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
        width: 48px;
        height: 48px;
        line-height: 48px;
        display: inline-block;
        cursor: pointer;
        transition: 0.6s;
    }

    .mask-footer span:hover {
        border-radius: 50%;
        background: #555555;
        color: #67e1f3;
    }

    .mask-footer .btn-pause {
        transform: rotate(90deg);
    }

    .mask-large .btn-pause:after,
    .mask-footer .btn-pause:after {
        content: '＝';
        position: relative;
        top: -1px;
        font-weight: bolder;
    }

    .mask-large .btn-play:after,
    .mask-footer .btn-play:after {
        content: '▷';
        position: relative;
        left: 2px;
        top: -1px;
    }

    .mask-footer .btn-refresh {
        height: 48px;
        width: 48px;
        line-height: 48px;
        box-sizing: border-box;
        display: inline-block;
        vertical-align: bottom;
        cursor: pointer;
        transition: 0.6s;
        border-radius: 50%;
    }

    .mask-footer .btn-refresh:hover {
        transform: rotate(180deg);
        background: #555555;
        color: #67e1f3;
    }

    .mask-footer .disable {
        cursor: not-allowed !important;
    }

    .mask-footer .disable:hover {
        color: white !important;
    }

    .mask-footer .btn-volume {
        height: 48px;
        width: 48px;
        line-height: 48px;
        padding: 12px;
        box-sizing: border-box;
        display: inline-block;
        vertical-align: bottom;
        cursor: pointer;
        transition: 0.6s;
    }

    .mask-footer .btn-volume:hover,
    .mask-footer .btn-volume-disable:hover {
        border-radius: 50%;
        background: #555555;
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
    }

    #videoBox >>> .vjs-big-play-button,
    #videoBox >>> .vjs-text-track-settings,
    #videoBox >>> .vjs-error-display,
    #videoBox >>> .vjs-loading-spinner,
    #videoBox >>> .vjs-control-bar {
        display: none !important;
    }

    #videoBox >>> .vjs-poster {
        z-index: 100;
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

    /*>>> .btn-full {*/
    /*    position: absolute !important;*/
    /*    right: 0;*/
    /*}*/

    >>> .video-fluid {
        width: 100% !important;
        height: 100% !important;
    }
</style>