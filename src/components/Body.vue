<template lang="html">
    <div class="main clearfx">
        <div class="colum main-left">
            123
        </div>

        <div class="colum main-middle">
            <net-graph></net-graph>
            <net-stat></net-stat>
        </div>

        <div class="colum main-right">
            123
        </div>
    </div>
</template>

<script>
import NetGraph from './middle/Graph.vue'
import NetStat from './middle/Statistic.vue'
export default {
    data() {
        return {};
    },
    computed: {},
    ready() {},
    attached() {},
    methods: {},
    components: {
        NetGraph,
        NetStat
    }
};
</script>

<style lang="css" scoped>

.main{
    width:100%;
    box-sizing: border-box;
    border:2px solid grey;
}

.colum{
    float:left;
    box-sizing: border-box;
    height:670px;
}

.main-left{
    border-right: 2px solid grey;
    width:200px;
}

.main-middle{
    border-right: 2px solid grey;
    width:550px;
}
.main-right{
    width:550px;
}
.clearfx::after{
    content:"";
    display: block;
    clear:both;
}

</style>
