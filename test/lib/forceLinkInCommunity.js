(function() {
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

    d3.forceLinkInCommunity = function(links) {
        var id = index,
            strength = defaultStrength,
            strengths,
            distance = constant(30),
            distances,
            nodes,
            count,
            bias,
            iterations = 1,
            cc=0,
            innerLinks = [],
            threshold = 1,
            flag = false;

        if (links == null) links = [];

        function defaultStrength(link) {
            return 1 / Math.min(count[link.source.index], count[link.target.index]);
        }

        function force(alpha) {
            if(flag){
                for (var k = 0, n = links.length; k < iterations; ++k) {
                    for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
                        // console.log(i);
                        link = links[i], source = link.source, target = link.target;
                        if(source.community!=target.community) continue;
                        x = target.x + target.vx - source.x - source.vx || jiggle();
                        y = target.y + target.vy - source.y - source.vy || jiggle();
                        l = Math.sqrt(x * x + y * y);
                        l = (l - distances[i]) / l * alpha * strengths[i];
                        x *= l, y *= l;
                        target.vx -= x * (b = bias[i]);
                        target.vy -= y * b;
                        source.vx += x * (b = 1 - b);
                        source.vy += y * b;
                    }
                }
            }else{
                // console.log(1111);
                for (var k = 0, n = innerLinks.length; k < iterations; ++k) {
                    for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
                        // console.log(i);
                        link = innerLinks[i], source = link.source, target = link.target;
                        x = target.x + target.vx - source.x - source.vx || jiggle();
                        y = target.y + target.vy - source.y - source.vy || jiggle();
                        l = Math.sqrt(x * x + y * y);
                        l = (l - distances[i]) / l * alpha * strengths[i];
                        x *= l, y *= l;
                        target.vx -= x * (b = bias[i]);
                        target.vy -= y * b;
                        source.vx += x * (b = 1 - b);
                        source.vy += y * b;
                    }
                }
            }

        }

        function initialize() {
            if (!nodes) return;
            if(flag){
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
            }else{
                if(links.length!=0){
                    getInnerLinks();
                }

                var i,
                    n = nodes.length,
                    m = innerLinks.length,
                    nodeById = map(nodes, id),
                    link;

                for (i = 0, count = new Array(n); i < m; ++i) {
                    link = innerLinks[i];
                    if (typeof link.source !== "object") link.source = find(nodeById, link.source);
                    if (typeof link.target !== "object") link.target = find(nodeById, link.target);
                    count[link.source.index] = (count[link.source.index] || 0) + 1;
                    count[link.target.index] = (count[link.target.index] || 0) + 1;
                }

                for (i = 0, bias = new Array(m); i < m; ++i) {
                    link = innerLinks[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
                }

                strengths = new Array(m), initializeStrength();
                distances = new Array(m), initializeDistance();
            }

        }

        function initializeStrength() {
            if (!nodes) return;
            if(flag){
                for (var i = 0, n = links.length; i < n; ++i) {
                    strengths[i] = +strength(links[i], i, links);
                }
            }else{
                for (var i = 0, n = innerLinks.length; i < n; ++i) {
                    strengths[i] = +strength(innerLinks[i], i, innerLinks);
                }
            }

        }

        function initializeDistance() {
            if (!nodes) return;
            if(flag){
                for (var i = 0, n = links.length; i < n; ++i) {
                    distances[i] = +distance(links[i], i, links);
                }
            }else{
                for (var i = 0, n = innerLinks.length; i < n; ++i) {
                    distances[i] = +distance(innerLinks[i], i, innerLinks);
                }
            }

        }
        function getInnerLinks(){
            var nodeById = map(nodes,id);

            for(let [i,l] of links.entries()){
                var link = links[i];
                link.index = i;
                if (typeof link.source !== "object") link.source = find(nodeById, link.source);
                if (typeof link.target !== "object") link.target = find(nodeById, link.target);
            }

            for(let l of links){
                var source = l.source;
                var target = l.target;
                // 只选择社区内部非模糊边
                // if(source.community!=target.community || source.fuzzy>threshold ||target.fuzzy>threshold){
                //     // console.log(true);
                //     continue;
                // }
                // else{
                //     innerLinks.push(l);
                // }
                if(source.community == target.community && source.fuzzy<=threshold && target.fuzzy<=threshold){
                    innerLinks.push(l);
                }
            }

        }

        force.initialize = function(_) {
            nodes = _;
            initialize();
        };

        force.links = function(_) {
            return arguments.length ? (links = _, initialize(), force) : links;
        };

        force.id = function(_) {
            return arguments.length ? (id = _, force) : id;
        };

        force.threshold = function(_){
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
})()
