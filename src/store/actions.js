import * as types from './mutation-types'
const GRAPH_PATH = "../../data/graph.json"
const PROPERTY_PATH = "../../data/node_attrs.json"
const NODE_TO_INDEX_PATH = "../../data/node_to_index.json"
const MDS_PATH = "../../data/mds.json"

/**
 * 获取所有数据
 * @param  {[type]} {commit} [description]
 * @return {[type]}          [description]
 */
export const getAllData = ({commit}) => {
    var startTime = new Date();

    Promise.all([getGraphData(), nodeAttrsData(),getNodeToIndex(),getMdsData()]).then(function(data) {
        // console.log(data);
        var endTime = new Date();
        console.log("获取数据花费：",(endTime-startTime)/1000);
        commit(types.GET_ALL_DATA, data)

    })
}

/**
 * 删选个体中心网络视图中的时间段（局部）
 * @param  {[type]} {commit} [description]
 * @param  {[type]} data     [description]
 * @return {[type]}          [description]
 */
export const changeLocalTArray = ({commit},data)=>{
    commit(types.CHANGE_LOCAL_T_ARRAY, data)
}

/**
 * 增加个体中心网络
 * @param  {[type]} {commit} [description]
 * @param  {[type]} author   作者名
 * @return {[type]}          [description]
 */
export const addIndividual = ({commit},author)=>{
    console.log(author);
    commit(types.ADD_INDIVIDUAL, author)
}
/**
 * 删除某个个体中心网络
 * @param  {[type]} {commit} [description]
 * @param  {[type]} author   [description]
 * @return {[type]}          [description]
 */
export const deleteIndividual = ({commit},author)=>{
    commit(types.DELETE_INDIVIDUAL,author)
}

/**
 * 选择年份，从而改变群体网络视图以及详细信息视图
 * @param  {[type]} {commit} [description]
 * @param  {[type]} year     [description]
 * @return {[type]}          [description]
 */
export const selectYear = ({commit}, year)=>{
    commit(types.SELECT_YEAR,year);
}


const getNodeToIndex = ()=>{
    return new Promise((resolve,reject)=>{
        fetch(NODE_TO_INDEX_PATH).then(res=>{
            res.json().then(node_to_index =>{
                resolve(node_to_index);
            })
        })
    })
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
const getMdsData = ()=>{
    return new Promise((resolve, reject) => {
        fetch(MDS_PATH).then(res => {
            res.json().then(mds => {
                resolve(mds)
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
