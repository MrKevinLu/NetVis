<template lang="html">
    <div class="sortView">

        <div class="controls">
            <div class="sortAttr clearfix">
                <div v-for="attr in attrs" class="legend" :class="{color1:attr=='Deg',color2:attr=='Pub',color3:attr=='Both',activeSort:attr==sortType}" @click="changeSortType(attr)">{{attr}}</div>
            </div>
            <div class="weight">
                <span>weight:</span> <input type="range" max="1" step="0.1" v-model="weight" style="display:inline-block"></input>
            </div>
            <div class="showType">
                <input type="radio" id="one" value="global" v-model="showType">
                <label for="one">Global</label>
                <input type="radio" id="two" value="snapshot" v-model="showType">
                <label for="two">Snapshot</label>
            </div>
        </div>
        <div class="nodeList">
            <div class="tooltip">

            </div>
            <div class="n-row title">
                <div class="flex-1">id</div>
                <div class="flex-1">Deg</div>
                <div class="flex-1">Pub</div>
            </div>
            <div v-for="n in c_PageNodes" class="n-row" @mouseover="mouseoverHandle(n[0],$event)" @mouseout="mouseoutHandle" @click="selectHandler(n[0])">
                <div class="flex-1">
                    {{n[0]}}
                </div>
                <div class="attr-column flex-2 clearfix">
                    <div :class="{'data-col-heat':sortType=='Both','data-col-seperate-1':sortType!='Both', 'data-col-1':true}" :style="{width:scales.a_deg(n[2][0])*2*weight+'px'}" >{{hovered == n[0]?n[2][0]:""}}</div>
                    <div :class="{'data-col-heat':sortType=='Both','data-col-seperate-2':sortType!='Both', 'data-col-2':true}" :style="{width:scales.a_pub(n[2][1])*2*(1-weight)+'px'}" >{{hovered == n[0]?n[2][1]:""}}</div>
                </div>
            </div>
        </div>
        <div class="page_divide">
            <pagination v-on:changePage="changePage" :currentPage="c_PageIndex" :itemNum="4" :nodes="nodes" :totalNum="Math.round(nodes.length/10)"></pagination>
        </div>
    </div>
</template>

<script>
import Pagination from './Pagination.vue'
import d3 from '../../lib/d3-extend'
import {mapGetters,mapActions} from 'vuex'

export default {
    data() {
        return {
            scales:'',
            sortType:"Both",
            c_PageNodes:[],
            numOfEachPage:15,
            c_PageIndex:1,
            attrs:["Deg","Pub","Both"],
            hovered:"",
            showType:"global",
            weight:0.5
        };
    },
    computed: {
        ...mapGetters([
            'index_to_node'
        ]),
        ori_nodes:function(){
            var attr_data = this.$store.state.attr_data,
                node_to_index = this.$store.state.node_to_index,
                nodes={},
                scales={
                    a_deg:'',
                    a_pub:''
                },
                index = 1;
            if(attr_data=="") return [];
            for(let t in attr_data){
                for(let name in attr_data[t]){
                    var values = attr_data[t][name];
                    if(nodes[name]==undefined){
                        nodes[name] = [values[0],values[1]]   // 0:a_deg  1:a_pub

                    }
                }
            }
            // console.log(nodes);
            nodes = Object.keys(nodes).map((d,i)=>{
                return [node_to_index[d],d,nodes[d]]
            });

            var deg_min_max = d3.extent(nodes,function(d){return d[2][0]});
            var pub_min_max = d3.extent(nodes,function(d){return d[2][1]});
            console.log(deg_min_max);
            console.log(pub_min_max);

            scales.a_deg = d3.scaleLinear()
                            .domain(deg_min_max)
                            .range([1,62]);

            scales.a_pub = d3.scaleLinear()
                            .domain(pub_min_max)
                            .range([1,62]);

            this.scales = scales;

            return nodes;
        },
        nodes:function(){
            var showType = this.showType,
                nodes = this.ori_nodes,
                time = this.$store.state.currentTime,
                attr_data = this.$store.state.attr_data;

            if(showType == "global")
                return nodes;
            else{
                return nodes.filter(d=>{
                    return attr_data[time][d[1]]!=undefined?true:false;
                })
            }
        },

        node_to_index(){
            return this.$store.state.node_to_index;
        }

    },


    methods: {
        ...mapActions([
            "addIndividual"
        ]),
        sort:function(){
            var nodes = this.nodes,
                type = this.sortType,
                deg_scale = this.scales.a_deg,
                pub_scale = this.scales.a_pub,
                percent1 = this.weight,
                percent2 = 1-percent1;
            //排序
            if(type == "Both"){
                nodes.sort((a,b)=>{
                    return (deg_scale(b[2][0])*percent1+pub_scale([b[2][1]])*percent2)-(deg_scale(a[2][0])*percent1+pub_scale([a[2][1]])*percent2);
                })
            }else if(type == "Deg"){
                nodes.sort((a,b)=>{
                    return deg_scale(b[2][0])-deg_scale(a[2][0]);
                })
            }else{
                nodes.sort((a,b)=>{
                    return pub_scale(b[2][1])-pub_scale(a[2][1]);
                })
            }

            //更新当前页节点
            var nodes = this.nodes;
            var pageIndex = this.c_PageIndex,
                numOfEachPage = this.numOfEachPage;
            var start = (pageIndex-1)*numOfEachPage;
            if(start+numOfEachPage>nodes.length){
                this.c_PageNodes = nodes.slice(start)
            }else{
                this.c_PageNodes = nodes.slice(start, start+numOfEachPage);
            }
            // for(let n of this.c_PageNodes){
            //     console.log(n[1],this.scales["a_deg"](n[2][0]),this.scales["a_pub"](n[2][1]));
            // }
        },
        changePage(page){
            this.c_PageIndex = page;
            // console.log(this.pageIndex);
        },
        changeSortType(attr){
            this.sortType = attr;

        },
        mouseoverHandle(id,e){
            this.hovered = id;
            var index_to_node = this.index_to_node;
            var x = e.layerX,
                y = e.layerY;
            d3.select(".sortView").select(".tooltip")
                    .style("left",x+5+"px")
                    .style("top",y-25+"px")
                    .text(index_to_node[id])
                    .style("display","block");
        },
        mouseoutHandle(){
            d3.select(".sortView .tooltip").style("display","none");
            this.hovered = "";
        },
        selectHandler(id){
            var index_to_node = this.index_to_node;
            this.addIndividual(index_to_node[id]);
        }

    },
    watch:{
        nodes:function(n_nodes,o_nodes){
            this.sort();
        },
        sortType:function(){
            this.sort();
        },
        c_PageIndex:function(){
            var nodes = this.nodes;
            var pageIndex = this.c_PageIndex,
                numOfEachPage = this.numOfEachPage;
            var start = (pageIndex-1)*numOfEachPage;
            this.c_PageNodes = nodes.slice(start, start+numOfEachPage);
        },
        showType:function(n){
            console.log(this.nodes.length);
        },
        weight:function(n){
            this.sort();
        }
    },
    components: {
        Pagination
    }
};
</script>

