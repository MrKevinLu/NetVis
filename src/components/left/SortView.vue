<template lang="html">
    <div class="sortView">
        <div class="controls">
            <div class="sortAttr clearfix">
                <div v-for="attr in attrs" class="legend" :class="{color1:attr=='Deg',color2:attr=='Pub',color3:attr=='Both',activeSort:attr==sortType}" @click="changeSortType(attr)">{{attr}}</div>
            </div>
            <div class="weight">
                <span>weight:</span> <input type="range" max=1 step=0.1 value=0.5 style="display:inline-block"></input>
            </div>
        </div>
        <div class="nodeList">
            <div class="n-row title">
                <div class="flex-1">id</div>
                <div class="flex-1">Deg</div>
                <div class="flex-1">Pub</div>
            </div>
            <div v-for="n in c_PageNodes" class="n-row">
                <div class="flex-1">
                    {{n[0]}}
                </div>
                <div class="flex-2 clearfix">
                    <div class="data-col data-col-1" :style="{width:scales.a_deg(n[2][0])+'px'}"></div>
                    <div class="data-col data-col-2" :style="{width:scales.a_pub(n[2][1])+'px'}"></div>
                </div>
            </div>
        </div>
        <div class="page_divide">
            <pagination v-on:changePage="changePage" :currentPage="c_PageIndex" :itemNum="4" :nodes="nodes" :totalNum="10"></pagination>
        </div>
    </div>
</template>

<script>
import Pagination from './Pagination.vue'
import d3 from '../../lib/d3-extend'

export default {
    data() {
        return {
            arr:[1,2,3,4,5,6,7,8,9,10],
            scales:'',
            sortType:"Both",
            c_PageNodes:[],
            numOfEachPage:10,
            c_PageIndex:1,
            attrs:["Deg","Pub","Both"]
        };
    },
    computed: {
        nodes:function(){
            var attr_data = this.$store.state.attr_data,
                nodes={},
                scales={
                    a_deg:'',
                    a_pub:''
                },
                index = 1;
            if(attr_data=="") return [];
            console.log(attr_data);
            for(let t in attr_data){
                for(let name in attr_data[t]){
                    var values = attr_data[t][name];
                    if(nodes[name]==undefined){
                        nodes[name] = [values[0],values[1]]   // 0:a_deg  1:a_pub

                    }
                }
            }
            console.log(nodes);
            nodes = Object.keys(nodes).map((d,i)=>{
                return [i,d,nodes[d]]
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
        }
    },
    events:{
        "next-page":function(index){
            this.pageIndex = index;
        }
    },
    methods: {
        sort:function(){
            var nodes = this.nodes,
                type = this.sortType,
                deg_scale = this.scales.a_deg,
                pub_scale = this.scales.a_pub,
                percent1 = 0.5,
                percent2 = 0.5;
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
            this.c_PageNodes = nodes.slice(start, start+numOfEachPage);
            for(let n of this.c_PageNodes){
                console.log(n[1],this.scales["a_deg"](n[2][0]),this.scales["a_pub"](n[2][1]));

            }
        },
        changePage(page){
            this.c_PageIndex = page;
            // console.log(this.pageIndex);
        },
        changeSortType(attr){
            this.sortType = attr;

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
            console.log("++++++++++");
            console.log(this.c_PageIndex);
            var nodes = this.nodes;
            var pageIndex = this.c_PageIndex,
                numOfEachPage = this.numOfEachPage;
            var start = (pageIndex-1)*numOfEachPage;
            this.c_PageNodes = nodes.slice(start, start+numOfEachPage);
        }
    },
    components: {
        Pagination
    }
};
</script>

<style lang="css">
.sortView{
    flex:1;
    display:flex;
    flex-direction: column;
    font-size:12px;
}
.controls{
    width:100%;
    height:100px;
    border-top: 1px lightgrey solid;
}
.nodeList{
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
    line-height: 30px;
    border-top: 1px lightgrey solid;
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
.clearfix:after{
    display:block;
    content:'';
    opacity: none;
    clear:both;
}
.data-col{
    float:left;
    margin-top:4px;
    height:22px;
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
