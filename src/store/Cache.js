export default {
    state: {
        liveTitle: [],
        liveArea: [],
        liveRoom: []
    },
    actions: {
        updateCache(state, {type, data}) {
            state[type] = data
        }
    },
    persistence: true
}