import {ipcMain, BrowserWindow, globalShortcut} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080#/close`
    : `file://${__dirname}/index.html#/close`

export const close = {
    closeWindow: null,
    createWindow: (main) => {
        close.closeWindow = new BrowserWindow({
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

        let closeWindow = close.closeWindow

        closeWindow.loadURL(winURL)

        closeWindow.on('closed', () => {
            close.closeWindow = null
        })

        closeWindow.hide()

        ipcMain.on('close-window-show', () => {
            closeWindow.show()
        })

        ipcMain.on('save-close-action', (e, args)=>{
            closeWindow.hide()
            main.mainWindow.webContents.send('saveCloseAction', args)
        })
    }
}
