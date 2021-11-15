const path = require('path')
const fs = require('fs')
const osHomedir = require('os-homedir');

export const Cache = {}

let cache = {
    liveTitle: [],
    liveArea: [],
    liveRoom: []
}

export function initCache() {

    const resource = path.join(osHomedir(), 'Documents', 'Bilive Manager')
    if (!fs.existsSync(resource))
        fs.mkdirSync(resource)

    const cacheJson = path.join(resource, 'cache.json')
    try {
        fs.accessSync(cacheJson, fs.constants.F_OK)
        cache = JSON.parse(fs.readFileSync(cacheJson).toString())
    } catch (e) {
        console.log(e)
        fs.writeFileSync(cacheJson, JSON.stringify(cache, null, 4))
    }

    Cache.get = (key) => {
        return cache[key]
    }

    Cache.set = (key, value) => {
        cache[key] = value
    }

    Cache.save = () => {
        fs.writeFileSync(cacheJson, JSON.stringify(cache, null, 4))
    }

}
