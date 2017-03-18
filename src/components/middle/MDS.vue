<template lang="html">
    <div class="mdsCanvas" v-show="type == 'MDS'">

        <canvas id="mds" width="550" height="550"  @mousedown="mousedown" @mousemove="mousemove" @mouseup="mouseup"></canvas>
    </div>
</template>

<script>
import d3 from '../../lib/d3-extend'
import {
    mapActions,
    mapGetters
} from 'vuex'
import Vue from 'vue'
import Highcharts from 'highcharts'
import chroma from 'chroma-js'
var echarts =require('echarts')
require('highcharts-more')(Highcharts)
    // import 'highcharts-more'

export default {
    props: ["type", "time", "searchNode", "comDistribute","mapAttr"],
    data() {
        return {
            canvasDom: '',
            context: '',
            brushes: [],
            brush: {},
            margin: {
                left: 40,
                top: 40
            },
            groups: {},
            nodesByIndex: {},
            neighbors:{},
            colors: ["#ea4f4f", "#f25ecd", "#f2aa1a", "#2f74ed"]
        };
    },
    computed: {
        ...mapGetters([
            "times",
            "prop_index",
            "quantile_scales"
        ]),
        quantile() {
            return this.quantile_scales.prop_quantile;
        },
        colorScales(){
            // 每个时间片各自计算比例尺，而非全局比例尺
            var attr_data = this.attr_data,
                time = this.time,
                mdsColorScales = {},
                attr_values = {},
                prop_index = this.prop_index,
                index_prop = this.index_prop;

            Object.keys(prop_index).forEach((attr)=>{
                attr_values[attr] = [];
            })

            Object.keys(attr_data[time]).forEach(name=>{
                var values = attr_data[time][name];
                for(let [i,v] of values.entries()){
                    attr_values[index_prop[i]].push(v);
                }
            })
            Object.keys(attr_values).forEach(attr=>{
                var scale;
                if(attr!="t_venue"){
                    // var min_max = d3.extent(attr_values[attr]);
                    // var scale = chroma
                    var min_max = d3.extent(attr_values[attr]);

                    var interpolate = d3.scaleLinear()
                                    .domain(min_max)
                                    .range([0,1]);
                    scale = value=>{
                        return chroma.scale(['#e5f5f9', '#005824'])(interpolate(value))
                        // return chroma.scale(['#e5ebf9', '#3016f4'])(interpolate(value))
                    }
                }else{
                    scale = d3.scaleOrdinal()
                                    .domain([1,2,3])
                                    .range(["#e66101","#fdb863","#b2abd2"]);
                                    // .range(["red","blue","orange"]);
                }
                mdsColorScales[attr] = scale;
            })
            return mdsColorScales;
            // return this.quantile_scales.scales;
        },
        index_prop() {
            return this.$store.state.index_prop;
        },
        attr_data() {
            return this.$store.state.attr_data;
        },
        graph() {
            return this.$store.state.graph;
        },
        mds: function() {
            this.initProperty();
            var t = this.time,
                graph = this.graph,
                attr_data = this.attr_data,
                nodesByIndex = {};
            if (graph != "") {
                graph[t].nodes.forEach((n, i) => {
                    nodesByIndex[i] = {
                        name: n.name,
                        values: attr_data[t][n.name]
                    }
                });
                this.nodesByIndex = nodesByIndex;
            }
            return this.$store.state.mds;
        },
        nodes: function() {
            var time = this.time,
                margin = this.margin,
                nodes = this.mds[time];
            if (nodes == undefined) return [];
            var x_min_max = d3.extent(nodes, (d) => d[0]),
                y_min_max = d3.extent(nodes, (d) => d[1]);
            var xScale = d3.scaleLinear()
                .range([margin.left, 550 - margin.left])
                .domain(x_min_max);
            var yScale = xScale.copy().range([margin.top, 550 - margin.top]).domain(y_min_max);

            nodes = nodes.map(d => {
                return [xScale(d[0]), yScale(d[1])];
            })
            return nodes;
        }
    },
    mounted() {
        this.initContext();
    },
    methods: {
        ...mapActions([
            'selectYear'
        ]),
        initContext() {
            var canvas = document.getElementById('mds'),
                ctx = canvas.getContext('2d');
            this.context = ctx;
            this.canvasDom = canvas;
            this.initEventHandlers();
        },
        initEventHandlers() {
            window.onkeydown = this.keydown;
        },
        draw: function() {
            this.clearCanvas();
            this.drawBackground();
            // this.drawLinks();
            this.drawNodes();
            this.drawBrush();

        },
        clearCanvas() {
            var ctx = this.context;
            ctx.clearRect(0, 0, 550, 550);
        },
        drawBackground() {
            var ctx = this.context;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 550, 550);
        },

        drawLinks(){
            var ctx = this.context,
                neighbors = this.neighbors,
                nodesByIndex = this.nodesByIndex,
                nodes = this.nodes;
            if(neighbors.length == 0) return;
            var cnode = this.getSearchNodePosition();
            for(let [i,n] of nodes.entries()){
                if(nodesByIndex[i].name in neighbors){
                    ctx.beginPath();
                    ctx.strokeStyle = "#aba6a6";
                    ctx.lineWidth = 2;
                    ctx.moveTo(cnode[0],cnode[1]);
                    ctx.lineTo(n[0],n[1]);
                    ctx.stroke();
                }
            }
        },

        drawNodes() {
            var ctx = this.context,
                nodes = this.nodes,
                nodesByIndex = this.nodesByIndex,
                prop_index = this.prop_index,
                colorScales = this.colorScales,
                mapAttr = this.mapAttr,
                searchNode = this.searchNode,
                neighbors = this.neighbors,
                tempNeighbors = [];

            for (let [i,n] of nodes.entries()) {
                ctx.beginPath();
                var node = nodesByIndex[i];
                var value = node.values[prop_index[mapAttr]],
                    name = node.name;
                if (n.selected == true) {
                    ctx.fillStyle = n.color;
                    console.log(nodesByIndex[i].name, nodesByIndex[i].values);
                } else {
                    if(mapAttr=="default"){
                        if(name=="Daniel A. Keim") ctx.fillStyle = "red";
                        else if(name == "Kwan-Liu Ma"){
                            ctx.fillStyle = "purple"
                        }else{
                            ctx.fillStyle = "lightgrey";
                        }
                        // ctx.fillStyle = "lightgrey";

                    }
                    else{
                        ctx.fillStyle = colorScales[mapAttr](value);
                    }
                    // console.log(ctx.fillStyle);
                    // ctx.fillStyle = "lightgrey"
                }

                if(searchNode == name){
                    // ctx.fillStyle = "orange";
                    // ctx.arc(n[0], n[1], 4, 0, 2 * Math.PI);
                    continue;
                }else{
                    if(name=="Daniel A. Keim") ctx.arc(n[0], n[1], 4, 0, 2 * Math.PI);
                    else if(name=="Kwan-Liu Ma") ctx.arc(n[0], n[1], 4, 0, 2 * Math.PI);
                    else ctx.arc(n[0], n[1], 2, 0, 2 * Math.PI);
                    // ctx.arc(n[0], n[1], 2, 0, 2 * Math.PI);
                }
                if(name in neighbors){
                    tempNeighbors.push(n);
                    continue;
                    // ctx.fillStyle = "red";
                    // ctx.arc(n[0], n[1], 4, 0, 2 * Math.PI);
                }
                ctx.fill();
                ctx.closePath();
            }

            if(tempNeighbors.length!=0){
                // 绘制搜索节点和邻居节点之间的连线
                this.drawLinks();
                // 后绘制搜索节点以及邻居节点
                var cnode = this.getSearchNodePosition();
                ctx.beginPath();
                ctx.fillStyle = "#ed892d";
                ctx.arc(cnode[0], cnode[1], 4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();

                for(let [j,n] of tempNeighbors.entries()){
                    ctx.beginPath();
                    var node = nodesByIndex[j];
                    var value = node.values[prop_index[mapAttr]],
                        name = node.name;

                    ctx.fillStyle = "#ea7272";
                    ctx.arc(n[0], n[1], 2, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.closePath();
                }
            }

        },
        drawBrush() {
            var ctx = this.context,
                brushes = this.brushes;
            for (let b of brushes) {
                var source = b.source,
                    target = b.target;
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = b.color;
                ctx.strokeRect(source[0], source[1], target[0] - source[0], target[1] - source[1])
                ctx.closePath();
            }
        },
        mousedown(e) {
            var brush = this.brush,
                brushes = this.brushes,
                colors = this.colors;
            if (e.shiftKey == true) {
                brush.source = [e.offsetX, e.offsetY];
                brush.target = [];
                brush.color = colors[brushes.length];
                brushes.push(brush);
            }
        },
        mousemove(e) {
            var brush = this.brush;
            var nodes = this.nodes;
            var mouseX = e.offsetX,
                mouseY = e.offsetY,
                nodesByIndex = this.nodesByIndex;
            // console.log(mouseX,mouseY);
            for(let [i,n] of nodes.entries()){

                // console.log(n[0],n[1]);
                if(Math.pow(mouseX-n[0],2)+Math.pow(mouseY-n[1], 2)<=4){
                    // console.log(true);
                    // console.log(nodesByIndex[i].name, nodesByIndex[i].values);
                }
            }
            if (e.shiftKey == true) {
                brush.target = [e.offsetX, e.offsetY];
                if (brush.source != undefined && brush.target != undefined)
                    this.selecteNodes(brush.source, brush.target, brush.color);
                this.draw();
            }
        },
        mouseup(e) {
            this.brush = [];
        },
        keydown(e) {
            if (e.key == "c") {
                this.brushes = [];
                this.groups = {};
                this.nodes.forEach(n => {
                    n.selected = false;
                })
                this.draw();
            }
            var series = [],
                type = this.comDistribute;
            if (e.key == 'd') {
                var brushes = this.brushes,
                    groups = this.groups;

                if (brushes.length > 0) {
                    var nodes = this.nodes,
                        nodesByIndex = this.nodesByIndex;
                    brushes.forEach((d, i) => {
                        Vue.set(groups, "group" + i, []);
                    });
                    this.brushes.forEach((b, j) => {
                        var source = b.source,
                            target = b.target;
                        nodes.forEach((n, i) => {
                            if (n[0] >= source[0] && n[1] >= source[1] && n[0] <= target[0] && n[1] <= target[1]) {
                                groups["group" + j].push(nodesByIndex[i]);
                            }
                        })
                        groups["group" + j].color = b.color;
                    })
                }
                // index_prop:{
                //     0:"a_deg",      // 总的节点度，非时变
                //     1:"a_pub",        // 总的发表量，非时变
                //     2:"t_avgW",       // 平均边权重，时变
                //     3:"t_pub",        // 当年发表量，时变
                //     4:"t_deg",     // 当年的节点度，时变
                //     5:"t_dCent",   // 度中心性 节点的度/N-1  N为所有节点，时变
                //     6:"t_avgC",       // 邻居节点的平均度中心性，时变
                //     7:"t_cc",         // 聚集系数，节点的邻居之间的边与两两相连的边数（n(n-1)/2）的占比，时变
                //     8:"t_venue"       // 文章发表在1.期刊 2.会议 3.both
                // },
                // var attrs = ["t_deg", "t_pub", "t_dCent"]
                var attrs = ["t_avgW", "t_avgC", "t_cc"]
                series = this.getDistribution(type, attrs);
                this.drawDistribution(type, attrs, series);
            }
        },
        selecteNodes(source, target, color) {
            var nodes = this.nodes;
            for (let [i, n] of nodes.entries()) {
                if (n[0] >= source[0] && n[1] >= source[1] && n[0] <= target[0] && n[1] <= target[1]) {
                    n.selected = true;
                    n.color = color;
                } else {
                    if (n.color == color)
                        n.selected = false;
                }
            }
        },
        initProperty() {
            this.brushes = [];
            this.brush = [];
        },
        getSearchNodePosition(){
            var nodes = this.nodes,
                searchNode = this.searchNode,
                nodesByIndex = this.nodesByIndex;
            for(let [i,n] of nodes.entries()){
                if(nodesByIndex[i].name == searchNode){
                    return n;
                }else continue;
            }
            return false;
        },
        getDistribution(type, attrs) {
            var groups = this.groups,
                quantile = this.quantile,
                prop_index = this.prop_index,
                series = [];
            if (type == "histogram") {
                Object.keys(groups).forEach(gName => {
                    var nodes = groups[gName];
                    // console.log(nodes);
                    var tmp_dis = {};
                    attrs.forEach(attr => {
                        tmp_dis[attr] = {
                            0: 0,
                            1: 0,
                            2: 0
                        }
                    });
                    for (let n of nodes) {
                        for (let a of attrs) {
                            var index = prop_index[a];
                            if (n.values[index] <= quantile[a][0])      // 小于等于1/4位点
                                tmp_dis[a][0]++;
                            else if (n.values[index] <= quantile[a][1]) // 1/4和3/4之间
                                tmp_dis[a][1]++;
                            else {  // 大于3/4位点
                                tmp_dis[a][2]++;
                            }
                            // console.log(quantile[a]);
                        }
                        // console.log(tmp_dis);
                    }

                    var arrays = [
                        [],
                        [],
                        []
                    ];


                    attrs.forEach((a, i) => {
                        Object.keys(tmp_dis[a]).sort((a, b) => a - b).forEach((d) => {
                            arrays[d].push(tmp_dis[a][d])
                        })
                    })
                    arrays.reverse();
                    for (let [i, array] of arrays.entries()) {
                        if (array.length != 0 && d3.sum(array) > 0) {
                            var name = i == 2 ? "小于1/4" : (i == 1 ? "1/4-3/4" : "大于3/4");
                            var color = d3.hsl(groups[gName].color);
                            if (name == "小于1/4") {
                                // color.s = color.s * 0.6;
                                color.l = color.l + 0.14;
                            } else if (name == "1/4-3/4") {
                                // color.s = color.s * 0.8;
                                color.l = color.l;
                            } else {
                                // color.s = color.s;
                                color.l = color.l-0.14;
                            }
                            series.push({
                                "name": name,
                                "data": arrays[i],
                                "stack": gName,
                                "color": color.toString()
                            })
                        }
                    }
                })
            } else {
                var radarScales = {};
                var attrs = Object.keys(this.index_prop).sort((a, b) => a > b).map(i => this.index_prop[i]).filter((d, i) => i != 8);
                Object.keys(groups).forEach(gName => {
                    console.log(gName);
                    var nodes = groups[gName];

                    var serie = d3.range(8).map(n => 0);
                    var color = d3.color(nodes.color);
                    color.opacity = 0.7;
                    serie.forEach((n, i) => {
                        radarScales[i] = d3.scaleLinear()
                            .range([0, 10]);
                    })
                    nodes.forEach(n => {
                            var values = n.values;
                            values.forEach((v, i) => {
                                if (i != 8) serie[i] += v;
                            })
                        })
                        // console.log(serie);
                    serie = serie.map(v => {
                        return v / nodes.length;
                    })
                    series.push({
                        type: 'area',
                        name: gName,
                        data: serie,
                        color: color.toString()
                    })
                })
                d3.range(8).forEach((d, i) => {
                    var values = [];
                    series.forEach(n => {
                            values.push(n.data[i])
                        })
                        // console.log(values);
                    var extent = d3.extent(values)
                    console.log(extent);
                    radarScales[i].domain([extent[0], extent[1]]);
                })

                series.forEach(n => {
                    n.data = n.data.map((v, i) => {
                        return radarScales[i](v);
                    })
                })
                series.attrs = attrs;
                series.scales = radarScales;
                // console.log(attrs);
                // console.log(series);
                // return series;
                // series = [{
                //     type: 'area',
                //     name: 'Area',
                //     data: [1, 8, 2, 7, 3, 6, 4, 5]
                // }]
            }
            // console.log(Object.keys(groups));
            // console.log(series);
            return series;



        },
        getValuesByIndex(){

        },
        drawDistribution(type, attrs, series) {
            var _this = this;
            var prop_index = this.prop_index;
            var scales = series.scales;
            var id = "community_dis";// tmp_stat
            if (type == "histogram") {
                Highcharts.chart(id, {
                    chart: {
                        type: 'column'
                    },
                    credits: {
                        enabled: false
                    },

                    xAxis: {
                        categories: attrs //['a_deg', 'a_pub', 't_pub']
                    },
                    legend: {
                        enabled: false
                    },
                    title: {
                        style: {
                            display: "none"
                        }
                    },

                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Total fruit consumption'
                        },
                        visible: false
                    },
                    tooltip: {
                        formatter: function () {
                            return '<b>' + this.x + '</b><br/>' +
                                this.series.name + ': ' + this.y + '<br/>' +
                                'Total: ' + this.point.stackTotal;
                        }
                        // pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
                        // shared: true
                    },
                    plotOptions: {
                        column: {
                            stacking: 'percent'
                        }
                    },
                    series: series
                });
            } else {
                var myChart = echarts.init(document.getElementById(id));
                var attrs = series.attrs;
                var option = {
                    tooltip: {
                        trigger: 'axis'
                    },

                    radar: [{
                        indicator: (function() {
                            var res = [];
                            for (var i = 0; i < attrs.length; i++) {
                                res.push({
                                    text: attrs[i],
                                    min:0-(series.scales[i].domain()[1]-series.scales[i].domain()[0])*0.1,
                                    max: series.scales[i].domain()[1]+(series.scales[i].domain()[1]-series.scales[i].domain()[0])*0.1
                                });
                            }
                            return res;
                        })(),
                        center: ['50%', '50%'],
                        radius: 50
                    }],

                    series: [

                        {
                            type: 'radar',
                            radarIndex: 0,
                            tooltip: {
                                trigger: 'item'
                            },
                            itemStyle: {
                                normal: {
                                    areaStyle: {
                                        type: 'default'
                                    }
                                }
                            },
                            data: series.map(s=>{
                                return {
                                    name:s.name,
                                    value:s.data.map((v,i)=>{
                                        return +series.scales[i].invert(v).toFixed(2);
                                    }),
                                    itemStyle:{
                                          normal:{color:s.color}
                                     }
                                }
                            })
                            // [{
                            //     name: 'Group1',
                            //     value: [2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 75.6, 82.2],
                            // }, {
                            //     name: 'Group2',
                            //     value: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 35.6, 62.2]
                            // }]
                        }
                    ]
                };

                myChart.setOption(option);
                // Highcharts.chart('community_dis', {
                //
                //     chart: {
                //         polar: true
                //     },
                //     credits: {
                //         enabled: false
                //     },
                //     title: {
                //         text: 'Highcharts Polar Chart',
                //         style: {
                //             display: "none"
                //         }
                //     },
                //
                //     pane: {
                //         size: "80%"
                //     },
                //
                //     xAxis: {
                //         categories: series.attrs,
                //         tickmarkPlacement: 'on',
                //         labels: {
                //             distance: 7
                //         }
                //     },
                //
                //     yAxis: {
                //         min: 0,
                //         visible: false
                //     },
                //     plotOptions: {
                //         enabled: false
                //     },
                //     tooltip: {
                //         // shared: true,
                //         formatter: function() {
                //             return `<span style="color:${this.series.color}">${this.series.name}: <br/>${this.x}:<b>${scales[prop_index[this.x].toString()].invert(this.y).toFixed(2)}</b></span>`
                //         }
                //     },
                //
                //     legend: {
                //         enabled: false
                //     },
                //     series: series
                // });
            }
        },
        findNeighbors(){

            var nodesByIndex = this.nodesByIndex,
                neighbors = this.neighbors,
                graph = this.graph,
                time = this.time,
                searchNode = this.searchNode,
                links = graph[time].links;
            //先清空邻居对象
            for(let key in neighbors) delete neighbors[key];
            if(searchNode!=''){
                for(let [i,l] of links.entries()){
                    if(l.source == searchNode){
                        neighbors[l.target]=1;
                    }else if(l.target == searchNode){
                        neighbors[l.source] = 1;
                    }else{
                        continue;
                    }
                }
            }
            console.log(neighbors);

        }
    },
    watch: {
        mds: function() {
            this.draw();
        },
        time: function() {
            this.initProperty();
            this.findNeighbors();
            this.draw();
        },
        mapAttr:function(){
            this.draw();
        },
        searchNode:function(){
            var _this = this;
            var tid = setTimeout(function(){
                clearTimeout(tid);
                _this.findNeighbors()
                _this.draw();
            }, 300)
            // this.draw();
        }
    },
    components: {}
};
</script>

<style lang="css" scoped>
.mdsCanvas{
    position: relative;
}

</style>
