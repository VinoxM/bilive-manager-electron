import Vue from 'vue'
import {preventForceRefreshAndTool} from './config'

import App from './App'

import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import {ipcRenderer} from "electron";
import api from "../api";
import {BiliSocket} from '../sokects/bilive'
import store from '../store'
import plugins from '../func'

const version = 'v1.0.8'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.prototype.ipcRenderer = ipcRenderer
Vue.prototype.$ws = new BiliSocket()
Vue.prototype.$api = api
Vue.prototype.$version = version
Vue.prototype.$store = store
Vue.prototype.$plugins = plugins

// 禁用快捷键
// preventForceRefreshAndTool()


import "video.js/dist/video-js.css"; // 引入video.js的css
import hls from "videojs-contrib-hls"; // 播放hls流需要的插件

Vue.use(hls)

// 组件注册
import Header from "./components/tools/Header";
Vue.component('header-box', Header)

import HeaderLog from "./components/tools/HeaderLog";
Vue.component('header-log', HeaderLog)

/* eslint-disable no-new */
new Vue({
    components: {App},
    router,
    template: '<App/>'
}).$mount('#app')