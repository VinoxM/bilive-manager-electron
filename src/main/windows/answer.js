import {ipcMain, BrowserWindow, globalShortcut} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/answer`
    : `file://${__dirname}/index.html#/answer`

export const answer = {
    url: winURL,
    window: null,
    createWindow: () => {
        answer.window = new BrowserWindow({
            useContentSize: true,
            height: 145,
            width: 280,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation:false,
                devTools: false//process.env.NODE_ENV === 'development'
            },
            frame: false,
            resizable: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            maximizable: false
        })

        let answerWindow = answer.window

        answerWindow.loadURL(winURL, {userAgent: 'Chrome',httpReferrer:"https://www.bilibili.com/"})

        answerWindow.on('close', (e) => {
            e.preventDefault()
            answerWindow.webContents.send('closeAnswer')
        })

        answerWindow.on('closed', () => {
            answer.window = null
        })

        answerWindow.hide()
    }
}
