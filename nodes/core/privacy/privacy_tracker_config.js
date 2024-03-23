module.exports = function(RED) {
    function PrivacyTrackerConfigurationNode(config) {
        RED.nodes.createNode(this, config);
        this.policyfilename = config.policyfilename;
        this.labellerfilename = config.labellerfilename;
    }

    RED.nodes.registerType("tracker-config", PrivacyTrackerConfigurationNode);
}