import {ipcMain, BrowserWindow, globalShortcut} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/close`
    : `file://${__dirname}/index.html#/close`

export const close = {
    url: winURL,
    window: null,
    createWindow: (main) => {
        close.window = new BrowserWindow({
            useContentSize: true,
            height: 135,
            width: 280,
            webPreferences: {
                devTools: false//process.env.NODE_ENV === 'development'
            },
            frame: false,
            resizable: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            maximizable: false,
            parent: main.mainWindow,
            modal: true
        })

        let closeWindow = close.window

        closeWindow.loadURL(winURL)

        closeWindow.on('closed', () => {
            close.window = null
        })

        closeWindow.hide()

        ipcMain.on('close-window-show', () => {
            closeWindow.show()
        })

        ipcMain.on('save-close-action', (e, args)=>{
            closeWindow.hide()
            main.window.webContents.send('saveCloseAction', args)
        })
    }
}
