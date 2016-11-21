import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as types from './mutation-types'
import mutations from './mutations'


// var data = fs.readFileSync('../../data/graph.json');

const state = {
    nodes:[],
    links:[],
    flag:false
}





Vue.use(Vuex);

export default new Vuex.Store({
    state,
    mutations,
    actions
})
