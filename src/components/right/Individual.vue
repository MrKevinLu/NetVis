<template lang="html">
    <div class="individual" :class="{[classed]:true}">
        <div class="tooltip">

        </div>
        <div class="foldPanel">
            <span class="name_span c_span">{{ selected }}</span>
            <span class="close_span c_span" @click="closePanel"></span>
            <span class="toggle_span c_span" @click="togglePanel"></span>
        </div>
        <div id="individual_1" class="i_container" v-show="isShowed">
            <svg :width="svgWidth" :height="svgHeight">
                    <rect :width="svgWidth" :height="svgHeight" class="overlay_background"></rect>
                    <g class="wrap-g">
                        <g class="axis-container">

                        </g>
                        <g class="path-group">
                            <edge v-for="(l,index) in links" :key="index" :path_group="l" :local_timeScale="local_timeScale" :orderAttr='orderAttr' :mapAttr="mapAttr" :classed="classed" :hover="true" :changeHover="changeHover"></edge>
                        </g>
                        <g class="node-group">
                            <node v-for="(n,index) in nodes" v-bind:key="index" :node="n" :index="index" :local_timeScale="local_timeScale" :len="nodes.length" :orderAttr='orderAttr' :mapAttr='mapAttr' :classed="classed" :hover="true" :changeHover="changeHover"></node>
                        </g>
                    </g>
            </svg>
        </div>

    </div>
</template>

<script>
import d3 from '../../lib/d3-extend'
import Highcharts from 'highcharts'
import Node from './Node.vue'
import Edge from './Link.vue'
import jLouvain from '../../lib/jLouvain'
// import dat from 'dat.gui'
import {mapActions,mapGetters} from "vuex"

