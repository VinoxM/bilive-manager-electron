import {app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, Notification, session} from 'electron'
import {main} from './main'
import {barrage} from './barrage'
import {answer} from './answer'
import {systemTray} from "./systemTray"
import {close} from "./close"
import {player} from "./player"
import url from 'url'
import cp from "child_process"

// let roomInfo
let connected = false
// let settingMain

const connections = {}
const urls = []

let focus = null

function initializeConnections() {
    const files = require.context('.', false, /\.js$/)
    files.keys().forEach(key => {
        if (key === './index.js' || key === './systemTray.js') return
        const k = key.replace(/(\.\/|\.js)/g, '')
        const module = files(key)[k]
        let url = module.url.replace(/\\/g, '/')
        urls.push({
            url: process.env.NODE_ENV === 'development' ? url : url.replace(/\/\//g, '///'),
            window: module.window
        })
    })

    ipcMain.on('update-connections', (e/*, {pid, url}*/) => {
        const pid = e.processId
        const url = e.sender.getURL()
        Object.keys(connections).forEach(k => {
            if (connections[k].url === url)
                delete connections[k]
        })
        const index = urls.findIndex(o => o.url === url)
        connections[pid] = {
            url,
            window: urls[index].window,
            pid: pid
        }
    })

    ipcMain.on('sync-store', (e, {dict}) => {
        const pid = e.processId
        const keys = Object.keys(connections).filter(k => {
            return parseInt(connections[k].pid) !== pid
        })
        keys.forEach(k => {
            connections[k].window.webContents.send('SyncStore', dict)
        })
    })
}

function updateShortcuts() {
    ipcMain.on('update-shortcut-sendMsg', (e, {old, new_}) => {
        if (old !== '无' && globalShortcut.isRegistered(old)) {
            globalShortcut.unregister(old)
        }
        if (new_ === '无') return
        globalShortcut.register(new_, () => {
            focus = BrowserWindow.getFocusedWindow()
            if (connected) {
                answer.window.show()
                answer.window.webContents.send('focusInput')
            }
        })
    })

    ipcMain.on('update-shortcut-clickThrough', (e, {old, new_}) => {
        if (old !== '无' && globalShortcut.isRegistered(old)) {
            globalShortcut.unregister(old)
        }
        if (new_ === '无') return
        globalShortcut.register(new_, () => {
            const flag = systemTray.menu.getMenuItemById('clickThrough').checked
            barrage.window.setIgnoreMouseEvents(!flag)
            systemTray.menu.getMenuItemById('clickThrough').checked = !flag
            barrage.window.webContents.send('toggleClickThrough', !flag)
        })
    })

    ipcMain.on('update-shortcut-onTop', (e, {old, new_}) => {
        if (old !== '无' && globalShortcut.isRegistered(old)) {
            globalShortcut.unregister(old)
        }
        if (new_ === '无') return
        globalShortcut.register(new_, () => {
            barrage.window.setAlwaysOnTop(!barrage.window.isAlwaysOnTop())
            barrage.window.webContents.send('updateOnTop', barrage.window.isAlwaysOnTop())
        })
    })

    ipcMain.on('update-shortcut-showBarrage', (e, {old, new_}) => {
        if (old !== '无' && globalShortcut.isRegistered(old)) {
            globalShortcut.unregister(old)
        }
        if (new_ === '无') return
        globalShortcut.register(new_, () => {
            if (barrage.window.isVisible()) {
                barrage.window.hide()
            } else barrage.window.show()
            systemTray.menu.getMenuItemById('barrage').checked = barrage.window.isVisible()
        })
    })
}

export function createWindows() {
    app.commandLine.appendSwitch('disable-web-security')
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['Referer'] = 'https://www.bilibili.com/'
        callback({cancel: false, requestHeaders: details.requestHeaders});
    })

    Menu.setApplicationMenu(null)
    main.createWindow()
    barrage.createWindow()
    answer.createWindow()
    systemTray.createTray(main, barrage)
    close.createWindow(main)
    player.createWindow()

    initializeConnections()

    updateShortcuts()

    ipcMain.on('click-through', () => {
        barrage.window.setIgnoreMouseEvents(true)
        systemTray.menu.getMenuItemById('clickThrough').checked = true
        barrage.window.webContents.send('toggleClickThrough', true)
    })

    ipcMain.on('click-through-off', () => {
        barrage.window.setIgnoreMouseEvents(false)
        systemTray.menu.getMenuItemById('clickThrough').checked = false
        barrage.window.webContents.send('toggleClickThrough', false)
    })

    ipcMain.on('save-user-info', (e, uInfo) => {
        systemTray.menu.getMenuItemById('live').enabled = uInfo.uid !== 0
    })

    ipcMain.on('toggle-live-status', (e, status) => {
        systemTray.menu.getMenuItemById('live').checked = status === 1
        systemTray.toggleLiveIcon(status)
        main.toggleLiveIcon(status)
    })

    ipcMain.on('toggle-barrage', () => {
        if (barrage.window.isVisible()) {
            barrage.window.hide()
        } else barrage.window.show()
        systemTray.menu.getMenuItemById('barrage').checked = barrage.window.isVisible()
    })

    ipcMain.on('barrage-close', () => {
        barrage.window.hide()
        systemTray.menu.getMenuItemById('barrage').checked = false
    })

    ipcMain.on('barrage-open', () => {
        barrage.window.show()
        systemTray.menu.getMenuItemById('barrage').checked = true
    })

    ipcMain.on('update-ws-connect', (e, flag) => {
        connected = flag
        systemTray.menu.getMenuItemById('connect').checked = flag
        if (!flag) {
            answer.window.webContents.send('wsClosed')
            player.window.webContents.send('wsClosed')
        }
    })

    ipcMain.on('update-live-status', (_, info) => {
        main.window.webContents.send('updateLiveStatus')
        if (!info.status) {
            player.window.webContents.send('liveEnd')
        }
        if (info.status && !barrage.window.isVisible()) {
            let notify = new Notification({
                title: `${info.uname}的直播开始了`,
                body: `[${info.areaName}] ${info.title}`,
                silent: false
            })
            notify.on('click', () => {
                barrage.window.show()
                notify.close()
            })
            notify.show()
            return
        }
        if (!info.status && !barrage.window.isVisible()) {
            let notify = new Notification({
                title: `${info.uname}的直播结束了`,
                body: `[${info.areaName}] ${info.title}`,
                silent: false
            })
            notify.show()
        }
    })

    ipcMain.on('toggle-on-top', () => {
        barrage.window.setAlwaysOnTop(!barrage.window.isAlwaysOnTop())
        barrage.window.webContents.send('updateOnTop', barrage.window.isAlwaysOnTop())
        systemTray.menu.getMenuItemById('onTop').checked = barrage.window.isAlwaysOnTop()
    })

    // ipcMain.on('save-room-info', (e, rInfo) => {
    //     roomInfo = rInfo
    //     answer.window.webContents.send('updateRoomInfo', rInfo)
    // })
    //
    // ipcMain.on('update-room-info', () => {
    //     answer.window.webContents.send('updateRoomInfo', roomInfo)
    // })

    ipcMain.on('add-barrage-log', (e, msg) => {
        barrage.window.webContents.send('addBarrageLog', msg)
    })

    ipcMain.on('add-barrage-err', (e, msg) => {
        barrage.window.webContents.send('addBarrageErr', msg)
    })

    // ipcMain.on('save-setting', (e, s) => {
    //     setting = s
    //     answer.window.webContents.send('updateSetting', setting)
    // })

    // ipcMain.on('update-setting', () => {
    //     answer.window.webContents.send('updateSetting', setting)
    // })

    // ipcMain.on('save-setting-main', (e, s) => {
    //     settingMain = s
    //     close.window.webContents.send('settingMainUpdate', settingMain)
    // })

    // ipcMain.on('update-setting-main', () => {
    //     close.window.webContents.send('settingMainUpdate', settingMain)
    // })

    ipcMain.on('connect-ws-self', () => {
        barrage.window.webContents.send('connectWsSelf')
    })

    ipcMain.on('disconnect-ws-self', () => {
        barrage.window.webContents.send('disconnectWsSelf')
    })

    ipcMain.on('open-pot-player', () => {
        dialog.showMessageBox(main.window,{
            type: 'info',
            title: '打开',
            message: '是否用PotPlayer打开?',
            buttons: ['确定', '取消'],
            cancelId: 2
        }).then(({response}) => {
            if (response === 0) {
                cp.exec('"C:\\Program Files\\DAUM\\PotPlayer\\PotPlayerMini64.exe" /clipboard')
            }
        })
    })

    ipcMain.on('open-by-player', (_, source) => {
        const res = url.parse(source, true)
        const type = res.pathname.split('.').pop()
        const sourceType = {'flv': 'flv', 'm3u8': 'hls'}
        player.window.show()
        player.window.webContents.send('playSource', {type: sourceType[type], source})
    })

    ipcMain.on('answer-close', () => {
        answer.window.hide()
        if (focus) {
            focus.focus()
        } else {
            main.window.blur()
            barrage.window.blur()
            player.window.blur()
        }
    })
}

export const windows = {
    main, barrage, answer, systemTray
}
