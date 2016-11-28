<template lang="html">
    <div class="individual">
        <div id="individual_1" class="i_container">
            <svg width=550 height=335>
                <!-- <transition-group name="list" tag="p"> -->
                    <!-- <p v-for="i in nodes" v-bind:key="i">{{i}}</p> -->
                    <node v-for="(n,index) in nodes" v-bind:key="index" :node="n" :index="index" :timeScale="timeScale" :len="nodes.length" :orderAttr='orderAttr' :mapAttr='mapAttr'></node>
                <!-- </transition-group> -->
            </svg>
        </div>
        <div id="individual_2" class="i_container">
            <!-- <svg width=550 height=335 id="svg2">
            </svg> -->
        </div>
        <button id="change">change</button>
    </div>
</template>

<script>
import d3 from '../../lib/d3-extend'
import Highcharts from 'highcharts'
import Node from './Node.vue'

export default {
    data() {
        return {
            t_extent_1:["1996","2016"],
            t_extent_2:[],
            individual_1: "",
            individual_2: "",
            orderAttr: "cluster",
            selected: "Kwan-Liu Ma",
            mapAttr: "t_pub",
            test1:[{id:1,data:1},{id:2,data:2},{id:3,data:3},{id:4,data:4}]

            // nodes:[[10,10],[20,20],[30,30]]
        };
    },
    computed: {
        timeScale(){
            var tr = this.t_extent_1;
            if(tr == []) return "";
            var timesRange = d3.range(Number(tr[1])-Number(tr[0])+1).map((d,i)=>{
                return Number(tr[0])+i+"";
            })
            // var extent = d3.extent(timesRange);
            console.log(timesRange);
            var t_scale = d3.scaleBand()
                .domain(timesRange)
                .range([30,500]);

            return t_scale;
        },
        nodes(){
            var graph = this.$store.state.graph;
            if(graph=="") return [];
            var start = this.t_extent_1[0],
                end = this.t_extent_1[1],
                selected = this.selected,
                coNodes = [];
            var i_times = d3.range((+end)-(+start)+1).map((d,i)=>(Number(start)+i)+"");
            // console.log(i_times);
            for(let t of i_times){
                var nodes = graph[t].nodes;
                var nodeByName = d3.map(nodes,function(d){
                    return d.name;
                });
                var links = graph[t].links;
                for(let l of links){
                    var source = typeof l.source=="object"?l.source.name:l.source,
                        target = typeof l.target=="object"?l.target.name:l.target;
                    // console.log(source,target);
                    if(source == selected) coNodes.push({
                        time:t,
                        data:nodeByName.get(target)
                    })
                    if(target == selected) coNodes.push({
                        time:t,
                        data:nodeByName.get(source)
                    })
                }
            }
            // console.log(coNodes);
            return coNodes;
        },
        // 获取个体中心网络中的属性比例尺
        i_scales(){
            var attr_data = this.$store.state.attr_data;
            if(attr_data=="") return;

            var index_prop = this.$store.state.index_prop;
            var i_scales = {};
            var domains = {};
            Object.keys(index_prop).forEach(k=>{
                i_scales[index_prop[k]] = d3.scaleLinear().range([30,300])
                domains[index_prop[k]] = [];
            });
            // console.dir(domains);
            //
            // for(let t in attr_data){
            //     for(name in attr_data[t]){
            //         var values = attr_data[t][name];
            //         values.forEach((v,i)=>{
            //             domains[index_prop[i]].push(v)
            //         })
            //     }
            // }
            //
            // for(let attr in i_scales){
            //     var extent = d3.extent(domains[attr]);
            //     console.log(extent);
            //     i_scales[attr].domain(extent);
            // }
            //
            // return i_scales
        }
    },
    ready() {},
    attached() {},
    mounted(){
        this.draw();
    },
    watch:{
        nodes:function(n,o){
            // console.log(this.i_scales);
        },
        i_scales:function(n){
            console.log(n);
        },
        timeScale:function(n){
            console.log(n);
        }
    },
    methods: {
        updateDate(){
            // var randomData = d3.range(7).map(d=>{
            //     var id = Math.floor(d3.randomUniform(0,1500)());
            //     var data = d3.randomUniform(1,10)();
            //     return {
            //         id,
            //         data
            //     }
            // })
            // console.log(randomData);
            //
            // var update = d3.selectAll("#svg2 circle").data(randomData,function(d){return d.id});
            var div = d3.selectAll("#individual_2 div").data([1, 2, 4, 8, 16, 32], function(d) { return d; });
            div.enter().append("div").text(function(d) { return d; });
            div.exit().remove();

            // update.enter().append("circle")
            //     .attr("cx",function(d){
            //         return d.data*20;
            //     })
            //     .attr("cy",function(d){
            //         return d.data*20;
            //     })
            //     .attr("r",5)
            //     .attr("fill","red");
            //
            // update.exit().remove();

        },
        draw(){
            var div = d3.select("#individual_2")
                        .selectAll("div")
                        .data([4, 8, 15, 16, 23, 42])
                        .enter().append("div")
                        .text(function(d) { return d; });

            d3.select("#change").on("click",function(){
                div = d3.selectAll("#individual_2 div").data([1, 2, 4, 8, 16, 32], function(d) { return d; });

                div.exit().remove();
                div.enter().append("div").text(function(d) { return d; });
            })
            // var selected = this.individual_1,
            //     extent = this.t_extent_1,
            //     width = d3.select

        }
    },
    components: {
        Node
    }
};
</script>

<style lang="css" scoped>
    .individual{
        display:flex;
        flex-direction:column;
        width:100%;
        height:670px;
    }
    #individual_1{
        flex:1;
    }
    #individual_2{
        flex:1;
    }
    /*.list-item {
      display: inline-block;
      margin-right: 10px;
    }
    .list-enter-active, .list-leave-active {
      transition: all 1s;
    }
    .list-enter, .list-leave-active {
      opacity: 0;
      transform: translateY(30px);
    }*/

</style>
