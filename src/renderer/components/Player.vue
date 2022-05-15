<template>
    <div id="videoBox" v-loading="loading">
        <header-box :btn-min="true" title="Bili Player" v-show="!isFullscreen" @windowClose="playerClose"
                    @windowMin="playerMin"></header-box>
        <!--        <video id="videoPlayer" class="video-js"></video>-->
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
                loading: true
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
                    this.playerObj.src(null)
                    this.playerObj.dispose()
                    this.playerObj = null
                }
                let options = {
                    autoplay: true, // 设置自动播放
                    controls: true, // 显示播放的控件
                    controlBar: {
                        children: [
                            'playToggle', // 播放按钮
                            'currentTimeDisplay', // 当前已播放时间
                            'progressControl', // 播放进度条
                            'durationDisplay', // 总时间
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
                            src: this.videoSrc,
                            type: sourceType[this.sourceType] // 告诉videojs,这是一个hls流
                        }
                    ]
                };
                if (this.sourceType === 'flv') {
                    options.flvjs = {
                        mediaDataSource: {
                            isLive: true,
                            cors: true,
                            withCredentials: false
                        }
                    }
                }
                const elem = document.createElement('video')
                elem.setAttribute('id', 'videoPlayer')
                elem.setAttribute('class', 'video-js')
                elem.setAttribute('style','display:none')
                document.getElementById('videoBox').appendChild(elem)
                this.playerObj = Videojs("videoPlayer", options, () => {
                    this_.playerObj.on('loadedmetadata', () => {
                        this_.loading = false
                        document.getElementById('videoPlayer').setAttribute('style', 'display: block')
                        const width = this_.playerObj.videoWidth(), height = this_.playerObj.videoHeight()
                        this_.ipcRenderer.send('video-loaded', {width, height})
                    })
                    this_.playerObj.on('fullscreenchange', () => {
                        // this_.ipcRenderer.send('fullscreen-change', {
                        //     flag: this_.playerObj.isFullscreen(),
                        //     width: this_.playerObj.videoWidth(),
                        //     height: this_.playerObj.videoHeight()
                        // })
                        // console.log('fullscreenchange')
                        this_.ipcRenderer.send('fullscreen-change', this_.playerObj.isFullscreen())
                    })
                })
                const btn = this.playerObj.controlBar.addChild('button', {
                    clickHandler: function () {
                        this_.ipcRenderer.send('fullscreen-change', !this_.playerObj.isFullscreen())
                    }
                });
                btn.addClass('vjs-fullscreen-control');
                btn.addClass('vjs-control');
                btn.addClass('vjs-button');
                btn.addClass('btn-full');
                const btn1 = this.playerObj.controlBar.addChild('button', {
                    clickHandler: function () {
                        this_.initVideo()
                    }
                })
                btn1.addClass('vjs-icon-replay');
                btn1.addClass('vjs-control');
                btn1.addClass('vjs-button');
                btn1.addClass('btn-replay')

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

            // this.$nextTick(() => {
            //     this_.videoSrc = 'https://cn-hbcd-cu-02-08.bilivideo.com/live-bvc/937894/live_173515738_43574662/index.m3u8?expires=1652593711&len=0&oi=2346917254&pt=web&qn=10000&trid=1007254a4375b1664dfd93ac3220b1b6c9b9&sigparams=cdn,expires,len,oi,pt,qn,trid&cdn=cn-gotcha01&sign=443dee6d1d4224d2d9b64bfde122a7f5&sk=858875595012057d60ac9239c8a029d4&flvsk=28fa386efcf76f3b1161ace8c290a776&p2p_type=1&src=909441&sl=2&free_type=0&flowtype=1&machinezone=jd&pp=rtmp&sid=cn-hbcd-cu-02-08&chash=0&sche=ban&source=onetier&order=2&site=1a9ac0e103219a0a2816c56e5a7235b6'
            //     this_.sourceType = 'hls'
            //     this_.initVideo()
            // })
        }
    }
</script>

<style scoped>
    #videoBox{
        width: 100%;
        height: 100%;
    }

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
</style>