import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as types from './mutation-types'
import mutations from './mutations'


// var data = fs.readFileSync('../../data/graph.json');

const state = {
    graph:"",
    attr_data:"",
    currentTime:"2010",
    clickNode:"",
    index_prop:{
        0:"a_deg",      // 总的节点度，非时变
        1:"a_pub",        // 总的发表量，非时变
        2:"t_avgW",       // 平均边权重，时变
        3:"t_pub",        // 当年发表量，时变
        4:"t_deg",     // 当年的节点度，时变
        5:"t_dCent",   // 度中心性 节点的度/N-1  N为所有节点，时变
        6:"t_avgC",       // 邻居节点的平均度中心性，时变
        7:"t_cc",         // 聚集系数，节点的邻居之间的边与两两相连的边数（n(n-1)/2）的占比，时变
        8:"t_venue"       // 文章发表在1.期刊 2.会议 3.both
    },
    g_index_prop:["avgW","avgPub","avgDeg","avgDcent","avgCC","l_nodes","l_links","n_growth_rate","l_growth_rate"]
    // {
    //     0: "avgW",
    //     1: "avgPub",
    //     2: "avgDeg",
    //     3: "avgDcent",
    //     4: "avgCC",
    //     5: "l_nodes",
    //     6: "l_links",
    //     7: "n_growth_rate",
    //     8: "l_growth_rate"
    // }
}

const getters = {
    times:(state,getters)=>{
        // console.log("+++++++++++");
        return state.graph?Object.keys(state.graph).sort((a,b)=>a-b):[];
    },
    // i_attr_scale:(state,getters)=>{
    //     var index_prop = this.index_prop;
    //     var scales = {};
    //     Object.keys(this.index_prop).forEach(d=>{
    //         scales[index_prop[d]] =
    //     })
    // },
    g_attr_data:(state, getters)=>{
        if(state.attr_data == "") return;
        var attr_data = state.attr_data,
            times = Object.keys(attr_data).sort((a, b) => a - b),
            graph = state.graph,
            nodes,
            links,
            g_attr_data = {},
            preNodes = graph[times[0]].nodes.length,
            preLinks = graph[times[0]].links.length,
            avgPub = 0, // 平均发表量
            avgW = 0, // 平均边权重
            avgDeg = 0, // 平均度
            avgDcent = 0, // 平均中心性
            avgCC = 0, // 聚集系数
            l_nodes = 0, // 节点数
            l_links = 0, // 边数
            n_growth_rate = 0, // 节点增长率
            l_growth_rate = 0; // 边增长率

        for (let t of times) {
            g_attr_data[t] = []
        }
        for (let t of times) {
            nodes = graph[t].nodes;
            links = graph[t].links;
            l_nodes = nodes.length;
            l_links = links.length;
            for (let name in attr_data[t]) {
                var prop_arr = attr_data[t][name]
                avgPub += prop_arr[3];
                avgDeg += prop_arr[4];
                avgDcent += prop_arr[5];
                avgCC += prop_arr[7];
            }
            avgPub = +(avgPub / nodes.length).toFixed(3);
            avgDeg = +(avgDeg / nodes.length).toFixed(3);
            avgDcent = +(avgDcent / nodes.length).toFixed(3);
            avgCC = +(avgCC / nodes.length).toFixed(3);
            for (let link of links) {
                avgW += link.weight;
            }

            avgW = +(avgW / links.length).toFixed(3);

            g_attr_data[t] = {
                avgPub,
                avgW,
                avgCC,
                avgDeg,
                avgDcent,
                l_nodes,
                l_links,
                n_growth_rate: +(((l_nodes - preNodes) / preNodes) * 100).toFixed(1),
                l_growth_rate: +(((l_links - preLinks) / preLinks) * 100).toFixed(1)
            }

            // console.log(g_attr_data[t]["n_growth_rate"], g_attr_data[t]["l_growth_rate"]);
            // console.log(l_nodes, preNodes);
            // 重新初始化
            preNodes = l_nodes,
                preLinks = l_links,
                avgPub = 0,
                avgW = 0,
                avgDeg = 0,
                avgDcent = 0,
                avgCC = 0,
                l_nodes = 0,
                l_links = 0,
                n_growth_rate = 0,
                l_growth_rate = 0;

        }
        // console.dir(g_attr_data);
        // state.g_attr_data = g_attr_data;
        return g_attr_data;
    }
}

Vue.use(Vuex);

export default new Vuex.Store({
    state,
    mutations,
    getters,
    actions
})
