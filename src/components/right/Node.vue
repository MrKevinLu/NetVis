<template lang="html">
    <transition name="fade">
        <circle class="i_item" :cx="cal_x(node)" :data-item="JSON.stringify(node)" :cy="cal_y(node)" r="3" :fill="color(mapAttr,node)" @mouseover="mouseOverHandler" @mouseout="mouseoutHandle"></circle>
        <!-- <rect :x= "local_timeScale(node.time)-10/2" :y="gen_y()-6/2" fill="green" width=10 height=6></rect> -->
    </transition>
</template>

<script>
import d3 from '../../lib/d3-extend'
import chroma from 'chroma-js'
import $ from 'jquery'
import {mapGetters} from 'vuex'
window.jQuery = window.$ = $;
require('velocity-animate');

// const prop_index = {
//     "a_deg":0,      // 总的节点度，非时变
//     "a_pub":1,        // 总的发表量，非时变
//     "t_avgW":2,       // 平均边权重，时变
//     "t_pub":3,        // 当年发表量，时变
//     "t_deg":4,     // 当年的节点度，时变
//     "t_dCent":5,   // 度中心性 节点的度/N-1  N为所有节点，时变
//     "t_avgC":6,       // 邻居节点的平均度中心性，时变
//     "t_cc":7,         // 聚集系数，节点的邻居之间的边与两两相连的边数（n(n-1)/2）的占比，时变
//     "t_venue":8       // 文章发表在1.期刊 2.会议 3.both
// };
const SVG_WH = {
    w: 650,
    h: 358
}

