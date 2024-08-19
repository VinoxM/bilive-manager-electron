import {app} from 'electron'
import {createWindows, windows} from "./windows";

const argv = process.argv

console.log(argv)

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

const gotTheLock = app.requestSingleInstanceLock()
app.disableHardwareAcceleration()
app.disableDomainBlockingFor3DAPIs()
app.setAppUserModelId('Bilive Manager')
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    createWindows()
})

if (!gotTheLock) {
    app.quit()
} else {
    app.on('ready', () => {
        createWindows()
    })

    app.on('second-instance', ()=>{
        const mainWindow = windows.main.window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            if (!mainWindow.isVisible()) mainWindow.show()
            mainWindow.focus()
        }
    })

}

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