const index_prop = {
    0:"a_deg",      // 总的节点度，非时变
    1:"a_pub",        // 总的发表量，非时变
    2:"t_avgW",       // 平均边权重，时变
    3:"t_pub",        // 当年发表量，时变
    4:"t_deg",     // 当年的节点度，时变
    5:"t_dCent",   // 度中心性 节点的度/N-1  N为所有节点，时变
    6:"t_avgC",       // 邻居节点的平均度中心性，时变
    7:"t_cc",         // 聚集系数，节点的邻居之间的边与两两相连的边数（n(n-1)/2）的占比，时变
    8:"t_venue"       // 文章发表在1.期刊 2.会议 3.both
};
export default {
    props:["selected","index","classed"],
    data() {
        return {
            time_range: ["1990", "2016"],  // 总的时间范围
            orderAttr: "cluster",
            mapAttr: "isNew",
            local_y_scale:"",
            is_axis_drawed:false,
            svgWidth: 650,
            svgHeight: 358,
            axisHeight: 50,
            isShowed:true,
            margin: {
                top: 10,
                left: 10,
                right: 10,
                bottom: 10
            }

            // nodes:[[10,10],[20,20],[30,30]]
        };
    },
    computed: {
        ...mapGetters([
            "attr_quantile"
        ]),
        // 总时间范围，时间序列
        timeArray() {
            var tr = this.time_range;
            var timeArray = d3.range(Number(tr[1]) - Number(tr[0]) + 1).map((d, i) => {
                return Number(tr[0]) + i + "";
            })
            return timeArray;
        },
        hasInitial(){
            return this.$store.state.hasInitial;
        },
        // 全局横坐标比例尺
        timeScale() {
            var timeArray = this.timeArray;
            var width = this.svgWidth - this.margin.left - this.margin.right;
            var t_scale = d3.scalePoint()
                .padding(0.5)
                .domain(timeArray)
                .range([0, width]);

            return t_scale;
        },
        local_t_array(){
            var tmp = this.$store.state.local_t_array[this.selected];
            return tmp;
        },

        // 局部横坐标比例尺
        local_timeScale(){
            var local_t_array = this.local_t_array;
            var width = this.svgWidth - this.margin.left - this.margin.right;
            var t_scale = d3.scalePoint()
                .padding(0.5)
                .domain(local_t_array)
                .range([0, width]);
            return t_scale;
        },
        // 合作者数组，{time,data}
        nodes() {
            var startTime = new Date();
            var graph = this.$store.state.graph;
            if (graph == "") return [];
            var local_t_array = this.local_t_array,
                selected = this.selected,
                coNodes = [];

            for (let t of local_t_array) {
                var nodes = graph[t].nodes;
                var nodeByName = d3.map(nodes, function(d) {
                    return d.name;
                });
                var links = graph[t].links;
                for (let l of links) {
                    var source = typeof l.source == "object" ? l.source.name : l.source,
                        target = typeof l.target == "object" ? l.target.name : l.target;
                    if (source == selected) coNodes.push({
                        time: t,
                        data: nodeByName.get(target)
                    })
                    if (target == selected) coNodes.push({
                        time: t,
                        data: nodeByName.get(source)
                    })
                }
            }
            var endTime = new Date();
            console.log("nodes takes:",(endTime-startTime)/1000);
            return coNodes;
        },
        links(){
            var startTime = new Date();
            var nodes = this.nodes,
                local_t_array = this.local_t_array,
                coNames,
                coNames_seq = {},
                links = [];
            if(!nodes) return links;
            for(let n of nodes){
                coNames_seq[n.data.name] = []
            }
            coNames = Object.keys(coNames_seq);
            // 构建每个合作时间序列{name1:[...],name2:[...]}
            for(let author of coNames){
                for(let n of nodes){
                    if(n.data.name == author){
                        coNames_seq[author].push(n)
                    }
                }
            }
            // 对每个合作者的合作时间序列进行排序
            for(let author of coNames){
                coNames_seq[author].sort((a,b)=>a.time-b.time)
            }
            //标记是否首次出现、连续出现、曾经出现
            for(let author of coNames){
                var seq = coNames_seq[author],
                    len = seq.length;
                for(let [i,n] of seq.entries()){
                    if(i==0) n.data.isPreExsit = 2;      // 第一次出现
                    else if(n.time-seq[i-1].time==1){
                        n.data.isPreExsit = 1;   // 连续出现
                    }else{
                        n.data.isPreExsit = 3;   // 曾经出现
                    }
                }
            }

            // 构建links,每个元素都是一个序列
            for(let author of coNames){
                var tmp_arr = [],
                    last_time;
                if((coNames_seq[author]).length<=1) continue;
                var seq = coNames_seq[author],
                    len = seq.length;
                for(let [i,n] of seq.entries()){
                    if(tmp_arr.length==0){  // 临时数组长度为0直接添加元素
                        tmp_arr.push(n);
                        last_time = n.time;
                        // continue;
                    }else{
                        if(n.time-last_time==1){    // 判断是否与临时数组连续
                            last_time = n.time; // 更换临时数组中最后一个元素的时间
                            tmp_arr.push(n)
                            // continue;
                        }else{              // 如果不连续，判断临时数组个数是否大于1，若大于1，能够形成路径，添加至links；否则重置临时数组
                            n.isPreExist = false;
                            if(tmp_arr.length>1){
                                links.push(tmp_arr);
                            }
                            else{
                                tmp_arr = [n];
                                last_time = n.time;
                                // continue;
                            }
                        }
                    }

                    if(i == len-1 && tmp_arr.length>1){         // 判断循环结束时临时数组是否大于两个元素
                        links.push(tmp_arr);
                    }
                }
            }
            var endTime = new Date();
            console.log("links takes:",(endTime-startTime)/1000);
            return links;
        },

        attr_data(){
            return this.$store.state.attr_data;
        }
    },
    beforeMount(){
        if(this.hasInitial){
            this.node_classified(this.orderAttr);
        }
    },
    mounted() {
        var c = this.classed;

        d3.select("."+c).select(".wrap-g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        d3.select("."+c).select(".wrap-g .node-group").attr("transform", "translate(0," + (this.margin.top + this.axisHeight) + ")");
        d3.select("."+c).select(".wrap-g .path-group").attr("transform", "translate(0," + (this.margin.top + this.axisHeight) + ")");
        if(this.hasInitial){
            this.is_axis_drawed = true;
            this.drawAxis();
        }
    },
    watch: {
        orderAttr:function(n,o){
            this.node_classified(n);   // 节点按属性值归类排号
        },
        nodes: function(n, o) {
            // console.log("drawAxis+++++++");
            if(!this.is_axis_drawed){
                this.is_axis_drawed = true;
                this.drawAxis();
            }
        },
        links:function(){
            // console.log("links+++++++");
            this.node_classified(this.orderAttr);
        }

    },
    methods: {
        ...mapActions([
            "changeLocalTArray",
            "addIndividual",
            "deleteIndividual"
        ]),
        changeHover(){

        },
        closePanel(){
            this.deleteIndividual(this.selected);
        },
        togglePanel(){
            this.isShowed = !this.isShowed;
            d3.select("."+this.classed).select(".toggle_span").classed("toggle_span_up",!this.isShowed);
        },
        mouseoverHander(){

        },
        sortByCluster(){
            var nodes = this.nodes,
                t_nodes = {},
                times = Array.from(new Set(nodes.map(d=>d.time))).sort((a,b)=>a-b),  // 获取存在合作者的时间戳
                graph = this.$store.state.graph;
            for(let t of times) t_nodes[t] = [];
            for(let n of nodes) t_nodes[n.time].push(n.data);
            for(let t in t_nodes){
                var sub_nodes = t_nodes[t],
                    sub_links = [],
                    global_links = graph[t].links;
                var temp_i_name = {},
                    authors = {};
                sub_nodes.forEach((n,i)=>{
                    temp_i_name[i] = n;
                    authors[n.name] = i;
                })
                for(let l of global_links){
                    var source = typeof l == 'obejct'?l.source.name:l.source,
                        target = typeof l == 'obejct'?l.target.name:l.target,
                        weight = l.weight;
                    if(source in authors && target in authors){
                        sub_links.push({
                            source:authors[source],
                            target:authors[target],
                            weight
                        })
                    }
                }
                var community = jLouvain().nodes(sub_nodes.map((d,i)=>{
                        return i;
                    })).edges(sub_links);
                var result = community();
                if(result==0){
                    var startIndex = 1;
                    sub_nodes.forEach((n,i)=>{
                        n.cluster = {};
                        n.cluster.gIndex = i+1;
                        n.cluster.index = (startIndex++);
                        n.cluster.tIndex = n.cluster.index;
                        n.cluster.len = sub_nodes.length;
                        n.cluster.numOfG = sub_nodes.length;
                        n.cluster.local_num_group = 1;
                    })
                }else{
                    var i_gIndex_arr = Object.keys(result).map(i=>{
                                            return [i,result[i]]
                                        }).sort((a,b)=>a[1]-b[1]);
                    // console.dir(result);
                    // var mapByName = d3.map(sub_nodes,function(d){return d.name;})
                    var preGIndex = 0,
                        start = 1;
                    for(let [i,n] of i_gIndex_arr.entries()){
                        var [index,gIndex] = [n[0],n[1]];

                        if(gIndex!=preGIndex){
                            preGIndex = gIndex;
                            start = 1;
                        }
                        var node = temp_i_name[index];
                        node.cluster = {};
                        node.cluster.gIndex = +gIndex+1;
                        node.cluster.index = start++;
                        node.cluster.tIndex = (+i)+1;
                        node.cluster.local_num_group = i_gIndex_arr.filter(d=>d[1]==gIndex).length;
                        node.cluster.numOfG = new Set(i_gIndex_arr.map(d=>d[1])).size;
                        node.cluster.len = i_gIndex_arr.length;
                        // console.log(node.cluster);
                    }
                }
            }
            this.sortInGroup(t_nodes);

        },
        sortByAttr(orderAttr){
            var nodes = this.nodes,
                attr_data = this.attr_data,
                times = Array.from(new Set(nodes.map(d=>d.time))).sort((a,b)=>a-b),
                // local_t_array = this.local_t_array,
                attr_quantile = this.attr_quantile,
                prop_index = {},    // 属性名-序号的映射
                t_g_num = {},   // 存储每年不同组的节点个数
                t_nodes = {};   // 按年存节点
            // for(let t of times) t_nodes[t] = [];
            // for(let n of nodes) t_nodes[n.time].push(n.data);
            for(let i in index_prop){
                prop_index[index_prop[i]] = i
            }
            var q_1 = attr_quantile[orderAttr][0],
                q_3 = attr_quantile[orderAttr][1];
            for(let t of times) {
                t_nodes[t] = [];
                t_g_num[t] = {};
                t_g_num[t][1]=0;
                t_g_num[t][2]=0;
                t_g_num[t][3]=0;
            }
            for(let n of nodes){
                t_nodes[n.time].push(n.data);
            }
            // 存储group 包含gIndex,index,len,numOfG
            for(let t in t_nodes){
                var temp_nodes = t_nodes[t];
                var group_index={
                    1:0,
                    2:0,
                    3:0
                }
                temp_nodes.forEach(n=>{
                    var values = attr_data[t][n.name],
                        c_value = values[prop_index[orderAttr]],
                        gIndex;
                    if(c_value<q_1) gIndex = 1;
                    else if (c_value<=q_3) gIndex = 2;
                    else gIndex = 3;
                    if(!n.group) n.group = {};
                    group_index[gIndex]++
                    n.group.gIndex = gIndex;
                    n.group.index = group_index[gIndex];
                    n.group.numOfG = Object.keys(group_index).length;
                    t_g_num[t][gIndex]++;
                })
                temp_nodes.forEach(n=>{
                    n.group.len = t_g_num[t][n.group.gIndex];
                })
            }

            this.sortInGroup(t_nodes);
        },

        // 为了减少边交叉，对group内的节点进行排序，排序规则：1. 同一个group内，连续出现的节点在其他节点之前 2.连续出现的节点顺序保持与前一时刻一致 3.非连续节点出现位置随意
        sortInGroup(t_nodes){
            var orderAttr = this.orderAttr;
            if(orderAttr == 'cluster'){
                var count = 0,
                    preNodes,
                    preTime;
                for(let t in t_nodes){
                    var sub_nodes = t_nodes[t];
                    /***********  先对子群大小排序 ***********/
                    sub_nodes.sort((a,b)=>{
                        // 先按子群中孩子节点个数排序，再根据子群编号排序
                        if(a.cluster.local_num_group != b.cluster.local_num_group){
                            return b.cluster.local_num_group-a.cluster.local_num_group
                        }else{
                            return a.cluster.gIndex-b.cluster.gIndex;
                        }
                    });
                    // 对子群中的tIndex个gIndex重新编号
                    var new_gIndex = 1,
                        preGIndex = sub_nodes[0].cluster.gIndex;
                    for(let [i,n] of sub_nodes.entries()){
                        var gIndex = n.cluster.gIndex;
                        if(gIndex != preGIndex){
                            preGIndex = gIndex;
                            new_gIndex++;
                        }
                        n.cluster.gIndex = new_gIndex
                        n.cluster.tIndex = i+1;
                    }
                    /*******************************************/

                    /***********  对子群内部进行排序 ***********/
                    if(count==0){
                        //将首个时刻的节点都赋给 preNodes
                        preNodes = sub_nodes;
                        preTime = t;
                        count++;
                        continue;
                    }
                    else if(t-preTime!=1){
                        preNodes = sub_nodes;
                        preTime = t;
                        count++
                        continue;
                    }
                    else{
                        /***********  首先对是否连续出现排序，连续出现的排在前面 ***********/
                        sub_nodes.sort((a,b)=>{
                            if(a.cluster.gIndex!=b.cluster.gIndex){
                                return a.cluster.gIndex-b.cluster.gIndex
                            }else{
                                return a.isPreExsit - b.isPreExsit;
                            }
                        })

                        var indexStart = 1,
                            preGIndex = sub_nodes[0].cluster.gIndex,
                            numOfG = sub_nodes[0].cluster.numOfG;

                        for(let [i,n] of sub_nodes.entries()){
                            var gIndex = n.cluster.gIndex;
                            if(gIndex!=preGIndex){
                                preGIndex = gIndex;
                                indexStart = 1;
                            }
                            n.cluster.index = indexStart++;
                            n.cluster.tIndex = i+1;
                        }
                        
                        /*******************************************/

                        /***********  对连续出现的进行排序 ***********/
                        for(let i of d3.range(numOfG)){
                            var c_gIndex = i+1,
                                real_seq = [];
                            // nodes: 子群中连续出现的节点集合
                            var nodes = sub_nodes.filter(n=>{
                                return n.cluster.gIndex==c_gIndex && n.isPreExsit==1
                            });

                            var mapByName = d3.map(nodes,d=>d.name);

                            if(nodes.length==0) continue;
                            var tempDataArr = nodes.map(d=>{
                                return [d.cluster.index, d.cluster.tIndex];
                            })
                            for(let n of preNodes){
                                if(mapByName.has(n.name)){
                                    real_seq.push(mapByName.get(n.name))
                                }

                            }

                            for(let [i,n] of real_seq.entries()){
                                n.cluster.index = tempDataArr[i][0];
                                n.cluster.tIndex = tempDataArr[i][1];
                            }
                        }
                        /*  注意重新排序，否则影响preNodes的顺序  */
                        sub_nodes.sort((a,b)=>{
                            if(a.cluster.gIndex!=b.cluster.gIndex){
                                return a.cluster.gIndex-b.cluster.gIndex
                            }else if(a.isPreExsit!=b.isPreExsit){
                                return a.isPreExsit-b.isPreExsit
                            }else{
                                return a.cluster.index-b.cluster.index;
                            }
                        })
                        /*******************************************/
                        /************** 重新初始化 ***************/
                        preNodes = sub_nodes;
                        preTime = t;
                    }
                }
            }
            else{
                var count = 0,
                    preNodes,
                    preTime;
                for(let t in t_nodes){
                    var sub_nodes = t_nodes[t];
                    if(count==0){
                        preNodes = sub_nodes;
                        preTime = t;
                        count++;
                        continue
                    }else if(t-preTime!=1){
                        preNodes = sub_nodes;
                        preTime = t;
                        count++;
                        continue;
                    }else{
                        /***********  首先对是否连续出现排序，连续出现的排在前面 ***********/

                        sub_nodes.sort((a,b)=>{
                            if(a.group.gIndex!=b.group.gIndex){
                                return a.group.gIndex-b.group.gIndex
                            }else{
                                return a.isPreExsit - b.isPreExsit;
                            }
                        })

                        var indexStart = 1,
                            preGIndex = sub_nodes[0].group.gIndex,
                            numOfG = sub_nodes[0].group.numOfG;

                        for(let [i,n] of sub_nodes.entries()){
                            var gIndex = n.group.gIndex;
                            if(gIndex!=preGIndex){
                                preGIndex = gIndex;
                                indexStart = 1;
                            }
                            n.group.index = indexStart++;
                        }
                        /*******************************************/

                        /***********  对连续出现的进行排序 ***********/
                        for(let i of d3.range(numOfG)){
                            var c_gIndex = i+1,
                                real_seq = [];
                            // nodes: 子群中连续出现的节点集合
                            var nodes = sub_nodes.filter(n=>{
                                return n.group.gIndex==c_gIndex && n.isPreExsit==1
                            });

                            var mapByName = d3.map(nodes,d=>d.name);

                            if(nodes.length==0) continue;
                            var tempDataArr = nodes.map(d=>{
                                return d.group.index;
                            })
                            for(let n of preNodes){
                                if(mapByName.has(n.name)){
                                    real_seq.push(mapByName.get(n.name))
                                }
                            }
                            for(let [i,n] of real_seq.entries()){
                                n.group.index = tempDataArr[i];
                            }
                        }

                        sub_nodes.sort((a,b)=>{
                            if(a.group.gIndex!=b.group.gIndex){
                                return a.group.gIndex-b.group.gIndex
                            }else if(a.isPreExsit!=b.isPreExsit){
                                return a.isPreExsit-b.isPreExsit
                            }else{
                                return a.group.index-b.group.index;
                            }
                        })

                        /*******************************************/
                        /************** 重新初始化 ***************/
                        preNodes = sub_nodes;
                        preTime = t;
                    }
                }
            }
        },

        node_classified(orderAttr="t_pub"){
            var startTime = new Date();
            if(orderAttr == "cluster"){
                this.sortByCluster();
            }else{
                this.sortByAttr(orderAttr);
            }
            var endTime = new Date();
            console.log("sort takes:",(endTime-startTime)/1000);

        },
        // cal_y(node){
        //     var orderAttr =this.orderAttr;
        //     var y,
        //         item_padding = 2,   // 节点之间间距
        //         group_padding = 8,  // 子群之间间距
        //         r = 3,          // 圆半径或者rect高度的一半
        //         height = 308;   // 绘制空间
        //
        //     if(orderAttr != "cluster"){
        //         var scale = d3.scalePoint()
        //                      .padding(0.7)
        //                      .domain([1,2,3])
        //                      .range([height,0])
        //
        //         var groupIndex = node.data.group.gIndex,
        //             len = node.data.group.len,
        //             index = node.data.group.index;
        //         y = scale(groupIndex)-((len-1)/2*(item_padding+r))+(index-1)*(item_padding+2*r);
        //     }else{
        //         var
        //             drawHeight = height-padding*2,
        //             numOfG = node.data.cluster.numOfG,
        //             tIndex = node.data.cluster.tIndex,
        //             len = node.data.cluster.len,
        //             gIndex = node.data.cluster.gIndex;
        //
        //         var padding_top = height-len*(2*r+item_padding)+item_padding-(numOfG-1)*group_padding;
        //         y = padding_top + r+(tIndex-1)*(item_padding+2*r)+(gIndex-1)*group_padding;
        //     }
        //
        //     return y;
        // },
        drawAxis() {
            var _this = this;
            var width = _this.svgWidth - _this.margin.left - _this.margin.right,
                height = _this.axisHeight,
                padding = 5,
                timeScale = _this.timeScale,
                time_obj = {},
                timeArray = _this.timeArray,
                nodeColor = d3.color("#f9be86"),
                changeLocalTArray = _this.changeLocalTArray,
                c = this.classed;
                // local_t_array = _this.local_t_array;

            _this.nodes.forEach((d, i) => {

                time_obj[d.time] ? (time_obj[d.time]++) : (time_obj[d.time] = 1)
            })

            var domains = Object.keys(time_obj).sort().map(k => {
                return [k, time_obj[k]]
            });
            var min_max = d3.extent(domains.map(d => {
                return d[1]
            }));
            var y_axis_scale = d3.scaleLinear()
                .domain(min_max)
                .range([height - padding, padding]);
            var svg = d3.select("."+c).select(".axis-container");
            var line = d3.line()
                .x(d => timeScale(d[0]))
                .y(d => y_axis_scale(d[1]));
            // 坐标轴
            svg.append("g")
                .attr("class", "axis--grid")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(timeScale)
                    .tickSize(-height)
                    .tickFormat(function(d) {
                        return d.substr(-2, 2);
                    }))
                .selectAll(".tick")
                // .classed("tick--minor", true)
                .selectAll("text").attr("dy", 10);

            // 刷子brush
            svg.append("g")
                .attr("class", "brush")
                .call(d3.brushX()
                    .extent([
                        [0, 0],
                        [width, height]
                    ])
                    .on("brush", brushing)
                    .on("end", brushended));
            // 节点和线
            var line = svg.append("g").datum(domains).append("path")
                .attr("class", "linepath")
                .attr("d", line);

            var nodes = svg.append("g")
                .selectAll(".node")
                .data(domains)
                .enter()
                .append("circle")
                .attr("class", "node")
                .attr("cx", d => timeScale(d[0]))
                .attr("cy", d => y_axis_scale(d[1]))
                .attr("r", 3)
                .attr("fill", nodeColor);

            function brushended() {
                if (!d3.event.sourceEvent) return; // Only transition after input.
                if (!d3.event.selection) return; // Ignore empty selections.
                var [x1, x2] = d3.event.selection,
                    current_t_range = [];

                // 局部时间范围
                current_t_range = timeArray.filter(d => {
                    if (timeScale(d) >= x1 && timeScale(d) <= x2)
                        return true
                    else return false;
                })
                var clen = current_t_range.length,
                    llen = _this.local_t_array.length;

                if(_this.local_t_array[0]!=current_t_range[0] || _this.local_t_array[llen-1]!=current_t_range[clen-1]){
                    changeLocalTArray({
                        name:_this.selected,
                        range:current_t_range
                    });
                }

            }

            function brushing() {
                if (!d3.event.sourceEvent) return; // Only transition after input.
                if (!d3.event.selection) return; // Ignore empty selections.
                var [x1, x2] = d3.event.selection
                d3.select("."+c).selectAll(".axis-container .node").each((d, i, eles) => {
                    if (timeScale(d[0]) >= x1 && timeScale(d[0]) <= x2) {
                        d3.select(eles[i]).attr("fill", nodeColor.brighter(1.5))
                    } else {
                        d3.select(eles[i]).attr("fill", nodeColor)
                    }
                })
            }
        }

    },
    components: {
        Node,
        Edge
    }
};
</script>

