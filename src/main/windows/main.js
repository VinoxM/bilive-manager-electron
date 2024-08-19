import {app, BrowserWindow, ipcMain, dialog, shell, Notification} from 'electron'
import path from "path";
import fs from 'fs'
import osHomedir from 'os-homedir'
import {barrage} from "./barrage";

const devFlag = process.env.NODE_ENV === 'development' || process.argv.indexOf('--open-dev-tools') > -1 || process.argv.indexOf('--open-main-dev-tools') > -1

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/`
    : `file://${__dirname}/index.html#/`

const live = process.env.NODE_ENV !== 'development' ? path.join(__dirname, 'static', 'live.png') : path.join('static', 'live.png')
const liveOn = process.env.NODE_ENV !== 'development' ? path.join(__dirname, 'static', 'live-on.png') : path.join('static', 'live-on.png')

let hideToTray = false

export const main = {
    url: winURL,
    window: null,
    downloadItem: {
        item: null,
        downloading: false
    },
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
                devTools: devFlag
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
            if (main.downloadItem.downloading) return
            dialog.showMessageBox({
                type: 'info',
                title: 'Bilive Manager 更新',
                message: '有新版本可供下载,是否更新?',
                buttons: ['下载', '取消'],
                cancelId: 2
            }).then(({response}) => {
                if (response === 0) {
                    if (!fs.existsSync(savePath))
                        fs.mkdirSync(savePath)
                    mainWindow.webContents.downloadURL(downloadUrl); // 触发 will-download 事件
                }
            })
        })

        ipcMain.on('cancel-download', (e)=>{
            if (null !== main.downloadItem.item) {
                dialog.showMessageBox({
                    type: 'warning',
                    title: 'Bilive Manager 更新',
                    message: '确认取消下载?',
                    buttons: ['确认', '取消'],
                    cancelId: 2
                }).then(({response}) => {
                    main.downloadItem.item.cancel()
                })
            }
        })

        mainWindow.webContents.session.on('will-download', (e, item) => {
            function delItem(file) {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file)
                }
            }
            const filePath = path.join(savePath, item.getFilename());
            delItem(filePath)
            let value = 0
            main.downloadItem.item = item
            item.setSavePath(filePath);
            //监听下载过程，计算并设置进度条进度
            item.on('updated', (evt, state) => {
                if ('progressing' === state) {
                    //此处  用接收到的字节数和总字节数求一个比例  就是进度百分比
                    const curSize = item.getReceivedBytes()
                    const totalSize = item.getTotalBytes()
                    if (curSize && totalSize) {
                        value = parseInt(100 * (item.getReceivedBytes() / item.getTotalBytes()))
                    }
                    // 把百分比发给渲染进程进行展示
                    console.log(value, curSize, totalSize)
                    mainWindow.webContents.send('updateProgressing', {value: value, curSize, totalSize});
                    // mac 程序坞、windows 任务栏显示进度
                    mainWindow.setProgressBar(value);
                }
            });
            //监听下载结束事件
            item.on('done', (e, state) => {
                //如果窗口还在的话，去掉进度条
                if (!mainWindow.isDestroyed()) {
                    mainWindow.setProgressBar(-1);
                }
                switch (state) {
                    // 下载成功后打开文件所在文件夹
                    case "completed":
                        mainWindow.webContents.send('downloadOver')
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Bilive Manager 更新',
                            message: '下载已完成,是否执行?',
                            buttons: ['执行', '取消'],
                            cancelId: 2
                        }).then(({response}) => {
                            if (response === 0) {
                                shell.openPath(filePath)
                            } else {
                                shell.showItemInFolder(filePath)
                            }
                        })
                        break
                    //下载被中断了
                    case "interrupted":
                        dialog.showErrorBox('下载失败', `文件 ${item.getFilename()} 因为某些原因被中断下载`);
                        mainWindow.webContents.send('downloadError')
                        // delItem(item.getSavePath())
                        break
                    case "cancelled":
                        mainWindow.webContents.send('downloadCancel')
                        // delItem(item.getSavePath())
                        break
                }
                main.downloadItem.item = null
                main.downloadItem.downloading = false
            });
        });

        ipcMain.on('no-more-updates', () => {
            new Notification({
                body: `已经是最新版本!`,
                silent: false,
                icon: live
            }).on('click', () => {
                barrage.window.show()
                this.close()
            }).show()
        })

        ipcMain.on('check-update-fail', (e, message) => {
            new Notification({
                body: `检查更新失败:${message},请切换更新源或稍后重试!`,
                silent: false,
                icon: live
            }).on('click', () => {
                barrage.window.show()
                this.close()
            }).show()
        })

        if (devFlag) mainWindow.openDevTools({mode: 'undocked'});
    }
}
