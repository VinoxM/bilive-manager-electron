import Vue from 'vue'
import {preventForceRefreshAndTool} from './config'

import App from './App'

import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import {ipcRenderer} from "electron";
import api from "../api";
import {initUToken, uToken} from "../setting/token";
import {initCache, Cache} from "../setting/cache";
import {BSetting, initBSetting} from "../setting/barrage";
import {BiliSocket} from '../sokects/bilive'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.prototype.ipcRenderer = ipcRenderer
Vue.prototype.$ws = new BiliSocket()
Vue.prototype.$api = api
Vue.prototype.$token = uToken
Vue.prototype.$cache = Cache
Vue.prototype.$bSetting = BSetting

// 禁用快捷键
// preventForceRefreshAndTool()

initBSetting()
initCache()
initUToken()

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