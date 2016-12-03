<template lang="html">
    <transition name="fade">
        <path :d="generate_d(path_group)" class="i_path" :data-item="JSON.stringify(path_group)" @mouseover="mouseOverHandler" @mouseout="mouseoutHandle"></path>
    </transition>
</template>

<script>
import d3 from '../../lib/d3-extend'

export default {
    props:['path_group',"index","orderAttr","mapAttr","local_timeScale","classed"],
    data() {
        return {};
    },
    computed: {},
    methods: {
        generate_d(group){
            var context = d3.path();
            this.drawPath(context,group);
            return context.toString();
        },
        color(mapAttr,node){
            if(mapAttr == "isNew"){
                var isPreExsit = node.data.isPreExsit;
                return isPreExsit==1?"lightgrey":(isPreExsit==2?"green":"purple");
            }
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

        cal_x(node){
            var timeScale = this.local_timeScale;
            return timeScale(node.time);
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
            }

            return y;
        },

        mouseOverHandler(event){
            var _this = this;
            var {target,offsetX,offsetY} = event,
                nodes = _this.path_group;

            d3.select("."+_this.classed)
                .select(".tooltip")
                .style("left",offsetX+10+"px")
                .style("top",offsetY-10+"px")
                .text(nodes[0].data.name)
                .style("display","block");

            d3.select("."+_this.classed).selectAll(".i_item").attr("fill",function(){
                var d = _this.getDataByAttr(d3.select(this), "data-item");
                if(d.data.name == nodes[0].data.name){
                    return "gold"
                }else{
                    return 'lightgrey';
                }
            })
            d3.select("."+_this.classed).selectAll(".i_path").style("stroke",function(){
                var d = _this.getDataByAttr(d3.select(this), "data-item");
                if(d[0].data.name == nodes[0].data.name){
                    return "gold"
                }else{
                    return 'lightgrey';
                }
            })

        },
        mouseoutHandle(event){
            var _this = this,
                color = _this.color,
                mapAttr = _this.mapAttr;

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

        getDataByAttr(selection, attrName){
            return JSON.parse(selection.attr(attrName))
        }
    },
    components: {}
};
</script>

<style lang="css" scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
.i_path{
    fill:none;
    stroke:lightgrey;
    stroke-width:2px;
}
</style>
