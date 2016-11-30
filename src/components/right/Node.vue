<template lang="html">
    <transition name="fade">
        <circle :cx="local_timeScale(node.time)" :cy="node.i_y" r="3" fill="green"></circle>
        <!-- <rect :x= "local_timeScale(node.time)-10/2" :y="gen_y()-6/2" fill="green" width=10 height=6></rect> -->
    </transition>
</template>

<script>
export default {
    props:['node',"index","len","mapAttr","orderAttr","local_timeScale"],
    data() {
        return {
            x:30,
            y:10
        };
    },
    computed: {},

    mounted() {

    },
    methods: {
        gen_y(){
            return Math.random()*300;
        }
    },
    components: {}
};
</script>

<style lang="css" scoped>
/*circle{
    stroke-width:1px;
    stroke:black;
}*/
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>
