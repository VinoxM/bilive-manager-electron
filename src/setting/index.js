const path = require('path')
const fs = require('fs')

export const Setting = {}

let setting = {}

export function initSetting() {

    const resource = path.join('resources')
    if (!fs.existsSync(resource))
        fs.mkdirSync(resource)

    const settingJson = path.join(resource, 'setting.json')
    try {
        fs.accessSync(settingJson, fs.constants.F_OK)
        setting = JSON.parse(fs.readFileSync(settingJson).toString())
    } catch (e) {
        console.log(e)
        fs.writeFileSync(settingJson, JSON.stringify({}, null, 4))
    }

    Setting.get = (key) => {
        return setting[key]
    }

    Setting.set = (key, value) => {
        setting[key] = value
    }

    Setting.save = () => {
        fs.writeFileSync(settingJson, JSON.stringify(setting, null, 4))
    }

}