<style lang="css">
    .axis--grid .domain {
        fill: #ddd;
        stroke: none;
    }
    .axis--grid .tick line {
        stroke: #fff;
    }
    .axis-container .node{
        /*fill:#f9be86*/
    }

    .axis-container .linepath{
        fill:none;
        stroke:lightgrey;
        stroke-width:2px;
    }

    .individual{
        position:relative;
        /*display:flex;*/
        /*flex-direction:column;*/
        width:100%;
        height:auto;
        /*height:378px;*/
        /*flex:1;*/
        /*height:670px;*/
    }
    .foldPanel{
        widht:100%;
        height:20px;
        background-color: #686767;
        /*vertical-align: middle;*/
        line-height: 20px;
        font-family: sans-serif;
        font-size: 12px;
        font-weight: bold;
        color:lightgrey;
        padding-left: 10px;
        padding-right:10px;
    }
    .c_span{
        display: inline-block;
        text-align: center;
    }
    .close_span, .toggle_span{
        float:right;
        width:15px;
        height:100%;
    }
    .close_span::after{
        content:"x";
    }
    .toggle_span::after{
        content:'';
        float:right;
        margin-top:7px;
        margin-right:3px;
        /*border-bottom:none;*/
        border-width:5px 5px 0;
        border-style:solid;
        border-color:lightgrey transparent;
    }
    .close_span:hover,.toggle_span:hover{
        background-color: black;
    }
    /*.toggle_span:hover:after{
        border-width:0 5px 5px;

    }*/
    .toggle_span_up::after{
        border-width:0 5px 5px;
    }
    #individual_1{
        width:100%;
        height:auto;
    }
    .overlay_background{
        fill:none;
    }
    .tooltip{
        position: absolute;
        display:none;
        border-radius:5px;
        min-width:40px;
        height:auto;
        padding:5px 10px;
        font-size:13px;
        font-family: sans-serif;
        font-weight: bold;
        background-color: rgba(119, 107, 107,0.7);
        color:white;

    }

</style>
