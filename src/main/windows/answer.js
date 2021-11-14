import {ipcMain, BrowserWindow, globalShortcut} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080#/answer`
    : `file://${__dirname}/index.html#/answer`

export const answer = {
    answerWindow: null,
    createWindow: () => {
        answer.answerWindow = new BrowserWindow({
            useContentSize: true,
            height: 145,
            width: 280,
            webPreferences: {
                devTools: false//process.env.NODE_ENV === 'development'
            },
            frame: false,
            resizable: false,
            alwaysOnTop: true,
            skipTaskbar: true
        })

        let answerWindow = answer.answerWindow

        answerWindow.loadURL(winURL)

        answerWindow.on('closed', () => {
            answerWindow = null
        })

        answerWindow.hide()

        ipcMain.on('answer-close', () => {
            answerWindow.hide()
        })
    }
}
