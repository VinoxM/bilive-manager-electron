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
        width: 28px;
        height: 28px;
        line-height: 28px;
        font-size: 16px;
        text-align: center;
        cursor: pointer;
        -webkit-app-region: no-drag;
        vertical-align: bottom;
        user-select: none;
        -webkit-user-select: none;
        border-radius: 50%;
    }

    .header-btn .btn-small {
        transform: rotate(-45deg);
        font-size: 12px;
    }

    .header-btn .btn-min:hover, 
    .header-btn .btn-small:hover{
        background-color: #ffffff;
    }

    .header-btn .btn-close:hover {
        background-color: red;
        color: white;
    }
</style>