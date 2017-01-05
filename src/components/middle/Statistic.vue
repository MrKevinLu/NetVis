<template lang="html">
    <div id="statistic">

    </div>
</template>

<script>
import {mapActions, mapGetters} from 'vuex'
import Highcharts from 'highcharts'
import d3 from '../../lib/d3-extend'

// console.log(Highcharts);
export default {
    data() {
        return {
            scales:"",
            series:""
        };
    },
    computed: {
        ...mapGetters([
            "times",
            "g_attr_data"
        ]),
        g_prop() {
            return this.$store.state.g_prop
        },
        graph() {
            return this.$store.state.graph
        }
    },
    watch: {
        g_attr_data: function() {
            this.getScale();
            this.draw()
        }
    },
    ready() {},
    attached() {},
    methods: {
        ...mapActions([
            "selectYear"
        ]),
        getScale:function(){
            var g_attr_data = this.g_attr_data,
                times = this.times,
                g_prop = this.g_prop,
                scales = {},
                domains = {},
                series = [],
                colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99'];
            var scale = d3.scaleLinear()
                            .range([0,1]);

            for(let name of g_prop){
                scales[name] = {};
                domains[name] = [];
                for(let t of times){
                    // console.log(g_attr_data[t]);
                    domains[name].push(g_attr_data[t][name])
                }
            }
            for(var attr in domains){
                var max = d3.max(domains[attr])
                scales[attr] = scale.copy().domain([0,max])
            }
            series = g_prop.map((attr,i)=>{
                var mapData = domains[attr].map(v=>{
                    return scales[attr](v)
                })
                var color = d3.color(colors[i]);
                color.opacity = 0.7;
                // console.log(mapData);
                return {
                    name:attr,
                    data:mapData,
                    scale:scales[attr],
                    color:color.toString()
                }
            })
            // console.log(series);
            this.scales = scales;
            this.series = series;
            // console.dir(scales);
            // console.dir(domains);

        },

        draw: function() {
            var _this = this;
            var data = _this.series;
            var scales = _this.scales;
            Highcharts.chart('statistic', {
                chart: {
                    type: 'area',
                    backgroundColor: 'white',
                    // marginTop:0,
                    marginBottom:25,
                    // marginRight:20,
                    showAxes: true,            //是否最初显示轴
                    spacingTop: 0,            //图表上方的空白
                    spacingRight: 10,
                    // spacingBottom: 0,
                    spacingLeft: 10
                },
                credits: { enabled:false },
                title: {
                    text: 'network attributes trend',
                    style: {
                        display: "none"
                    }
                },
                xAxis: {
                    // gridLineWidth: 5,
                    allowDecimals: false,
                    labels: {
                        formatter: function() {
                            return this.value; // clean, unformatted number for year
                        }
                    },
                    // tickColor:"red",
                    // lineColor:"red"
                },
                legend: {
                    // layout: 'vertical',
                    // align: 'right',
                    verticalAlign: 'top',
                    borderWidth: 0,
                    margin:10
                },
                yAxis: {
                    // gridLineWidth: 1,
                    // title: {
                    //     text: 'Nuclear weapon states'
                    // },
                    // labels: {
                    //     formatter: function() {
                    //         return this.value / 1000 + 'k';
                    //     }
                    // },
                    visible: false
                },
                tooltip: {
                    formatter: function(){
                        return `${this.series.name} <br/> ${this.x} ${scales[this.series.name].invert(this.y)}`
                    }
                },
                plotOptions: {
                    area: {
                        pointStart: 1990,
                        marker: {
                            enabled: false,
                            symbol: 'circle',
                            radius: 2,
                            states: {
                                hover: {
                                    enabled: true
                                }
                            }
                        },
                        point:{
                            events:{
                                click:function(e){
                                    _this.selectYear(e.point.category);
                                    console.log(e.point.category);
                                }
                            }
                        }
                    }
                },
                series: data
            });

        }
    },
    mounted() {
        // console.log(this.times);
        // console.log(this.g_prop_data);
    },
    components: {}
};
</script>

<style lang="css" scoped>
    #statistic{
        flex:1;
        width:100%;
        /*background-color: lightgrey;*/
    }
    .highcharts-background{
        /*fill: black*/
    }
</style>