<style lang="css" scoped>
.sortView{
    flex:1;
    display:flex;
    flex-direction: column;
    font-size:12px;
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
    z-index:999;
}
.controls{
    width:100%;
    height:100px;
    border-top: 1px lightgrey solid;
}
.nodeList{
    position:relative;
    width:100%;
    flex:1;
}
.page_divide{
    width:100%;
    height:40px;
}
.nodeList{
    display:flex;
    flex-direction: column;
    text-align: center;
    font-size:14px;
}
.nodeList div{
    /*border:1px lightgrey solid;*/
}
.n-row{
    display:flex;
    flex:1;
    line-height: 20.5px;
    border-top: 1px lightgrey solid;
}
.n-row title{
    background-color: #edeaea;
}
.n-row:last-child{
    border-bottom: 1px lightgrey solid;
}
.n-row:hover{
    background-color: #f2efef;
}
.flex-1{
    flex:1
}
.flex-2{
    flex:2;
    text-align: left;
}
.attr-column{
    position: relative;
}
.clearfix:after{
    display:block;
    content:'';
    opacity: none;
    clear:both;
}
.data-col-heat{
    float:left;
    margin-top:4px;
    height:13px;
}
.data-col-seperate-1,.data-col-seperate-2{
    position:absolute;
}
.data-col-seperate-1{
    left:0;
    top:4px;
    height:13px;
}
.data-col-seperate-2{
    left:64px;
    top:4px;
    height:13px;
}

.data-col-1{
    background-color: pink;
}
.data-col-2{
    background-color:lightblue;
}
.legend{
    float:left;
    border-radius: 10px;
    padding:0 5px;
    background-color:#ABA6A6;
    color:white;
    margin-right:5px;
}
.legend::after{
    display:inline-block;
    position:relative;
    content:"";
    width:12px;
    height:12px;
    border-radius:6px;
    line-height: 15px;
    text-align: center;
    top:2px;
    left:2px;
}
.legend:after:hover{
    cursor: pointer;
}
.legend:hover{
    cursor:pointer;
}
.color1:after{
    background-color: pink;
}
.color2:after{
    background-color:lightblue;
}
.color3:after{
    background-color: purple;
}
.activeSort{
    background-color: #f4bc2e;
    color:white;
    opacity: 0.8;
}
.controls>div{
    margin-left:10px;
}
.weight span,.weight input{
    display:inline-block;
}
.weight span{
    margin-right:5px;
}
.weight input{
    width:100px;
    vertical-align: middle;
    padding-left:10px;
}
.sortAttr, .weight{
    height:25px;
    line-height: 25px;
}
.sortAttr,.weight{
    margin:5px
}
</style>
