<template lang="html">
    <div class="footer">
        This is the foot
    </div>
</template>

<script>
import * as d3 from 'd3'
export default {
    beforeMount:()=>{
        // console.log(d3.select(".footer").html());
    },
    mounted:()=>{
        // console.log(d3.select(".footer").html());
    }
};
</script>

<style lang="css">
    .footer{
        width:100%;
        background-color: grey;
        text-align: center;
    }
</style>
