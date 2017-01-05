<template lang="html">
    <div class="container">
        <net-head></net-head>
        <net-body></net-body>
        <!-- <div id="tmp_stat">

        </div> -->
    </div>
</template>

<script>
import NetHead from './components/Head.vue'
import NetBody from './components/Body.vue'


export default {
    data: function() {
        return {

        }
    },
    methods:{

    },
    components: {
        NetHead,
        NetBody
    }
}
</script>

<style lang="css" scoped>
    .container{
        display:flex;
        flex-direction:column;
        width:1400px;
        height:800px;
        margin:0 auto;
    }
    #tmp_stat{
        position: absolute;
        top:800px;
        left:100px;
        width:400px;
        height:400px;
    }
</style>
