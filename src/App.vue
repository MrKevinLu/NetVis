<template lang="html">
    <div class="container">
        <net-head></net-head>
        <net-body></net-body>
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
    components: {
        NetHead,
        NetBody
    }
}
</script>

<style lang="css" scoped>
    .container{
        width:1304px;
        height:710px;
        margin:0 auto;
    }
</style>
