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
                        <g class="nodesBrush"></g>
                        <g class="path-group">

                            <path v-for="(path_group,index) in links" v-bind:key="index" :d="generate_d(path_group)" class="i_path" :data-item="JSON.stringify(path_group)" ></path>

                        </g>
                        <g class="node-group">
                            <circle v-for="(node,index) in nodes" v-bind:key="index" class="i_item" :data-item="JSON.stringify(node)" :cx="cal_x(node)" :cy="cal_y(node)" r="3" :fill="nodeColor(mapAttr,node)" @click="nodeClickHandler($event)" @mouseover="nodeMouseoverHandler($event)" @mouseout="nodeMouseoutHandle($event)"></circle>
                        </g>
                        <g class="sankey"></g>
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
import chroma from 'chroma-js'
import jLouvain from '../../lib/jLouvain'
import dat from '../../lib/dat.gui.min'
import {mapActions,mapGetters} from "vuex"

// const index_prop = {
//     0:"a_deg",      // 总的节点度，非时变
//     1:"a_pub",        // 总的发表量，非时变
//     2:"t_avgW",       // 平均边权重，时变
//     3:"t_pub",        // 当年发表量，时变
//     4:"t_deg",     // 当年的节点度，时变
//     5:"t_dCent",   // 度中心性 节点的度/N-1  N为所有节点，时变
//     6:"t_avgC",       // 邻居节点的平均度中心性，时变
//     7:"t_cc",         // 聚集系数，节点的邻居之间的边与两两相连的边数（n(n-1)/2）的占比，时变
//     8:"t_venue"       // 文章发表在1.期刊 2.会议 3.both
// };
//


