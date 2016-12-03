<template lang="html">
    <div class="bodyContainer main clearfx">

        <div class="colum main-left">
            <sort-view></sort-view>
        </div>

        <div class="colum main-middle">
            <net-graph></net-graph>
            <net-stat></net-stat>
        </div>

        <div class="colum main-right">
            <!-- <Demo v-for="(author,index) in selected" :key="index" :selected="author"></Demo> -->
            <net-individual v-for="(author,index) in selected" :key="index" :selected="author" :classed="author.split(' ').join('')+'_individual'"></net-individual>
        </div>
    </div>
</template>

<script>
import NetGraph from './middle/Graph.vue'
import NetStat from './middle/Statistic.vue'
import NetIndividual from './right/Individual.vue'
import SortView from './left/SortView.vue'


export default {
    data() {
        return {};
    },
    computed: {
        selected(){
            return this.$store.state.selected;
        }
    },

    methods: {

    },
    mounted(){

        console.log(`select: ${this.selected}`);
    },
    components: {
        NetGraph,
        NetStat,
        NetIndividual,
        SortView
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
