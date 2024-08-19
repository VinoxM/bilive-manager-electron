import {BrowserWindow, ipcMain, screen} from 'electron'

const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080/#/player`
    : `file://${__dirname}/index.html#/player`

const devFlag = process.env.NODE_ENV === 'development' || process.argv.indexOf('--open-dev-tools') > -1 || process.argv.indexOf('--open-player-dev-tools') > -1

const videoSize = {
    width: 1280, height: 720
}

let isSmall = false

let lastSmallWidth = 640

const lastSmallPos = {x: 0, y: 0}

const movePos = {x: 0, y: 0}

export const player = {
    url: winURL,
    window: null,
    createWindow: () => {
        player.window = new BrowserWindow({
            useContentSize: true,
            width: 1280,
            height: 720,
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true,
                contextIsolation: false,
                // devTools: false
                devTools: devFlag
            },
            resizable: false,
            frame: false,
            transparent: false,
            alwaysOnTop: false,
            skipTaskbar: false,
            maximizable: true,
            // fullscreenable: true,
            show: false
        })

        let playerWindow = player.window

        playerWindow.loadURL(winURL, {userAgent: 'Chrome', httpReferrer: "https://www.bilibili.com/"})

        playerWindow.on('close', (e) => {
            e.preventDefault()
            playerWindow.webContents.send('closePlayer')
        })

        playerWindow.on('closed', () => {
            player.window = null
        })

        playerWindow.on('will-resize', (oldVal, {x, y, width, height}) => {
            if (isSmall) {
                oldVal.preventDefault()
                const b = videoSize.height / videoSize.width
                const windowSize = oldVal.sender.getSize()
                const size = {
                    width: windowSize[0],
                    height: windowSize[1]
                }
                const resize = {width: 0, height: 0}
                if (width === size.width) {
                    resize.height = height
                    resize.width = Math.floor(height / b)
                } else /*if (lastSize.height === size.height)*/ {
                    resize.width = width
                    resize.height = Math.floor(width * b)
                }
                playerWindow.setSize(resize.width, resize.height)
                const windowPos = oldVal.sender.getPosition()
                const pos = {x: windowPos[0], y: windowPos[1]}
                if (pos.x === x) {
                    playerWindow.setPosition(x, pos.y === y ? y : pos.y + size.height - resize.height)
                } else if (pos.y === y) {
                    playerWindow.setPosition(pos.x === x ? x : pos.x + size.width - resize.width, y)
                } else {
                    playerWindow.setPosition(pos.x + size.width - resize.width, pos.y + size.height - resize.height)
                }
                playerWindow.webContents.send('resize', resize)
            }
        })

        if (devFlag) playerWindow.openDevTools({mode: 'undocked'});

        ipcMain.on('player-close', () => {
            playerWindow.hide()
        })

        ipcMain.on('player-min', () => {
            playerWindow.minimize()
        })

        ipcMain.on('video-loaded', (_, {width, height, isFullscreen, isClosed}) => {
            videoSize.height = height
            videoSize.width = width
            if (!isSmall) {
                const screenSize = screen.getPrimaryDisplay().size
                playerWindow.setResizable(true)
                playerWindow.setMaximumSize(screenSize.width, screenSize.height)
                playerWindow.setSize(width, height + 30)
                playerWindow.setFullScreen(!isClosed && isFullscreen)
                playerWindow.setResizable(false)
                playerWindow.center()
            }
        })


        ipcMain.on('fullscreen-change', (_, flag) => {
            playerWindow.setResizable(true)
            playerWindow.setFullScreen(flag)
            playerWindow.setResizable(false)
        })

        ipcMain.on('player-small', () => {
            const screenSize = screen.getPrimaryDisplay().size
            playerWindow.setAlwaysOnTop(true)
            playerWindow.setResizable(true)
            const maxWidth = screenSize.width/2, minWidth = 510, width = lastSmallWidth
            const b = videoSize.height / videoSize.width
            const resize = {width: width, height: Math.floor(width * b)}
            playerWindow.setSize(width, resize.height)
            playerWindow.setMaximumSize(maxWidth, Math.floor(maxWidth * b))
            playerWindow.setMinimumSize(minWidth, Math.floor(minWidth * b))
            const space = {width: 15, height: 50}
            if (lastSmallPos.x === 0 && lastSmallPos.y === 0) {
                lastSmallPos.x = screenSize.width - resize.width - space.width
                lastSmallPos.y = screenSize.height - resize.height - space.height
            }
            playerWindow.setPosition(lastSmallPos.x, lastSmallPos.y)
            isSmall = true
            playerWindow.webContents.send('changeSmallWindowOnTop', true)
        })

        ipcMain.on('player-large', () => {
            lastSmallPos.x = playerWindow.getPosition()[0]
            lastSmallPos.y = playerWindow.getPosition()[1]
            lastSmallWidth = playerWindow.getSize()[0]
            const screenSize = screen.getPrimaryDisplay().size
            playerWindow.setResizable(true)
            playerWindow.setAlwaysOnTop(false)
            playerWindow.setMaximumSize(screenSize.width, screenSize.height)
            playerWindow.setSize(videoSize.width, videoSize.height + 30)
            playerWindow.setResizable(false)
            playerWindow.center()
            isSmall = false
        })

        ipcMain.on('move-small-window', (e, pos) => {
            playerWindow.setPosition(pos[0], pos[1])
        })

        ipcMain.on('small-window-on-top', () => {
            const isOnTop = !playerWindow.isAlwaysOnTop()
            playerWindow.setAlwaysOnTop(isOnTop)
            playerWindow.webContents.send('changeSmallWindowOnTop', isOnTop)
        })
    }
}
