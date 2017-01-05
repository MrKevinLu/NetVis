import * as d3 from 'd3'

var map = d3.map;

function constant(x) {
    return function() {
        return x;
    };
}

function jiggle() {
    return (Math.random() - 0.5) * 1e-6;
}

function index(d) {
    return d.index;
}

function find(nodeById, nodeId) {
    var node = nodeById.get(nodeId);
    if (!node) throw new Error("missing: " + nodeId);
    return node;
}

export default function(links) {
    var id = index,
        strength = defaultStrength,
        strengths,
        distance = constant(30),
        distances,
        nodes,
        count,
        bias,
        iterations = 1,
        metaNodes,
        metaLinks = [],
        cc = 0,
        threshold = 1,
        flag = false;

    if (links == null) links = [];

    function defaultStrength(link) {
        return 1 / Math.min(count[link.source.index], count[link.target.index]);
    }

    function force(alpha) {

        if (flag) {
            for (var k = 0, n = links.length; k < iterations; ++k) {
                for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
                    link = links[i], source = link.source, target = link.target;
                    // 添加
                    if (source.community != target.community) continue;
                    x = target.x + target.vx - source.x - source.vx || jiggle();
                    y = target.y + target.vy - source.y - source.vy || jiggle();
                    l = Math.sqrt(x * x + y * y);
                    l = (l - distances[i]) / l * alpha * strengths[i];
                    x *= l, y *= l;
                    cc++;
                    // console.log(x);
                    // console.log(bias[i],n,iterations);
                    target.vx -= x * (b = bias[i]);
                    target.vy -= y * b;
                    source.vx += x * (b = 1 - b);
                    source.vy += y * b;
                }
            }
            // console.log(cc,links.length);
        } else {
            for (let t = 0; t < metaNodes.length; t++) {
                var mNode = metaNodes[t],
                    groupNodes = mNode.children;
                mNode.x = d3.mean(groupNodes, n => n.x);
                mNode.y = d3.mean(groupNodes, n => n.y);
                mNode.vx = d3.mean(groupNodes, n => n.vx);
                mNode.vy = d3.mean(groupNodes, n => n.vy);
            }
            // console.log(metaNodes);
            for (var k = 0, n = metaLinks.length; k < iterations; ++k) {
                for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
                    cc++;

                    link = metaLinks[i], source = link.source, target = link.target;
                    x = target.x + target.vx - source.x - source.vx || jiggle();
                    y = target.y + target.vy - source.y - source.vy || jiggle();


                    l = Math.sqrt(x * x + y * y);
                    l = (l - distances[i]) / l * alpha * strengths[i];
                    x *= l, y *= l;
                    var tNodes = target.children,
                        sNodes = source.children;
                    b = bias[i];
                    if (target.type == "fuzzyNode") {
                        for (let j = 0; j < tNodes.length; j++) {
                            var nn = tNodes[j];
                            nn.vx -= x * b;
                            nn.vy -= y * b
                        }
                    }
                    if (source.type == "fuzzyNode") {
                        for (let j = 0; j < sNodes.length; j++) {
                            var nn = sNodes[j];
                            nn.vx += x * (1 - b);
                            nn.vy += y * (1 - b)
                        }
                    }

                }
            }
        }

    }

    function initialize() {
        if (flag) {
            if (!nodes) return;

            var i,
                n = nodes.length,
                m = links.length,
                nodeById = map(nodes, id),
                link;

            for (i = 0, count = new Array(n); i < m; ++i) {
                link = links[i], link.index = i;
                if (typeof link.source !== "object") link.source = find(nodeById, link.source);
                if (typeof link.target !== "object") link.target = find(nodeById, link.target);
                count[link.source.index] = (count[link.source.index] || 0) + 1;
                count[link.target.index] = (count[link.target.index] || 0) + 1;
            }

            for (i = 0, bias = new Array(m); i < m; ++i) {
                link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
            }

            strengths = new Array(m), initializeStrength();
            distances = new Array(m), initializeDistance();
        } else {
            if (!metaNodes) return;
            if (links.length != 0) {
                getMetaLinks();
                // console.log(metaLinks);
            }
            var i,
                n = metaNodes.length,
                m = metaLinks.length;
            nodeById = map(metaNodes, function(d) {
                    return d.gIndex
                }),
                link;
            for (i = 0, count = new Array(n); i < m; ++i) {
                link = metaLinks[i], link.index = i;
                if (typeof link.source !== "object") link.source = find(nodeById, link.source);
                if (typeof link.target !== "object") link.target = find(nodeById, link.target);
                count[link.source.index] = (count[link.source.index] || 0) + 1;
                count[link.target.index] = (count[link.target.index] || 0) + 1;
            }
            // console.log(metaNodes);
            for (i = 0, bias = new Array(m); i < m; ++i) {
                link = metaLinks[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
            }
            // console.log(bias);
            strengths = new Array(m), initializeStrength();
            distances = new Array(m), initializeDistance();
        }

    }

    function initializeStrength() {
        if (flag) {
            if (!nodes) return;

            for (var i = 0, n = links.length; i < n; ++i) {
                strengths[i] = +strength(links[i], i, links);
            }
        } else {
            if (!metaNodes) return;

            for (var i = 0, n = metaLinks.length; i < n; ++i) {
                strengths[i] = +strength(metaLinks[i], i, metaLinks);
            }
        }

    }

    function initializeDistance() {
        if (flag) {
            if (!nodes) return;

            for (var i = 0, n = links.length; i < n; ++i) {
                distances[i] = +distance(links[i], i, links);
            }
        } else {
            if (!metaNodes) return;

            for (var i = 0, n = metaLinks.length; i < n; ++i) {
                distances[i] = +distance(metaLinks[i], i, metaLinks);
            }
        }

    }

    force.initialize = function(_) {
        nodes = _;
        initMetaNodes();
        initialize();
    };

    function initMetaNodes() {
        var coreNodes = nodes.filter(n => {
            return n.fuzzy <= threshold;
        });
        var fuzzyNodes = nodes.filter(n => {
            return n.fuzzy > threshold;
        });
        // 构建元节点
        var mNodes = d3.nest().key(n => n.community).map(coreNodes).values();
        metaNodes = mNodes.map((nodes, i) => {
            return {
                children: nodes,
                num: nodes.length,
                gIndex: nodes[0].community + "unfuzzy",
                index: i,
                type: "coreNode"
            }
        });

        for (let fn of fuzzyNodes) {
            var i = d3.max(metaNodes, n => n.index);
            metaNodes.push({
                children: [fn],
                num: 1,
                gIndex: (fn.id || fn.name) + fn.community + "fuzzy",
                index: ++i,
                type: "fuzzyNode"
            })
        }
        // console.log(metaNodes);
    }

    function getMetaLinks() {
        //构建元边
        var nodeById = map(nodes, d => d.id || d.name);
        var tmp_metaLinks = [];
        for (let l of links) {
            if (l.virtual) continue;
            var source = typeof l.source !== "object" ? find(nodeById, l.source) : l.source,
                target = typeof l.target !== "object" ? find(nodeById, l.target) : l.target,
                flag = false;
            var c1, c2, w;
            if (source.fuzzy > threshold && target.fuzzy <= threshold) {

                c1 = (source.id || source.name) + source.community + "fuzzy";
                c2 = target.community + "unfuzzy";
                w = l.weight || l.value;
            }
            if (target.fuzzy > threshold && source.fuzzy <= threshold) {

                c1 = (target.id || target.name) + target.community + "fuzzy";
                c2 = source.community + "unfuzzy";
                w = l.weight || l.value;
            }
            if (c1 == undefined || c2 == undefined) continue;
            // var c1 = source.community+(source.fuzzy>threshold?"fuzzy":"unfuzzy"),
            //     c2 = target.community+(target.fuzzy>threshold?"fuzzy":"unfuzzy"),
            //     w = l.weight||l.value;

            // if(c1==c2 || source.fuzzy>threshold ||target.fuzzy>threshold){
            //     continue;
            // };

            if ((source.fuzzy > threshold && target.fuzzy <= threshold) || (target.fuzzy > threshold && source.fuzzy <= threshold)) {
                for (let ml of tmp_metaLinks) {
                    var metaS = ml.source,
                        metaT = ml.target;
                    // 若存在元边，更新权重
                    if ((metaS == c1 && metaT == c2) || (metaS == c2 && metaT == c1)) {
                        flag = true;
                        ml.weight += w;
                        break;
                    }
                }
                //若不存在，添加一条新的元边
                if (!flag) {
                    tmp_metaLinks.push({
                        source: c1,
                        target: c2,
                        weight: w,
                        tag: c1
                    })
                }
            }
        }
        var metaLinksByTag = d3.nest().key(d => d.tag).map(tmp_metaLinks),
            tags = metaLinksByTag.keys();
        for (let k of tags) {
            var groups = metaLinksByTag.get(k).sort((a, b) => b.weight - a.weight).slice(0, 2);
            metaLinks.push(...groups)
        }

        // console.log(metaLinks);
    }

    force.links = function(_) {
        return arguments.length ? (links = _, initialize(), force) : links;
    };

    force.id = function(_) {
        return arguments.length ? (id = _, force) : id;
    };

    force.threshold = function(_) {
        return arguments.length ? (threshold = _, force) : threshold;
    };

    force.iterations = function(_) {
        return arguments.length ? (iterations = +_, force) : iterations;
    };

    force.strength = function(_) {
        return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
    };

    force.distance = function(_) {
        return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
    };

    return force;
}
