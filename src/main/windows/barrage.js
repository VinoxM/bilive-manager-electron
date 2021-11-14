import {app, BrowserWindow, ipcMain} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080#/barrage`
    : `file://${__dirname}/index.html#/barrage`

export const barrage = {
    barrageWindow: null,
    createWindow: () => {
        barrage.barrageWindow = new BrowserWindow({
            useContentSize: true,
            width: 400,
            maxWidth: 450,
            minWidth: 400,
            height: 800,
            maxHeight: 800,
            minHeight: 700,
            webPreferences: {
                devTools: false//process.env.NODE_ENV === 'development'
            },
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true
        })

        let barrageWindow = barrage.barrageWindow

        barrageWindow.loadURL(winURL)

        barrageWindow.on('closed', () => {
            barrageWindow = null
        })

        barrageWindow.hide()

        barrageWindow.on('resize', () => {
            const size = barrageWindow.getSize()
            barrageWindow.webContents.send('resize', {height: size[1], width: size[0]})
        })

        ipcMain.on('get-size', () => {
            const size = barrageWindow.getSize()
            barrageWindow.webContents.send('resize', {height: size[1], width: size[0]})
        })
    }
}
