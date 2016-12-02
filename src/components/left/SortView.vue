<template lang="html">
    <div class="sortView">
        <button class="add_author">add</button>
        <button class="delete_author">delete</button>
    </div>
</template>

<script>
import {mapActions, mapGetters} from 'vuex'
import d3 from '../../lib/d3-extend'

export default {
    data() {
        return {};
    },
    computed: {},
    mounted(){
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

</style>
