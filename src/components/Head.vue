<template lang="html">
    <div class="header">
        <span class="title">{{ title }}</span>
        <!-- <button class="help" name="button">Help</button> -->

        <!-- <el-row>
          <el-col :span="24"><div class="grid-content title">{{ title }}</div></el-col>
        </el-row> -->
    </div>

</template>

<script>
import {set} from 'vue'

export default {
    props: ['titleContent'],
    data() {
        return {
            title: "DMNVis"
        }
    },
    updated: function() {
        console.log("updated head");
    },
    methods: {

    }

};
</script>

<style lang="css" scoped>
.header {
    width:100%;
    border-radius: 4px;
    line-height: 35px;
    color:#dbd9d9;
    background-color: #686767;
    margin-bottom: 5px;
}

.title{
    display: inline-block;
    padding-left: 20px;
}

/*.help{
    width:60px;
    height:25px;
    border-radius: 4px;
    float: right;
}*/
</style>
