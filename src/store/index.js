import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as types from './mutation-types'
import mutations from './mutations'
import d3 from '../lib/d3-extend'
// import chroma from 'chroma-js'

// const Times =
// var data = fs.readFileSync('../../data/graph.json');
export const initTimes = d3.range(27).map((d, i) => {
    return 1990 + i + "";
})
const state = {
    graph:"",
    attr_data:"",
    node_to_index:"",
    mds:"",
    currentTime:"2011",
    hasInitial:false,
    clickNode:"",
    selected:["Huamin Qu","Daniel A. Keim","Kwan-Liu Ma"], //"Huamin Qu","Kwan-Liu Ma"
    local_t_array: {
        "Huamin Qu":initTimes,
        "Daniel A. Keim":initTimes,
        "Kwan-Liu Ma":initTimes
    },
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
    g_prop:["avgW","avgPub","avgDeg","avgDcent","avgCC","l_nodes","l_links","n_growth_rate","l_growth_rate"]
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
        return state.graph?Object.keys(state.graph).sort((a,b)=>a-b):[];
    },
    prop_index:(state,getters)=>{
        var index_prop = state.index_prop,
            prop_index = {}
        Object.keys(index_prop).forEach(k=>{
            prop_index[index_prop[k]] = k;
        })
        return prop_index;
    },
    // 全网属性
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

        return g_attr_data;
    },

    index_to_node(state,getters){
        var node_to_index = state.node_to_index;
        if(node_to_index == '') return;

        var index_to_node = {};
        Object.keys(node_to_index).forEach(name=>{
            index_to_node[node_to_index[name]] = name;
        })
        return index_to_node;
    },

    // 各个属性的1/4 和 3/4位点以及比例尺
    quantile_scales(state,getters){
        var attr_data = state.attr_data;

        if(attr_data == "") return;
        var prop_domains={},
            prop_quantile = {},
            scales = {},
            index_prop = state.index_prop
        Object.keys(index_prop).forEach(i=>{
            prop_domains[index_prop[i]] = [];
            prop_quantile[index_prop[i]] = [];
            scales[index_prop[i]] = "";
        })
        for(let t in attr_data){
            for(let name in attr_data[t]){
                var values = attr_data[t][name];
                for(let [i,v] of values.entries()){
                    prop_domains[index_prop[i]].push(v)
                }
            }
        }
        // 获取每个属性对应的四分之一位点和四分之三位点
        for(let attr in prop_domains){
            var values = prop_domains[attr].sort((a,b)=>a-b);
            if(attr!="t_venue"){
                var quantile_1 = d3.quantile(values,0.25),
                    quantile_3 = d3.quantile(values,0.75);
                var min_max = d3.extent(values),
                    scale = d3.scaleLinear()
                                .domain(min_max)
                                .range([0,1]);
                prop_quantile[attr].push(quantile_1,quantile_3);
                scales[attr] = scale;

            }else{
                var scale = d3.scaleOrdinal()
                                .domain(Array.from(new Set(values)))
                                .range(["red","blue","orange"]);
                prop_quantile[attr].push(1.5,2.5); // 类别型数据还需处理下
                scales[attr] = scale;

            }
        }

        // 获取属性颜色映射比例尺
        for(let attr in prop_domains){
            if(attr != "t_venue"){
                var values = prop_domains[attr]
            }
        }
        return {prop_quantile,scales};
    }
}

Vue.use(Vuex);

export default new Vuex.Store({
    state,
    mutations,
    getters,
    actions
})
