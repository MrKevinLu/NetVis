import * as types from './mutation-types'

export default {
    [types.GET_ALL_DATA](state,data){
        state.nodes = [...data.nodes];
        state.links = [...data.links];
    },

    [types.DELETE_NODE](state){
        // console.log(22222);
    }

}
