import {app, Tray, Menu} from 'electron'
import path from 'path'

const live = process.env.NODE_ENV !== 'development' ? path.join(__dirname, 'static', 'live.png') : path.join('static', 'live.png')
const liveOn = process.env.NODE_ENV !== 'development' ? path.join(__dirname, 'static', 'live-on.png') : path.join('static', 'live-on.png')

export const systemTray = {
    tray: null,
    menu: null,
    toggleLiveIcon: (status) => {
        systemTray.tray.setImage(status ? liveOn : live)
    },
    createTray: (main, barrage) => {
        systemTray.tray = new Tray(live)
        systemTray.menu = Menu.buildFromTemplate([
            {
                label: '主界面',
                type: 'normal',
                click: (e) => {
                    main.mainWindow.show()
                }
            },
            {
                id: 'live',
                label: '开播',
                type: 'checkbox',
                enabled: false,
                click: (e) => {
                    main.mainWindow.webContents.send('toggleLiveStatus')
                }
            },
            {type: 'separator'},
            {
                label: '弹幕机',
                type: 'checkbox',
                id: 'barrage',
                click: (e) => {
                    if (e.checked)
                        barrage.barrageWindow.show()
                    else
                        barrage.barrageWindow.hide()
                }
            },
            {
                label: '连接弹幕',
                type: 'checkbox',
                id: 'connect',
                click: (e) => {
                    if (!barrage.barrageWindow.isVisible())
                        barrage.barrageWindow.show()
                    barrage.barrageWindow.webContents.send('toggleWsConnect')
                }
            },
            {
                label: '弹幕置顶',
                type: 'checkbox',
                id: 'onTop',
                checked: true,
                click: (e) => {
                    barrage.barrageWindow.webContents.send('toggleBarrageOnTop')
                }
            },
            {
                label: '点击穿透',
                type: 'checkbox',
                id: 'clickThrough',
                click: (e) => {
                    barrage.barrageWindow.setIgnoreMouseEvents(e.checked)
                    barrage.barrageWindow.webContents.send('toggleClickThrough', e.checked)
                }
            },
            {type: 'separator'},
            {
                label: '最小化到托盘',
                type: 'checkbox',
                checked: true,
                click: (e) => {
                    main.mainWindow.webContents.send('toggleMinToTray', e.checked)
                }
            },
            {
                label: '退出',
                type: 'normal',
                click: () => {
                    app.exit()
                }
            }
        ])

        let tray = systemTray.tray
        let menu = systemTray.menu
        tray.setToolTip('Bilive-Manager')
        tray.setContextMenu(menu)
        tray.on('double-click', () => {
            if (main.mainWindow.isVisible()) {
                main.mainWindow.hide()
            } else
                main.mainWindow.show()
        })
    }
}
