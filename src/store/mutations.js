import * as types from './mutation-types'
import {initTimes} from './index'
import Vue from 'vue'
// const initTimes = d3.range(27).map((d, i) => {
//     return 1990 + i + "";
// })

export default {
    /**
     * 初始化时获取数据
     * @param  {[type]} state [description]
     * @param  {[type]} data  [description]
     * @return {[type]}       [description]
     */
    [types.GET_ALL_DATA](state,data){
        state.graph = data[0];
        state.attr_data = data[1];
        state.node_to_index = data[2];
        state.mds = data[3];
    },

    /**
     * 修改特定用户的时间范围
     * @param  {[type]} state [description]
     * @param  {[type]} data  [description]
     * @return {[type]}       [description]
     */
    [types.CHANGE_LOCAL_T_ARRAY](state,data){
        state.local_t_array[data.name] = data.range;
    },

    /**
     * 增加用户
     * @param  {[type]} state  [description]
     * @param  {[type]} author [description]
     * @return {[type]}        [description]
     */
    [types.ADD_INDIVIDUAL](state,author){
        // console.log(state.selected);
        if(!(author in state.local_t_array)){
            state.selected.push(author);
            Vue.set(state.local_t_array,author,initTimes);
            state.hasInitial = true;
            console.log(state.selected);
        }else{
            alert(`User ${author} exist!`);
        }
    },
    /**
     * 删除用户
     * @param  {[type]} state  [description]
     * @param  {[type]} author [description]
     * @return {[type]}        [description]
     */
    [types.DELETE_INDIVIDUAL](state,author){
        var selected = state.selected,
            local_t_array = state.local_t_array;
        if(author in local_t_array){
            var index = selected.indexOf(author)
            selected.splice(index,1);
            delete local_t_array[author]
        }
    },

    /**
     * 为群体网络选择一个特定时刻
     * @param  {[type]} state [description]
     * @param  {[type]} data  [description]
     * @return {[type]}       [description]
     */
    [types.SELECT_YEAR](state,year){
        state.currentTime = year;
    }

}
