import Vue from 'vue'
import App from './src/App.vue'
import store from './src/store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import './src/css/global.less'
import { getAllData } from './src/store/actions'
import * as types from './src/store/mutation-types'
// var startTime = new Date();
Vue.use(ElementUI)

new Vue({
    el:"#app",
    store,
    render: h=>h(App)
})

store.dispatch("getAllData");

// getAllData(store)
