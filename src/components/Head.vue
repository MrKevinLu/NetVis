<template lang="html">
    <div class="header">
        {{ titleContent }}
        <div class="">
            <input type="text" v-model="key">
            <input type="text" v-model="value">
            <button type="button" @click="addObject">add</button>
            <span v-for="i in arr">{{ i }}</span>
        </div>
        <div class="">
            <p v-for="(value, key) in profile">{{ key }}:{{value}} </p>
        </div>
    </div>

</template>

<script>
import {set} from 'vue'

export default {
    props:['titleContent'],
    data(){
        return {
            key:"",
            value:"",
            arr:[],
            // test:"",
            profile:{
                name:"lbb",
                age:18
            }
        }
    },
    updated:function(){
        console.log("updated head");
    },
    methods:{
        addObject:function(){
            // this.test = Math.random();
            this.arr.push(Math.floor(Math.random()));
            // if(this.key.trim() && this.value.trim()){
            //     this.profile[this.key] = this.value;
            //     this.key = "";
            //     this.value = "";
            //     // this.profile.sex = "M"
            //     // this.$set(this.profile, 'sex', "M")
            //     // console.log(this.profile);
            // }
        }
    }

};
</script>

<style lang="css">
    .header{
        width:100%;
        background-color: grey;
        text-align: center;
    }
</style>
