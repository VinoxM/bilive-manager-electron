const barrage = require('./barrage')
const querystring = require('querystring')
const url_ = require('url')

export default {
    barrage,
    urlToString: function (url) {
        const str = new URL(url)
        const obj = {}
        for (let key of str.searchParams.keys()) {
            obj[key] = str.searchParams.get(key)
        }
        return obj
    },
    urlToCookie: function (url) {
        const str = new URL(url)
        const arr = []
        const obj = {}
        for (let key of str.searchParams.keys()) {
            obj[key] = str.searchParams.get(key)
            arr.push(`${key}=${str.searchParams.get(key)};`)
        }
        return {
            cookie: arr.join(' '),
            data: obj
        }
    }
}