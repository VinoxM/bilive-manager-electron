<template>
    <div id="app">
        <router-view></router-view>
    </div>
</template>

<script>
    export default {
        name: 'bilive-barrage'
    }
</script>

<style>

    html, body {
        height: 100%;
    }

    #app {
        height: 100%;
        border-radius: 8px;
        overflow: hidden;
        /*background: white;*/
    }

    body {
        padding: 0;
        margin: 0;
        font-family: 'Microsoft YaHei', serif;
        font-size: 14px;
    }

    ::-webkit-scrollbar {
        width: 8px;
        height: 12px;
        background-color: #F5F5F5;
    }

    ::-webkit-scrollbar-track {
        background-color: #F5F5F5;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #999;
    }

    ::-webkit-scrollbar-thumb:hover {
        background-color: #777;
    }

    ::-webkit-scrollbar-thumb:active {
        background-color: #555;
    }

</style>
