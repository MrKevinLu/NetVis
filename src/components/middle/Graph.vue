<template lang="html">
    <div id="g_network_view">
        <!-- <net-FDA :type="type" :time="currentTime"></net-FDA> -->
        <net-MDS :type="type" :time="currentTime"></net-MDS>
    </div>
</template>

<script>
import d3 from '../../lib/d3-extend'
import Louvain from '../../lib/jLouvain'
import NetFDA from './FDA.vue'
import NetMDS from './MDS.vue'
import dat from '../../lib/dat.gui.min'

import {
    mapActions,
    mapGetters
} from 'vuex'

export default {
    data() {
        return {
            community: null,
            communityResult: {},
            type:"MDS"
        };
    },

    computed: {
        currentTime:function(){
            return this.$store.state.currentTime;
        }
    },

    beforeCreate: function() {

    },

    watch: {

        graph: function() {
            // this.drawCanvas();
            // this.draw();
        }
    },

    mounted: function() {
        this.generateControls();
    },
    components:{
        NetFDA,
        NetMDS
    },
    methods: {
        ...mapActions([
            'getAllData'
        ]),
        generateControls(){
            var _this = this;
            var obj = {
                layout:_this.type
            }
            // var attrList = Object.keys(index_prop).map(d=>{return index_prop[d]});
            var gui = new dat.GUI({autoPlace: false});

            var customContainer = d3.select('#g_network_view').node();
            customContainer.appendChild(gui.domElement);
            gui.add(obj,"layout",['MDS','FDA']).onChange(_this.toggleView);
            gui.close();
        },
        toggleView(type){
            this.type = type;
        },

        nodeMouseover: function(d) {
            console.log(d3.event.target);
        },

        detectCommunity: function() {
            // 检测社团 得到{index:cid……} index:节点序号 cid：社团序号
            var id_index = {}
            this.community = Louvain().nodes(this.nodes.map((d, i) => {
                id_index[d.name] = i;
                return i;
            })).edges(this.links.map(l => {
                return {
                    weight: l.weight || l.value,
                    source: id_index[l.source],
                    target: id_index[l.target]
                };
            }));
            var community_assignment_result = this.community();
            this.communityResult
            var max_community_number = 0;
            this.nodes.forEach((d, i) => {
                d.community = community_assignment_result[i];
                max_community_number = max_community_number < community_assignment_result[i] ? community_assignment_result[i] : max_community_number;
            })
            console.log(max_community_number);

        },


        drawCanvas: function() {
            var canvas = document.querySelector("canvas"),
                context = canvas.getContext("2d"),
                width = +canvas.width,
                height = +canvas.height,
                nodes = this.nodes,
                links = this.links;

            this.detectCommunity();
            // console.log(initialMetaNodes(this.nodes));
            var x = d3.scaleLinear()
                .domain([0, width])
                .range([0, width]);

            var y = d3.scaleLinear()
                .domain([0, height])
                .range([height, 0]);

            var zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", zoomed);
            // console.log(d3.schemeCategory20);
            //
            var color = d3.scaleOrdinal()
                .domain(d3.range(8))
                .range(d3.schemeCategory20);

            var simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) {
                    return d.name;
                }).distance(30))
                .force("collision", d3.forceCollide().radius(function(d, i) {
                    return 6;
                }))
                .force("metaForce", d3.metaForce().id(function(d){
                    return d.group
                }))
                .force("charge", d3.forceManyBody().strength(-2))
                .force("center", d3.forceCenter(width / 2, height / 2));

            simulation
                .nodes(nodes)
                .on("tick", ticked);
            console.log(nodes);
            simulation.force("link")
                .links(links);
            // simulation.force("metaForce")
            //     .links(links);
            // console.log(initialMetaLinks(links));

            var c = d3.select(canvas)
                    .call(d3.drag()
                    .container(canvas)
                    .subject(dragsubject)
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))
                    .call(zoom);
                    // .call(zoom.transform, transform);
                    // .call(zoom.translateBy(selection, x, y) )
            // .call(zoom);


            function ticked() {
                draw()
            }
            console.log(nodes.length);
            function draw() {
                context.clearRect(0, 0, width, height);
                context.fillStyle = "#665e5e"
                context.fillRect(0,0,width,height)
                context.beginPath();
                links.forEach(drawLink);
                context.strokeStyle = "#726d6d";
                context.stroke();

                // context.beginPath();
                nodes.forEach(drawNode);
                // context.fill();
                // context.strokeStyle = "#fff";
                // context.stroke();
            }

            function dragsubject() {
                return simulation.find(d3.event.x, d3.event.y);
            }

            function dragstarted() {
                if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                d3.event.subject.fx = d3.event.subject.x;
                d3.event.subject.fy = d3.event.subject.y;
            }

            function dragged() {
                d3.event.subject.fx = d3.event.x;
                d3.event.subject.fy = d3.event.y;
            }

            function dragended() {
                if (!d3.event.active) simulation.alphaTarget(0);
                d3.event.subject.fx = null;
                d3.event.subject.fy = null;
            }

            function drawLink(d) {
                context.moveTo(d.source.x, d.source.y);
                context.lineTo(d.target.x, d.target.y);
            }

            function drawNode(d,i) {
                context.beginPath();
                context.fillStyle = color(d.community)
                if(i==10){
                    // console.log(d.x, d.y);
                }
                context.moveTo(d.x + 3, d.y);
                context.arc(d.x, d.y, 2, 0, 2 * Math.PI);
                context.fill()
                // context.strokeStyle = "#fff";
                // context.stroke();
            }


            function transform(){
                console.log(this);
                return 0;
            }
            function zoomed() {

                context.clearRect(0, 0, width, height);

                draw();
            }

        }


    }
};
</script>

<style lang="css" scoped>
    #g_network_view{
        width:100%;
        height:550px;
        position:relative;
    }
    circle:hover{
        fill: red
    }
    .view {
      fill: white;
      stroke: #000;
    }

</style>
<style lang="css">
#g_network_view .dg.main{
    position:absolute;
    top:0;
    right:10px;
    z-index:999;
    border-radius: 4px;
    width:200px !important;
}
#g_network_view .dg.main .close-button{
    box-sizing: border-box;
    background-color: white;
    color:black;
    height:20px;
    line-height:20px;
    width:200px !important;
    text-align: right;
    padding-right:10px;
}
</style>
