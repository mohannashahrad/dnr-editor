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

            console.log('Rules:', rules);
            console.log('Label Injectors:', labellers);

            // Initializing the tracker node
            const tracker = node.context().global.get("Tracker");
            var labeller_dict = {};
            var rules_list = [];

            labellers.forEach(item => {
                var paramMatch = item.func.match(/^\s*([^(]*)\s*=>/);
                var param = paramMatch ? paramMatch[1].trim() : null;
                labeller_dict[item.label] = eval('(function('+ param +') { return ' + item.func + '; })()');

            });

            // This is just the read/access rules 
            rules.forEach(item => {
                if (item.action === 'allow') {
                    rules_list.push(item.sink + ' <- ' + item.source);
                } else {
                    rules_list.push(item.sink + ' </- ' + item.source);
                }
            });

            // configure tracker object
            tracker.configure({
                labellers: labeller_dict,
                rules: rules_list
            })

            // Setting tracker as a flow context
            node.context().flow.set('tracker', tracker);
            
            msg.tracker = tracker;
            node.send(msg);
        });
    }

    RED.nodes.registerType('tracker-config', TrackerConfig);
};

