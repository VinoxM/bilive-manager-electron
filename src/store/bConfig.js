export default {
    state: {
        setting: {
            clientHeight: 800,
            clientWidth: 400,
            posX: 2153,
            posY: 185,
            medalVisible: false,
            effectFlag: true,
            joinShow: true,
            bColor: "rgba(0, 0, 0, 0.4)",
            uNameColor: "#a6c0e8",
            bMessageColor: "#ffffff",
            giftColor: "#a6c0e8"
        }
    },
    actions: {
        updateSetting(state, data){
            state.setting = data
        }
    },
    persistence: true
}