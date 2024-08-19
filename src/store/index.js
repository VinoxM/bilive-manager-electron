const files = require.context('.', false, /\.js$/)
const modules = {}
let state = {}
const {ipcRenderer} = require('electron')
// const remote = require('@electron/remote')
// const pid = remote.getCurrentWebContents().getOSProcessId()
// const url = remote.getCurrentWebContents().getURL()

const path = require('path')
const fs = require('fs')
const osHomedir = require('os-homedir');
const resource = path.join(osHomedir(), 'Documents', 'Bilive Manager')

if (!fs.existsSync(resource))
    fs.mkdirSync(resource)

files.keys().forEach(key => {
    if (key === './index.js') return
    modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default
    const k = key.replace(/(\.\/|\.js)/g, '')

    if (modules[k].persistence) {
        const json = path.join(resource, `${k}.json`)
        try {
            fs.accessSync(json, fs.constants.F_OK)
            modules[k].state = JSON.parse(fs.readFileSync(json).toString())
        } catch (e) {
            console.log(e)
            fs.writeFileSync(json, JSON.stringify(modules[k].state, null, 4))
        }

        modules[k].actions['persistence'] = function () {
            fs.writeFileSync(json, JSON.stringify(modules[k].state, null, 4))
        }
    }

    state[k] = modules[k].state
})

function getModulesDict() {
    const dict = {}
    Object.keys(modules).forEach(k => {
        dict[k] = modules[k].state
    })
    return dict
}

ipcRenderer.send('update-connections'/*, {pid, url}*/)

ipcRenderer.on('SyncStore', (_, dict) => {
    updateModulesDict(dict)
})

function updateModulesDict(dict) {
    Object.assign(state, dict)
    Object.keys(state).forEach(k=>{
        modules[k].state = state[k]
    })
}

function sendToSyncStore() {
    ipcRenderer.send('sync-store', {dict:getModulesDict()})
}

const dispatch = function (str, args) {
    const keys = String(str).split('.')
    const func = modules[keys[0]].actions[keys[1]]
    const state_ = modules[keys[0]].state
    return new Promise((resolve, reject)=>{
        try{
            func(state_, args)
            updateModulesDict(getModulesDict())
            sendToSyncStore()
        } catch (e) {
            reject(e)
        }
        resolve()
    })
}

sendToSyncStore()

export default {
    dispatch,
    state
}
