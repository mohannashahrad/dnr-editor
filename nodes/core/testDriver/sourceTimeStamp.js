module.exports = function(RED) {
    function SourceTimestampNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        const axios = node.context().global.get("axios");

        // Function to create and send a new message with the start timestamp from WorldTimeAPI
        async function sendMsg(msg, send,axios) {
            try {
                //const response = await axios.get('http://worldtimeapi.org/api/ip');
                //const startTimestamp = new Date(response.data.utc_datetime).getTime();
                const startTimestamp = Date.now();
                msg.startTimestamp = startTimestamp;
                msg.sourceId = node.id;
                send(msg);
            } catch (error) {
                node.error("Failed to fetch time from WorldTimeAPI: " + error);
                msg.startTimestamp = Date.now(); // Fallback to local time if the API request fails
                msg.sourceId = node.id;
                send(msg);
            }
        }

        // Handle manual triggering of the node
        node.on('input', function(msg, send, done) {
            sendMsg(msg, send, axios);
            if (done) {
                done();
            }
        });
    }
    RED.nodes.registerType("source-timestamp", SourceTimestampNode);

    RED.httpAdmin.post("/customInject/:id", RED.auth.needsPermission("inject.write"), function(req, res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node != null) {
            try {
                if (req.body && req.body.__user_inject_props__) {
                    node.receive(req.body);
                } else {
                    node.receive();
                }
                res.sendStatus(200);
            } catch (err) {
                res.sendStatus(500);
                node.error(RED._("inject.failed", { error: err.toString() }));
            }
        } else {
            res.sendStatus(404);
        }
    });
}
