module.exports = function(RED) {
    function SinkTimestampNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Pre-req packages
        const axios = node.context().global.get("axios");

        // Function to get the current time from the central server
        async function getCurrentTime() {
            try {
                const response = await axios.get('http://worldtimeapi.org/api/timezone/Etc/UTC'); // Public time API
                return new Date(response.data.utc_datetime).getTime(); // Convert to milliseconds
            } catch (error) {
                node.error("Failed to fetch current time from server: " + error.message);
                return Date.now(); // Fallback to local time if server request fails
            }
        }

        node.on('input', async function(msg) {
            //const endTimestamp = await getCurrentTime();
            const endTimestamp = Date.now();
            const startTimestamp = msg.startTimestamp;
            msg.endToEndDuration = endTimestamp - startTimestamp;
            msg.endTimestamp = endTimestamp;
            msg.sinkId = node.id;
            let logIntervals = [];

            for (let i = 1; i < msg.dnrTimestamp.length; i++) {
                logIntervals.push(msg.dnrTimestamp[i] - msg.dnrTimestamp[i - 1]);
            }

            let durationSums = {};
            let privacyLatency = 0;

            if (msg.privacyCheckTimestamps) {

                // Calculate performance statistics 
                msg.privacyCheckTimestamps.forEach(entry => {
                    if (durationSums[entry.deviceId]) {
                        if (durationSums[entry.deviceId][entry.type]) {
                            durationSums[entry.deviceId][entry.type] += entry.duration;
                        } else {
                            durationSums[entry.deviceId][entry.type] = entry.duration;
                        }
                    } else {
                        durationSums[entry.deviceId] = {};
                        durationSums[entry.deviceId][entry.type] = entry.duration;
                    }
                    
                    privacyLatency += entry.duration;
                });

                // Writing message performance stats to output / log file
                let status = null;
                if (msg.violation) {
                    status = 'failed';
                } else {
                    status = 'passed';
                }

                // instead of logging it, just print it and then have a log reader for creating the result file
                // NOTE: Always check the output of the file, based on your needs
                //console.log( {"type": 'performance_stats', "msg_id": msg._msgid, "uid": msg.tracking_labels.owners[0].uid.value, "status": status, "end_to_end_latency": msg.endToEndDuration, "privacy_latency": privacyLatency, "privacy_latency_breakdown": durationSums
                console.log( {"type": 'performance_stats', "msg_id": msg._msgid, "file": msg.file, "status": status, "end_to_end_latency": msg.endToEndDuration, "privacy_latency": privacyLatency, "privacy_latency_breakdown": durationSums, sinkId: msg.sinkId, sourceId: msg.sourceId, logIntervals: logIntervals
                // uncomment the one below, if you want the full log to be printed out
                //console.log( {"type": 'performance_stats', "msg_id": msg._msgid, "file": msg.file, "status": status, "end_to_end_latency": msg.endToEndDuration, "privacy_latency": privacyLatency, "privacy_latency_breakdown": durationSums, "full_log":msg.privacyCheckTimestamps
                });
            } else {
                // for baseline invokations where privacy tracking is not present
                console.log({"type": 'performance_stats', "msg_id": msg._msgid, "file": msg.file, "end_to_end_latency": msg.endToEndDuration, sinkId: msg.sinkId, sourceId: msg.sourceId, logIntervals: logIntervals
                });
            }

            // Send the message to the next node
            node.send(msg);
        });
    }

    RED.nodes.registerType("sink-timestamp", SinkTimestampNode);
}