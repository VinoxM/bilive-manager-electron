import {app, BrowserWindow, ipcMain, dialog, shell, Notification} from 'electron'
import path from "path";
import fs from 'fs'
import osHomedir from 'os-homedir'
import {barrage} from "./barrage";

const devFlag = process.argv.indexOf('--open-dev-tools') > -1 || process.argv.indexOf('--open-main-dev-tools') > -1

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/`
    : `file://${__dirname}/index.html#/`

const live = process.env.NODE_ENV !== 'development' ? path.join(__dirname, 'static', 'live.png') : path.join('static', 'live.png')
const liveOn = process.env.NODE_ENV !== 'development' ? path.join(__dirname, 'static', 'live-on.png') : path.join('static', 'live-on.png')

let hideToTray = false

export const main = {
    url: winURL,
    window: null,
    toggleLiveIcon: (status) => {
        main.window.setIcon(status ? liveOn : live)
    },
    createWindow: () => {
        main.window = new BrowserWindow({
            useContentSize: true,
            width: 300,
            height: 400,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                // devTools: false,
                devTools: process.env.NODE_ENV === 'development' || devFlag
            },
            resizable: false,
            frame: false,
            transparent: true,
            icon: live,
            maximizable: false
        })

        let mainWindow = main.window

        mainWindow.loadURL(winURL, {userAgent: 'Chrome', httpReferrer: "https://www.bilibili.com/"})

        mainWindow.on('close', (e) => {
            if (hideToTray) {
                e.preventDefault()
                mainWindow.hide()
            }
        })

        mainWindow.on('closed', () => {
            main.window = null
            app.exit()
        })

        ipcMain.on('update-hide-to-tray', (_, flag) => {
            hideToTray = flag
        })

        ipcMain.on('close-main', (e, flag) => {
            if (flag)
                mainWindow.hide()
            else {
                mainWindow.close()
                app.exit()
            }
        })

        ipcMain.on('min-main', (e) => {
            mainWindow.minimize()
        })

        const savePath = path.join(osHomedir(), 'Documents', 'Bilive Manager', 'update')

        ipcMain.on('download', (e, downloadUrl) => {
            dialog.showMessageBox({
                type: 'info',
                title: 'Bilive Manager ??????',
                message: '????????????????????????,?????????????',
                buttons: ['??????', '??????'],
                cancelId: 2
            }).then(({response}) => {
                if (response === 0) {
                    if (!fs.existsSync(savePath))
                        fs.mkdirSync(savePath)
                    mainWindow.webContents.downloadURL(downloadUrl); // ?????? will-download ??????
                }
            })
        })

        mainWindow.webContents.session.on('will-download', (e, item) => {
            const filePath = path.join(savePath, item.getFilename());
            let value = 0
            item.setSavePath(filePath); // 'C:\Users\kim\Downloads\???12???.zip'
            //???????????????????????????????????????????????????
            item.on('updated', (evt, state) => {
                if ('progressing' === state) {
                    //??????  ??????????????????????????????????????????????????????  ?????????????????????
                    const curSize = item.getReceivedBytes()
                    const totalSize = item.getTotalBytes()
                    if (curSize && totalSize) {
                        value = parseInt(100 * (item.getReceivedBytes() / item.getTotalBytes()))
                    }
                    // ??????????????????????????????????????????
                    console.log(value, curSize, totalSize)
                    mainWindow.webContents.send('updateProgressing', {value: value, curSize, totalSize});
                    // mac ????????????windows ?????????????????????
                    mainWindow.setProgressBar(value);
                }
            });
            //????????????????????????
            item.on('done', (e, state) => {
                //??????????????????????????????????????????
                if (!mainWindow.isDestroyed()) {
                    mainWindow.setProgressBar(-1);
                }
                //???????????????????????????
                if (state === 'interrupted') {
                    dialog.showErrorBox('????????????', `?????? ${item.getFilename()} ?????????????????????????????????`);
                    mainWindow.webContents.send('downloadError')
                }
                // ??????????????????????????????????????????
                if (state === 'completed') {
                    mainWindow.webContents.send('downloadOver')
                    dialog.showMessageBox({
                        type: 'info',
                        title: 'Bilive Manager ??????',
                        message: '???????????????,?????????????',
                        buttons: ['??????', '??????'],
                        cancelId: 2
                    }).then(({response}) => {
                        if (response === 0) {
                            shell.openItem(filePath)
                        } else {
                            shell.showItemInFolder(filePath)
                        }
                    })
                }
            });
        });

        ipcMain.on('no-more-updates', () => {
            new Notification({
                body: `?????????????????????!`,
                silent: false,
                icon: live
            }).on('click', () => {
                barrage.window.show()
                this.close()
            }).show()
        })

        ipcMain.on('check-update-fail', (e, message) => {
            new Notification({
                body: `??????????????????:${message},?????????????????????????????????!`,
                silent: false,
                icon: live
            }).on('click', () => {
                barrage.window.show()
                this.close()
            }).show()
        })

        mainWindow.openDevTools({mode: 'undocked'});
    }
}
