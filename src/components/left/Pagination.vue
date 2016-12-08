<template lang="html">

    <div id="page">
        <div class="container">
            <button class="item pre" :disabled="currentPage==1" @click="changePage(currentPage-1)">Pre</button>
            <button v-for="index in pageNumArr" class="item" :class="{active:index==currentPage}" @click="changePage(index)">
                {{index}}
            </button>
            <button class="item next" :disabled="currentPage==totalNum" @click="changePage(currentPage+1)">Next</button>
        </div>
    </div>

</template>

<script>
// import $ from 'jquery'
// var jQuery = $;
// import '../../lib/jqPaginator.min'

export default {
    props:["currentPage","itemNum","totalNum"],
    data() {
        return {
            pageNumArr:[1,2,3,4]
        };
    },
    computed: {

    },
    mounted() {

    },
    methods: {
        changePage:function(page){
            var currentPage = page,
                totalNum = this.totalNum;
            if(currentPage<=2){
                this.pageNumArr = [1,2,3,4]
            }else if(currentPage<totalNum-1){
                this.pageNumArr = [currentPage-1,currentPage,currentPage+1,currentPage+2];
            }else{
                this.pageNumArr = [totalNum-3,totalNum-2,totalNum-1,totalNum];
            }
            this.$emit('changePage',currentPage);
        }
    },
    components: {}
};
</script>

<style lang="css" scoped>
#page .item{
    width:20px;
    height:20px;
    border:0px;
    background-color: white;
    text-align: center;
}
.item:hover{
    cursor:pointer;
}

#page .active{
    background-color: black;
    color:white;
}
/*.item:hover{
    background-color:black;
}*/
.container{
    position:relative;
    float:right;
    height:40px;
    line-height: 40px;
}
#page .item.pre,#page .item.next{
    width:40px;
}
</style>
