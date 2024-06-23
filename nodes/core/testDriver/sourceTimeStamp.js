module.exports = function(RED) {
    function SourceTimestampNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Function to create and send a new message with the start timestamp
        function sendMsg() {
            var msg = {};
            msg.startTimestamp = Date.now();
            node.send(msg);
        }

        // Handle manual triggering of the node
        node.on('input', function() {
            sendMsg();
        });
    }
    RED.nodes.registerType("source-timestamp", SourceTimestampNode);

    RED.httpAdmin.post("/customInject/:id", RED.auth.needsPermission("inject.write"), function(req,res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                if (req.body && req.body.__user_inject_props__) {
                    node.receive(req.body);
                } else {
                    node.receive();
                }
                res.sendStatus(200);
            } catch(err) {
                res.sendStatus(500);
                node.error(RED._("inject.failed",{error:err.toString()}));
            }
        } else {
            res.sendStatus(404);
        }
    });
}

