import * as d3 from 'd3'
import forceLinkBetCommunity from './force-extend/forceLinkBetCommunity.js'
import forceLinkFuzzy from './force-extend/forceLinkFuzzy.js'
import forceLinkInCommunity from './force-extend/forceLinkInCommunity.js'
import forceRepBetCommunity from './force-extend/forceRepBetCommunity.js'
import forceRepInCommunity from './force-extend/forceRepInCommunity.js'
import metaCollide from './force-extend/metaCollide.js'

d3.forceLinkBetCommunity = forceLinkBetCommunity;
d3.forceLinkFuzzy = forceLinkFuzzy;
d3.forceLinkInCommunity = forceLinkInCommunity;
d3.forceRepBetCommunity = forceRepBetCommunity;
d3.forceRepInCommunity = forceRepInCommunity;
d3.metaCollide = metaCollide;

export default d3
