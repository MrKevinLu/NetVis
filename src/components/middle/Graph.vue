<template lang="html">
    <div class="contextCanvas">
        <net-FDA :type="type" :time="currentTime"></net-FDA>
        <net-MDS :type="type" :time="currentTime"></net-MDS>
    </div>
</template>

<script>
import d3 from '../../lib/d3-extend'
import Louvain from '../../lib/jLouvain'
import NetFDA from './FDA.vue'
import NetMDS from './MDS.vue'
import {
    mapActions,
    mapGetters
} from 'vuex'

export default {
    data() {
        return {
            community: null,
            communityResult: {},
            type:"mds"
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
        var _this = this;
    },
    components:{
        NetFDA,
        NetMDS
    },
    methods: {
        ...mapActions([
            'getAllData'
        ]),
        drawMDS(){
            var canvas = document.getElementById('mds'),
                context = canvas.getContext("2d");
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
            // var color = d3.scaleOrdinal()
            //     .domain(d3.range(max_community_number))
            //     .range(d3.schemeCategory20);
            //
            // d3.selectAll('.node')
            //     .data(this.nodes)
            //     .attr('fill', function(d) {
            //         // console.log(d.community);
            //         return color(d.community);
            //     });
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

        },
        draw: function() {

            var svg = d3.select("svg"),
                width = +svg.attr("width"),
                height = +svg.attr("height");
            var zoom = d3.zoom()
                .scaleExtent([0.1, 1])
                .translateExtent([
                    [-100, -100],
                    [width + 90, height + 100]
                ])
                .on("zoom", zoomed);

            var svgGroup = svg.append("g");

            var color = d3.scaleOrdinal(d3.schemeCategory20);


            var simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) {
                    return d.name;
                }).distance(10).strength(0.9)) // 默认30
                .force("collision", d3.forceCollide().radius(function(d, i) {
                    return 4;
                }))
                .force("charge", d3.forceManyBody().strength(-3)) // 默认-30
                .force("center", d3.forceCenter(width / 2, height / 2));

            var link = svgGroup.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(this.links)
                .enter().append("line")
                .attr("stroke-width", function(d) {
                    return Math.sqrt(d.weight);
                });

            var node = svgGroup.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(this.nodes)
                .enter().append("circle")
                .attr("class", 'node')
                .attr("r", function(d, i) {
                    return 3
                })
                .attr("fill", function(d) {
                    return "red";
                })
                // .on("mouseover", this.nodeMouseover)
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

            node.append("title")
                .text(function(d) {
                    return d.name;
                });

            simulation
                .nodes(this.nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(this.links);

            // svg.call(zoom);

            function zoomed() {
                // svgGroup.attr("transform", d3.event.transform);
                link.attr("transform", d3.event.transform);
                node.attr("transform", d3.event.transform);
                // "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }

            function ticked() {
                link
                    .attr("x1", function(d) {
                        return d.source.x;
                    })
                    .attr("y1", function(d) {
                        return d.source.y;
                    })
                    .attr("x2", function(d) {
                        return d.target.x;
                    })
                    .attr("y2", function(d) {
                        return d.target.y;
                    });

                node
                    .attr("cx", function(d) {
                        return d.x;
                    })
                    .attr("cy", function(d) {
                        return d.y;
                    });
            }

            function dragstarted(d) {
                if (!d3.event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            }

            function dragended(d) {
                if (!d3.event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }


        }

    }
};
</script>

<style lang="css" scoped>
    .contextCanvas{
        width:100%;
        height:550px;
    }
    circle:hover{
        fill: red
    }
    .view {
      fill: white;
      stroke: #000;
    }

</style>
