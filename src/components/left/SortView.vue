<template lang="html">
    <div class="sortView">
        <button class="add_author">add</button>
        <button class="delete_author">delete</button>
        <div id="test_animation">

        </div>
    </div>

</template>

<script>
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
    computed: {},
    mounted(){
        // console.log($);
        // $('#test_animation').velocity({width:"100px",height:"200px"},1500);
        var _this = this;
        d3.select(".add_author").on("click",function(){
            _this.addIndividual("Thomas Ertl");
        })
        d3.select(".delete_author").on("click",function(){
            _this.deleteIndividual("Thomas Ertl");
        })
    },
    methods: {
        ...mapActions([
            'addIndividual',
            'deleteIndividual'
        ])
    },
    components: {}
};
</script>

<style lang="css" scoped>
#test_animation{
    background-color: red;
}
</style>
