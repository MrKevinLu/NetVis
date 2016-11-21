<template lang="html">
    <div class="container">
        <!-- <container-head></container-head>
        <container-body>
            <body-left></body-left>
            <body-middle></body-middle>
            <body-right></body-right>
        </container-body> -->
        <el-row>
          <el-col :span="24"><div class="grid-content">DMNVis</div></el-col>
        </el-row>
        <graph></graph>
        <footlbb></footlbb>
    </div>
</template>

<script>
import Headlbb from './components/Head.vue'
import Footlbb from './components/Foot.vue'
import Graph from './components/Body.vue'

export default {
    data: function() {
        return {
            title: "this is the head"
        }
    },
    components: {
        Headlbb,
        Graph,
        Footlbb
    }
}
</script>

<style lang="css">
    .grid-content {
        border-radius: 4px;
        line-height: 36px;
        padding-left: 26px;;
        color:#dbd9d9;
        background-color: #686767;
        margin-bottom: 5px
    }
    /*.el-row {
       margin-bottom: 20px;
       &:last-child {
         margin-bottom: 0;
       }
     }
     .el-col {
       border-radius: 4px;
     }
     .bg-purple-dark {
       background: #99a9bf;
     }
     .bg-purple {
       background: #d3dce6;
     }
     .bg-purple-light {
       background: #e5e9f2;
     }

     .row-bg {
       padding: 10px 0;
       background-color: #f9fafc;
     }*/
</style>
