(function() {
        var quadtree = d3.quadtree;

        function x(d) {
            return d.x+d.vx;
        }

        function y(d) {
            return d.y+d.vy;
        }

        function constant(x) {
            return function() {
                return x;
            };
        }

        function jiggle() {
            return (Math.random() - 0.5) * 1e-6;
        }

        d3.forceCollideMetaNodes = function(radius) {
            var nodes,
                radii,
                strength = 1,
                iterations = 1,
                threshold = 1,
                metaNodes,
                flag = false;

            if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);

            function force() {
                if(flag){
                    var i, n = nodes.length,
                        tree,
                        node,
                        xi,
                        yi,
                        ri,
                        ri2;

                    for (var k = 0; k < iterations; ++k) {
                        tree = quadtree(nodes, x, y).visitAfter(prepare);
                        for (i = 0; i < n; ++i) {
                            node = nodes[i];
                            ri = radii[node.index], ri2 = ri * ri;
                            xi = node.x + node.vx;
                            yi = node.y + node.vy;
                            tree.visit(apply);
                        }
                    }

                    function apply(quad, x0, y0, x1, y1) {
                        var data = quad.data,
                            rj = quad.r,
                            r = ri + rj;
                        if (data) {
                            console.log(data);
                            if (data.index > node.index) {
                                var x = xi - data.x - data.vx,
                                    y = yi - data.y - data.vy,
                                    l = x * x + y * y;
                                if (l < r * r) {
                                    if (x === 0) x = jiggle(), l += x * x;
                                    if (y === 0) y = jiggle(), l += y * y;
                                    l = (r - (l = Math.sqrt(l))) / l * strength;
                                    node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
                                    node.vy += (y *= l) * r;
                                    data.vx -= x * (r = 1 - r);
                                    data.vy -= y * r;
                                }
                            }
                            return;
                        }
                        return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
                    }
                }else{
                    var i, n = metaNodes.length,
                        tree,
                        node,
                        xi,
                        yi,
                        ri,
                        ri2;

                    for(let i = 0;i<metaNodes.length;i++){
                        var metaNode = metaNodes[i];
                        var groupNodes = metaNode.children;
                        metaNode.x = d3.mean(groupNodes,(n)=>n.x);
                        metaNode.y = d3.mean(groupNodes,(n)=>n.y);
                        metaNode.vx = d3.mean(groupNodes,(n)=>n.vx);
                        metaNode.vy = d3.mean(groupNodes,(n)=>n.vy);
                    }

                    for (var k = 0; k < iterations; ++k) {
                        tree = quadtree(metaNodes, x, y).visitAfter(prepare);
                        for (i = 0; i < n; ++i) {
                            node = metaNodes[i];
                            ri = radii[node.index], ri2 = ri * ri;
                            xi = node.x + node.vx;
                            yi = node.y + node.vy;
                            console.log(ri2,xi,yi);
                            tree.visit(apply);
                        }
                    }

                    function apply(quad, x0, y0, x1, y1) {
                        var data = quad.data,
                            rj = quad.r,
                            r = ri + rj;
                        if (data) {
                            // console.log(data);
                            if (data.index > node.index) {
                                var x = xi - data.x - data.vx,
                                    y = yi - data.y - data.vy,
                                    l = x * x + y * y;
                                if (l < r * r) {
                                    if (x === 0) x = jiggle(), l += x * x;
                                    if (y === 0) y = jiggle(), l += y * y;
                                    l = (r - (l = Math.sqrt(l))) / l * strength;

                                    for(let i=0; i < node.children.length;i++){
                                        var nn = node.children[i];
                                        nn.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
                                        nn.vy += (y *= l) * r;
                                    }
                                    for(let i =0;i<data.children.length;i++){
                                        var nn = data.children[i];
                                        nn.vx -= x * (r = 1 - r);
                                        nn.vy -= y * r;
                                    }
                                }
                            }
                            return;
                        }
                        return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
                    }
                }

            }

            function prepare(quad) {
                if (quad.data) return quad.r = radii[quad.data.index];
                for (var i = quad.r = 0; i < 4; ++i) {
                    if (quad[i] && quad[i].r > quad.r) {
                        quad.r = quad[i].r;
                    }
                }
            }

            function initialize() {
                if(flag){
                    if (!nodes) return;
                    var i, n = nodes.length,
                        node;
                    radii = new Array(n);
                    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
                }else{
                    if (!nodes) return;
                    var i, n = metaNodes.length,
                        node;
                    radii = new Array(n);
                    for (i = 0; i < n; ++i) node = metaNodes[i], radii[node.index] = +radius(node, i, metaNodes);
                }

            }

            force.initialize = function(_) {
                nodes = _;
                var corNodes = nodes.filter(n=>n.fuzzy<=threshold);
                var mNodes = d3.nest().key(n=>n.community).map(corNodes).values();
                metaNodes = mNodes.map((nodes,i)=>{
                    return {
                        children:nodes,
                        num:nodes.length,
                        gIndex:nodes[0].community,
                        index:i
                    }
                });
                initialize();
            };

            force.threshold = function(_){
                return arguments.length ? (threshold = _, force) : threshold;
            };

            force.iterations = function(_) {
                return arguments.length ? (iterations = +_, force) : iterations;
            };

            force.strength = function(_) {
                return arguments.length ? (strength = +_, force) : strength;
            };

            force.radius = function(_) {
                return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
            };

            return force;
        }
    })()
