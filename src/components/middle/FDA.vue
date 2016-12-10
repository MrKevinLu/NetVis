<template lang="html">
    <canvas id="fda" width="550" height="550" v-show="type == 'FDA'"></canvas>
</template>

<script>
import d3 from '../../lib/d3-extend'

export default {
    props:["type","time"],
    data() {
        return {
            context:""
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
                links = _this.links;

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
                .on("tick", ticked);

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
                ct = this.context;
            for(let n of nodes){
                ct.beginPath();
                ct.fillStyle = "red"
                ct.arc(n.x, n.y, 2, 0, 2 * Math.PI);
                ct.fill();
                ct.closePath();
            }
        },
        drawLinks(){
            var links = this.links,
                ct = this.context;
            for(let l of links){
                ct.beginPath()
                ct.strokeStyle = "lightgrey";
                ct.lineWidth = 2;
                ct.moveTo(l.source.x,l.source.y);
                ct.lineTo(l.target.x,l.target.y)
                ct.stroke();
                ct.closePath();
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
