<template lang="html">
    <div class="header">
        <span class="title">{{ title }}</span>
    </div>

</template>

<script>
import {set} from 'vue'
import d3 from '../lib/d3-extend'
import dat from '../lib/dat.gui.min'

export default {
    props: ['titleContent'],
    data() {
        return {
            title: "DMNVis"
        }
    },
    updated: function() {
        console.log("updated head");
    },
    mounted(){
        this.generateControls();
    },
    methods: {
        generateControls(){
            var obj = {
                orderAttr: "cluster",
                colorMap: "default",
                startColor: [128,128,128],
                endColor: [90,90,90]
            }
            var gui = new dat.GUI({autoPlace: false});
            var customContainer = d3.select(".header").node();
            customContainer.appendChild(gui.domElement);
            gui.add(obj,"orderAttr",["cluster","t_pub","t_deg","t_avgW","t_avgC"]);
            gui.add(obj,"colorMap",["default","t_pub","t_deg","t_avgW","t_avgC"]);
            gui.addColor(obj,"startColor");
            gui.addColor(obj,"endColor");
            gui.close();
        }
    }

};
</script>

<style lang="css" scoped>
.header {
    position: relative;
    box-sizing: border-box;
    width:100%;
    border-radius: 4px;
    line-height: 35px;

    color:#dbd9d9;
    background-color: #686767;
    margin-bottom: 5px;
}

.title{
    display: inline-block;
    padding-left: 20px;
}

</style>

<style lang="css">
    .header .dg.main{
        position:absolute;
        top:0;
        right:0;
        z-index:999;
        border-radius: 4px;
        width:200px !important;
    }
    .header .dg.main .close-button{
        box-sizing: border-box;
        background-color: #686767;
        height:35px;
        line-height:35px;
        width:200px !important;
        text-align: right;
        padding-right:10px;
    }
</style>
