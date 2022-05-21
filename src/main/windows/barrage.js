import {app, BrowserWindow, ipcMain, Menu} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/barrage`
    : `file://${__dirname}/index.html#/barrage`

const devFlag = process.argv.indexOf('--open-dev-tools') > -1 || process.argv.indexOf('--open-barrage-dev-tools') > -1

export const barrage = {
    url: winURL,
    window: null,
    createWindow: () => {
        barrage.window = new BrowserWindow({
            useContentSize: true,
            width: 400,
            maxWidth: 450,
            minWidth: 360,
            height: 828,
            maxHeight: 828,
            minHeight: 500,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                // devTools: false
                devTools: process.env.NODE_ENV === 'development' || devFlag
            },
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            maximizable: false
        })

        let barrageWindow = barrage.window

        barrageWindow.loadURL(winURL, {userAgent: 'Chrome', httpReferrer: "https://www.bilibili.com/"})

        barrageWindow.on('closed', () => {
            barrage.window = null
        })

        barrageWindow.hide()

        barrageWindow.on('resize', () => {
            const size = barrageWindow.getSize()
            barrageWindow.webContents.send('resize', {height: size[1], width: size[0]})
        })

        barrageWindow.on('move', () => {
            const pos = barrageWindow.getPosition()
            barrageWindow.webContents.send('move', {x: pos[0], y: pos[1]})
        })

        ipcMain.on('get-size', () => {
            const size = barrageWindow.getSize()
            barrageWindow.webContents.send('resize', {height: size[1], width: size[0]})
        })

        ipcMain.on('get-pos', () => {
            const pos = barrageWindow.getPosition()
            barrageWindow.webContents.send('move', {x: pos[0], y: pos[1]})
        })

        ipcMain.on('update-size', (e, size) => {
            barrageWindow.setSize(size[0], size[1])
        })

        ipcMain.on('update-pos', (e, pos) => {
            barrageWindow.setPosition(pos[0], pos[1])
        })

        ipcMain.on('show-barrage-menu', (e, {ops, x, y}) => {
            ops.forEach(obj => {
                obj.submenu = obj.submenu.map(o => {
                    return {
                        label: o.label,
                        i: o.index,
                        click: function () {
                            barrageWindow.webContents.send('barrage-menu-clicked', o)
                        }
                    }
                })
            })

            Menu.buildFromTemplate(ops).popup({
                window: barrageWindow,
                x, y
            })
        })

        barrageWindow.openDevTools({mode: 'undocked'});
    }
}

