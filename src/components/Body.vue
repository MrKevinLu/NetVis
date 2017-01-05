<template lang="html">
    <div class="bodyContainer main clearfx">

        <div class="colum main-left">
            <auxiliary></auxiliary>
        </div>

        <div class="colum main-middle">
            <!-- <net-graph></net-graph>
            <net-stat></net-stat> -->
        </div>

        <div class="colum main-right">
            <net-individual v-for="(author,index) in selected" :key="index" :selected="author" :timeArray="timeArray" :attr_data="attr_data" :classed="author.split('.').join('').split(' ').join('')+'_individual'"></net-individual>
        </div>
    </div>
</template>

<script>
import NetGraph from './middle/Graph.vue'
import NetStat from './middle/Statistic.vue'
import NetIndividual from './right/Individual.vue'
import Auxiliary from './left/Auxiliary.vue'
import d3 from '../lib/d3-extend'

export default {
    data() {
        return {
            time_range: ["1990", "2016"]
        };
    },
    computed: {
        selected(){
            return this.$store.state.selected;
        },
        attr_data(){
            return this.$store.state.attr_data;
        },
        timeArray() {
            var tr = this.time_range;
            var timeArray = d3.range(Number(tr[1]) - Number(tr[0]) + 1).map((d, i) => {
                return Number(tr[0]) + i + "";
            })
            return timeArray;
        }
    },

    methods: {

    },
    mounted(){
    },
    components: {
        NetGraph,
        NetStat,
        NetIndividual,
        Auxiliary
    }
};
</script>

<style lang="css" scoped>

.bodyContainer.main{
    display:flex;
    position:relative;
    align-items:stretch;
    width:100%;
    flex:1;
    box-sizing: border-box;
    border:2px solid grey;
}

.main-left{
    display: flex;
    flex-direction:column;
    flex:1;
    border-right: 2px solid grey;
}

.main-middle{
    display:flex;
    flex-direction:column;
    border-right: 2px solid grey;
    width:550px;
}
.main-right{
    position:relative;
    width:650px;
    display:flex;
    flex-direction:column;
    overflow: scroll;
}
.clearfx::after{
    content:"";
    display: block;
    clear:both;
}
</style>

<style lang="css">

</style>
