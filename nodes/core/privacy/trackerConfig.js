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

            // Add default labellers only used internally 
            labeller_dict['identity'] = obj => obj[1];

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

            // set a unique tracking id to the msg object to track its label
            msg.tracking_id = generateRandomId();
            msg.tracking_labels = {owners:[], readers:[]};

            node.send(msg);
        });
    }

    function generateRandomId() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomId = '';
    
        for (let i = 0; i < 8; i++) {
            randomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    
        return randomId;
    }

    RED.nodes.registerType('tracker-config', TrackerConfig);
};

