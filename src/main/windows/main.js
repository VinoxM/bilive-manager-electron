import {app, BrowserWindow, ipcMain, dialog, shell} from 'electron'
import path from "path";

const fs = require('fs');
const osHomedir = require('os-homedir');

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
                devTools: process.env.NODE_ENV === 'development'
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
            main.mainWindow = null
            app.exit()
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
                title: 'Bilive Manager 更新',
                message: '有新版本可供下载,是否更新?',
                buttons: ['下载', '取消'],
                cancelId: 2
            }, (index) => {
                if (index === 0) {
                    if (!fs.existsSync(savePath))
                        fs.mkdirSync(savePath)
                    mainWindow.webContents.downloadURL(downloadUrl); // 触发 will-download 事件
                }
            })
        })

        mainWindow.webContents.session.on('will-download', (e, item) => {
            const filePath = path.join(savePath, item.getFilename());
            let value = 0
            item.setSavePath(filePath); // 'C:\Users\kim\Downloads\第12次.zip'
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
                //下载被取消或中断了
                if (state === 'interrupted') {
                    dialog.showErrorBox('下载失败', `文件 ${item.getFilename()} 因为某些原因被中断下载`);
                    mainWindow.webContents.send('downloadError')
                }
                // 下载成功后打开文件所在文件夹
                if (state === 'completed') {
                    mainWindow.webContents.send('downloadOver')
                    dialog.showMessageBox({
                        type: 'info',
                        title: 'Bilive Manager 更新',
                        message: '下载已完成,是否执行?',
                        buttons: ['执行', '取消'],
                        cancelId: 2
                    }, (index) => {
                        if (index === 0) {
                            shell.openItem(filePath)
                        } else {
                            shell.showItemInFolder(filePath)
                        }
                    })
                }
            });
        });

        ipcMain.on('no-more-updates', () => {
            dialog.showMessageBox({
                type: 'info',
                title: 'Bilive Manager 更新',
                message: '已经是最新版本!',
                buttons: ['确定'],
                cancelId: 2
            }, () => {
            })
        })

        ipcMain.on('check-update-fail', (e, message) => {
            dialog.showMessageBox({
                type: 'error',
                title: 'Bilive Manager 更新',
                message: `检查更新失败,请切换更新源或稍后重试!\n${message}`,
                buttons: ['确定'],
                cancelId: 2
            }, () => {
            })
        })

        mainWindow.openDevTools({mode: 'undocked'});
    }
}
