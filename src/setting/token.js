const path = require('path')
const fs = require('fs')
const osHomedir = require('os-homedir');

export const uToken = {}

let token = {}

export function initUToken() {

    const resource = path.join(osHomedir(), 'Documents', 'Bilive Manager')
    if (!fs.existsSync(resource))
        fs.mkdirSync(resource)

    const uTokenJson = path.join(resource, 'token.json')
    try {
        fs.accessSync(uTokenJson, fs.constants.F_OK)
        token = JSON.parse(fs.readFileSync(uTokenJson).toString())
    } catch (e) {
        console.log(e)
        fs.writeFileSync(uTokenJson, JSON.stringify({}, null, 4))
    }

    uToken.get = (key) => {
        return token[key]
    }

    uToken.set = (key, value) => {
        token[key] = value
    }

    uToken.save = () => {
        fs.writeFileSync(uTokenJson, JSON.stringify(token, null, 4))
    }

}
