<template lang="html">
    <div class="mdsCanvas" v-show="type == 'MDS'">
        <div class="arrow arrow-left" @click="preTime">
        </div>
        <div class="arrow arrow-right" @click="nextTime">
        </div>
        <canvas id="mds" width="550" height="550"  @mousedown="mousedown" @mousemove="mousemove" @mouseup="mouseup"></canvas>
    </div>
</template>

<script>
import d3 from '../../lib/d3-extend'
import {mapActions,mapGetters} from 'vuex'
import Vue from 'Vue'
import Highcharts from 'highcharts'

export default {
    props:["type","time"],
    data() {
        return {
            brushes:[],
            brush:{},
            margin:{
                left:40,
                top:40
            },
            groups:{},
            nodesByIndex:{},
            colors:["#ea4f4f","#f25ecd","#f2aa1a","#2f74ed"]
        };
    },
    computed: {
        ...mapGetters([
            "times",
            "prop_index",
            "quantile_scales"
        ]),
        quantile(){
            return this.quantile_scales.prop_quantile;
        },
        index_prop(){
            return this.$store.state.index_prop;
        },
        attr_data(){
            return this.$store.state.attr_data;
        },
        graph(){
            return this.$store.state.graph;
        },
        mds:function(){
            this.initProperty();
            var t = this.time,
                graph = this.graph,
                attr_data = this.attr_data,
                nodesByIndex = {};
            if(graph!=""){
                graph[t].nodes.forEach((n,i)=>{
                    nodesByIndex[i] = {
                        name:n.name,
                        values:attr_data[t][n.name]
                    }
                });
                this.nodesByIndex = nodesByIndex;
            }
            return this.$store.state.mds;
        },
        nodes:function(){
            var time = this.time,
                margin = this.margin,
                nodes = this.mds[time];
            if(nodes==undefined) return [];
            var x_min_max = d3.extent(nodes,(d)=>d[0]),
                y_min_max = d3.extent(nodes,(d)=>d[1]);
            var xScale = d3.scaleLinear()
                            .range([margin.left,550-margin.left])
                            .domain(x_min_max);
            var yScale = xScale.copy().range([margin.top,550-margin.top]).domain(y_min_max);

            nodes = nodes.map(d=>{
                return [xScale(d[0]),yScale(d[1])];
            })
            return nodes;
        }
    },
    methods: {
        ...mapActions([
            'selectYear'
        ]),
        draw:function(){
            var canvas = document.getElementById("mds"),
                ct = canvas.getContext("2d"),
                nodes = this.nodes,
                brushes = this.brushes;
                window.onkeydown = this.keydown;
                ct.clearRect(0,0, 550,550);

                this.drawCricles(ct, nodes);
                this.drawBrush(ct, brushes);

        },
        drawCricles(ct,nodes){
            for(let n of nodes){
                ct.beginPath();
                if(n.selected == true){
                    ct.fillStyle = n.color;
                }else{
                    ct.fillStyle = "lightgrey"
                }
                ct.arc(n[0],n[1],2,0,2*Math.PI);
                ct.fill();
                ct.closePath();
            }
        },
        drawBrush(ct, brushes){
            for(let b of brushes){
                var source = b.source,
                    target = b.target;
                ct.beginPath();
                ct.lineWidth = 2;
                ct.strokeStyle = b.color;
                ct.strokeRect(source[0],source[1],target[0]-source[0],target[1]-source[1])
                ct.closePath();
            }
        },
        mousedown(e){
            var brush = this.brush,
                brushes = this.brushes,
                colors = this.colors;
            if(e.shiftKey == true){
                brush.source = [e.offsetX,e.offsetY];
                brush.target = [];
                brush.color = colors[brushes.length];
                brushes.push(brush);
            }
        },
        mousemove(e){
            var brush = this.brush;
            if(e.shiftKey==true){
                brush.target = [e.offsetX, e.offsetY];
                if(brush.source!=undefined && brush.target!=undefined)
                    this.selecteNodes(brush.source, brush.target,brush.color);
                this.draw();
            }
        },
        mouseup(e){
            this.brush = [];
        },
        keydown(e){
            if(e.key == "c"){
                this.brushes = [];
                this.groups = {};
                this.nodes.forEach(n=>{
                    n.selected = false;
                })
                this.draw();
            }
            if(e.key == 'd'){
                var brushes = this.brushes,
                    groups = this.groups;

                if(brushes.length>0){
                    var nodes = this.nodes,
                        nodesByIndex = this.nodesByIndex;
                    brushes.forEach((d,i)=>{
                        Vue.set(groups,"group"+i,[]);
                    });
                    this.brushes.forEach((b,j)=>{
                        var source = b.source,
                            target = b.target;
                        nodes.forEach((n,i)=>{
                            if(n[0]>=source[0] && n[1]>=source[1] && n[0]<=target[0] && n[1]<=target[1]){
                                groups["group"+j].push(nodesByIndex[i]);
                            }
                        })
                    })
                }
                var attrs = ["a_deg","a_pub","t_pub"]
                // console.log(this.prop_index);
                // console.log(this.quantile);
                var series = this.getDistribution(attrs);
                this.drawDistribution(attrs,series);
            }
        },
        selecteNodes(source,target,color){
            var nodes = this.nodes;
            for(let [i,n] of nodes.entries()){
                if(n[0]>=source[0] && n[1]>=source[1] && n[0]<=target[0] && n[1]<=target[1]){
                    n.selected = true;
                    n.color = color;
                }
            }
        },
        preTime(){
            var time = this.time,
                times = this.times;
            if(time>times[0]){
                this.initProperty();
                this.selectYear(+time-1);
            }
        },
        nextTime(){
            var time = this.time,
                times = this.times;
            if(time<times[times.length-1]){
                this.initProperty()
                this.selectYear(+time+1);
            }
        },
        initProperty(){
            this.brushes = [];
            this.brush = [];
        },
        getDistribution(attrs){
            var groups = this.groups,
                quantile = this.quantile,
                prop_index = this.prop_index,
                series = [];

            Object.keys(groups).forEach(gName=>{
                var nodes = groups[gName];
                // console.log(nodes);
                var tmp_dis = {};
                attrs.forEach(attr=>{
                    tmp_dis[attr] = {
                        0:0,
                        1:0,
                        2:0
                    }
                });
                for(let n of nodes){
                    for(let a of attrs){
                        var index = prop_index[a];
                        if(n.values[index]<=quantile[a][0])
                            tmp_dis[a][0]++;
                        else if(n.values[index]<=quantile[a][1])
                            tmp_dis[a][1]++;
                        else{
                            tmp_dis[a][2]++;
                        }
                    }
                    // console.log(tmp_dis);
                }

                var arrays = [[],[],[]];


                attrs.forEach((a,i)=>{
                    Object.keys(tmp_dis[a]).sort((a,b)=>a-b).forEach((d)=>{
                        arrays[d].push(tmp_dis[a][d])
                    })
                })
                for(let [i,array] of arrays.entries()){
                    if(array.length!=0 && d3.sum(array)>0){
                        var name = i==0?"小于1/4":(i==1?"1/4-3/4":"大于3/4");
                        series.push({
                            "name":name,
                            "data":arrays[i],
                            "stack":gName
                        })
                    }
                }
            })

            return series;



        },
        drawDistribution(attrs, series){
            Highcharts.chart('community_dis', {
                    chart: {
                        type: 'column'
                    },
                    credits: { enabled:false },

                    xAxis: {
                        categories: ['a_deg', 'a_pub', 't_pub']
                    },
                    legend: {
                    	enabled:false
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
                        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
                        shared: true
                    },
                    plotOptions: {
                        column: {
                            stacking: 'percent'
                        }
                    },
                    series: series
                });
        }
    },
    watch:{
        mds:function(){
            this.draw();
        },
        time:function(){
            this.draw();
        }
    },
    components: {}
};
</script>

<style lang="css" scoped>
.mdsCanvas{
    position: relative;
}
.arrow{
    position:absolute;
    opacity:0.2;
}
.arrow-left{
    top:275px;
    left:10px;
    background-color: grey;

}
.arrow-right{
    right:10px;
    top:275px;
    background-color: grey;

}
.arrow-left:hover, .arrow-right:hover{
    cursor:pointer;
}
.arrow-left:before{
    display:block;
    content:"<";
    font-size:40px;
    color:black;
    padding-top:5px;
}
.arrow-right:before{
    display:block;
    content:">";
    font-size:40px;
    color:black;
    padding-top:5px;
}
</style>
