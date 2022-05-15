export default {
    state: {
        register: {
            uid: '',
            token: '',
            cookie: ''
        },
        setting: {
            dontAskMe: false,
            closeAction: "toClose",
            liveToConnect: true,
            liveToDisconnect: true,
            runForUpdate: true,
            updateSource: "gitee",
            sendMsgShortcut: [
                "",
                "",
                "",
                "无"
            ],
            clickThroughShortcut: [
                "",
                "",
                "",
                "无"
            ]
        }
    },
    actions: {
        updateRegister(state, data){
            state.register = data
        },
        updateSetting(state, data) {
            state.setting = data
        }
    },
    persistence: true
}