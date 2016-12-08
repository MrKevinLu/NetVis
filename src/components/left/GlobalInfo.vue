<template lang="html">
    <div class="global_info">
        <table>
            <tr>
                <td class="title">year:</td>
                <td>{{currentTime}}</td>
            </tr>
            <tr>
                <td class="title">Nodes:</td>
                <td>{{numOfNodes}}</td>
            </tr>
            <tr>
                <td class="title">Links:</td>
                <td>{{numOfLinks}}</td>
            </tr>
        </table>
    </div>
</template>

<script>
export default {
    data() {
        return {};
    },
    computed: {

        currentTime:function(){
            return this.$store.state.currentTime
        },
        numOfNodes:function(){
            var time = this.currentTime;
            if(this.$store.state.graph!='') return this.$store.state.graph[time].nodes.length;
            else return 0;
        },
        numOfLinks:function(){
            var time = this.currentTime;
            if(this.$store.state.graph!='') return this.$store.state.graph[time].links.length;
            else return 0;
        },
    },
    methods: {},
    components: {}
};
</script>

<style lang="css" scoped>
.global_info{
    height:100px;
}
table{
    width:192px;
    height:100px;
    text-align: center;
    border-collapse:collapse;
    font-size:14px;
}
table,tr,td{
    border:1px lightgrey solid;
}

.title{
    /*padding-left: 15px;*/
    font-weight:bold;
}
</style>
