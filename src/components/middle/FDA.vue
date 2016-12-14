<template lang="html">
    <canvas id="fda" width="550" height="550" v-show="type == 'FDA'"></canvas>
</template>

<script>
import d3 from '../../lib/d3-extend'
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
            newScaleX: xScale.copy(),
            newScaleY: yScale.copy()
        };
    },
    computed: {
        graph:function(){
            return this.$store.state.graph;
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
        }
    },
    mounted(){
        this.initContext();
    },
    methods: {
        initContext(){
            var canvas = document.getElementById('fda'),
                ct = canvas.getContext('2d');
            this.context = ct;
        },
        initCoordinate(){
            var _this = this,
                width = 550,
                height = 550,
                nodes = _this.nodes,
                links = _this.links,
                canvas = document.getElementById("fda");


            var zoom = d3.zoom().scaleExtent([0.2, 16]).on("zoom", this.zoom);

            d3.select(canvas).call(zoom);

            var simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) {
                    return d.name;
                }).distance(30))
                .force("collision", d3.forceCollide().radius(function(d, i) {
                    return 6;
                }))
                .force("charge", d3.forceManyBody().strength(-2))
                .force("center", d3.forceCenter(width / 2, height / 2));

            simulation
                .nodes(nodes)
                .on("tick", ticked)
                .on("end",function(){
                    console.log("end");
                });

            simulation.force("link")
                .links(links);

            function ticked(){
                _this.draw();
            }

        },

        draw(){
            var ct = this.context;
            ct.clearRect(0,0,550,550);
            this.drawLinks();
            this.drawCircles();
        },

        drawCircles(){
            var nodes = this.nodes,
                ct = this.context,
                x = this.newScaleX,
                y = this.newScaleY;
                // console.log(x.domain());
            for(let [i,n] of nodes.entries()){
                ct.beginPath();
                ct.fillStyle = "red"
                if(i==1){
                    // console.log(x(n.x),y(n.y));
                }
                ct.arc(x(n.x), y(n.y), 2, 0, 2 * Math.PI);
                ct.fill();
                ct.closePath();
            }
        },
        drawLinks(){
            var links = this.links,
                ct = this.context,
                x = this.newScaleX,
                y = this.newScaleY;
            for(let l of links){
                ct.beginPath()
                ct.strokeStyle = "lightgrey";
                ct.lineWidth = 2;
                ct.moveTo(x(l.source.x),y(l.source.y));
                ct.lineTo(x(l.target.x),y(l.target.y))
                ct.stroke();
                ct.closePath();
            }
        },
        zoom(){
            this.newScaleX = d3.event.transform.rescaleX(xScale);
            this.newScaleY = d3.event.transform.rescaleY(yScale);
            this.draw();
        }
    },
    watch:{
        // graph:function(){
        //     this.initCoordinate()
        //     this.draw()
        // },
        nodes:function(){
            this.initCoordinate()
            this.draw()
        }
    },
    components: {}
};
</script>

<style lang="css">
</style>
