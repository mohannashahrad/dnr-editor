module.exports = function(RED) {
    function SinkTimestampNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function(msg) {
            const endTimestamp = Date.now();
            const startTimestamp = msg.startTimestamp;
            msg.duration = endTimestamp - startTimestamp;
            msg.endTimestamp = endTimestamp;
            node.send(msg);
        });
    }
    RED.nodes.registerType("sink-timestamp", SinkTimestampNode);
}