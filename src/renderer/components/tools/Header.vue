<template>
    <div class="header-box">
        <img v-show="!!icon" class="header-icon" :src="src">
        <slot name="title">
            <span class="header-title" v-if="align === 'left'"
                  :style="{paddingLeft: !icon?'5px':'30px'}">{{title}}</span>
            <span class="header-title-center" v-else>{{title}}</span>
        </slot>
        <div class="header-btn">
            <span class="btn-min" @click="$emit('windowMin')" v-if="btnMin">-</span>
            <span class="btn-small" @click="$emit('windowSmall')" v-if="btnSmall">↓</span>
            <span class="btn-close" @click="$emit('windowClose')" v-if="btnClose">×</span>
        </div>
    </div>
</template>

<script>
    export default {
        name: "Header",
        props: {
            btnMin: {
                type: Boolean,
                default: true
            },
            btnClose: {
                type: Boolean,
                default: true
            },
            btnSmall: {
                type: Boolean,
                default: false
            },
            title: '',
            icon: '',
            align: {
                type: String,
                default: 'center'
            }
        },
        computed: {
            src() {
                return this.icon ? this.icon : false
            }
        }
    }
</script>

<style scoped>
    .header-box {
        height: 30px;
        width: 100%;
        -webkit-app-region: drag;
        position: relative;
        box-sizing: border-box;
        background: rgba(255, 111, 160, 0.60);
        box-shadow: 0 2px 2px 0 #afafaf;
        z-index: 100;
        /*border-radius: 8px 8px 0 0;*/
    }

    .header-icon {
        width: 20px;
        height: 20px;
        display: inline-block;
        position: absolute;
        left: 5px;
        top: 4px;
        vertical-align: middle;
    }

    .header-title {
        font-family: 'Microsoft YaHei', sans-serif;
        font-size: 16px;
        line-height: 30px;
        display: inline-block;
    }

    .header-title-center {
        font-family: 'Microsoft YaHei', sans-serif;
        font-size: 16px;
        line-height: 30px;
        width: 100%;
        display: inline-block;
        text-align: center;
    }

    .header-btn {
        position: absolute;
        height: 30px;
        right: 1px;
        top: 0;
        -webkit-app-region: no-drag;
        box-sizing: border-box;
        padding: 1px 0;
    }

    .header-btn span {
        display: inline-block;
        width: 26px;
        height: 26px;
        line-height: 26px;
        font-size: 16px;
        text-align: center;
        cursor: pointer;
        -webkit-app-region: no-drag;
        vertical-align: bottom;
        user-select: none;
        -webkit-user-select: none;
        transition: 0.4s;
        margin: 2px;
    }

    .header-btn .btn-small {
        border-radius: 50%;
        font-size: 12px;
    }

    .header-btn .btn-min:hover{
        border-radius: 50%;
        background-color: rgb(214,214,214);
        box-shadow: -1px -1px 2px 0 rgba(214,214,214,0.35), inset -1px -1px 2px 1px rgba(255,255, 255, 0.2), inset 2px 2px 3px 1px rgba(0, 0, 0, 0.3);
    }

    .header-btn .btn-small:hover{
        transform: rotate(-45deg);
        border-radius: 50%;
        background-color: rgb(214,214,214);
        box-shadow: 0px 0 2px 0 rgba(214,214,214,0.35), inset 0px -1px 2px 1px rgba(255,255, 255, 0.2), inset 0px 2px 3px 1px rgba(0, 0, 0, 0.3);
    }

    .header-btn .btn-close:hover {
        border-radius: 50%;
        color: white;
        background-color: rgb(255,0,0);
        box-shadow: -1px -1px 2px 0 rgba(255,0,0,0.35), inset -1px -1px 2px 1px rgba(255,255, 255, 0.2), inset 2px 2px 3px 1px rgba(0, 0, 0, 0.3);
    }
</style>