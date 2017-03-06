<template lang="html">
    <div class="" style="potition:relative">
        <canvas id="fda" width="550" height="550" v-show="type == 'FDA'"></canvas>
        <div id="canvasTooltip" class="ctxTooltip disabled">
            this is a tooltip!
        </div>
    </div>
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
let levels = d3.range(16).slice(1);
export default {
    props:["type","time","searchNode","comDistribute","backgroundColorMode"],
    data() {
        return {
            context:"",
            canvasDom:'',
            newScaleX: xScale.copy(),
            newScaleY: yScale.copy(),
            k:1,
            hoverNode:'',
            colorInterpolation:"",
            nodeColor:'',
            mousemoveTimeout:'',
            threshold:0.2,
            kScale: d3.scaleLinear().range([1,0]).domain([0.1,8]),
            // backgroundColorMode:false,   // true 底为白色
            // shadowScale:d3.scaleLinear().range([0,1]),
            // kScaleToLevel:  d3.scaleQuantize().domain([1,0.1]).range([1,2,3,4,5]),
            newKScale:d3.scaleQuantize().domain([0.3,1]).range(levels.concat(levels.length+1).reverse())

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
                            .range([4,7]);
            return scale;
        },
        degScale:function(){
            var nodes = this.nodes;
            var deg_min_max = d3.extent(nodes,(n)=>n.deg);
            var degScale = d3.scaleQuantize().domain([deg_min_max[0],deg_min_max[1]]).range(levels);
            return degScale;
        },
        statisticCommunity:function(){
            var graph = this.graph;

            if(!graph) return "社团统计失败";
            var nodes, links;
            var times = Object.keys(graph).sort((a,b)=>a-b);
            for(let t of times){
                nodes = graph[t].nodes;
                links = graph[t].links;
                var id_index = {};
                var temp_c = {};
                var community = jLouvain().nodes(nodes.map((d, i) => {
                    var key = d.id||d.name
                    id_index[key] = i;
                    return i;
                })).edges(links.map(l => {
                    return {
                        weight: l.weight || l.value,
                        source: id_index[l.source],
                        target: id_index[l.target]
                    };
                }));
                var community_assignment_result = community();
                // var max_community_number = 0;
                nodes.forEach((d, i) => {
                    d.tmpCommunity = community_assignment_result[i];
                    // max_community_number = max_community_number < community_assignment_result[i] ? community_assignment_result[i] : max_community_number;
                })
                nodes.forEach((d,i)=>{
                    if(!temp_c[d.tmpCommunity]){
                        temp_c[d.tmpCommunity] = 0;
                    }
                    temp_c[d.tmpCommunity]++;
                })

                var number = Object.keys(temp_c).filter(a=>temp_c[a]>5).length;
                console.log(t, number);
                // console.log(community_assignment_result);
            }




            console.log(times);
            return times;
            // for(let t of times){
            //     console.log(t);
            // }
        }
    },
    mounted(){

        console.log("first mounted")
        this.initContext();
    },
    methods: {
        ...mapActions([
            "addIndividual"
        ]),
        setNodeColor(){
            var nodes = this.nodes,
                backgroundColorMode = this.backgroundColorMode,
                randomColorForNodes = {};

            for(let n of nodes){
                if(randomColorForNodes[n.community] == undefined){
                    var interpolate;
                    if(backgroundColorMode){
                        interpolate = d3.interpolate(0,0.9);
                    }else{
                        interpolate = d3.interpolate(0.4,0.7)
                    }
                    // var interpolate1 = d3.interpolate(0.4,0.7);
                    // var interpolate1 = d3.interpolate(0,0.5);
                    // randomColorForNodes[n.community] = d3.interpolateRainbow(Math.random()*1);
                    randomColorForNodes[n.community] = d3.hsl(360*Math.random(),Math.random(),interpolate(Math.random()));
                }
            }

            this.nodeColor = (groupIndex)=>{
                return randomColorForNodes[groupIndex];
                // return d3.interpolateRainbow(_this.colorInterpolation(groupIndex));
            }
        },
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
                rScale = _this.rScale,
                newScaleX = this.newScaleX,
                newScaleY = this.newScaleY;
                // randomColorForNodes = {},
                // backgroundColorMode = this.backgroundColorMode;

            // 给每个节点打社区标签
            _this.detectCommunity()
            // console.log(_this.statisticCommunity);

            // 添加虚拟边，计算节点模糊度
            _this.initNL();
            _this.setNodeColor();
            // 设置节点颜色函数


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
                .force("outterCharge",d3.forceRepBetCommunity().threshold(threshold).distanceMax(300).strength(function(n,i,nodes){
                    var extent = d3.extent(nodes,d=>d.children.length);

                    var scale = d3.scaleLinear().domain(extent).range([-100,-1200])
                    return scale(n.children.length)
                }))
                // .force("metaCollide", d3.metaCollide().threshold(threshold).radius(function(d){
                //     // var nodes = d.children;
                //     //     var x0 = d3.mean(nodes,n=>newScaleX(n.x)),
                //     //         y0 = d3.mean(nodes,n=>newScaleY(n.y));
                //     //     var xExtent = d3.extent(nodes,n=>newScaleX(n.x)),
                //     //         yExtent = d3.extent(nodes,n=>newScaleY(n.y));
                //     //     var r1 = (xExtent[1]-xExtent[0])/2,
                //     //         r2 = (yExtent[1]-yExtent[0])/2,
                //     //         r = r1>=r2?r1*1.2:r2*1.2;
                //         return 60;
                // }))
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

            this.clearCanvas(); // 清空
            this.drawBackground();    // 绘制背景色
            this.drawConnectedGroupsShadows();
            this.drawShadows();     // 绘制每个社团的阴影
            this.drawLinks();   // 绘制节点之间的连线
            this.drawNodes();   // 绘制节点
            // this.drawTooltips();
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
                height = this.canvasSize.height,
                backgroundColorMode = this.backgroundColorMode;
            ctx.beginPath()
            if(backgroundColorMode){
                ctx.fillStyle="white";
            }else{
                ctx.fillStyle="black";
            }
            ctx.fillRect(0,0,width,height);
        },
        drawConnectedGroupsShadows(){

        },
        drawShadows(){
            var shadowData = this.getShawdowData();
            var ctx = this.context,
                color = this.nodeColor,
                // kScale = this.kScale,
                currentK = this.k,
                degScale = this.degScale,
                newKScale = this.newKScale,
                backgroundColorMode = this.backgroundColorMode;

            for(let shadow of shadowData){
                var totalNodes = shadow.nodes,
                    leftNodes = totalNodes.filter(n=>degScale(n.deg)>=newKScale(currentK)),
                    opacity = 1-leftNodes.length/totalNodes.length;
                ctx.beginPath()
                var {x0,y0,r,gIndex} = shadow;
                // context.fillStyle = "rgba(119, 113, 113,0.5)"
                var grad  = ctx.createRadialGradient(x0,y0,0,x0,y0,r)
                var c = d3.color(color(gIndex));
                // c.opacity = kScale(currentK);
                c.opacity = opacity;
                if(backgroundColorMode){
                    grad.addColorStop(1,`rgba(255,255,255,${opacity})`)
                }else{
                    grad.addColorStop(1,`rgba(0,0,0,${opacity})`)
                }
                grad.addColorStop(0,c);
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
                threshold = this.threshold,
                degScale = this.degScale,
                newKScale = this.newKScale,
                currentK = this.k;

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
                if(degScale(n.deg)<newKScale(currentK)){
                    continue;
                }
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
                searchNode = this.searchNode,
                degScale = this.degScale,
                newKScale = this.newKScale,
                currentK = this.k,
                backgroundColorMode = this.backgroundColorMode;

            for(let l of links){
                if(l.virtual==true) continue;
                var source = l.source,
                    target = l.target;
                if(degScale(source.deg)<newKScale(currentK) || degScale(target.deg)<newKScale(currentK)) continue;

                ctx.beginPath()
                ctx.lineWidth = l.weight || l.value;
                ctx.strokeStyle = 'rgba(255, 170, 0, 0.4)'
                if(hoverNode!='' || searchNode==l.source.name || searchNode == l.target.name){
                    if(l.source.name == hoverNode.name || l.target.name==hoverNode.name || l.source.name == searchNode || l.target.name == searchNode){
                        ctx.lineWidth = 2;
                        if(backgroundColorMode){
                            ctx.strokeStyle = 'rgba(132, 129, 129,0.9)'
                        }else{
                            ctx.strokeStyle = 'rgba(255,255,255,0.7)'
                        }
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
            var newKScale = this.newKScale;
            var nodes = this.nodes;
            var degScale = this.degScale;

            // console.log("k:"+this.k);
            // console.log("level:"+newKScale(this.k));
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
                d3.select("#canvasTooltip").classed("disabled",true);
                for(let n of nodes){
                    var r = rScale(n.deg),
                        cx = xScale(n.x),
                        cy = yScale(n.y);

                    if(!n.name.startsWith("group") && Math.pow(cx-mouseX,2)+Math.pow(cy-mouseY,2)<r*r){
                        _this.hoverNode = n
                        n.hoveron = true;
                        flag = true;
                        var content = `name:  ${n.name}<br/>deg:  ${n.deg}`;
                        d3.select("#canvasTooltip").classed("disabled",false)
                                                   .style("left",function(d){
                                                       return mouseX+10+"px";
                                                   })
                                                   .style("top",function(d){
                                                       return mouseY+10+"px";
                                                   })
                                                   .html(content);
                        break;
                    }else{
                        n.hoveron = false;
                    }
                    // if(!n.name.startsWith("group") && Math.pow(cx-mouseX,2)+Math.pow(cy-mouseY,2)<r*r){
                    //     _this.hoverNode = n
                    //     n.hoveron = true
                    //     flag = true;
                    //     break;
                    // }else{
                    //     n.hoveron = false;
                    // }
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
                    r:r+2,
                    gIndex:g,
                    nodes
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
                    if(n.fuzzy>threshold) continue; // 模糊度大于特定值的节点不添加虚拟边
                    for(let [j,m] of nodes.entries()){
                        if(n.fuzzy>threshold) continue;  // 模糊度大于特定值的节点不添加虚拟边
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
        },
        backgroundColorMode:function(){
            this.setNodeColor();
            this.draw();
        },
        searchNode:function(){
            this.draw();
        }
        // nodes:function(){
        //     console.log("nodes changed");
        // }
    }
};
</script>

<style lang="css" scoped>
    .ctxTooltip{
        position: absolute;
        width:auto;
        padding:10px;
        line-height: 20px;
        color:white;
        background-color: rgba(155, 144, 144,0.7);
        border-radius: 4px;
        font-size:14px;
    }

    .ctxTooltip.disabled{
        display:none;
    }
</style>
