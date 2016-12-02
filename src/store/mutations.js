import * as types from './mutation-types'
import {initTimes} from './index'
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
            state.local_t_array[author] = initTimes;
            state.hasInitial = true;
            console.log(state.selected);
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
    [types.CHANGE_TIME](state,data){
        state.currentTime = data;
    }

}
