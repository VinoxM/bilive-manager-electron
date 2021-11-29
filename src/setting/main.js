const path = require('path')
const fs = require('fs')
const osHomedir = require('os-homedir');

export const MSetting = {}

let mSetting = {
}

export function initMSetting() {

    const resource = path.join(osHomedir(), 'Documents', 'Bilive Manager')
    if (!fs.existsSync(resource))
        fs.mkdirSync(resource)

    const mSettingJson = path.join(resource, 'mSetting.json')
    try {
        fs.accessSync(mSettingJson, fs.constants.F_OK)
        mSetting = JSON.parse(fs.readFileSync(mSettingJson).toString())
    } catch (e) {
        console.log(e)
        fs.writeFileSync(mSettingJson, JSON.stringify(mSetting, null, 4))
    }

    MSetting.get = (key) => {
        return mSetting[key]
    }

    MSetting.set = (key, value) => {
        mSetting[key] = value
    }

    MSetting.save = () => {
        fs.writeFileSync(mSettingJson, JSON.stringify(mSetting, null, 4))
    }

}