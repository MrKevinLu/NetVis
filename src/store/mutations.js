import * as types from './mutation-types'

export default {
    [types.GET_ALL_DATA](state,data){
        state.graph = data[0];
        state.attr_data = data[1];
    },

    [types.CHANGE_LOCAL_T_ARRAY](state,data){
        state.local_t_array = data;
    },

    [types.CHANGE_TIME](state,data){
        state.currentTime = data;
    }

}
