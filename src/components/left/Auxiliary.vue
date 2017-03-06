<template lang="html">
    <div class="auxiliary">
        <global-info></global-info>
        <community-dis></community-dis>
        <sort-view></sort-view>
    </div>

</template>

<script>
import GlobalInfo from './GlobalInfo.vue'
import CommunityDis from './CommunityDis.vue'
import SortView from './SortView.vue'
import {mapActions, mapGetters} from 'vuex'
import d3 from '../../lib/d3-extend'
// 导入全局变量失败，原因不明
import $ from 'jquery';
window.jQuery = window.$ = $;
require('velocity-animate');


export default {
    data() {
        return {};
    },
    computed: {
        graph:function(){
            return this.$store.state.graph;
        }
    },
    mounted(){
        var _this = this;
    },
    methods: {
        ...mapActions([
            'addIndividual',
            'deleteIndividual',
            'selectYear'
        ])
    },
    components: {
        GlobalInfo,
        CommunityDis,
        SortView
    }
};
</script>

<style lang="css" scoped>
    .auxiliary{
        flex:1;
        display:flex;
        flex-direction:column;
    }


</style>
