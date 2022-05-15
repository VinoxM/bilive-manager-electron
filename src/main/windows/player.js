import {BrowserWindow, ipcMain} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/player`
    : `file://${__dirname}/index.html#/player`

const devFlag = process.argv.indexOf('--open-dev-tools') > -1 || process.argv.indexOf('--open-player-dev-tools') > -1

export const player = {
    url: winURL,
    window: null,
    createWindow: () => {
        player.window = new BrowserWindow({
            useContentSize: true,
            width: 1280,
            height: 720,
            webPreferences: {
                // devTools: true
                devTools: process.env.NODE_ENV === 'development' || devFlag
            },
            resizable: false,
            frame: false,
            transparent: false,
            alwaysOnTop: false,
            skipTaskbar: false,
            maximizable: true,
            fullscreenable: true
        })

        let playerWindow = player.window

        playerWindow.loadURL(winURL)

        playerWindow.on('closed', () => {
            player.window = null
        })

        playerWindow.hide()

        playerWindow.openDevTools({mode: 'undocked'});

        ipcMain.on('player-close', () => {
            playerWindow.hide()
        })

        ipcMain.on('player-min', () => {
            playerWindow.minimize()
        })

        ipcMain.on('video-loaded', (_, {width, height}) => {
            playerWindow.setSize(width, height + 30)
        })

        ipcMain.on('fullscreen-change', (_, flag) => {
            playerWindow.setResizable(true)
            playerWindow.setFullScreen(flag)
            playerWindow.setResizable(false)
        })
    }
}

