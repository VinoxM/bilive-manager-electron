import {ipcMain, BrowserWindow} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/login`
    : `file://${__dirname}/index.html#/login`

export const login = {
    url: winURL,
    window: null,
    createWindow: (main) => {
        login.window = new BrowserWindow({
            useContentSize: true,
            height: 356,
            width: 300,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                devTools: false//process.env.NODE_ENV === 'development'
            },
            frame: false,
            resizable: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            maximizable: false,
            parent: main.window,
            modal: true,
            transparent: true,
            show: false
        })

        let loginWindow = login.window

        loginWindow.loadURL(winURL, {userAgent: 'Chrome', httpReferrer: "https://www.bilibili.com/"})

        loginWindow.on('close', (e) => {
            e.preventDefault()
        })

        loginWindow.on('closed', () => {
            login.window = null
        })

        ipcMain.on('close-login-window', () => {
            loginWindow.hide()
        })
    }
}
