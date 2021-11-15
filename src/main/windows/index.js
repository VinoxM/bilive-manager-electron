import {globalShortcut, ipcMain, Menu} from 'electron'
import {main} from './main'
import {barrage} from './barrage'
import {answer} from './answer'
import {systemTray} from "./systemTray";

let userInfo
let roomInfo
let connected = false
let setting

export function createWindows() {
    Menu.setApplicationMenu(null)
    main.createWindow()
    barrage.createWindow()
    answer.createWindow()
    systemTray.createTray(main, barrage)

    globalShortcut.register('Alt+Shift+C', () => {
        if (connected && roomInfo['roomId'] !== 0) {
            answer.answerWindow.show()
            answer.answerWindow.webContents.send('focusInput')
        }
    })

    ipcMain.on('click-through', () => {
        barrage.barrageWindow.setIgnoreMouseEvents(true)
        systemTray.menu.getMenuItemById('clickThrough').checked = true
        barrage.barrageWindow.webContents.send('toggleClickThrough', true)
    })

    ipcMain.on('click-through-off', () => {
        barrage.barrageWindow.setIgnoreMouseEvents(false)
        systemTray.menu.getMenuItemById('clickThrough').checked = false
        barrage.barrageWindow.webContents.send('toggleClickThrough', false)
    })

    ipcMain.on('save-user-info', (e, uInfo) => {
        userInfo = uInfo
        systemTray.menu.getMenuItemById('live').enabled = userInfo.uid !== 0
        barrage.barrageWindow.webContents.send('updateUserInfo', userInfo)
    })

    ipcMain.on('update-user-info', () => {
        barrage.barrageWindow.webContents.send('updateUserInfo', userInfo)
    })

    ipcMain.on('toggle-live-status', (e, status) => {
        systemTray.menu.getMenuItemById('live').checked = status === 1
        systemTray.toggleLiveIcon(status)
        main.toggleLiveIcon(status)
    })

    ipcMain.on('toggle-barrage', () => {
        if (barrage.barrageWindow.isVisible()) {
            barrage.barrageWindow.hide()
        } else barrage.barrageWindow.show()
        systemTray.menu.getMenuItemById('barrage').checked = barrage.barrageWindow.isVisible()
    })

    ipcMain.on('barrage-close', () => {
        barrage.barrageWindow.hide()
        systemTray.menu.getMenuItemById('barrage').checked = false
    })

    ipcMain.on('update-ws-connect', (e, flag) => {
        connected = flag
        systemTray.menu.getMenuItemById('connect').checked = flag
        if (!flag) {
            answer.answerWindow.webContents.send('wsClosed')
        }
    })

    ipcMain.on('toggle-on-top', () => {
        barrage.barrageWindow.setAlwaysOnTop(!barrage.barrageWindow.isAlwaysOnTop())
        barrage.barrageWindow.webContents.send('updateOnTop', barrage.barrageWindow.isAlwaysOnTop())
        systemTray.menu.getMenuItemById('onTop').checked = barrage.barrageWindow.isAlwaysOnTop()
    })

    ipcMain.on('save-room-info', (e, rInfo) => {
        roomInfo = rInfo
        answer.answerWindow.webContents.send('updateRoomInfo', rInfo)
    })

    ipcMain.on('update-room-info', () => {
        answer.answerWindow.webContents.send('updateRoomInfo', roomInfo)
    })

    ipcMain.on('add-barrage-log', (e, msg) => {
        barrage.barrageWindow.webContents.send('addBarrageLog', msg)
    })

    ipcMain.on('add-barrage-err', (e, msg) => {
        barrage.barrageWindow.webContents.send('addBarrageErr', msg)
    })

    ipcMain.on('save-setting',(e, s)=>{
        setting = s
        answer.answerWindow.webContents.send('updateSetting', setting)
    })

    ipcMain.on('update-setting',()=>{
        answer.answerWindow.webContents.send('updateSetting', setting)
    })
}

export const windows = {
    main, barrage, answer, systemTray
}
