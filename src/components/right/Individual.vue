<template lang="html">
    <div class="individual">
        <div id="individual_1" class="i_container">
            <svg :width="svgWidth" :height="svgHeight">
                    <g class="wrap-g">
                        <g id="axis-container">

                        </g>
                        <g class="node-group">
                            <node v-for="(n,index) in nodes" v-bind:key="index" :node="n" :index="index" :local_timeScale="local_timeScale" :len="nodes.length" :orderAttr='orderAttr' :mapAttr='mapAttr'></node>
                        </g>
                    </g>
                <!-- <transition-group name="list" tag="p"> -->
                    <!-- <p v-for="i in nodes" v-bind:key="i">{{i}}</p> -->
                <!-- </transition-group> -->
            </svg>
        </div>
        <div id="individual_2" class="i_container">
            <!-- <svg width=550 height=335 id="svg2">
            </svg> -->
        </div>

    </div>
</template>

<script>
import d3 from '../../lib/d3-extend'
import Highcharts from 'highcharts'
import Node from './Node.vue'
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
    data() {
        return {
            time_range: ["1990", "2016"],  // 总的时间范围
            t_extent_2: [],
            individual_1: "",
            individual_2: "",
            orderAttr: "cluster",
            selected: "Kwan-Liu Ma",
            mapAttr: "t_pub",
            local_y_scale:"",
            is_axis_drawed:false,
            svgWidth: 650,
            svgHeight: 378,
            axisHeight: 50,
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
            return this.$store.state.local_t_array;
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
                    // console.log(source,target);
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

            // console.log(coNodes);
            return coNodes;
        },
        attr_data(){
            return this.$store.state.attr_data;
        },
        // 获取个体中心网络中的属性比例尺
        i_scales() {
            var attr_data = this.$store.state.attr_data;
            if (attr_data == "") return;

            var index_prop = this.$store.state.index_prop;
            var i_scales = {};
            var domains = {};
            Object.keys(index_prop).forEach(k => {
                i_scales[index_prop[k]] = d3.scaleLinear().range([30, 300])
                domains[index_prop[k]] = [];
            });
        }
    },
    mounted() {
        d3.select(".wrap-g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        d3.select(".wrap-g .node-group").attr("transform", "translate(0," + (this.margin.top + this.axisHeight) + ")");

    },
    watch: {
        orderAttr:function(n,o){
            // this.node_classified(n);   // 节点按属性值归类排号
        },
        nodes: function(n, o) {
            this.node_classified();
            if(!this.is_axis_drawed){
                this.is_axis_drawed = true;
                this.drawAxis();
            }
        },
        i_scales: function(n) {

        },
        timeScale: function(n) {

        },
        local_timeScale:function(n,o){
            // console.log("change scale");
        }
    },
    methods: {
        ...mapActions([
            "changeLocalTArray"
        ]),
        node_classified(orderAttr="a_pub"){
            var nodes = this.nodes,
                attr_data = this.attr_data,
                local_t_array = this.local_t_array,
                attr_quantile = this.attr_quantile,
                prop_index = {},    // 属性名-序号的映射
                t_g_num = {},   // 存储每年不同组的节点个数
                t_nodes = {};   // 按年存节点
            console.log(attr_quantile);
            for(let i in index_prop){
                prop_index[index_prop[i]] = i
            }
            var q_1 = attr_quantile[orderAttr][0],
                q_3 = attr_quantile[orderAttr][1];
            for(let t of local_t_array) {
                t_nodes[t] = [];
                t_g_num[t] = {};
                t_g_num[t][1]=0;
                t_g_num[t][2]=0;
                t_g_num[t][3]=0;
            }
            for(let n of nodes){
                t_nodes[n.time].push(n.data);
            }
            // 存储group 包含gIndex,index,len
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
                    t_g_num[t][gIndex]++;
                })
                temp_nodes.forEach(n=>{
                    n.group.len = t_g_num[t][n.group.gIndex];
                    // console.log(n);
                })
            }

            // 计算坐标
            this.cal_cordinate();


        },
        cal_cordinate(){
            var item_padding = 2,
                r = 3,
                nodes = this.nodes,
                height = 308;

            var scale = d3.scalePoint()
                         .padding(1)
                         .domain([1,2,3])
                         .range([height,0])
            for(let n of nodes){
                var groupIndex = n.data.group.gIndex,
                    len = n.data.group.len,
                    index = n.data.group.index;
                var i_y = scale(groupIndex)-((len-1)/2*(item_padding+r))+(index-1)*(item_padding+2*r);
                n.i_y = i_y;
                console.log(i_y);
            }
        },
        drawAxis() {
            var _this = this;
            var width = _this.svgWidth - _this.margin.left - _this.margin.right,
                height = _this.axisHeight,
                padding = 5,
                timeScale = _this.timeScale,
                time_obj = {},
                timeArray = _this.timeArray,
                nodeColor = d3.color("#f9be86"),
                changeLocalTArray = _this.changeLocalTArray;
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
            // console.log(min_max);
            var y_axis_scale = d3.scaleLinear()
                .domain(min_max)
                .range([height - padding, padding]);
            var svg = d3.select("#axis-container");
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
                    changeLocalTArray(current_t_range)
                }

                // console.log(local_t_array);
                // this.local_t_array = local_t_array;
                // console.log(local_t_range);

            }

            function brushing() {
                if (!d3.event.sourceEvent) return; // Only transition after input.
                if (!d3.event.selection) return; // Ignore empty selections.
                var [x1, x2] = d3.event.selection
                d3.selectAll("#axis-container .node").each((d, i, eles) => {
                    if (timeScale(d[0]) >= x1 && timeScale(d[0]) <= x2) {
                        d3.select(eles[i]).attr("fill", nodeColor.brighter(1.5))
                    } else {
                        d3.select(eles[i]).attr("fill", nodeColor)
                    }
                })
            }
        },

        updateDate() {


        },
        draw() {


        }
    },
    components: {
        Node
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
    #axis-container .node{
        /*fill:#f9be86*/
    }

    #axis-container .linepath{
        fill:none;
        stroke:lightgrey;
        stroke-width:2px;
    }

    .individual{
        display:flex;
        flex-direction:column;
        width:100%;
        flex:1
        /*height:670px;*/
    }
    #individual_1{
        flex:1;
        border: 1px grey solid
    }
    #individual_2{
        flex:1;
    }
</style>
