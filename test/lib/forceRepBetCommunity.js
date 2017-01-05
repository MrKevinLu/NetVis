(function() {
    var quadtree = d3.quadtree;

    function x(d) {
        return d.x;
    }

    function y(d) {
        return d.y;
    }

    function constant(x) {
        return function() {
            return x;
        };
    }

    function jiggle() {
        return (Math.random() - 0.5) * 1e-6;
    }

    d3.forceRepBetCommunity = function() {
        var nodes,
            node,
            alpha,
            strength = constant(-30),
            strengths,
            distanceMin2 = 1,
            distanceMax2 = Infinity,
            theta2 = 0.81,
            metaNodes,
            flag = true,
            threshold = 1;

        function force(_) {
            if(flag){
                for(let i = 0;i<metaNodes.length;i++){
                    var metaNode = metaNodes[i];
                    var groupNodes = metaNode.children;
                    metaNode.x = d3.mean(groupNodes,(n)=>n.x);
                    metaNode.y = d3.mean(groupNodes,(n)=>n.y);
                    metaNode.vx = 0;
                    metaNode.vy = 0;
                }

                var i, n = metaNodes.length,
                    tree = quadtree(metaNodes, x, y).visitAfter(accumulate);
                for (alpha = _, i = 0; i < n; ++i) node = metaNodes[i], tree.visit(apply);
            }else{
                //原始
                var i, n = nodes.length,
                    tree = quadtree(nodes, x, y).visitAfter(accumulate);
                for (alpha = _, i = 0; i < n; ++i) {
                    node = nodes[i];
                    tree.visit(apply);
                }
            }
        }

        function initialize() {
            if(flag){
                // 修改
                if (!metaNodes) return;
                for(let i = 0;i<metaNodes.length;i++){
                    var metaNode = metaNodes[i];
                    var groupNodes = metaNode.children;
                    metaNode.x = d3.mean(groupNodes,(n)=>n.x);
                    metaNode.y = d3.mean(groupNodes,(n)=>n.y);
                    metaNode.vx = 0;
                    metaNode.vy = 0;
                }
                var i, n = metaNodes.length,
                    node;

                strengths = new Array(n);
                for (i = 0; i < n; ++i) node = metaNodes[i], strengths[node.index] = +strength(node, i, metaNodes);
            }else{
                if (!nodes) return;
                var i, n = nodes.length,
                    node;
                strengths = new Array(n);
                for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
            }



        }

        function accumulate(quad) {
            var strength = 0,
                q, c, x, y, i;
            // console.log(quad);
            // For internal nodes, accumulate forces from child quadrants.
            if (quad.length) {
                for (x = y = i = 0; i < 4; ++i) {
                    if ((q = quad[i]) && (c = q.value)) {
                        strength += c, x += c * q.x, y += c * q.y;
                    }
                }
                quad.x = x / strength;
                quad.y = y / strength;
            }

            // For leaf nodes, accumulate forces from coincident quadrants.
            else {
                q = quad;
                q.x = q.data.x;
                q.y = q.data.y;
                do strength += strengths[q.data.index];
                while (q = q.next);
            }

            quad.value = strength;
        }

        function apply(quad, x1, _, x2) {

            if (!quad.value) return true;
            var x = quad.x - node.x,
                y = quad.y - node.y,
                w = x2 - x1,
                l = x * x + y * y;

            // Apply the Barnes-Hut approximation if possible.
            // Limit forces for very close nodes; randomize direction if coincident.
            if (w * w / theta2 < l) {
                if (l < distanceMax2) {
                    if (x === 0) x = jiggle(), l += x * x;
                    if (y === 0) y = jiggle(), l += y * y;
                    if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
                    if(flag){
                        for(let i = 0;i<node.children.length;i++){
                            var n = node.children[i];
                            n.vx += x * quad.value * alpha / l;
                            n.vy += y * quad.value * alpha / l;
                        }
                    }else{
                        node.vx += x * quad.value * alpha / l;
                        node.vy += y * quad.value * alpha / l;
                    }


                }
                return true;
            }

            // Otherwise, process points directly.
            else if (quad.length || l >= distanceMax2) return;

            // Limit forces for very close nodes; randomize direction if coincident.
            if (quad.data !== node || quad.next) {
                if (x === 0) x = jiggle(), l += x * x;
                if (y === 0) y = jiggle(), l += y * y;
                if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
            }

            do
                if (quad.data !== node) {
                    w = strengths[quad.data.index] * alpha / l;
                    if(flag){
                        for(let i = 0;i<node.children.length;i++){
                            var n = node.children[i];
                            n.vx += x * w;
                            n.vy += y * w;
                        }
                    }else{
                        node.vx += x * w;
                        node.vy += y * w;
                    }
                }
            while (quad = quad.next);
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

        force.strength = function(_) {
            return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
        };

        force.threshold = function(_){
            return arguments.length ? (threshold = _, force) : threshold;
        };

        force.distanceMin = function(_) {
            return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
        };

        force.distanceMax = function(_) {
            return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
        };

        force.theta = function(_) {
            return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
        };

        return force;
    }
})()
