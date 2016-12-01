<template lang="html">
    <transition name="fade">
        <circle class="i_item" :cx="local_timeScale(node.time)" :cy="cal_y(node)" r="3" :fill="color()"></circle>
        <!-- <rect :x= "local_timeScale(node.time)-10/2" :y="gen_y()-6/2" fill="green" width=10 height=6></rect> -->
    </transition>
</template>

<script>
import d3 from '../../lib/d3-extend'
export default {
    props:['node',"index","len","mapAttr","orderAttr","local_timeScale"],
    data() {
        return {

        };
    },
    computed: {
        attr_data(){
            return this.$store.state.attr_data
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
        color(){
            var mapAttr = this.mapAttr,
                node = this.node;
            if(mapAttr == "isNew"){
                var isPreExsit = node.isPreExsit;
                return isPreExsit==1?"green":(isPreExsit==2?"lightgrey":"purple");
            }
        },
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
        cal_y(node){
            var orderAttr =this.orderAttr;
            var y,
                item_padding = 2,   // 节点之间间距
                group_padding = 8,  // 子群之间间距
                r = 3,          // 圆半径或者rect高度的一半
                height = 308;   // 绘制空间

            if(orderAttr != "cluster"){
                var scale = d3.scalePoint()
                             .padding(0.7)
                             .domain([1,2,3])
                             .range([height,0])

                var groupIndex = node.data.group.gIndex,
                    len = node.data.group.len,
                    index = node.data.group.index;
                y = scale(groupIndex)-((len-1)/2*(item_padding+r))+(index-1)*(item_padding+2*r);
            }else{
                var numOfG = node.data.cluster.numOfG,
                    tIndex = node.data.cluster.tIndex,
                    len = node.data.cluster.len,
                    gIndex = node.data.cluster.gIndex;

                var padding_top = (height-len*(2*r+item_padding)+item_padding*numOfG-(numOfG-1)*group_padding)/2;
                y = padding_top + r+(tIndex-1)*(item_padding+2*r)+(gIndex-1)*group_padding;
                // if(node.time == "2005") console.log(y,node.data.name);
            }

            return y;
        }
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
