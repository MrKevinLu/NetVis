<template lang="html">
    <div id="g_network_view">
        <net-FDA :type="type" :comDistribute="dis_type" :time="currentTime" :searchNode="searchNode" :backgroundColorMode="backgroundColorMode"></net-FDA>
        <net-MDS :type="type" :comDistribute="dis_type" :time="currentTime" :searchNode="searchNode" :mapAttr="mapAttr"></net-MDS>
        <div class="arrow arrow-left" @click="preTime">
        </div>
        <div class="arrow arrow-right" @click="nextTime">
        </div>
        <div class="search">
            <input type="text" id="searchInput" v-model="searchNode" placeholder="search">
        </div>
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
            type:"MDS",
            searchNode:'',
            dis_type:"histogram",
            mapAttr:"default",
            backgroundColorMode:true   // true 底为白色
        };
    },

    computed: {
        ...mapGetters([
            'times',
            'prop_index'
        ]),
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
            'getAllData',
            'selectYear'
        ]),
        generateControls(){
            var _this = this;
            var attrs = Object.keys(_this.prop_index);
            var obj = {
                layout:_this.type,
                dis_type:_this.dis_type,
                mapAttr:"default",
                background:true
            }
            // var attrList = Object.keys(index_prop).map(d=>{return index_prop[d]});
            var gui = new dat.GUI({autoPlace: false});

            var customContainer = d3.select('#g_network_view').node();
            customContainer.appendChild(gui.domElement);
            gui.add(obj,"layout",['MDS','FDA']).onChange(_this.toggleView);
            gui.add(obj,"dis_type",['radar','histogram']).onChange(_this.toggleDistributionView);
            gui.add(obj,"mapAttr",attrs.concat("default")).onChange(_this.changeMDS_mapAttr);
            gui.add(obj,"background").onChange(_this.toggleBackgroundColorMode);
            gui.close();
        },
        toggleView(type){
            this.type = type;
        },
        toggleDistributionView(value){
            this.dis_type = value;
        },
        toggleBackgroundColorMode(){
            this.backgroundColorMode = !this.backgroundColorMode;
        },
        changeMDS_mapAttr(value){
            this.mapAttr = value;
        },
        preTime(){
            var time = this.currentTime,
                times = this.times;
            if(time>times[0]){
                // this.initProperty();
                this.selectYear(+time-1);
            }
        },
        nextTime(){
            var time = this.currentTime,
                times = this.times;
            if(time<times[times.length-1]){
                // this.initProperty()
                this.selectYear(+time+1);
            }
        },
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
    background-color: black;
    color:white;
    height:20px;
    line-height:20px;
    width:200px !important;
    text-align: right;
    padding-right:10px;
}
.arrow{
    position:absolute;
    opacity:0.2;
}
.arrow-left{
    top:275px;
    left:10px;
    background-color: grey;

}
.arrow-right{
    right:10px;
    top:275px;
    background-color: grey;

}
.arrow-left:hover, .arrow-right:hover{
    cursor:pointer;
}
.arrow-left:before{
    display:block;
    content:"<";
    font-size:40px;
    color:black;
    /*padding-top:5px;*/
}
.arrow-right:before{
    display:block;
    content:">";
    font-size:40px;
    color:black;
    /*padding-top:5px;*/
}
.search{
    position: absolute;
    left:2px;
    top:0px;
}
.search:after{
    display: inline-block;
    content:'🔍';
    position:relative;
    top:2px;
    left:2px;
    font-size:14px;
}
/*#searchInput:after{
    display: inline-block;
    content:'🔍';
    position:relative;
    top:2px;
    right:2px;
    font-size:14px;
}*/
#searchInput{
    display: inline-block;
    width:100px;
    height:15px;
    background-color: #eae3e3;
    border-radius: 2px;
}
</style>
