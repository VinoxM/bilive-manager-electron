const path = require('path')
const fs = require('fs')
const osHomedir = require('os-homedir');

export const BSetting = {}

let bSetting = {
}

export function initBSetting() {

    const resource = path.join(osHomedir(), 'Documents', 'Bilive Manager')
    if (!fs.existsSync(resource))
        fs.mkdirSync(resource)

    const bSettingJson = path.join(resource, 'bSetting.json')
    try {
        fs.accessSync(bSettingJson, fs.constants.F_OK)
        bSetting = JSON.parse(fs.readFileSync(bSettingJson).toString())
    } catch (e) {
        console.log(e)
        fs.writeFileSync(bSettingJson, JSON.stringify(bSetting, null, 4))
    }

    BSetting.get = (key) => {
        return bSetting[key]
    }

    BSetting.set = (key, value) => {
        bSetting[key] = value
    }

    BSetting.save = () => {
        fs.writeFileSync(bSettingJson, JSON.stringify(bSetting, null, 4))
    }

}
