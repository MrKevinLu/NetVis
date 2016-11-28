<template lang="html">
    <transition name="fade">
        <rect :x= "timeScale(node.time)" :y="30" fill="red" width=10 height=6></rect>
    </transition>
</template>

<script>
export default {
    props:['node',"index","len","mapAttr","orderAttr","timeScale"],
    data() {
        return {
            x:30,
            y:30
        };
    },
    computed: {},
    ready() {},
    attached() {},
    mounted() {
        // console.log(this.node);
    },
    methods: {},
    components: {}
};
</script>

<style lang="css" scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>
