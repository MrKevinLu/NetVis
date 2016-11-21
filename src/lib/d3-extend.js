import * as d3 from 'd3'


function index(d) {
    return d.group;
}

function find(nodeById, nodeId) {
    var node = nodeById.get(nodeId);
    if (!node) throw new Error("missing: " + nodeId);
    return node;
}

function jiggle() {
    return (Math.random() - 0.5) * 1e-6;
}

function constant(x) {
    return function() {
        return x;
    };
}

d3.metaForce = function(links) {
    var id = index,
        strength = defaultStrength,
        strengths,
        distance = constant(60),
        distances,
        nodes,
        count,
        bias,
        iterations = 1,
        metaLinks,
        metaNodes,
        iter = 0;

    if (links == null) links = [];

    function defaultStrength(link) {
        return 1 / Math.min(count[link.source.index], count[link.target.index]);
    }

    function force(alpha) {
        if(iter>0){

            var nodeById = d3.map(metaNodes, id);

            for (var k = 0, n = metaLinks.length; k < iterations; ++k) {
                for (var i = 0, mlink, source, target, x, y, l, b; i < n; i++) {
                    mlink = metaLinks[i], source = find(nodeById, mlink.source.group), target = find(nodeById, mlink.target.group);
                    // console.log(source.children);
                    var x1 = 0,
                        y1 = 0,
                        x2 = 0,
                        y2 = 0;
                    source.children.forEach(n => {
                        x1 += n.x + n.vx
                        y1 += n.y + n.vy
                    })

                    x1 = x1 / (source.children.length)
                    y1 = y1 / (source.children.length)
                    // console.log(x1,y1);
                    target.children.forEach(n => {
                        x2 = n.x + n.vx
                        y2 = n.y + n.vy
                    })
                    x2 = x2 / (target.children.length)
                    y2 = y2 / (target.children.length)
                    x = x2 - x1
                    y = y2 - y1
                    // console.log(x,y);
                    l = Math.sqrt(x * x, y * y)
                    // console.log(strengths[i]);
                    l = (l - distances[i]) / l * alpha * strengths[i];
                    // console.log(l);
                    x *= l, y *= l;
                    b = bias[i]
                    debugger
                    target.children.forEach(n => {

                        console.log(x*b,y*b);
                        n.vx -= x * b;
                        n.vy -= y * b;
                    })
                    source.children.forEach(n => {
                        n.vx += x * (1 - b);
                        n.vy += y * (1 - b);
                    })
                }
            }
        }else{
            iter++;
        }

    }

    function initialize() {
        if (!metaNodes) return;
        metaLinks = initialMetaLinks(links)

        var i,
            n = metaNodes.length,
            m = metaLinks.length,
            nodeById = d3.map(metaNodes, id),
            link;

        for (i = 0, count = new Array(n); i < m; ++i) {
            link = metaLinks[i], link.index = i;
            if (typeof link.source !== "object") link.source = find(nodeById, link.source);
            if (typeof link.target !== "object") link.target = find(nodeById, link.target);
            count[link.source.index] = (count[link.source.index] || 0) + 1;
            count[link.target.index] = (count[link.target.index] || 0) + 1;
        }
        console.log(count);
        for (i = 0, bias = new Array(m); i < m; ++i) {
            link = metaLinks[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
        }
        // console.log(bias);
        strengths = new Array(m), initializeStrength();
        distances = new Array(m), initializeDistance();
    }

    function initializeStrength() {
        if (!nodes) return;
        for (var i = 0, n = metaLinks.length; i < n; ++i) {
            strengths[i] = +strength(metaLinks[i], i, links);
        }
        console.log(strengths);
    }

    function initializeDistance() {
        if (!nodes) return;

        for (var i = 0, n = metaLinks.length; i < n; ++i) {
            distances[i] = +distance(metaLinks[i], i, links);
        }
    }

    function initialMetaNodes(nodes) {
        metaNodes = []
        var obj = {},
            index = 0
        nodes.forEach(n => {
            var group = n.community
            if (obj[group]) {
                obj[group].children.push(n)
            } else {
                obj[group] = {
                    index: index++,
                    group: group,
                    children: [n]
                }
            }
        })
        metaNodes = d3.values(obj)
        return metaNodes
    }

    function initialMetaLinks(links) {
        metaLinks = []
        if(!links) return metaLinks
        links.forEach(l => {
            var sourceG = l.source.community;
            var targetG = l.target.community;
            // console.log(sourceG, targetG);
            if (sourceG != targetG) {
                // console.log(metaLinks.length);
                var newlink = {
                    source: sourceG,
                    target: targetG,
                    weight: 1,
                    children: [l]
                };
                var isExsist = false;
                for (let ml of metaLinks) {
                    var s = ml.source,
                        t = ml.target;
                    if ((sourceG == s && targetG == t) || (sourceG == t && targetG == s)) {
                        ml.weight++;
                        ml.children.push(l)
                        break;
                    }
                }
                if (!isExsist) metaLinks.push(newlink)
            }

        })
        return metaLinks
    }

    force.initialize = function(_) {
        // console.log(_);
        nodes = _;
        metaNodes = initialMetaNodes(_);
        initialize();
    };

    force.links = function(_) {
        return arguments.length ? (links = _, initialize(), force) : links;
    };

    force.id = function(_) {
        return arguments.length ? (id = _, force) : id;
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

export default d3