export default {
    props:['node',"index","len","mapAttr","orderAttr","local_timeScale","classed","nodeAttrScales","cal_x","cal_y","getDataByAttr","color"],
    data() {
        return {
            a:1
        };
    },
    computed: {
        ...mapGetters([
            "prop_index"
        ]),
        attr_data(){
            return this.$store.state.attr_data
        },
        index_prop(){
            return this.$store.state.index_prop;
        }

    },

    mounted() {
        // this.tooltip()
    },
    watch:{
        attr_data:function(){
            console.log("++++++++++");
        }
    },
    methods: {
        /*****   节点颜色映射方案   ****/
        // color(mapAttr,node){
        //     var scales = this.scales,
        //         values = node.values;
        //     if(mapAttr == "default"){
        //         var isPreExsit = node.data.isPreExsit;
        //         return isPreExsit==1?"lightgrey":(isPreExsit==2?"green":"purple");
        //     }else if(mapAttr!="t_venue"){
        //         var scale = scales[mapAttr],
        //             value = values[prop_index[mapAttr]];
        //         return chroma.scale(['#fee0d2', '#de2d26'])(scale(value));
        //     }else{
        //         var scale = scales["t_venue"];
        //         return scale(values[prop_index[mapAttr]])
        //     }
        // },
        /*****  上下文信息   *****/
        tooltip(){
            var _this = this,
                node = this.node;
            d3.selectAll(".i_item")
                .on("mouseover",function(d){
                    console.dir(node.data.cluster);
                })
                .on("mouseout",function(d){
                    d3.select(this).attr("fill","green")
                });
        },
        // cal_x(node){
        //     var timeScale = this.local_timeScale;
        //     return timeScale(node.time);
        // },
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
        //         var numOfG = node.data.cluster.numOfG,
        //             tIndex = node.data.cluster.tIndex,
        //             len = node.data.cluster.len,
        //             gIndex = node.data.cluster.gIndex;
        //
        //         var padding_top = (height-len*(2*r+item_padding)+item_padding*numOfG-(numOfG-1)*group_padding)/2;
        //         y = padding_top + r+(tIndex-1)*(item_padding+2*r)+(gIndex-1)*group_padding;
        //         // if(node.time == "2005") console.log(y,node.data.name);
        //     }
        //
        //     return y;
        // },
        mouseOverHandler(event){
            var _this = this,
                attr = _this.orderAttr,
                index_prop = _this.index_prop;

            var {target,offsetX,offsetY} = event,
                node = _this.node;
            var content = '';
            node.values.forEach((v,i)=>{
                content+=`</br>${index_prop[i]}:${v}`;
            })
            d3.select("."+_this.classed)
                .select(".tooltip")
                .style("left",function(d){
                    if(SVG_WH.w-offsetX>100)
                        return offsetX+10+"px"
                    else{
                        return offsetX-120+"px"
                    }
                })
                .style("top",offsetY-10+"px")
                .html(`gIndex:${node.data.cluster.gIndex}</br>index:${node.data.cluster.index}</br>tIndex:${node.data.cluster.tIndex}`)
                // .html(`<span class='hoverName'>${node.data.name}</span>${content}`)
                .style("display","block");
            // node.cluster.gIndex = +gIndex+1;
            // node.cluster.index = start++;
            // node.cluster.tIndex = (+i)+1;
            d3.select("."+_this.classed).selectAll(".i_item").attr("fill",function(){
                var d = _this.getDataByAttr(d3.select(this), "data-item");
                if(d.data.name == node.data.name){
                    return "gold"
                }else{
                    return 'lightgrey';
                }
            })
            d3.select("."+_this.classed).selectAll(".i_path").style("stroke",function(){
                var d = _this.getDataByAttr(d3.select(this), "data-item");
                if(d[0].data.name == node.data.name){
                    return "gold"
                }else{
                    return 'lightgrey';
                }
            })

        },
        mouseoutHandle(event){
            var _this = this,
                color = _this.color,
                mapAttr = _this.mapAttr,
                values = _this.values;
            var {target,offsetX,offsetY} = event;
            d3.select("."+_this.classed)
                .select(".tooltip")
                .style("display","none");

            d3.select("."+_this.classed).selectAll(".i_item").attr("fill",function(d){
                var d = _this.getDataByAttr(d3.select(this), "data-item");
                return color(mapAttr,d);
            })
            d3.select("."+_this.classed).selectAll(".i_path").style("stroke",function(){
                return 'lightgrey';
            })
        },

        // cal_x(node){
        //     var timeScale = this.local_timeScale;
        //     return timeScale(node.time);
        // },
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
        //         var numOfG = node.data.cluster.numOfG,
        //             tIndex = node.data.cluster.tIndex,
        //             len = node.data.cluster.len,
        //             gIndex = node.data.cluster.gIndex;
        //
        //         var padding_top = (height-len*(2*r+item_padding)+item_padding*numOfG-(numOfG-1)*group_padding)/2;
        //         y = padding_top + r+(tIndex-1)*(item_padding+2*r)+(gIndex-1)*group_padding;
        //         // if(node.time == "2005") console.log(y,node.data.name);
        //     }
        //
        //     return y;
        // },
        // getDataByAttr(selection, attrName){
        //     return JSON.parse(selection.attr(attrName))
        // },
        // color(mapAttr,node){
        //     var scales = this.nodeAttrScales,
        //         values = node.values,
        //         prop_index = this.prop_index;
        //     if(mapAttr == "default"){
        //         var isPreExsit = node.data.isPreExsit;
        //         return isPreExsit==1?"lightgrey":(isPreExsit==2?"green":"purple");
        //     }else if(mapAttr!="t_venue"){
        //         var scale = scales[mapAttr],
        //             value = values[prop_index[mapAttr]];
        //         return chroma.scale(['#fee0d2', '#de2d26'])(scale(value));
        //     }else{
        //         var scale = scales["t_venue"];
        //         return scale(values[prop_index[mapAttr]])
        //     }
        // },
    },
    components: {}
};
</script>

<style lang="css" scoped>
/*circle{
    stroke-width:1px;
    stroke:black;
}*/
.i_item::hover{
    fill:gold
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}

.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>
<style>
.hoverName{
    color:darkblue;
}
</style>
