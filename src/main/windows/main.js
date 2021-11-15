import {app, BrowserWindow, ipcMain} from 'electron'
import path from "path";

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

const live = process.env.NODE_ENV !== 'development' ? path.join(__dirname, 'static', 'live.png') : path.join('static', 'live.png')
const liveOn = process.env.NODE_ENV !== 'development' ? path.join(__dirname, 'static', 'live-on.png') : path.join('static', 'live-on.png')

export const main = {
    mainWindow: null,
    toggleLiveIcon: (status) => {
        main.mainWindow.setIcon(status ? liveOn : live)
    },
    createWindow: () => {
        main.mainWindow = new BrowserWindow({
            useContentSize: true,
            width: 300,
            height: 400,
            webPreferences: {
                devTools: false//process.env.NODE_ENV === 'development'
            },
            resizable: false,
            frame: false,
            transparent: true,
            icon: live,
            maximizable: false
        })

        let mainWindow = main.mainWindow

        mainWindow.loadURL(winURL)

        mainWindow.on('closed', () => {
            mainWindow = null
            app.exit()
        })

        ipcMain.on('close-main', () => {
            mainWindow.close()
            app.exit()
        })

        ipcMain.on('min-main', (e, flag) => {
            if (flag)
                mainWindow.hide()
            else
                mainWindow.minimize()
        })

        // mainWindow.openDevTools({mode: 'undocked'});
    }
}
