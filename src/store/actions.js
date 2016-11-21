import * as types from './mutation-types'
console.log(types);
const GRAPH_PATH = "../../data/demo.json"
// function getGraph(data_links){
//     var result = {}
//     var times = Object.keys(data_links).sort((a,b)=>a<b)
//     for(var t of times){
//         var nodes,links,node_obj={};
//         result[t] = {};
//         links = result[t]["links"] = data_links[t];
//         nodes = result[t]["nodes"] = [];
//         for(let link of links){
//             var source = link.source;
//             var target = link.target;
//             if(!node_obj[source]){
//                 node_obj[source] = 1
//                 nodes.push({
//                     name:source
//                 })
//             }
//             if(!node_obj[target]){
//                 node_obj[target] = 1
//                 nodes.push({
//                     name:target
//                 })
//             }
//         }
//     }
//     return result
// }

export const getAllData = ({commit})=>{
    getGraphData().then(graph=>{
        // var time = "2000"
        // var subGraph = graph[time]
        commit(types.GET_ALL_DATA, graph)
    })
    // fetch("../../data/graph.json").then((res)=>{
    //     res.json().then(function(data){
    //         console.log(data);
    //         // var output = getGraph(data)["1995"]
    //         var output = data
    //         console.log("nodes:",output.nodes.length);
    //         console.log("links:",output.links.length);
    //         console.log(types.GET_ALL_DATA);
    //         commit(types.GET_ALL_DATA, output)
    //     })
    // })
}

const getGraphData = () => {
    return new Promise((resolve,reject)=>{
        fetch(GRAPH_PATH).then(res=>{
            res.json().then(graph=>{
                resolve(graph)
            })
        })
    })
}

const nodeAttrsData = () => {
    new Promise((resovel,reject)=>{
        fetch("../../data/node_attrs.json").then(res=>{
            res.json().then(attrsData =>{
                resolve(attrsData)
            })
        })
    })
}

export const deleteNode = ({commit})=>{
    console.log("success");
    commit(types.DELETE_NODE,true)
}

export const deleteLink = ({commit}, {id})=>{

}
