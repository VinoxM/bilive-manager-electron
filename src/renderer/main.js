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
import {MSetting, initMSetting} from "../setting/main";
import {BiliSocket} from '../sokects/bilive'

const version = 'v1.0.2'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false
Vue.use(ElementUI)
Vue.prototype.ipcRenderer = ipcRenderer
Vue.prototype.$ws = new BiliSocket()
Vue.prototype.$api = api
Vue.prototype.$token = uToken
Vue.prototype.$cache = Cache
Vue.prototype.$bSetting = BSetting
Vue.prototype.$mSetting = MSetting
Vue.prototype.$version = version

// 禁用快捷键
// preventForceRefreshAndTool()

initBSetting()
initCache()
initUToken()
initMSetting()

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