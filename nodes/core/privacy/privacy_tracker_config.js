module.exports = function(RED) {
    function TrackerConfig(config) {
        RED.nodes.createNode(this, config);
        this.fileNameType = config.fileNameType || 'passFileName';
        this.policyFileName = config.policyFileName || '';
        this.rules = config.rules || [{ source: '', sink: '', action: '' }];

        this.labellerFileType = config.labellerFileType || 'passFileName';
        this.labellerFileName = config.labellerFileName || '';
        this.labellers = config.labellers || [{ label: '', func: ''}];

        var node = this;

        node.on('input', function(msg) {
            // Access node properties
            var fileNameType = node.fileNameType;
            var policyFileName = node.policyFileName;
            var rules = node.rules;

            var labellerFileType = node.labellerFileType;
            var labellerFileName = node.labellerFileName;
            var labellers = node.labellers;

            // Perform desired operations based on the configuration
            // For example, you can log the configuration to the console
            console.log('Policy File Name Type:', fileNameType);
            console.log('Policy File Name:', policyFileName);
            console.log('Rules:', rules);

            console.log('Labeller File Name Type:', labellerFileType);
            console.log('Labeller File Name:', labellerFileName);
            console.log('Label Injectors:', labellers);

            // Send the modified message along
            node.send(msg);
        });
    }

    RED.nodes.registerType('tracker-config', TrackerConfig);
};
