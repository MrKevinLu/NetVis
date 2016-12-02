import * as types from './mutation-types'
const GRAPH_PATH = "../../data/graph.json"
const PROPERTY_PATH = "../../data/node_attrs.json"


export const getAllData = ({commit}) => {
    Promise.all([getGraphData(), nodeAttrsData()]).then(function(data) {
        // console.log(data);
        commit(types.GET_ALL_DATA, data)
    })
}

export const changeLocalTArray = ({commit},data)=>{
    commit(types.CHANGE_LOCAL_T_ARRAY, data)
}

export const addIndividual = ({commit},author)=>{
    console.log(author);
    commit(types.ADD_INDIVIDUAL, author)
}
export const deleteIndividual = ({commit},author)=>{
    commit(types.DELETE_INDIVIDUAL,author)
}
const changeTime = ({commit},time)=>{
    commit(types.CHANGE_TIME, time)
}


const getGraphData = () => {
    return new Promise((resolve, reject) => {
        fetch(GRAPH_PATH).then(res => {
            res.json().then(graph => {
                resolve(graph)
            })
        })
    })
}

const nodeAttrsData = () => {
    return new Promise((resolve, reject) => {
        fetch(PROPERTY_PATH).then(res => {
            res.json().then(graph => {
                resolve(graph)
            })
        })
    })
}
