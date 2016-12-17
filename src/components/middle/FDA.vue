<template lang="html">
    <canvas id="fda" width="550" height="550" v-show="type == 'FDA'"></canvas>
</template>

<script>
import d3 from '../../lib/d3-extend'
import jLouvain from '../../lib/jLouvain'
import {mapActions} from 'vuex'
const xScale = d3.scaleLinear()
                .domain([0,550])
                .range([0,550]);

const yScale = d3.scaleLinear()
                .domain([0,550])
                .range([550,0]);

export default {
    props:["type","time"],
    data() {
        return {
            context:"",
            canvasDom:'',
            newScaleX: xScale.copy(),
            newScaleY: yScale.copy(),
            k:0.1,
            hoverNode:'',
            colorInterpolation:"",
            nodeColor:'',
            mousemoveTimeout:''
        };
    },
    computed: {
        graph:function(){
            return this.$store.state.graph;
        },
        attr_data:function(){
            return this.$store.state.attr_data;
        },
        nodes:function(){
            var time = this.time;
            if(this.graph!=""){
                return this.graph[time].nodes;
            }else{
                return [];
            }
        },
        links:function(){
            var time = this.time;
            if(this.graph!=""){
                return this.graph[time].links;
            }else{
                return [];
            }
        },
        canvasSize:function(){
            var width = this.canvasDom.width?this.canvasDom.width:550,
                height = this.canvasDom.width?this.canvasDom.width:550;

            return {
                width,
                height
            }
        },
        rScale:function(){
            var attr_data = this.attr_data,
                nodes = this.nodes,
                t = this.time;
            var degs = nodes.filter(n=>!n.name.startsWith("group")).map(n=>{
                // 4为t_deg在数组的序号
                var deg = attr_data[t][n.name][4];
                return n.deg = deg;
            })
            var min_max = d3.extent(degs);
            var scale = d3.scaleLinear()
                            .domain(min_max)
                            .range([2,5]);
            return scale;
        }
    },
    mounted(){
        this.initContext();
    },
    methods: {
        ...mapActions([
            "addIndividual"
        ]),
        initContext(){
            var canvas = document.getElementById('fda'),
                ctx = canvas.getContext('2d');
            this.context = ctx;
            this.canvasDom = canvas;
            this.initEventHandlers();
        },
        initCoordinate(){
            var _this = this,
                width = _this.canvasSize.width,
                height = _this.canvasSize.height,
                nodes = _this.nodes,
                links = _this.links,
                canvas = document.getElementById("fda");

            // 给每个节点打社区标签
            _this.detectCommunity()

            //给每个社区添加社区中心
            _this.addCommunityCentric();
            // 设置节点颜色函数
            _this.nodeColor = (groupIndex)=>{
                return d3.interpolateRainbow(_this.colorInterpolation(groupIndex));
            }

            // 缩放行为
            var zoom = d3.zoom().scaleExtent([0.1, 8]).on("zoom", _this.zoom);
            d3.select(canvas).call(zoom).call(zoom.scaleTo,0.1);

            // 设置力
            var simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) {
                    return d.name;
                }).distance(function(l){
                    return (l.source.community == l.target.community)?10:70
                }))
                .force("charge", d3.forceManyBody().strength(function(d){
                    return -20;
                }))
                .force("center", d3.forceCenter(width / 2, height / 2));

            simulation
                .nodes(nodes)
                .on("tick", ticked)
                .on("end",function(){
                    // console.log(_this.links);
                });

            simulation.force("link")
                .links(links);

            function ticked(){
                _this.draw();
            }

        },
        initEventHandlers(){
            var canvas = this.canvasDom;
            d3.select("canvas").on("mousemove",this.mousemoveHandler)
                               .on("click",this.clickHandler);
        },

        draw(){
            this.clearCanvas();
            this.drawBackground();
            this.drawShadows();
            this.drawLinks();
            this.drawNodes();
            this.drawTooltips();
        },
        clearCanvas(){
            var ctx = this.context;
            var width = this.canvasSize.width,
                height = this.canvasSize.height;
            ctx.clearRect(0,0,width,height);
        },
        drawBackground(){
            var ctx = this.context;
            var width = this.canvasSize.width,
                height = this.canvasSize.height;
            ctx.beginPath()
            ctx.fillStyle="black";
            ctx.fillRect(0,0,width,height);
        },
        drawShadows(){
            var ctx = this.context;
        },
        drawNodes(){
            var nodes = this.nodes,
                ctx = this.context,
                xScale = this.newScaleX,
                yScale = this.newScaleY,
                rScale = this.rScale,
                color = this.nodeColor;

            for(let [i,n] of nodes.entries()){
                if(n.name.startsWith("group")) continue;
                ctx.beginPath();
                ctx.fillStyle = color(n.community)
                var r = n.hoveron?rScale(n.deg)*1.5:rScale(n.deg);
                ctx.arc(xScale(n.x), yScale(n.y), r, 0, 2 * Math.PI);
                ctx.fill();
                if(n.hoveron){
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "white";
                    ctx.stroke();
                }
            }
        },
        drawLinks(){
            var links = this.links,
                ctx = this.context,
                xScale = this.newScaleX,
                yScale = this.newScaleY,
                hoverNode = this.hoverNode;
            for(let l of links){
                if(l.source.name.startsWith("group") || l.target.name.startsWith("group")) continue;
                ctx.beginPath()
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(255, 170, 0, 0.4)'
                if(hoverNode!=''){
                    if(l.source.name == hoverNode.name || l.target.name==hoverNode.name){
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
                    }else{
                        ctx.strokeStyle = 'rgba(201, 199, 199,0.1)'
                    }
                }
                ctx.moveTo(xScale(l.source.x),yScale(l.source.y));
                ctx.lineTo(xScale(l.target.x),yScale(l.target.y))
                ctx.stroke();
            }
        },
        drawTooltips(){
            var ctx = this.context,
                hoverNode = this.hoverNode,
                xScale = this.newScaleX,
                yScale = this.newScaleY;
            if(hoverNode!=""){
                ctx.beginPath()
                // ctx.lineWidth = 1;
                ctx.fillStyle = "lightgrey"
                ctx.font = 'bold 14px Georgia';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(hoverNode.name, xScale(hoverNode.x)+15,yScale(hoverNode.y)-15);
            }
        },
        zoom(){
            this.k = d3.event.transform.k;
            this.newScaleX = d3.event.transform.rescaleX(xScale);
            this.newScaleY = d3.event.transform.rescaleY(yScale);
            this.draw();
        },
        /************  社区检测  **************/
        detectCommunity(){
            var nodes = this.nodes,
                links = this.links;

            var id_index = {};
            var community = jLouvain().nodes(nodes.map((d, i) => {
                var key = d.id||d.name
                id_index[key] = i;
                return i;
            })).edges(this.links.map(l => {
                return {
                    weight: l.weight || l.value,
                    source: id_index[l.source],
                    target: id_index[l.target]
                };
            }));
            var community_assignment_result = community();

            var max_community_number = 0;
            this.nodes.forEach((d, i) => {
                d.community = community_assignment_result[i];
                max_community_number = max_community_number < community_assignment_result[i] ? community_assignment_result[i] : max_community_number;
            })
            // console.log(max_community_number);
            this.colorInterpolation = d3.scaleLinear()
                            .domain([0,max_community_number])
                            .range([0,1])
        },
        addCommunityCentric(){
            var nodes = this.nodes,
                links = this.links;
            var nodeByGroup = d3.nest().key((d)=>d.community).map(nodes);
            for(let [i,n] of nodes.entries()){
                var groupName = "group"+n.community,
                    weight = nodeByGroup.get(n.community+"").length;
                if(weight<=1) continue;
                links.push({
                    source:groupName,
                    target:n.name,
                    weight
                })
            }
            for(let k of nodeByGroup.keys()){
                if(nodeByGroup.get(k).length<=1) continue;
                nodes.push({
                    name:"group"+k,
                    community:+k,
                    deg:nodeByGroup.get(k).length
                })
            }

            // 改变links
            var nodeByName = d3.map(nodes,(n)=>n.name);
            for(let l of links){
                // console.log(nodeByName.get(l.source),nodeByName.get(l.target));
                l.source = nodeByName.get(l.source);
                l.target = nodeByName.get(l.target);
            }

        },

        mousemoveHandler(){
            clearTimeout(this.mousemoveTimeout)
            var _this = this;
            var nodes = _this.nodes,
                rScale = _this.rScale,
                mouseX = d3.event.offsetX,
                mouseY = d3.event.offsetY,
                xScale = _this.newScaleX,
                yScale = _this.newScaleY,
                flag = false;
            this.mousemoveTimeout = setTimeout(function(){
                for(let n of nodes){
                    var r = rScale(n.deg),
                        cx = xScale(n.x),
                        cy = yScale(n.y);
                    if(!n.name.startsWith("group") && Math.pow(cx-mouseX,2)+Math.pow(cy-mouseY,2)<r*r){
                        _this.hoverNode = n
                        n.hoveron = true
                        flag = true;
                        break;
                    }else{
                        n.hoveron = false;
                    }
                }
                if(!flag){
                    _this.hoverNode = ''
                };
                _this.draw();
            },100)

        },

        /*****    选择个体中心     ******/
        clickHandler(){

            var nodes = this.nodes,
                rScale = this.rScale,
                mouseX = d3.event.offsetX,
                mouseY = d3.event.offsetY,
                xScale = this.newScaleX,
                yScale = this.newScaleY;
            var selectedNode = '';
            for(let n of nodes){
                var r = rScale(n.deg),
                    cx = xScale(n.x),
                    cy = yScale(n.y);
                if(!n.name.startsWith("group") && Math.pow(cx-mouseX,2)+Math.pow(cy-mouseY,2)<r*r){
                    selectedNode = n;
                    break;
                }
            }
            if(selectedNode!=''){
                this.addIndividual(selectedNode.name)
                console.log(selectedNode.name);
            }
        }

    },
    watch:{
        graph:function(){
            this.initCoordinate()
            this.draw()
        }
    },
    components: {}
};
</script>

<style lang="css">
</style>
