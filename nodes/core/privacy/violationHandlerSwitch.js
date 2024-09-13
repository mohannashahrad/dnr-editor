module.exports = function(RED) {
    function ViolationSwitchNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.on('input', function(msg) {
            // Assuming msg.violation.source.id needs to match selected node IDs
            const sourceId = msg.violation && msg.violation.source && msg.violation.source.id;

            // Retrieve selected node IDs from configuration (config.cases)
            const selectedNodeIds = config.cases.map(c => c.nodeId);

            // Check if sourceId matches any selected node ID
            const index = selectedNodeIds.indexOf(sourceId);
            if (index !== -1) {
                // Found a match, send message to corresponding output port
                const outputs = config.cases.length;
                const msgArray = Array(outputs).fill(null);
                msgArray[index] = msg; // Place msg in corresponding output port
                node.send(msgArray);
            } else if (config.default) {
                // No match found, but default output is enabled
                const outputs = config.cases.length + 1; // +1 for default output
                const msgArray = Array(outputs).fill(null);
                msgArray[outputs - 1] = msg; // Place msg in default output port
                node.send(msgArray);
            } else {
                // No match found and no default output, drop the message
                node.send(null);
            }
        });
    }

    RED.nodes.registerType("custom-switch", ViolationSwitchNode, {
        defaults: {
            cases: { value: [], validate: validateCases },
            default: { value: false }
        }
    });

    // Validation function for cases array
    function validateCases(config) {
        // Validate config.cases array if needed
        // Example: Ensure each case has required fields
        return true; // Return true if validation passes
    }
};