export default {
    props:["selected","index","classed","attr_data","timeArray"],
    data() {
        return {
            // time_range: ["1990", "2016"],  // 总的时间范围
            orderAttr: "cluster",
            mapAttr: "default",
            comColorMap:"default",
            local_y_scale:"",
            is_axis_drawed:false,
            svgWidth: 650,
            svgHeight: 358, //358 450
            axisHeight: 50,
            isShowed:true,
            local_t_array:[...this.timeArray],
            margin: {
                top: 20,
                left: 10,
                right: 10,
                bottom: 10
            },
            selectNodes:[],
            isShownOfCom:false //group
        };
    },
    computed: {
        ...mapGetters([
            "quantile_scales",
            "prop_index"
        ]),
        index_prop(){
            return this.$store.state.index_prop;
        },
        hasInitial(){
            return this.$store.state.hasInitial;
        },
        // 全局横坐标比例尺
        timeScale() {
            console.time();
            var timeArray = this.timeArray;
            var width = this.svgWidth - this.margin.left - this.margin.right;
            var t_scale = d3.scalePoint()
                .padding(0.5)
                .domain(timeArray)
                .range([0, width]);
            console.log("timeScale");
            console.timeEnd();
            return t_scale;
        },
        nodeAttrScales(){
            // 局部比例尺
            console.time()
            var prop_index = this.prop_index,
                nodes = this.nodes;
            if(nodes=="") return "";
            // var color = d3.interpolate("#fcbfbf","#ff0000");
            //"#fcdbc2","#a55804"
            var startC = "#dfcdc2",
                endC = "#e35000";
            var color = d3.interpolate(startC,endC);
            var attr_seg_scales = {};
            var attrs = Object.keys(prop_index);
            for(let attr of attrs){
                attr_seg_scales[attr] = {};
            }
            for(let [i,attr] of attrs.entries()){
                if(attr != "t_venue"){
                    var num_seg = 10,   // 分段数
                        current_attr_values = nodes.map(n=>n.values[prop_index[attr]]), // 对应属性上的所有值
                        [min,max] = d3.extent(current_attr_values),    // 属性最大最小值
                        interval = (max-min)/num_seg,   // 分段间隔
                        num_dif_values = Array.from(new Set(current_attr_values)).length, // 对应属性上的不同值的个数
                        // accumulative = 0,
                        initColor = startC;
                        attr_seg_scales[attr].extent = [min,max];
                        attr_seg_scales[attr].interval = interval;
                        attr_seg_scales[attr].num_seg = num_seg;
                    // console.log(attr);
                    for(let i in d3.range(num_seg)){
                        var initValue = min+i*interval,
                            topValue = initValue+interval,
                            len = new Set(current_attr_values.filter(d=>d<=topValue)).size,
                            percent = len/num_dif_values,
                            localScale = d3.scaleLinear().domain([initValue, topValue]).range([0,1]),  // 桶内值线性映射插值
                            linearScale = d3.scaleLinear().domain([min,max]).range([0,1]),
                            endColor = color(percent);
                        var k = "seg"+(+i+1);
                        attr_seg_scales[attr][k] = (function(initColor, endColor,localScale,linearScale){
                            return value=>{
                                // return d3.interpolate(startC,endC)(linearScale(value))
                                return d3.interpolate(initColor, endColor)(localScale(value))
                            }
                        })(initColor, color(percent),localScale,linearScale)

                        initColor = endColor;
                    }
                }else{
                    attr_seg_scales[attr] = d3.scaleOrdinal()
                                    .domain([1,2,3])
                                    .range(["red","blue","orange"]);
                }
            }
            console.log("nodeAttrScales")
            console.timeEnd()

            return attr_seg_scales;
            // 全局比例尺
            // return this.quantile_scales.scales;
        },
        // local_t_array(){
        //     var tmp = this.$store.state.local_t_array[this.selected];
        //     return tmp;
        // },

        // 局部横坐标比例尺
        local_timeScale(){
            // console.log("local_timeScale change");
            var local_t_array = this.local_t_array;
            var width = this.svgWidth - this.margin.left - this.margin.right;
            var t_scale = d3.scalePoint()
                .padding(0.5)
                .domain(local_t_array)
                .range([0, width]);
            return t_scale;
        },
        links(){
            console.time()
            var nodes = this.nodes,
                local_t_array = this.local_t_array,
                coNames,
                coNames_seq = {},
                links = [];
            // console.log(nodes, this.selected);
            if(nodes==[] || !nodes) return links;
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
                        }else{              // 如果不连续，判断临时数组个数是否大于1，若大于1，能够形成路径，添加至links；初始化临时数组，加入当前节点
                            n.isPreExist = false;
                            if(tmp_arr.length>1){
                                links.push(tmp_arr);
                            }
                            tmp_arr = [n];
                            last_time = n.time;
                        }
                    }

                    if(i == len-1 && tmp_arr.length>1){         // 判断循环结束时临时数组是否大于两个元素
                        links.push(tmp_arr);
                    }
                }

            }
            // console.log("links 222222222")
            console.log("links")
            console.timeEnd()

            // console.log("links takes:",(endTime-startTime)/1000);
            return links;
        },
        // 合作者数组，{time,data,values,weight}
        nodes() {
            console.time();
            var graph = this.$store.state.graph,
                attr_data = this.$store.state.attr_data;
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
                        data: nodeByName.get(target),
                        values:attr_data[t][target],
                        weight:l.weight||l.value
                    })
                    if (target == selected) coNodes.push({
                        time: t,
                        data: nodeByName.get(source),
                        values:attr_data[t][source],
                        weight:l.weight||l.value
                    })
                }
            }
            console.log("nodes")
            console.timeEnd()

            return coNodes;
        },


        //个体中心每年的属性值数组
        ego_values(){
            console.time()
            var selected = this.selected,
                attr_data = this.$store.state.attr_data,
                t_values = {};
            if(attr_data == "") return [];
            for(let t in attr_data){
                if(selected in attr_data[t]){
                    t_values[t] = attr_data[t][selected]
                }
            }
            console.log("ego_values:")
            console.timeEnd()
            return t_values;
        },

        // 个体中心坐标轴y轴比例尺，主要是每个属性的domain
        egoAxisScales_seq(){
            console.time();
            var startTime = new Date();
            var attr_data = this.attr_data,
                selected = this.selected,
                local_t_array = this.local_t_array,
                prop_index = this.prop_index,
                index_prop = this.index_prop,
                scales = {},
                ego_values_seq={};
            Object.keys(prop_index).forEach(k=>{
                scales[k]=[];
                ego_values_seq[k]=[];
            });
            for(let t of local_t_array){
                if(!attr_data[t][selected]) continue;
                var values = attr_data[t][selected];
                for(let [i,v] of values.entries()){
                    var attr = index_prop[i];
                    ego_values_seq[attr].push([t,v]);
                }
            }
            Object.keys(ego_values_seq).forEach(k=>{
                if(k!="t_venue"){
                    var extent = d3.extent(ego_values_seq[k],d=>d[1]);
                    scales[k] = d3.scaleLinear().domain(extent);
                }else{
                    var values = Array.from(new Set(ego_values_seq[k].map(n=>n[1])));
                    scales[k] = d3.scaleOrdinal().domain(values);
                }
            })
            console.log("egoAxisScales_seq:")
            console.timeEnd()
            return {scales,ego_values_seq}
        }
    },
    beforeMount(){
        // 在添加作者时，需要对节点进行排序；添加时hasInitial为true
        if(this.hasInitial){
            this.node_classified(this.orderAttr);
        }
    },
    mounted() {
        var _this = this;
        var c = _this.classed;

        d3.select("."+c).select(".wrap-g").attr("transform", "translate(" + _this.margin.left + "," + _this.margin.top + ")");
        d3.select("."+c).select(".wrap-g .nodesBrush").attr("transform", "translate(0," + (_this.margin.top + _this.axisHeight-5) + ")");
        d3.select("."+c).select(".wrap-g .node-group").attr("transform", "translate(0," + (_this.margin.top + _this.axisHeight-5) + ")");
        d3.select("."+c).select(".wrap-g .path-group").attr("transform", "translate(0," + (_this.margin.top + _this.axisHeight-5) + ")");
        d3.select("."+c).select(".wrap-g .sankey").attr("transform", "translate(0," + (_this.margin.top + _this.axisHeight-5) + ")");

        if(_this.hasInitial){
            _this.is_axis_drawed = true;
            _this.drawAxis();
        }
        _this.generateControls();
        // this.initBrush();
    },
    watch: {
        orderAttr:function(n,o){
            this.node_classified(n);   // 节点按属性值归类排号
        },
        // nodes: function(n, o) {
        //     console.log("nodes change");
        //     // if(!this.is_axis_drawed){
        //     //     this.is_axis_drawed = true;
        //     //     this.drawAxis();
        //     // }
        //     // this.node_classified(this.orderAttr);
        //     // console.log("watch nodes 444444")
        // },
        selectNodes:function(){
            console.log("selectNodes change");
        },
        links:function(){
            console.log("links change!");
            if(!this.is_axis_drawed){
                this.is_axis_drawed = true;
                this.drawAxis();
            }
            this.node_classified(this.orderAttr);

            // console.log("watch links 3333333")
        }

    },
    methods: {
        ...mapActions([
            "addIndividual",
            "deleteIndividual"
        ]),
        changeHover(){

        },
        initBrush(){
            var _this = this,
                width = this.svgWidth,
                height = this.svgHeight-this.axisHeight,
                c = this.classed,
                getDataByAttr = this.getDataByAttr,
                cal_x = this.cal_x,
                cal_y = this.cal_y,
                // mapAttr = this.mapAttr,
                nodeColor = this.nodeColor;
                // local_timeScale = this.local_timeScale;

            var svg = d3.select("."+c).select(".wrap-g .nodesBrush").append("g")
                        .attr("class","brush")
                        .call(d3.brush().extent([
                            [0,0],
                            [width,height]
                        ]).on("start",brushStart)
                          .on("brush",brushing)
                          .on("end",brushended));
            function brushStart(){
                var nodes = _this.nodes;
                // _this.selectNodes.splice(0)
                d3.select("."+c).selectAll(".i_item").style("fill",function(d){
                    var node = getDataByAttr(d3.select(this),"data-item");
                    // console.log(_this.mapAttr);
                    return nodeColor(_this.mapAttr,node);
                })
                d3.select("."+c).selectAll(".i_path").style("stroke","lightgrey")
            }
            function brushended() {
                if (!d3.event.sourceEvent) return; // Only transition after input.
                if (!d3.event.selection) return; // Ignore empty selections.
                // console.log(d3.event.selection);
                var [[x1,y1], [x2,y2]] = d3.event.selection;
                var names;
                d3.select("."+c).selectAll(".i_item").each(function(d,i){
                    var d = getDataByAttr(d3.select(this),"data-item");
                    var [x,y] = [cal_x(d), cal_y(d)];
                    if(x>=x1 && x<=x2 && y>=y1 && y<=y2){
                        if(!names) names = {};
                        names[d.data.name] = 1;
                    }
                })


                // if(names){
                //     _this.selectNodes.splice(0)
                //     _this.selectNodes.push(...names)
                // }

                if(names){
                    d3.select("."+c).selectAll(".i_item").style("fill",function(d,i){
                        var d = getDataByAttr(d3.select(this),"data-item");
                        if(names[d.data.name]==1){
                            return "gold"
                        }else{
                            return "lightgrey"
                        }

                    })

                    d3.select("."+c).selectAll(".i_path").style("stroke",function(){
                        var d = getDataByAttr(d3.select(this),"data-item");

                        if(names[d[0].data.name]==1){
                            return "gold";
                        }else{
                            return "lightgrey";
                        }
                    })
                }


            }
            function brushing() {
                if (!d3.event.sourceEvent) return; // Only transition after input.
                if (!d3.event.selection) return; // Ignore empty selections.
            }
        },
        /******* 关闭折叠事件 ********/
        closePanel(){
            this.deleteIndividual(this.selected);
        },
        togglePanel(){
            this.isShowed = !this.isShowed;
            d3.select("."+this.classed).select(".toggle_span").classed("toggle_span_up",!this.isShowed);
        },
        /**************************/

        /******* 为每个节点进行分组编号 ********/

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
                // sortValueArr = [],
                // local_t_array = this.local_t_array,
                quantile = this.quantile_scales.prop_quantile,
                prop_index = this.prop_index,    // 属性名-序号的映射
                t_g_num = {},   // 存储每年不同组的节点个数
                t_nodes = {},   // 按年存节点,内部data
                nodesByName = {};   // 按年存节点,内部data
            // for(let n of nodes){
            //     let t = n.time,
            //         name = n.data.name,
            //         value = n.values[prop_index[orderAttr]];
            //     sortValueArr.push(value)
            // }
            // sortValueArr = Array.from(new Set(sortValueArr)).sort((a,b)=>a-b);
            // console.log(sortValueArr);
            var q_1 = quantile[orderAttr][0],
                q_3 = quantile[orderAttr][1];
            console.log("排序属性的两个位点：",q_1,q_3);
            for(let t of times) {
                t_nodes[t] = [];
                t_g_num[t] = {};
                t_g_num[t][1]=0;
                t_g_num[t][2]=0;
                t_g_num[t][3]=0;
            }

            for(let n of nodes){
                t_nodes[n.time].push(n.data);
                // o_nodes[n.time].push(n);
            }
            nodesByName = d3.nest().key(d=>d.time).key(d=>d.data.name).map(nodes);
            console.log(nodesByName);
            // 存储group 包含gIndex,index,len,numOfG

            // for(let t of times){
            //     var temp_nodes = t_nodes[t],
            //     var group_index={
            //         1:0,
            //         2:0,
            //         3:0
            //     }
            //     temp_nodes.forEach(n=>{
            //         var values = attr_data[t][n.name],
            //             c_value = values[prop_index[orderAttr]],
            //             gIndex;
            //         if(c_value<=q_1) gIndex = 1;
            //         else if (c_value<=q_3) gIndex = 2;
            //         else gIndex = 3;
            //         if(!n.group) n.group = {};
            //         group_index[gIndex]++
            //         n.group.gIndex = gIndex;
            //         n.group.index = group_index[gIndex];
            //         n.group.numOfG = Object.keys(group_index).length;
            //         t_g_num[t][gIndex]++;
            //     })
            //     temp_nodes.forEach(n=>{
            //         n.group.len = t_g_num[t][n.group.gIndex];
            //     })
            //     // console.log("************");
            //     // temp_nodes.sort((a,b)=>a.group.gIndex-b.group.gIndex);
            //     // temp_nodes.forEach(n=>{
            //     //     var values = attr_data[t][n.name]
            //     //     console.log(n.group.gIndex,values[prop_index[orderAttr]]);
            //     // })
            //     // console.log("************");
            // }

            for(let t of times){
                var temp_nodes = t_nodes[t];

                var group_index={
                    1:0,
                    2:0,
                    3:0
                }
                temp_nodes.forEach(n=>{
                    var values = attr_data[t][n.name],
                        c_value = orderAttr != "strength"?values[prop_index[orderAttr]]:nodesByName.get(t).get(n.name)[0].weight,
                        gIndex;
                    if(c_value<=q_1){
                        gIndex = 1;
                    }
                    else if (c_value<=q_3){
                        gIndex = 2;
                    }
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
            var getGroupNodesByGIndex = d3.nest().key(d=>d.data.group.gIndex).map(nodes);
            var groups = Object.keys(group_index),
                groups_max_len = {},
                totalMaxLen = 0,
                heap = {};
            for(let gIndex of groups){
                groups_max_len[gIndex] = 0;
                var max_len = d3.max(getGroupNodesByGIndex.get(gIndex), (d)=>d.data.group.len);
                totalMaxLen+=max_len;
                groups_max_len[gIndex] = max_len;
            }

            for(let index of groups){
                heap[index] = 0;
                for(let i=index;i>0;i--){
                    heap[index]+=groups_max_len[i];
                }
            }
            // groups_max_len.totalMaxLen = totalMaxLen;
            nodes.forEach(n=>{
                n.data.group.maxLens = groups_max_len;
                n.data.group.totalMaxLen = totalMaxLen;
                n.data.group.heap = heap;
            })
            // console.log(heap);
            // console.log(groups_max_len);
            this.sortInGroup(t_nodes);
        },

        /**************************/

        /******* 为每个节点进行组内重新编号 ********/
        // 为了减少边交叉，对group内的节点进行排序，排序规则：1. 同一个group内，连续出现的节点在其他节点之前 2.连续出现的节点顺序保持与前一时刻一致 3.非连续节点出现位置随意
        sortInGroup(t_nodes){
            var orderAttr = this.orderAttr,
                times = Object.keys(t_nodes).sort((a,b)=>(+a)-(+b));
            // console.log(times);
            if(orderAttr == 'cluster'){
                var count = 0,
                    preNodes,
                    preTime;
                for(let t of times){
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

                // console.log(times);
                for(let t of times){
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
                            // var tempDataArr = nodes.map(d=>{
                            //     return d.group.index;
                            // })
                            for(let n of preNodes){
                                if(mapByName.has(n.name)){
                                    real_seq.push(mapByName.get(n.name))
                                }
                            }
                            for(let [i,n] of real_seq.entries()){
                                n.group.index = i+1;
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
        /**************************/

        node_classified(orderAttr){
            var startTime = new Date();
            if(orderAttr == "cluster"){
                this.sortByCluster();
            }else{
                this.sortByAttr(orderAttr);
            }
            var nodes = this.nodes;
            // for(let n of nodes){
            //     if(n.time == "2012" && n.data.cluster.gIndex==1){
            //         console.log(n.data.name+" : "+n.data.cluster.index);
            //     }
            // }
            var endTime = new Date();
            // console.log("sort takes:",(endTime-startTime)/1000);
            // this.generateSankeyData();
        },

        generateSankeyData(){
            var startTime = new Date();
            var nodes = this.nodes,
                links = this.links,
                orderAttr = this.orderAttr,
                mapNodesByTime,
                metaNodes = [],
                metaLinks = [];

            this.node_classified(orderAttr);


            var temp = nodes.filter((n)=>n.time=="2012" && n.data.cluster.gIndex==1);


            if(orderAttr=="cluster"){
                mapNodesByTime = d3.nest().key(n=>n.time).key(n=>n.data.cluster.gIndex).map(nodes);
            }
            else {
                mapNodesByTime = d3.nest().key(n=>n.time).key(n=>n.data.group.gIndex).map(nodes);
            };
            var times = mapNodesByTime.keys().sort((a,b)=>a-b),
                len = times.length;

            // 初始化元节点
            for(let [i,t] of times.entries()){
                var groupKeys = mapNodesByTime.get(times[i]).keys().sort((a,b)=>a-b);
                var start = 1;
                var numOfNodes = d3.nest().key(n=>n.time).map(nodes).get(t).length;
                for(let k of groupKeys){
                    var id = t+""+k;
                    var tmp_nodes = mapNodesByTime.get(t).get(k);
                    // nodes.filter((n)=>n.time==t && n.data.cluster.gIndex==k);
                    // if(t=="2012" && k==1)console.log(tmp_nodes);
                    metaNodes.push({
                        id,
                        data:tmp_nodes,
                        t:t,
                        startNIndex:start,
                        local_len:tmp_nodes.length,
                        total_len:numOfNodes,
                        numOfGroup:groupKeys.length,
                        gIndex:+k
                    });
                    start+=tmp_nodes.length;
                }
            }
            if(orderAttr == "cluster"){
                for(let metaNode of metaNodes){
                    metaNode.data.sort((a,b)=>a.data.cluster.index-b.data.cluster.index)
                }
            }else{
                for(let metaNode of metaNodes){
                    metaNode.data.sort((a,b)=>a.data.group.index-b.data.group.index)
                }
            }

            // 存储每一个社团中的边的起始点
            var s_start = {},
                t_start = {};

            // console.log(metaNodes);
            for(let [i,t] of times.entries()){
                var curTime = times[i],
                    nextTime = times[i+1];
                if(i<len-1){
                    if(nextTime-curTime!=1) continue;
                    var curGroups = mapNodesByTime.get(times[i]),
                        nextGroups = mapNodesByTime.get(times[i+1]),
                        curKeys = curGroups.keys().sort((a,b)=>a-b),
                        nextKeys = nextGroups.keys().sort((a,b)=>a-b);


                    for(let k1 of curKeys){
                        s_start[curTime+""+k1] = 1;
                    }
                    for(let k2 of nextKeys){
                        t_start[nextTime+""+k2] = 1;
                    }
                    /*******************/
                    for(let k1 of curKeys){
                        var nodes1 = curGroups.get(k1);
                        for(let k2 of nextKeys){
                            var nodes2 = nextGroups.get(k2);
                            var id1 = curTime+""+k1,
                                id2 = nextTime+""+k2;
                            for(let n1 of nodes1){
                                for(let n2 of nodes2){
                                    if(n1.data.name == n2.data.name){
                                        if(!this.isExistInMetaLinks(id1, id2, metaLinks)){
                                            metaLinks.push({
                                                source:id1,
                                                target:id2,
                                                weight:1
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            for(let l of metaLinks){
                var {source,target,weight} = l;
                l.sStart = s_start[source];
                l.tStart = t_start[target];
                s_start[source]+=weight;
                t_start[target]+=weight;
            }
            for(let l of metaLinks){
                var source = l.source,
                    target = l.target;
                for(let n of metaNodes){
                    if(n.id == source) l.source = n;
                    if(n.id == target) l.target = n;
                }
            }
            var endTime = new Date();

            return {
                metaNodes,
                metaLinks
            }
            // console.log("sankey takes:",(endTime-startTime)/1000);
            // console.log(metaLinks);
        },
        isExistInMetaLinks(source,target,metaLinks){
            var flag = false;
            for(let l of metaLinks){
                if(source==l.source && target==l.target){
                    flag = true;
                    l.weight++;
                    break;
                }
            }
            return flag;
        },
        /******** 绘制头部坐标轴  **********/
        drawAxis() {
            var _this = this;
            var width = _this.svgWidth - _this.margin.left - _this.margin.right,
                selected = _this.selected,
                // ego_values = _this.ego_values,
                height = _this.axisHeight,
                padding = 5,
                margin = _this.margin,
                timeScale = _this.timeScale,
                timeArray = _this.timeArray,
                prop_index = _this.prop_index,
                nodeColor = d3.color("#475669"),
                local_t_array = _this.local_t_array,
                c = _this.classed,
                another_attr = "t_pub",
                {scales,ego_values_seq} = this.egoAxisScales_seq,
                axisScaleTop = timeScale.copy(),
                axisScaleBottom = timeScale.copy();
            // console.log(ego_values_seq);



            var domains_1 = ego_values_seq["t_deg"];
            var domains_2 = ego_values_seq[another_attr];

            // if(selected == "Daniel A. Keim"){
            //     console.log(domains_deg);
            //     console.log(domains_another);
            // }
            var brush = d3.brushX()
                            .extent([
                                [0, -margin.top],
                                [width, 0]
                            ])
                            .on("brush", brushing)
                            .on("end", brushended)
            var y_axis_scale_deg = scales["t_deg"].range([height - padding, padding]);

            var y_axis_scale_another = scales[another_attr].range([height - padding, padding]);

            var svg = d3.select("."+c).select(".axis-container");
            var line = d3.line()
                .x(d => axisScaleBottom(d[0]))
                .y(d => y_axis_scale_deg(d[1]));
            var axisB = d3.axisBottom(axisScaleBottom).tickSize(-height).tickFormat(function(d){return d.substr(-2,2)});
            var axisT = d3.axisTop(axisScaleTop).tickFormat(function(d){return d.substr(-2,2)});
            // 坐标轴
            // var topAxis = svg.append("g")
            //                     .attr("class","axis--grid")
            //                     .call(axisT)
            var bottomAxis = svg.append("g")
                                .attr("class", "bottom axis--grid")
                                .attr("transform", "translate(0," + height + ")")
                                .call(axisB)
                                .selectAll(".tick")
                                // .classed("tick--minor", true)
                                .selectAll("text").attr("dy", 10);
            var topAxis = svg.append("g")
                            .attr("class", "top axis--grid")
                            // .attr("transform", "translate(0," + height + ")")
                            .call(axisT)
                            .selectAll(".tick")
                            // .classed("tick--minor", true)
                            .selectAll("text").attr("dy", 5);
            // 刷子brush
            svg.append("g")
                .attr("class", "brush")
                .call(brush);

            var bars = svg.append("g")
                          .selectAll(".bar")
                          .data(domains_2)
                          .enter()
                          .append("rect")
                          .attr("class","bar")
                          .attr("width",10)
                          .attr("height",function(d){
                              return height-y_axis_scale_another(d[1]);
                          })
                          .attr("x",function(d){
                              return axisScaleBottom(d[0])-5;
                          })
                          .attr("y",function(d){
                              return y_axis_scale_another(d[1])
                          })
                          .attr("fill",function(){
                              return "#99A9BF"
                          });
            // 节点和线
            var line_path = svg.append("g").datum(domains_1).append("path")
                .attr("class", "linepath")
                .attr("d", line);



            var nodes = svg.append("g")
                .selectAll(".node")
                .data(domains_1)
                .enter()
                .append("circle")
                .attr("class", "node")
                .attr("cx", d => axisScaleBottom(d[0]))
                .attr("cy", d => y_axis_scale_deg(d[1]))
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
                    llen = local_t_array.length;

                if(local_t_array[0]!=current_t_range[0] || local_t_array[llen-1]!=current_t_range[clen-1]){
                    axisScaleBottom = axisScaleBottom.domain(current_t_range)

                    /**************   更新视图   ************/
                    svg.select(".bottom.axis--grid").call(axisB).selectAll("text").attr("dy", 10);
                    //update
                    var newBarData = domains_2.filter(n=>{
                        return n[0]>=current_t_range[0] && n[0]<=current_t_range[clen-1];
                    });
                    var newNodeData = domains_1.filter(n=>{
                        return n[0]>=current_t_range[0] && n[0]<=current_t_range[clen-1];
                    })
                    // update bars
                    var barUpdate = svg.selectAll(".bar").data(newBarData,function(n){return n[0]});
                    barUpdate.attr("x",function(d){return axisScaleBottom(d[0])-5});
                    barUpdate.enter().append("rect")
                                    .attr("class","bar")
                                    .attr("width",10)
                                    .attr("height",function(d){
                                        return height-y_axis_scale_another(d[1]);
                                    })
                                    .attr("x",function(d){
                                        return axisScaleBottom(d[0])-5;
                                    })
                                    .attr("y",function(d){
                                        return y_axis_scale_another(d[1])
                                    })
                                    .attr("fill",function(){
                                        return d3.rgb(101, 147, 237,0.5)
                                    });
                    barUpdate.exit().remove();
                    // update line
                    line_path.datum(newNodeData).attr("d",line);
                    //update nodes
                    var nodeUpdate = svg.selectAll(".node").data(newNodeData,function(d){return d[0]});
                    nodeUpdate.attr("cx",function(d){return axisScaleBottom(d[0])});
                    nodeUpdate.enter().append("circle")
                                .attr("class", "node")
                                .attr("cx", d => axisScaleBottom(d[0]))
                                .attr("cy", d => y_axis_scale_deg(d[1]))
                                .attr("r", 3)
                                .attr("fill", nodeColor);
                    nodeUpdate.exit().remove();

                    /**************************************/
                    local_t_array.splice(0);
                    local_t_array.push(...current_t_range);
                    if(_this.isShownOfCom){
                        // console.log("++++++++");
                        // _this.drawCommunity(_this.isShownOfCom);
                    }
                }

            }
            function brushing() {
                if (!d3.event.sourceEvent) return; // Only transition after input.
                if (!d3.event.selection) return; // Ignore empty selections.
                // var [x1, x2] = d3.event.selection
                // d3.select("."+c).selectAll(".axis-container .node").each((d, i, eles) => {
                //     if (timeScale(d[0]) >= x1 && timeScale(d[0]) <= x2) {
                //         d3.select(eles[i]).attr("fill", nodeColor.brighter(1.5))
                //     } else {
                //         d3.select(eles[i]).attr("fill", nodeColor)
                //     }
                // })
            }
        },

        /*****  为每个个体中心网络生成局部控制面板  ******/
        generateControls(){
            var _this = this,
                index_prop = _this.index_prop;
            var obj = {
                orderAttr: "cluster",   // 排序选择
                colorMap: "default",    // 节点颜色映射选择
                displayCom:false,
                startColor: [128,128,128],
                endColor: [90,90,90],
                comColorMap:"default"

            }
            var attrList = Object.keys(index_prop).map(d=>{return index_prop[d]});
            // console.log(attrList);
            var gui = new dat.GUI({autoPlace: false});

            var customContainer = d3.select("."+_this.classed).node();
            customContainer.appendChild(gui.domElement);
            gui.add(obj,"orderAttr",['cluster',"strength",...attrList]).onChange(_this.changeOrderAttr);
            gui.add(obj,"colorMap",["default",...attrList]).onChange(_this.changeMapAttr);
            gui.add(obj,"comColorMap",["default",...attrList]).onChange(_this.changeComColorMap);
            gui.add(obj,"displayCom").onChange(_this.drawCommunity);
            gui.close();
        },

        drawCommunity(flag){
            console.log(flag);
            this.isShownOfCom = flag;
            var c = this.classed;

            if(flag){
                d3.select("."+c).select(".path-group").style("display","none");
                d3.select("."+c).select(".node-group").style("display","none");

                var {metaNodes, metaLinks} = this.generateSankeyData(),
                    prop_index = this.prop_index,
                    timeScale = this.local_timeScale,
                    cal_sankey_node_y = this.cal_sankey_node_y,
                    cal_y = this.cal_y,
                    get_sankey_path = this.get_sankey_path,
                    orderAttr = this.orderAttr,
                    comColorMap = this.comColorMap,
                    metaNodeColor = "#dca385",
                    metaNodeColorScale = this.metaNodeColorScale;
                console.log(comColorMap);

                var opacityScale = d3.scaleLinear().range([0.4,0.9]);
                var weight_min_max = d3.extent(metaLinks,ml=>ml.weight);
                opacityScale.domain(weight_min_max);
                console.log(weight_min_max);

                if(comColorMap != "default"){
                    let values = [];
                    for(let [i,n] of metaNodes.entries()){
                        let value = d3.mean(n.data,d=>d.values[prop_index[comColorMap]])
                        values.push(value);
                    }
                    let min_max = d3.extent(values,d=>d);
                    let interpolate = d3.scaleLinear().domain(min_max).range([0,1]);
                    metaNodeColor = (value)=>{
                        return metaNodeColorScale(interpolate(value))
                    }
                    console.log(typeof metaNodeColor);
                }

                var g_path = d3.select("."+c).select(".sankey").append("g").attr("class","sankey_path"),
                    g_nodes = d3.select("."+c).select(".sankey").append("g").attr("class","sankey_nodes");

                g_path.selectAll(".s_path")
                       .data(metaLinks)
                       .enter()
                       .append("path")
                       .attr("class","s_path")
                       .attr("d",function(d){
                           return get_sankey_path(orderAttr, d);
                       })
                       .style("stroke","lightgrey")
                       .style("stroke-width",function(d){
                           return d.weight*(2*3+2);
                       })
                       .style("fill","none")
                       .style("opacity",function(d){
                           return opacityScale(d.weight);
                       });

                g_nodes.selectAll(".s_node")
                        .data(metaNodes)
                        .enter()
                        .append("rect")
                        .attr("class","s_node")
                        .attr("x",function(d){
                            return timeScale(d.t)-3;
                        })
                        .attr("y",function(d){
                            return cal_sankey_node_y(d);
                        })
                        .attr("width",6)
                        .attr("height",function(d){
                            return d.local_len*(2*3+2);
                        })
                        .attr("fill",function(d){
                            if(comColorMap=="default") return metaNodeColor;
                            else{
                                var value = d3.mean(d.data,d=>d.values[prop_index[comColorMap]]);
                                return metaNodeColor(value);
                            }
                        });
            }else{
                d3.select("."+c).select(".sankey").selectAll("g").remove();
                d3.select("."+c).select(".path-group").style("display","block");
                d3.select("."+c).select(".node-group").style("display","block");
            }
        },
        get_sankey_path(orderAttr,d){
            var y,
                svgHeight = this.svgHeight,
                group_padding = 8,  // 子群之间间距
                r = 3,          // 圆半径或者rect高度的一半
                height = svgHeight-85;   // 绘制空间 273
            var timeScale = this.local_timeScale;
            var context = d3.path();
            var sourceX = timeScale(d.source.t)+r,
                targetX = timeScale(d.target.t)-r,
                sourceY = this.cal_sankey_node_y(d.source)+(d.sStart-1)*(2*r+2)+d.weight*(r+1),
                targetY = this.cal_sankey_node_y(d.target)+(d.tStart-1)*(2*r+2)+d.weight*(r+1),
                ctr_1 = [(sourceX+targetX)/2,sourceY],
                ctr_2 = [(sourceX+targetX)/2,targetY];

            context.moveTo(sourceX,sourceY);

            context.bezierCurveTo(ctr_1[0],ctr_1[1],ctr_2[0],ctr_2[1],targetX,targetY);

            return context.toString();
        },
        cal_sankey_node_y(d){
            var cal_y = this.cal_y,
                tmp_nodes = d.data;
            return cal_y(tmp_nodes[0])-3;
        },
        changeComColorMap(attr){
            var prop_index = this.prop_index,
                c = this.classed,
                color = this.metaNodeColorScale;
            this.comColorMap = attr;
            if(attr == "default"){
                d3.select("."+c).selectAll(".sankey .s_node").attr("fill","#dca385")
            }else{
                var mNodes = d3.select("."+c).selectAll(".sankey .s_node").data();
                var values = [];
                for(let [i,n] of mNodes.entries()){
                    var value = d3.mean(n.data,d=>d.values[prop_index[attr]])
                    values.push(value);
                }

                var min_max = d3.extent(values,d=>d);
                var interpolate = d3.scaleLinear().domain(min_max).range([0,1]);
                d3.select("."+c).selectAll(".sankey .s_node").each(function(d,i){
                    var d = d3.select(this).data()[0];
                    var value = d3.mean(d.data,d=>d.values[prop_index[attr]]);
                    d3.select(this).attr("fill",color(interpolate(value)));
                })
            }

        },
        metaNodeColorScale(value){
            return d3.interpolate("#fee6ce","#e6550d")(value)
        },
        changeOrderAttr(attr){
            this.orderAttr = attr;
        },
        changeMapAttr(attr){
            this.mapAttr = attr
        },
        cal_x(node){
            var timeScale = this.local_timeScale;
            return timeScale(node.time);
        },
        cal_y(node){
            var orderAttr =this.orderAttr,
                svgHeight = this.svgHeight;
            // console.log(node);
            var y,
                spacePadding = 8,
                height = svgHeight-85,   // 绘制空间 273
                r = 3,          // 圆半径或者rect高度的一半
                item_padding = 2,   // 节点之间间距
                group_padding = 8,  // 子群之间间距
                new_group_padding = "";

            if(orderAttr != "cluster"){
                var scale = d3.scalePoint()
                             .padding(0.5)
                             .domain([1,2,3])
                             .range([height,0]);

                var groupIndex = node.data.group.gIndex,
                    heap = node.data.group.heap,
                    numNodes = heap[groupIndex],
                    curGroupMaxLen = node.data.group.maxLens[groupIndex],
                    totalMaxLen = node.data.group.totalMaxLen,
                    len = node.data.group.len,
                    index = node.data.group.index,
                    numOfG = node.data.group.numOfG,
                    startPosition;
                group_padding = (height-2*spacePadding-totalMaxLen*(2*r+item_padding)+numOfG*item_padding)/(numOfG-1);
                startPosition = height-spacePadding-((numNodes-curGroupMaxLen/2)*(2*r+item_padding)-item_padding*groupIndex)-(groupIndex-1)*group_padding;
                var disp = (r+item_padding/2)*len-r;

                y = startPosition+(index-1)*(2*r+item_padding)-disp;
                // y = scale(groupIndex)+(index-1)*(2*r+item_padding)-disp;
                // y = scale(groupIndex)-((len-1)/2*(item_padding+r))+(index-1)*(item_padding+2*r);
            }else{

                var numOfG = node.data.cluster.numOfG,
                    tIndex = node.data.cluster.tIndex,
                    len = node.data.cluster.len,
                    gIndex = node.data.cluster.gIndex;

                var padding_top = (height-len*(2*r+item_padding)+item_padding*numOfG-(numOfG-1)*group_padding)/2;
                y = padding_top + r+(tIndex-1)*(item_padding+2*r)+(gIndex-1)*group_padding;
                // if(node.time=="2012")
                    // console.log(node.data);
            }

            return y;
        },
        getDataByAttr(selection, attrName){
            return JSON.parse(selection.attr(attrName))
        },
        nodeColor(mapAttr,node){
            var scales = this.nodeAttrScales,
                values = node.values,
                prop_index = this.prop_index;
            if(mapAttr == "default"){
                var isPreExsit = node.data.isPreExsit;
                return isPreExsit==1?"lightgrey":(isPreExsit==2?"green":"purple");
            }else if(mapAttr!="t_venue"){
                var scale = scales[mapAttr],
                    value = values[prop_index[mapAttr]];

                var seg_num = Math.floor((value-scale.extent[0])/scale.interval)+1;
                if(seg_num == scale.num_seg+1) seg_num--;
                var k = "seg"+seg_num;
                if(node.data.name == "Weiwei Cui") console.log(scale[k](value));
                return scale[k](value);

                // return chroma.scale(['#fee0d2', '#de2d26'])(scale(value)).toString();
                // return chroma.scale(['#fcbfbf', '#ff0000'])(scale(value)).toString();

            }else{
                var scale = scales["t_venue"];
                return scale(values[prop_index[mapAttr]])
            }
        },
        generate_d(group){
            var context = d3.path();
            this.drawPath(context,group);
            return context.toString();
        },
        drawPath(context,group){
            var start = group[0],
                len = group.length,
                local_timeScale = this.local_timeScale;
            context.moveTo(this.cal_x(start), this.cal_y(start))

            for(let [i,n] of group.entries()){
                if(i!=0){
                    var s_node = group[i-1],
                        d_node = n,
                        ctr_1 = [(this.cal_x(d_node)+this.cal_x(s_node))/2,this.cal_y(s_node)],
                        ctr_2 = [(this.cal_x(d_node)+this.cal_x(s_node))/2,this.cal_y(d_node)];
                    context.bezierCurveTo(ctr_1[0],ctr_1[1],ctr_2[0],ctr_2[1],this.cal_x(d_node),this.cal_y(d_node));
                }
            }
        },
        nodeMouseoverHandler(event){
            var _this = this,
                // attr = _this.orderAttr,
                index_prop = _this.index_prop,
                prop_index = _this.prop_index,
                svgWidth = _this.svgWidth,
                svgHeight = _this.svgHeight,
                orderAttr = _this.orderAttr,
                color = _this.nodeColor,
                mapAttr = _this.mapAttr;


            var {target,offsetX,offsetY} = event,
                currentElement = event.currentTarget,
                node = _this.getDataByAttr(d3.select(currentElement), "data-item");
            console.log(node);
            // var content = '';
            // node.values.forEach((v,i)=>{
            //     content+=`</br>${index_prop[i]}:${v}`;
            // })
            var orderValue = orderAttr == "cluster"?"cluster":(orderAttr == "strength"?node.weight:node.values[prop_index[orderAttr]]);
            // var content = orderAttr == "cluster"?`gIndex:${node.data.cluster.gIndex}</br>index:${node.data.cluster.index}</br>tIndex:${node.data.cluster.tIndex}`:`gIndex:${node.data.group.gIndex}</br>index:${node.data.group.index}`;
            var content = `name:${node.data.name}</br>${orderAttr}:${orderValue}</br>${mapAttr}:${mapAttr=="default"?"default":node.values[prop_index[mapAttr]]}`;
            d3.select("."+_this.classed)
                .select(".tooltip")
                .style("left",function(d){
                    if(svgWidth-offsetX>130)
                        return offsetX+10+"px"
                    else{
                        return offsetX-120+"px"
                    }
                })
                .style("top",offsetY-60+"px")
                .html(content)
                // .html(`<span class='hoverName'>${node.data.name}</span>${content}`)
                .style("display","block");
            d3.select("."+_this.classed).selectAll(".i_item").each(function(d,i,elems){
                var d = _this.getDataByAttr(d3.select(this), "data-item");
                if(d.data.name == node.data.name){
                    d3.select(this).attr("fill",color(mapAttr,d))
                                   .attr("r",5);
                                //    .classed("nodeHoverOnOne",true);
                }else{
                    d3.select(this).attr("fill","lightgrey").style("opacity",0.6);
                }
                // if(d.data.name == node.data.name && d.data.name == "Yingcai Wu"){
                //     d3.select(this).attr("fill",color(mapAttr,d))
                //                    .attr("r",5)
                //                    .classed("nodeHoverOnOne",true);
                // }else if(d.data.name == node.data.name && d.data.name == "Weiwei Cui"){
                //     d3.select(this).attr("fill",color(mapAttr,d))
                //                    .attr("r",5)
                //                    .classed("nodeHoverOnTwo",true);
                // }else{
                //     if(d.data.name!="Yingcai Wu" && d.data.name!="Weiwei Cui")
                //         d3.select(this).attr("fill","lightgrey").style("opacity",0.6);
                // }
            })
            d3.select("."+_this.classed).selectAll(".i_path").each(function(d,i){
                var d = _this.getDataByAttr(d3.select(this), "data-item");
                if(d[0].data.name == node.data.name){
                    d3.select(this).style("stroke","#8e8b8b");
                }else{
                    d3.select(this).style("stroke","lightgrey").style("opacity",0.6);
                }
            });
            // d3.select("."+_this.classed).selectAll(".i_path").each(function(d,i){
            //     var d = _this.getDataByAttr(d3.select(this), "data-item");
            //     if(d[0].data.name == node.data.name && (d[0].data.name!="Yingcai Wu" || d[0].data.name!="Weiwei Cui")){
            //         d3.select(this).style("stroke","#8e8b8b");
            //     }else{
            //         if(d[0].data.name!="Yingcai Wu" && d[0].data.name!="Weiwei Cui")
            //             d3.select(this).style("stroke","lightgrey").style("opacity",0.6);
            //     }
            // });

        },
        nodeMouseoutHandle(){
            var _this = this,
                color = _this.nodeColor,
                mapAttr = _this.mapAttr;
            var {target,offsetX,offsetY} = event;
            d3.select("."+_this.classed)
                .select(".tooltip")
                .style("display","none");

            d3.select("."+_this.classed).selectAll(".i_item")
                .attr("fill",function(d){
                    var d = _this.getDataByAttr(d3.select(this), "data-item");
                    return color(mapAttr,d);
                })
                .attr("r",3).style("opacity",1)
                .classed("nodeHoverOn",false);
            d3.select("."+_this.classed).selectAll(".i_path").style("stroke",function(){
                return 'lightgrey';
            }).style("opacity",1);
        },
        nodeClickHandler(event){
            var _this = this;
            var currentElement = event.currentTarget,
                node = _this.getDataByAttr(d3.select(currentElement), "data-item");
            _this.addIndividual(node.data.name);
        }
    },
    components: {
        Node,
        Edge
    }
};
</script>

<style lang="css">
    .bottom.axis--grid .domain {
        fill: #ddd;
        stroke: none;
    }
    .axis--grid .tick line {
        stroke: #fff;
    }
    .top.axis--grid .domain {
        display:none;
    }
    /*.top.axis--grid .tick line{
        display:none;
    }*/
    /*.bottom.axis--grid .tick line{
        display:none;
    }
    .top.axis--grid path{
        display:none;
        fill:none;
    }*/
    .axis-container .node{
        /*fill:#f9be86*/
    }

    .axis-container .linepath{
        fill:none;
        stroke:#BFBFBF;
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
    .nodeHoverOnOne{
        stroke:black;
        stroke-width:2px;
    }
    .nodeHoverOnTwo{
        stroke:#f71845;
        stroke-width:2px;
    }
    .i_path{
        fill:none;
        stroke:lightgrey;
        stroke-width:2px;
    }

</style>

<style lan="css">
.individual .dg.main{
    position:absolute;
    top:0;
    right:60px;
    z-index:999;
    border-radius: 4px;
    width:200px !important;
}
.individual .dg.main .close-button{
    box-sizing: border-box;
    background-color: #686767;
    height:20px;
    line-height:20px;
    width:200px !important;
    text-align: right;
    padding-right:10px;
}


</style>
