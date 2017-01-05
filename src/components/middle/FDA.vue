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
    props:["type","time","searchNode","comDistribute"],
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
            mousemoveTimeout:'',
            threshold:0.3,
            kScale: d3.scaleLinear().range([1,0]).domain([0.1,8])

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
            var time = this.time,
                attr_data = this.attr_data,
                nodes;
            if(this.graph!=""){
                nodes = this.graph[time].nodes.map(n=>{
                    return {
                        name:n.name
                    }
                })
                // return this.graph[time].nodes;
            }else{
                nodes = [];
            }

            var degs = nodes.filter(n=>!n.name.startsWith("group")).map(n=>{
                // 4为t_deg在数组的序号
                var deg = attr_data[time][n.name][4];
                return n.deg = deg;
            })
            // console.log(nodes);
            return nodes;
        },

        links:function(){
            var time = this.time;
            if(this.graph!=""){
                return this.graph[time].links.map(l=>{
                    return {
                        source:l.source,
                        target:l.target,
                        weight:l.weight,
                        venue:l.venue
                    }
                })
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
            var deg_min_max = d3.extent(nodes,n=>n.deg);
            // var degs = nodes.filter(n=>!n.name.startsWith("group")).map(n=>{
            //     // 4为t_deg在数组的序号
            //     var deg = attr_data[t][n.name][4];
            //     return n.deg = deg;
            // })
            // var min_max = d3.extent(degs);
            var scale = d3.scaleLinear()
                            .domain(deg_min_max)
                            .range([3,7]);
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
        init(){
            var _this = this,
                width = _this.canvasSize.width,
                height = _this.canvasSize.height,
                nodes = _this.nodes,
                links = _this.links,
                canvas = document.getElementById("fda"),
                threshold = _this.threshold,
                rScale = _this.rScale;

            // 给每个节点打社区标签
            _this.detectCommunity()

            // 添加虚拟边，计算节点模糊度
            _this.initNL();

            // 设置节点颜色函数
            _this.nodeColor = (groupIndex)=>{
                return d3.interpolateRainbow(_this.colorInterpolation(groupIndex));
            }

            // 缩放行为
            var zoom = d3.zoom().scaleExtent([0.1, 8]).on("zoom", _this.zoom);
            d3.select(canvas).call(zoom);
            //.call(zoom.scaleTo,0.1);


            var simulation = d3.forceSimulation()
                .force("innerLink",d3.forceLinkInCommunity().threshold(threshold).id(function(d){return d.id||d.name;}).distance(function(d){
                    return 1;
                }))
                .force("innerCollide",d3.forceCollide().radius(function(d){
                    return rScale(d.deg);
                }))
                .force("innerCharge",d3.forceRepInCommunity().threshold(threshold).strength(function(){return -10}))
                .force("outterLink",d3.forceLinkBetCommunity().threshold(threshold).id(function(d){return d.gIndex;}).distance(function(l,i,links){
                    var extent = d3.extent(links,link=>link.weight);
                    var scale = d3.scaleLinear().domain(extent).range([100,60]);
                    return scale(l.weight);
                }))
                .force("outterCharge",d3.forceRepBetCommunity().threshold(threshold).strength(function(n,i,nodes){
                    var extent = d3.extent(nodes,d=>d.children.length);
                    var scale = d3.scaleLinear().domain(extent).range([-100,-400])
                    return scale(n.children.length)
                }))

                .force("fuzzyLink",d3.forceLinkFuzzy().threshold(threshold).id(d=>d.gIndex).distance(l=>1/l.weight))
                .force("center",d3.forceCenter(width/2,height/2));

            simulation.nodes(nodes)
                      .on("tick",ticked);

            simulation.force("innerLink")
                     .links(links);
            simulation.force("outterLink")
                     .links(links);
            simulation.force("fuzzyLink")
                    .links(links);
            // console.log(nodes);


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
            var shadowData = this.getShawdowData();
            var ctx = this.context,
                color = this.nodeColor,
                kScale = this.kScale,
                currentK = this.k;

            for(let shadow of shadowData){
                ctx.beginPath()
                var {x0,y0,r,gIndex} = shadow;
                // context.fillStyle = "rgba(119, 113, 113,0.5)"
                var grad  = ctx.createRadialGradient(x0,y0,r*0.5,x0,y0,r)
                var c = d3.color(color(+gIndex));
                c.opacity = kScale(currentK);
                grad.addColorStop(0,`rgba(0,0,0,${kScale(currentK)})`)
                grad.addColorStop(1,c)
                ctx.fillStyle = grad;
                ctx.arc(x0, y0, r, 0, 2 * Math.PI);
                ctx.fill();
            }
            // ctx.beginPath()
        },
        drawNodes(){
            var nodes = this.nodes,
                ctx = this.context,
                newScaleX = this.newScaleX,
                newScaleY = this.newScaleY,
                rScale = this.rScale,
                color = this.nodeColor,
                searchNode = this.searchNode,
                threshold = this.threshold;

            // for(let [i,n] of nodes.entries()){
            //     if(n.name.startsWith("group")) continue;
            //     ctx.beginPath();
            //     ctx.fillStyle = color(n.community)
            //     var r = (n.hoveron==true || searchNode==n.name)?rScale(n.deg)*1.5:rScale(n.deg);
            //     // if(n.hoveron || this.searchNode==n.name ){
            //     //     r = rScale(n.deg);
            //     // }else{
            //     //     r = rScale(n.deg);
            //     // }
            //     ctx.arc(newScaleX(n.x), newScaleY(n.y), r, 0, 2 * Math.PI);
            //     ctx.fill();
            //     if(n.hoveron || searchNode==n.name){
            //         ctx.lineWidth = 2;
            //         ctx.strokeStyle = "white";
            //         ctx.stroke();
            //     }
            // }

            for(let [i,n] of nodes.entries()){
                ctx.beginPath();
                var cx = newScaleX(n.x)||0,
                    cy = newScaleY(n.y)||0,
                    r = rScale(n.deg);

                var grad  = ctx.createRadialGradient(cx,cy,0,cx,cy,r)
                grad.addColorStop(0,"white")
                grad.addColorStop(1,color(n.community))

                // 模糊度大于阈值的用特定的颜色表示
                // context.fillStyle = grad
                ctx.fillStyle = n.fuzzy>threshold?grad:grad;
                ctx.lineWidth = 0;
                if(n.fuzzy>threshold){
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "white";
                }


                if(n.hoveron == true || n.name == searchNode){
                    r = r*1.5;
                }
                ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                ctx.fill();
                if(n.hoveron == true || n.name == searchNode){
                    // r = r*1.5;
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "white"
                    ctx.stroke()
                }
            }

        },
        drawLinks(){
            var links = this.links,
                ctx = this.context,
                newScaleX = this.newScaleX,
                newScaleY = this.newScaleY,
                hoverNode = this.hoverNode,
                searchNode = this.searchNode;
            for(let l of links){
                if(l.virtual==true) continue;
                ctx.beginPath()
                ctx.lineWidth = l.weight || l.value;
                ctx.strokeStyle = 'rgba(255, 170, 0, 0.4)'
                if(hoverNode!='' || searchNode==l.source.name || searchNode == l.target.name){
                    if(l.source.name == hoverNode.name || l.target.name==hoverNode.name || l.source.name == searchNode || l.target.name == searchNode){
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
                    }else{
                        ctx.strokeStyle = 'rgba(201, 199, 199,0.1)'
                    }
                }
                ctx.moveTo(newScaleX(l.source.x),newScaleY(l.source.y));
                ctx.lineTo(newScaleX(l.target.x),newScaleY(l.target.y))
                ctx.stroke();
            }

            // for(let l of links){
            //     if(l.virtual==true) continue;
            //     var source = l.source,
            //         target = l.target;
            //     if(source.hoveron == true || target.hoveron == true || searchNode==source.name || searchNode==target.name){
            //         ctx.beginPath();
            //         ctx.strokeStyle = 'rgba(255, 131, 0,0.8)';
            //         ctx.lineWidth = Math.sqrt(l.value||l.weight)*2;
            //
            //         ctx.moveTo(newScaleX(source.x),newScaleY(source.y))
            //         ctx.lineTo(newScaleX(target.x),newScaleY(target.y));
            //         ctx.stroke();
            //     }else{
            //         ctx.beginPath();
            //         ctx.strokeStyle = 'rgba(201, 199, 199,0.5)';
            //         ctx.lineWidth = Math.sqrt(l.value||l.weight)*2;
            //
            //         ctx.moveTo(newScaleX(source.x),newScaleY(source.y))
            //         ctx.lineTo(newScaleX(target.x),newScaleY(target.y));
            //         ctx.stroke();
            //     }
            // }
        },
        drawTooltips(){
            var ctx = this.context,
                hoverNode = this.hoverNode,
                xScale = this.newScaleX,
                yScale = this.newScaleY;
            if(hoverNode!=""){
                ctx.beginPath()
                // ctx.fillStyle = 'rgba(0,0,0,0.7)'
                // ctx.fillRect(xScale(hoverNode.x),yScale(hoverNode.y))
                // ctx.lineWidth = 1;
                ctx.fillStyle = "lightgrey"
                ctx.font = 'bold 12px Georgia';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText("name:"+hoverNode.name+'\n'+"deg:"+hoverNode.deg, xScale(hoverNode.x)+15,yScale(hoverNode.y)-20);
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
            // console.log(community_assignment_result);
            // console.log(max_community_number);
            this.colorInterpolation = d3.scaleLinear()
                            .domain([0,max_community_number])
                            .range([0,1])
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
        },
        getShawdowData(){
            var nodes = this.nodes,
                newScaleX = this.newScaleX,
                newScaleY = this.newScaleY,
                threshold = this.threshold;

            var groups = d3.nest().key(n=>n.community).map(nodes.filter(n=>n.fuzzy<=threshold));
            var gIndexs = groups.keys();

            var shadowData = gIndexs.map(g=>{
                var nodes = groups.get(g);
                var x0 = d3.mean(nodes,n=>newScaleX(n.x)),
                    y0 = d3.mean(nodes,n=>newScaleY(n.y));
                var xExtent = d3.extent(nodes,n=>newScaleX(n.x)),
                    yExtent = d3.extent(nodes,n=>newScaleY(n.y));
                var r1 = (xExtent[1]-xExtent[0])/2,
                    r2 = (yExtent[1]-yExtent[0])/2,
                    r = r1>=r2?r1*1.2:r2*1.2;
                return {
                    x0,
                    y0,
                    r,
                    gIndex:g
                }
            })
            return shadowData;
        },

        // 添加虚拟边和计算节点模糊度
        initNL(){
            var nodes = this.nodes,
                links = this.links,
                threshold = this.threshold;

            var nodeById = d3.map(nodes,function(d){return d.name});

            var metaNodes=[],metaLinks=[];
            var adjList = {};
            var groups = {

            };

            // 构建邻接表
            links.forEach(l=>{
                var {source,target} = l;
                if(adjList[source]==undefined){
                    adjList[source]={}
                }
                adjList[source][target]=1
            })


            // 标记桥梁节点
            for(let l of links){
                var source = nodeById.get(l.source),
                    target = nodeById.get(l.target);
                var c1 = source.community,
                    c2 = target.community;
                if(c1==c2) continue;
                else{
                    source.bridge?source.bridge++:source.bridge=1;
                    target.bridge?target.bridge++:target.bridge=1;
                }
            }

            //计算模糊度
            for(let n of nodes){
                n.fuzzy = compute_fuzzy(n);
            }

            // 构建元节点
            nodes.forEach(n=>{
                if(groups[n.community]==undefined) groups[n.community]=[]
                groups[n.community].push(n);
            })

            // 添加虚拟边
            Object.keys(groups).forEach(gIndex=>{
                var nodes = groups[gIndex];
                for(let [i,n] of nodes.entries()){
                    if(n.fuzzy>threshold) continue;
                    for(let [j,m] of nodes.entries()){
                        if(n.fuzzy>threshold) continue;
                        var id1 = n.id||n.name,
                            id2 = m.id||m.name;
                        if(i<j){
                            if(!isInLinks(id1,id2)){
                                // console.log(true);
                                links.push({
                                    source:id1,
                                    target:id2,
                                    weight:1,
                                    virtual:true
                                })
                            }
                        }
                    }
                }
            })
            // console.log(links.length);

            function isInLinks(id1,id2){
                return (adjList[id1]&&adjList[id1][id2])||(adjList[id2]&&adjList[id2][id1])?true:false;
            }
            // 模糊度计算
            function compute_fuzzy(n){
                if(n.bridge) return n.bridge/(n.deg);
                else return 0;
            }

        }
    },

    watch:{
        graph:function(){
            this.init();
            // this.draw()
        },
        time:function(){
            this.init();
            // this.draw();
        }
        // nodes:function(){
        //     console.log("nodes changed");
        // }
    }
};
</script>

<style lang="css">
</style>
