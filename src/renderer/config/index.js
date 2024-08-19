export function preventForceRefreshAndTool() {
    const env = process.env.NODE_ENV;
    console.log("process.env.NODE_ENV:", process.env.NODE_ENV);
    if (env === "development") {
        console.log("非产线环境，允许刷新和打开开发者工具");
    }

    window.addEventListener('keydown', (e) => {
        const {ctrlKey, code, shiftKey} = e;

        // ctrl + shift + i
        if (ctrlKey && shiftKey && code === 'KeyI') {
            console.log("globalShortcut：Ctrl + Shift + i 被阻止");
            e.preventDefault();
        }

        // ctrl +  r
        if (ctrlKey && code === 'KeyR') {
            console.log("globalShortcut：Ctrl + r 被阻止");
            e.preventDefault();
        }

        // f5
        if (code === 'F5') {
            console.log("globalShortcut：F5 被阻止");
            e.preventDefault();
        }

    }, true);
}