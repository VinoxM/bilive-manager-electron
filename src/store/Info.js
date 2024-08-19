export default {
    state: {
        user: {

        },
        live: {

        },
        room: {

        }
    },
    actions: {
        updateInfoByKey(state, {key, data}) {
            state[key] = data
        }
    }
}