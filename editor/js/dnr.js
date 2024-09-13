/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

RED.dnr = (function() {
  var constraints = [];
  var privacy_labels = [];

  /* DNR stack initiation */
  function init() {
    initGui()
    initMap()
    RED.sidebar.devices.init()

    $('#btn-constraints').click(function() { 
      $( "#node-dialog-new-constraints" ).dialog( "open" ) })

    $('#btn-privacy-labels').click(function() { 
      $( "#node-dialog-new-privacy-labels" ).dialog( "open" ) })


    $("#node-dialog-new-constraints")
    .dialog({
      modal: true,
      autoOpen: false,
      width: 500,
      open: function(e) {
        $(this).dialog('option', 'title', 'Create a node requirement');
        $("#createConstraintBtn").text('Create')

        var constraintId = $('#constraint-id').val()
        if (!constraintId){
          return
        }

        // editing existing constraint
        for (var i = 0; i < constraints.length; i++){
          if (constraints[i].id === constraintId){
            var c = constraints[i]
            break
          }
        }

        if (!c){
          return
        }

        // populate fields with existing value
        if (c['deviceName']){
          $( "#device-name" ).val(c['deviceName'])
        }
        if (c['location']){
          $( "#location-constraint" ).val(c['location'])
        }
        if (c['memory']){
          $( "#memory-constraint" ).val(c['memory'])
        }
        if (c['rxload']){
          $( "#rxload-constraint" ).val(c['rxload'])
        }
        if (c['cores']){
          $( "#cores-constraint" ).val(c['cores'])
        }
        $(this).dialog('option', 'title', 'Editing existed constraint');
        $("#createConstraintBtn").text('Save edit')
      },
      close: function(e) {
        resetConstraintsDialog()
      },
      buttons: {
        Create: {
          id: "createConstraintBtn",
          click: createConstraint
        },
        Cancel: function() {
          $(this).dialog("close")
        }
      }
    })

    $("#node-dialog-new-privacy-labels")
    .dialog({
      modal: true,
      autoOpen: false,
      width: 500,
      open: function(e) {
        $(this).dialog('option', 'title', 'Create a node requirement');
        $("#createPrivacyLabelBtn").text('Create')

        var privacyLabelId = $('#privacy-label-id').val()
        if (!privacyLabelId){
          return
        }

        // editing existing label
        for (var i = 0; i < privacy_labels.length; i++){
          if (privacy_labels[i].id === privacyLabelId){
            var c = privacy_labels[i]
            break
          }
        }

        if (!c){
          return
        }

        // populate fields with existing value
        $("#node-dialog-new-privacy-labels .node-labeller-row").remove();
        $("#node-dialog-new-privacy-labels .data-labeller-row").remove();

        // TODO: What if there are multiple node or data labellers?
        if (c.node_labeller) {
            // Create a new row for each constraint
            var newRow = $('<div class="node-labeller-row">\
            <label for="node-labeller-modules"><i class="fa"></i>Modules Required:</label>\
            <input type="text" id="node-labeller-modules" value="' + c.node_labeller_modules + '">\
            <label for="node-labeller"><i class="fa"></i>Node Labeller Fucntion:</label>\
            <textarea rows="5" cols= "100" id="node-labeller">' + c.node_labeller + '</textarea>\
            </div>');
    
            // Append the new row to the privacy constraints dialog
            $("#node-dialog-new-privacy-labels .labels").append(newRow);
        };

        if (c.data_property) {
          // Create a new row for each constraint
          var newRow = $('<div class="data-labeller-row">\
                    <label for="data-property"><i class="fa"></i>Msg Property to Label:</label>\
                    <input type="text" id="data-property" placeholder="pass payload for msg.payload" value="' + c.data_property + '">\
                    <label for="access-control"><i class="fa"></i>Access Control:</label>\
                    <select id="access-control">\
                        <option value="owner"' + (c.access_control === "owner" ? ' selected' : '') + '>Owner</option>\
                        <option value="reader"' + (c.access_control === "reader" ? ' selected' : '') + '>Reader</option>\
                    </select>\
                  </div>');
  
          // Append the new row to the privacy constraints dialog
          $("#node-dialog-new-privacy-labels .labels").append(newRow);
        };

        $(this).dialog('option', 'title', 'Editing existing constraint');
        $("#createPrivacyLabelBtn").text('Save edit')
      },
      close: function(e) {
        resetPrivacyLabelsDialog()
      },
      buttons: {
        Create: {
          id: "createPrivacyLabelBtn",
          click: createPrivacyLabel
        },
        Cancel: function() {
          $(this).dialog("close")
        }
      }
    })

    $("#seed-dialog")
    .dialog({
      title: 'Export DNR Seed',
      modal: true,
      autoOpen: false,
      width: 500,
      resizable: false,
      buttons: [
        {
          id: "clipboard-dialog-cancel",
          text: RED._("common.label.cancel"),
          click: function() {
            $(this).dialog("close");
          }
        },
        {
          id: "clipboard-dialog-copy",
          class: "primary",
          text: RED._("clipboard.export.copy"),
          click: function() {
            $("#seed-export").select();
            document.execCommand("copy");
            document.getSelection().removeAllRanges();
            RED.notify(RED._("clipboard.nodesExported"));
            $(this).dialog( "close" );
          }
        }
      ],
      open: function(e) {
          $(this).parent().find(".ui-dialog-titlebar-close").hide();
      }
    })

    RED.menu.init({id:"btn-constraints-options",
      options: []
    })

    RED.menu.init({id:"btn-privacy-labels-options",
      options: []
    })

    RED.menu.init({id:"btn-link-constraints",
        options: [
            {id:"1-1",label:'1-1',onselect:function(){setLinkConstraint('11')}},
            {id:"1-N",label:'1-N',onselect:function(){setLinkConstraint('1N')}},
            {id:"N-1",label:'N-1',onselect:function(){setLinkConstraint('N1')}},
            {id:"N-N",label:'N-N',onselect:function(){setLinkConstraint('NN')}}
        ]
    })

    RED.menu.addItem("btn-sidemenu", {
      id:"menu-item-dnr",
      toggle:false,
      // selected: true,
      label: 'DNR',
      options: [
        {
          id:"menu-item-constraints",
          toggle:true,
          selected: true,
          label: 'Show constraints',
          onselect:function(s) { toggleConstraints(s)}
        },
        {
          id:"menu-item-dnr-seed",
          toggle:false,
          // selected: true,  
          label: 'Export DNR Seed',
          onselect:function() { showDnrSeed()}
        },
        {
          id:"menu-item-dnr-devices",
          toggle:false,
          // selected: true,
          label: 'Show devices',
          onselect:"dnr:show-devices-tab"
        }
      ]
    })

    RED.events.on("deploy",function(){
      $.ajax({
        url: "dnr/flows/"+RED.workspaces.active(),
        type:"POST",
        success: function(resp) {
        },
        error: function(jqXHR,textStatus,errorThrown) {
          console.log('cannot notify new flow')  
        }
      })
    })
  }// end stack initiation

  function initGui(){
    /* Node Requirements button */ 
    $('<li><span class="deploy-button-group button-group">'+
      '<a id="btn-constraints" class="deploy-button" href="#"> <span>Node Requirements</span></a>'+
      '<a id="btn-constraints-options" data-toggle="dropdown" class="deploy-button" href="#"><i class="fa fa-caret-down"></i></a>'+
      '</span></li>').prependTo(".header-toolbar")
    
    /* Link Requirements button */ 
    $('<li><span class="deploy-button-group button-group">'+
      '<a id="btn-link-constraints" data-toggle="dropdown" class="deploy-button" href="#">'+
      'Link Requirements ' + 
      '<i class="fa fa-caret-down"></i></a>'+
      '</span></li>').prependTo(".header-toolbar")

    /* Privacy Label Button */ 
    $('<li><span class="deploy-button-group button-group">'+
      '<a id="btn-privacy-labels" class="deploy-button" href="#"> <span>Privacy Labels</span></a>'+
      '<a id="btn-privacy-labels-options" data-toggle="dropdown" class="deploy-button" href="#"><i class="fa fa-caret-down"></i></a>'+
      '</span></li>').prependTo(".header-toolbar")

    /* Privacy Requirements button */ 
    // $('<li><span class="deploy-button-group button-group">'+
    //   '<a id="btn-privacy-constraints" class="deploy-button" href="#"> <span>Privacy Requirements</span></a>'+
    //   '<a id="btn-privacy-policy-options" data-toggle="dropdown" class="deploy-button" href="#"><i class="fa fa-caret-down"></i></a>'+
    //   '</span></li>').prependTo(".header-toolbar")

    // Location constraint dialog (map)
    $('<div id="node-dialog-map" class="hide">\
          <div id="map" style="height: 300px;">\
          </div>\
      </div>').appendTo("body")

    /* Constraint definition dialog */ 
    $('<div id="node-dialog-new-constraints" class="hide node-red-dialog">\
      <div class="form-row">\
          <label for="constraint-id" ><i class="fa"></i>Constraint Id:</label>\
          <input type="text" id="constraint-id">\
          <label for="device-name" ><i class="fa"></i>Device Name:</label>\
          <input type="text" id="device-name" placeholder="device s application scope unique ID">\
          <label><i class="fa"></i>Location:</label>\
          <input type="text" id="location-constraint">\
          <label for="memory-constraint"><i class="fa"></i>Min memory (MB):</label>\
          <input type="text" id="memory-constraint" placeholder="500">\
          <label for="rxload-constraint"><i class="fa"></i>Max rxload (bytes/s):</label>\
          <input type="text" id="rxload-constraint" placeholder="50000">\
          <label for="cores-constraint"><i class="fa"></i>Min CPU cores:</label>\
          <input type="text" id="cores-constraint" placeholder="1000">\
          <label for="force-install">Force install</label>\
          <input type="checkbox" id="force-install">\
      </div>\
    </div>').appendTo("body")

    /* Privacy Label definition dialog */ 
    $('<div id="node-dialog-new-privacy-labels" class="hide node-red-dialog">\
    <div class="labels">\
        <label for="privacy-label-id"><i class="fa"></i>Privacy Label:</label>\
        <input type="text" id="privacy-label-id">\
    </div>\
    <button id="add-node-labeller">Add Node Labeller</button>\
    <button id="add-data-labeller">Add Data Labeller</button>\
    </div>').appendTo("body")

    function createNodeLabeller() {
        var row = $('<div class="node-labeller-row">\
                    <label for="node-labeller-modules"><i class="fa"></i>Modules Required:</label>\
                    <input type="text" id="node-labeller-modules">\
                    <label for="node-labeller"><i class="fa"></i>Node Labeller Fucntion:</label>\
                    <textarea rows="5" cols= "100" id="node-labeller" placeholder="function label(nodeObj, deviceContext, modules) \n {\n\n//implement your labeller here\n\n}"></textarea>\
                    </div>');
        return row;
    }

    function createDataLabeller() {
      var row = $('<div class="data-labeller-row">\
                    <label for="data-property"><i class="fa"></i>Msg Property to Label:</label>\
                    <input type="text" id="data-property" placeholder="pass payload for msg.payload">\
                    <label for="access-control"><i class="fa"></i>Access Control:</label>\
                    <select id="access-control">\
                        <option value="owner">Owner</option>\
                        <option value="reader">Reader</option>\
                    </select>\
                  </div>');
      return row;
    }

    function addNodeLabeller() {
      var row = createNodeLabeller();
      $("#node-dialog-new-privacy-labels .labels").append(row);
    }

    function addDataLabeller() {
      var row = createDataLabeller();
      $("#node-dialog-new-privacy-labels .labels").append(row);
    }

    // Event listeners for labeller buttons
    $("#add-node-labeller").click(function() {
        addNodeLabeller();
    });

    $("#add-data-labeller").click(function() {
      addDataLabeller();
    });

    /* Privacy policy definition dialog */ 
    // $('<div id="node-dialog-new-privacy-constraints" class="hide node-red-dialog">\
    //   <div class="constraints">\
    //       <label for="policy-id" ><i class="fa"></i>Policy Id:</label>\
    //       <input type="text" id="policy-id">\
    //     <button id="add-constraint-row">Add Rule</button>\
    //     </div>\
    //   </div>\
    // </div>').appendTo("body");

    // Function to create a new row of constraints
    // function createConstraintRow() {
    //     var row = $('<div class="constraint-row">\
    //                   <input type="text" class="source-label" placeholder="Source Label">\
    //                   <input type="text" class="sink-label" placeholder="Sink Label">\
    //                   <select class="action">\
    //                     <option value="allow">Allow</option>\
    //                     <option value="disallow">Disallow</option>\
    //                   </select>\
    //                 </div>');
    //     return row;
    // }

    
    // Function to add a new row of constraints when the plus button is clicked
    // function addConstraintRow() {
    //     var row = createConstraintRow();
    //     $("#node-dialog-new-privacy-constraints .constraints").append(row);
    // }

    // // Add event listener to the plus button
    // $("#add-constraint-row").click(function() {
    //     addConstraintRow();
    // });

    /* Seed flow dialog */ 
    $('<div id="seed-dialog" class="hide node-red-dialog">'+
      '<form class="dialog-form form-horizontal">'+
        '<div class="form-row">'+
          '<textarea readonly style="resize: none; width: 100%; border-radius: 4px;font-family: monospace; font-size: 12px; background:#f3f3f3; padding-left: 0.5em; box-sizing:border-box;" id="seed-export" rows="5"></textarea>'+
        '</div>'+
      '</form></div>').appendTo("body")
  }

  // location constraints GUI
  function initMap(){
    if (typeof google === 'undefined'){
      console.log('map api not loaded')
      return
    }
    var VANCOUVER = {lat: 49.269801, lng: -123.109489}
    var currentOverlay = null
    var overlayVisible = false
    var rectangle

    var map = new google.maps.Map(document.getElementById('map'), {
      center: VANCOUVER, 
      zoom: 10
    })
    
    var drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.MARKER,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ['rectangle']
      }
    })

    drawingManager.setMap(map)

    $("#node-dialog-map").dialog({
      title:"Set location constraint",
      modal: true,
      autoOpen: false,
      width: 500,
      open: function(e) {
        drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE)
        google.maps.event.trigger(map, 'resize') // to make map visible
        var locationConstraint = $('#location-constraint').val()
        if (!locationConstraint){
          clearOverlay()
          return
        }

        locationConstraint = JSON.parse(locationConstraint)
        var north = locationConstraint.ne[0]
        var south = locationConstraint.sw[0]
        var east = locationConstraint.ne[1]
        var west = locationConstraint.sw[1]

        rectangle = new google.maps.Rectangle({
          map: map,
          bounds: {
            north: north,
            south: south,
            east: east,
            west: west
          }
        })

        map.setCenter({
          lat: south, 
          lng: west
        })
      },
      close: function(e) {
        clearOverlay()
      },
      buttons: 
      {
        Set: function (){
          if (!overlayVisible){
            $('#location-constraint').val("")
            $(this ).dialog( "close");
            return
          }

          var bounds = currentOverlay.getBounds();
          var start = bounds.getNorthEast();
          var end = bounds.getSouthWest();

          $('#location-constraint').val( 
            JSON.stringify({
              ne: [start.lat(), start.lng()],
              sw: [end.lat(), end.lng()]
          }));

          $(this).dialog( "close" );
        },
        Reset: function(){
          clearOverlay()
        },
        Cancel: function() {
          $(this).dialog( "close" );
        }
      }
    })

    google.maps.event.addListener(map, 'click', function(event) {
      clearOverlay()
    });

    google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
      clearOverlay()
      currentOverlay = e.overlay
      overlayVisible = true
    })

    $('#location-constraint').click(function() { 
      $("#node-dialog-map").dialog( "open" )
    })

    function clearOverlay(){
      if (currentOverlay){
        currentOverlay.setMap(null)
        overlayVisible = false
      }
      if (rectangle){
        rectangle.setMap(null)
      }
    }
  }

  /* Helper functions */
  function resetConstraintsDialog(){
    $("#constraint-id").val("")
    $("#device-name").val("")
    $("#location-constraint").val("")
    $("#memory-constraint").val("")
    $("#rxload-constraint").val("")
    $("#cores-constraint").val("")
  }

  function resetPrivacyLabelsDialog(){
    $("#privacy-label-id").val("")

    // Remove all existing rows except the first one
    $("#node-dialog-new-privacy-labels .node-labeller-row").remove();
    $("#node-dialog-new-privacy-labels .data-labeller-row").remove();
  }

  function showDnrSeed(){
    var host = document.location.hostname;
    var port = document.location.port;
    var protocol = document.location.protocol

    var operatorUrl = protocol + "//" + host + (port ? (":"+port) : "")
    var dnrSeed = [
      {
        "id": "xxxxxxxx.xxxxx",
        "type": "tab",
        "label": "DNR Seed"
      },
      {
        "id":"xxxxxxxx.xxxxx",
        "operatorUrl": operatorUrl,
        "nodered":"",
        "wires":[],
        "type": "dnr-daemon",
        "x":100,"y":100,
        "z": "xxxxxxxx.xxxxx"
      }
    ]
    $("#seed-export").val(JSON.stringify(dnrSeed))
    $("#seed-dialog").dialog( "open" )
  }

  function toggleConstraints(checked) {
    d3.selectAll('.node_constraints_group').style("display", checked ? "inline" : "none")
    d3.selectAll('.link_constraint_group').style("display", checked ? "inline" : "none")
    d3.selectAll('.node_privacy-labels_group').style("display", checked ? "inline" : "none")
  }

  function createConstraint(){
    var constraintId = $( "#constraint-id" ).val();
    if (!constraintId){
        alert('constrantId is required');
        return;
    }
        
    var deviceName = $( "#device-name" ).val();
    var location = $( "#location-constraint" ).val();
    var memory = $( "#memory-constraint" ).val();
    var rxload = $( "#rxload-constraint" ).val();
    var cores = $( "#cores-constraint" ).val();
    
    if (memory){
      memory = parseInt(memory)
      if (isNaN(memory)){
        alert('cores and memory are integer')
        return
      }
    }
    if (rxload){
      rxload = parseInt(rxload)
      if (isNaN(rxload)){
        alert('network load are integer')
        return
      }
    }
    if (cores){
      cores = parseInt(cores)
      if (isNaN(cores)){
        alert('cores and memory are integer')
        return
      }
    }

    var creatingConstraint = {
      id:constraintId
    }

    if (deviceName)
        creatingConstraint['deviceName'] = deviceName;
    if (location)
        creatingConstraint['location'] = location;
    if (memory)
        creatingConstraint['memory'] = memory;
    if (rxload)
        creatingConstraint['rxload'] = rxload;
    if (cores)
        creatingConstraint['cores'] = cores;

    addConstraintToGui(creatingConstraint);

    $(this).dialog( "close" );
  }

  function createPrivacyLabel(){
    var privacyLabelId = $( "#privacy-label-id" ).val();
    var node_labeller = $( "#node-labeller" ).val();
    var node_labeller_modules = $( "#node-labeller-modules" ).val();
    var data_property = $( "#data-property" ).val();
    var access_control = $( "#access-control" ).val();

    if (!privacyLabelId){
        alert('privacyLabelId is required');
        return;
    }

    var creatingPrivacyLabel = {
      id:privacyLabelId
    }

    if (data_property)
      creatingPrivacyLabel['data_property'] = data_property;
    
    if (access_control)
      creatingPrivacyLabel['access_control'] = access_control;

    if (node_labeller)
      creatingPrivacyLabel['node_labeller'] = node_labeller;

    if (node_labeller_modules)
      creatingPrivacyLabel['node_labeller_modules'] = node_labeller_modules;

    addPrivacyLabelToGui(creatingPrivacyLabel);

    $(this).dialog( "close" );
  }

  function addConstraintToGui(c){
    // check if c id is unique (exist or not)
    for (var i = 0; i < constraints.length; i++){
      if (c.id && c.id === constraints[i].id){
        // updating existing constraint
        c.fill = constraints[i].fill
        c.text = constraints[i].text
        constraints[i] = c
        // TEST: update the constraints that are attached to all the nodes
        RED.nodes.eachNode(function(node){
          if (!node.constraints){
            return
          }
          for (var id in node.constraints){
            if (id === c.id){
              node.constraints[id] = c
              break
            }
          }
        })
        return
      }
    }  

    // add it to the constraints list
    c.fill = c.fill ? c.fill : randomColor();
    c.text = c.text ? c.text : c.id;
    constraints.push(c);

    RED.menu.addItem("btn-constraints-options", {
      id:c.id,
      label:c.id,
      onselect:function(s) { 
        var nodeSelected = false

        RED.nodes.eachNode(function(node){
          if (node.selected){
            nodeSelected = true
            return
          }
        })

        if (!nodeSelected){
          // no node is selected, allow to edit current constraint
          $( "#constraint-id" ).val(c['id'])
          $( "#node-dialog-new-constraints" ).dialog( "open" )
        } else {
          // reset these fields to blank
          resetConstraintsDialog()
          setNodeConstraint(c['id'])
        }
      }
    })
  }

  function addPrivacyLabelToGui(c){
    // check if c id is unique (exist or not)
    for (var i = 0; i < privacy_labels.length; i++){
      if (c.id && c.id === privacy_labels[i].id){
        // updating existing privacy_label
        c.fill = privacy_labels[i].fill
        c.text = privacy_labels[i].text
        privacy_labels[i] = c
        // TEST: update the privacy_labels that are attached to all the nodes
        RED.nodes.eachNode(function(node){
          if (!node.privacy_labels){
            return
          }
          for (var id in node.privacy_labels){
            if (id === c.id){
              node.privacy_labels[id] = c
              break
            }
          }
        })
        return
      }
    }  

    // add it to the privacy_labels list
    c.fill = c.fill ? c.fill : randomColor();
    c.text = c.text ? c.text : c.id;
    privacy_labels.push(c);

    RED.menu.addItem("btn-privacy-labels-options", {
      id:c.id,
      label:c.id,
      onselect:function(s) { 
        var nodeSelected = false

        RED.nodes.eachNode(function(node){
          if (node.selected){
            nodeSelected = true
            return
          }
        })

        if (!nodeSelected){
          // no node is selected, allow to edit current privacy label
          $( "#privacy-label-id" ).val(c['id'])
          $( "#node-dialog-new-privacy-labels" ).dialog( "open" )
        } else {
          // reset these fields to blank
          resetPrivacyLabelsDialog()
          setNodePrivacyLabel(c['id'])
        }
      }
    })
  }

  /* Link constraints */

  /** 
   * Applying a link type to selected link, called from drop-down menu
   * @param {linkType} wt - The link type being applyed to 
   */
  function setLinkConstraint(linkType){
    var link = d3.select('.link_selected')
    if (link.data().length > 1){
      console.log('WARNING, choosing 2 links at the same time!!!')
      return;
    }
    if (!link.data()[0]){
      return
    }

    var d = link.data()[0]

    var source = d.source
    var sourcePort = d.sourcePort
    var target = d.target
    var midX = (d.x1+d.x2) / 2
    var midY = (d.y1+d.y2) / 2

    if (!source['constraints']){
      source['constraints'] = {};
    }
    var sourceConstraints = source.constraints
    if (!sourceConstraints.link){
      sourceConstraints.link = {}
    }

    sourceConstraints.link[sourcePort + '_' + target.id] = linkType

    link.selectAll('.link_constraint_group').remove();
    link.append("svg:g")
      .style({display:'inline',fill: 'brown', 'font-size': 12})
      .attr("class","link_constraint_group")
      .attr("transform","translate(" + midX + "," + midY+ ")")
      .append("svg:text")
      .text(linkType)
      .on("mousedown", (function(){
        return function(){
          link.selectAll('.link_constraint_group').remove();
          delete sourceConstraints.link[sourcePort + '_' + target.id]
          RED.nodes.dirty(true);
        }
      })())

    RED.nodes.dirty(true);// enabling deploy
  }

  // called from view, append link constraint to a link (e.g when editor is loaded)
  function appendLinkConstraint(link){
    var d = link.data()[0]
    
    var source = d.source
    var sourcePort = d.sourcePort
    var target = d.target
    var midX = (d.x1+d.x2) / 2 || 0
    var midY = (d.y1+d.y2) / 2 || 0

    var sourceLink, linkType

    try {
      sourceLink = source.constraints.link
      linkType = sourceLink[sourcePort + '_' + target.id]
    } catch(e){}
    
    if (!linkType){
      return
    }

    link.selectAll('.link_constraint_group').remove();
    link.append("svg:g")
      .style({display:'inline',fill: 'brown', 'font-size': 12})
      .attr("class","link_constraint_group")
      .attr("transform","translate(" + midX + "," + midY+ ")")
      .append("svg:text")
      .text(linkType)
      .on("mousedown", (function(){
        return function(){
          link.selectAll('.link_constraint_group').remove();
          delete sourceLink[sourcePort + '_' + target.id]
          RED.nodes.dirty(true);
        }
      })())
  }

  // called on deploying to correct link constraints before sending to server
  // this is necessary in the case that a dest node is deleted but
  // link constraints are still present in source node
  function correctLinkConstraints(data){
    var nodes = data.flows.filter(function(f){
      return f.wires
    })

    var nodeIds = nodes.map(function(f){
      return f.id
    })

    for (var i = 0; i < nodes.length; i++){
      var node = nodes[i]
      if (!node.constraints || !node.constraints.link){
        continue
      }

      var link = node.constraints.link
      for (var linkKey in link){
        if (!nodeIds.includes(linkKey.split('_')[1])){
          delete link[linkKey]
        }
      }

      if (Object.keys(link).length === 0){
        delete node.constraints.link
      }
    }
  }

  /*
    called by view whenever a node is moved, to update the location of label
    according to the location of link
  */
  function redrawLinkConstraint(l){
    if (l.attr('class').indexOf('link_background') === -1){
      return
    }

    var aLink = d3.select(l[0][0].parentNode).selectAll('.link_constraint_group')
    if (!aLink.data()[0]){
      return
    }

    var d = aLink.data()[0]
    var midX = (d.x1+d.x2) / 2
    var midY = (d.y1+d.y2) / 2

    aLink.attr("transform","translate(" + midX + "," + midY+ ")")
  }

  /** 
   * Applying a constraint to selected nodes, it will be shown on redrawing, after
   * clicking on the canvas
   * Constraints and Nodes are Many to Many relationship
   * @param {constraint} c - The constraint being applyed to 
   */
  function setNodeConstraint(cid){
    var c
    for (var i = 0; i < constraints.length; i++){
      if (cid === constraints[i].id){
        c = constraints[i]
        break
      }
    } 

    if (!c){
      return
    }

    var appliedTo = 0;

    d3.selectAll('.node_selected').each(function(node){
      if (!node['constraints'])
        node['constraints'] = {}

      node.constraints[c.id] = c
      redrawConstraints(d3.select(this.parentNode))
      RED.nodes.dirty(true)
    })
  }

  // Applying a label to a node
  function setNodePrivacyLabel(cid){
    var c
    for (var i = 0; i < privacy_labels.length; i++){
      if (cid === privacy_labels[i].id){
        c = privacy_labels[i]
        break
      }
    } 

    if (!c){
      return
    }

    var appliedTo = 0;
    console.log(c);

    d3.selectAll('.node_selected').each(function(node){      
      if (!node['privacy_labels'])
        node['privacy_labels'] = {}

      node.privacy_labels[c.id] = c

      // If the selected node has a node labeller
      // update the violation_handler and add a new handler port for it
      if (c.node_labeller) {
        console.log("locating the privacy handler node");
        RED.nodes.eachNode(function(aNode){
          if (aNode.name === 'privacy_violation_switch'){            
            // check if already the port for the node being labelled is added
            var portExists = false;
            aNode['rules'].forEach(function(rule) {
              if (rule.v === node.id) {
                portExists = true;
              }
            });

            // If port doesn't exist, update the switch node
            if (!portExists) {
              aNode['ports'].push(aNode['ports'][aNode['ports'].length - 1] + 1);
              aNode['outputs'] = aNode['outputs'] + 1;
              aNode['rules'].push({
                "t": "eq",
                "v": node.id,
                "vt": "str"
              });
              }
          }
        });
      }

      redrawPrivacyLabels(d3.select(this.parentNode))
      RED.nodes.dirty(true)
    })
  }

  function prepareConstraints(n, node){
    if (n.constraints)
      node['constraints'] = n.constraints;

    if(n.privacy_labels)
      node['privacy_labels'] = n.privacy_labels;

  }

  // when server starts, load constraints to constraints list 
  function loadConstraints(nodes){
  
    for (var i = 0; i < nodes.length; i++){
      if (!nodes[i]['constraints'])
        continue;

      var nConstraints = nodes[i].constraints;
      for (c in nConstraints){
        if (c !== 'link'){
          addConstraintToGui(nConstraints[c]);
        }
      }
    }
  }

  function loadPrivacyLabels(nodes){
  
    for (var i = 0; i < nodes.length; i++){
      if (!nodes[i]['privacy_labels'])
        continue;

      var nPrivacyLabels = nodes[i].privacy_labels;
      for (c in nPrivacyLabels){
        if (c !== 'link'){
          addPrivacyLabelToGui(nPrivacyLabels[c]);
        }
      }
    }
  }


  function redrawConstraints(thisNode){
    var d = thisNode.data()[0]

    var node_constraints_group = thisNode.selectAll('.node_constraints_group');
    
    if (node_constraints_group[0].length === 0){
      node_constraints_group = thisNode.append("svg:g").attr("class","node_constraints_group")
    }

    var node_constraints_list = thisNode.selectAll('.node_constraint');

    node_constraints_group.style("display","inline");

    var nodeConstraints = [];

    for (var c in d.constraints){
      if (!d.constraints.hasOwnProperty(c) || c === 'link') {
        continue;
      }

      nodeConstraints.push(d.constraints[c]);
    }

    // TODO: weak check on array matching, should check with constraint id (data) and text label (view)
    if (node_constraints_list[0].length === nodeConstraints.length)
      return;

    // create new nodes with a fresh start (avoid mix and match)
    node_constraints_list.remove();

    node_constraints_group
      .attr("transform","translate(3, -" + nodeConstraints.length * 12 + ")")
      .style({"font-style": "italic", "font-size": 12});

    for (var j = 0; j < nodeConstraints.length; j++){

      var constraintData = nodeConstraints[j];
      var fill = constraintData.fill || "black";
      // var shape = constraintData.shape;

      var node_constraint = node_constraints_group.append("svg:g");
      var makeCallback = function(id, node_constraint){
        return function(){
          console.log('deleting')
          delete d.constraints[id];
          node_constraint.remove();
          RED.nodes.dirty(true);
        }
      };
      node_constraint.style({fill: fill, stroke: fill})
        .attr("class","node_constraint")
        .attr("transform","translate(0, " + j*17 + ")")
        .on("mousedown", makeCallback(constraintData.id, node_constraint));

      node_constraint.append("svg:text")
        .attr("class","node_constraint_label")
        .text(constraintData.text ? constraintData.text : "");
    } 

  }

  function redrawPrivacyLabels(thisNode){
    var d = thisNode.data()[0]

    var node_privacy_labels_group = thisNode.selectAll('.node_privacy_labels_group');
    
    if (node_privacy_labels_group[0].length === 0){
      node_privacy_labels_group = thisNode.append("svg:g").attr("class","node_privacy_labels_group")
    }

    var node_privacy_labels_list = thisNode.selectAll('.node_privacy_label');

    node_privacy_labels_group.style("display","inline");

    var nodePrivacyLabels = [];

    for (var c in d.privacy_labels){
      if (!d.privacy_labels.hasOwnProperty(c) || c === 'link') {
        continue;
      }

      nodePrivacyLabels.push(d.privacy_labels[c]);
    }

    // TODO: weak check on array matching, should check with privacy label (data) and text label (view)
    if (node_privacy_labels_list[0].length === nodePrivacyLabels.length)
      return;

    // create new nodes with a fresh start (avoid mix and match)
    node_privacy_labels_list.remove();

    node_privacy_labels_group
      .attr("transform","translate(30, -" + nodePrivacyLabels.length * 12 + ")")
      .style({"font-style": "italic", "font-size": 12});

    for (var j = 0; j < nodePrivacyLabels.length; j++){

      var privacyLabelData = nodePrivacyLabels[j];
      var fill = privacyLabelData.fill || "black";

      var node_privacy_label = node_privacy_labels_group.append("svg:g");
      var makeCallback = function(id, node_privacy_label){
        return function(){
          console.log('deleting')
          delete d.privacy_labels[id];
          node_privacy_label.remove();
          RED.nodes.dirty(true);
        }
      };
      node_privacy_label.style({fill: fill, stroke: fill})
        .attr("class","node_privacy_label")
        .attr("transform","translate(0, " + j*17 + ")")
        .on("mousedown", makeCallback(privacyLabelData.id, node_privacy_label));

      node_privacy_label.append("svg:text")
        .attr("class","node_privacy_label_label")
        .text(privacyLabelData.text ? privacyLabelData.text : "");
    } 

  }

  function randomColor(){
    var possibleColor = ["#4286f4", "#f404e0", "#f40440", "#f42404", 
          "#f4a804", "#2d9906", "#069959", "#068c99", "#8f0699",
          "#5103c6", "#c66803", "#c64325", "#c425c6", "#7625c6", "#c62543",
          "#25c6a1", "#187f67", "#407266", "#567240", "#bf3338", "#bf337b"];

    var result = possibleColor[Math.ceil(Math.random() * possibleColor.length) - 1];

    return result;
  }

  // function showFlowMetadata(){
  //   var thisFlowId = RED.workspaces.active();

  //   $( "#flow-id" ).val(thisFlowId);
  //   $( "#flow-trackers" ).val('');

  //   RED.nodes.eachWorkspace(function(flow){
  //     if (flow.id === thisFlowId && flow.metadata)
  //       $( "#flow-trackers" ).val(flow.metadata.trackers.toString());
  //   });

  //   $( "#node-dialog-flow-metadata" ).dialog( "open" ); 
  // }


  // function newFlowMetadataDialog(){
  //   var flowId = $( "#flow-id" ).val();
  //   var trackers = $( "#flow-trackers" ).val().split(',');
  //   var flowMetadata = {};

  //   if (trackers){
  //     flowMetadata['trackers'] = trackers;
  //     RED.nodes.eachWorkspace(function(flow){
  //       console.log(flow);
  //       if (flow.id === flowId)
  //         flow['metadata'] = flowMetadata;
  //     });
  //   }

  //   $( this ).dialog( "close" );
  // }

  return {
     correctLinkConstraints: correctLinkConstraints,
     appendLinkConstraint: appendLinkConstraint,
     redrawLinkConstraint: redrawLinkConstraint,
     prepareConstraints: prepareConstraints,
     loadConstraints: loadConstraints,
     loadPrivacyLabels: loadPrivacyLabels,
     redrawConstraints: redrawConstraints,
     redrawPrivacyLabels: redrawPrivacyLabels,
     init: init
  }
 })()








/* Device monitoring sidebar */
RED.sidebar.devices = (function() {
  var activeFilter = ""
  var loadedList = []

  /* Setup sidebar view */
  var content = $('<div class="sidebar-devices">')
  var toolbar = $('<div>'+
      '<a class="sidebar-footer-button" id="workspace-devices-map-view" href="#"><i id="workspaces-devices-list" class="fa fa-map-marker"></i></a></div>')

  var searchDiv = $('<div>',{class:"palette-search"}).appendTo(content);
  var searchInput = $('<input type="text" placeholder="Search devices"></input>')
    .appendTo(searchDiv)
    .searchBox({
        delay: 300,
        change: function() {
          activeFilter = $(this).val().toLowerCase();
          var visible = devicesList.editableList('filter');
          searchInput.searchBox('count',visible);
          devicesList.children().removeClass('selected');
          devicesList.children(":visible:first").addClass('selected');
        }
    });

  // Sidebar map
  var mapView = $('<div id="deviceMap">').css({
    "position": "absolute",
    "top": "35px",
    "bottom": 0,
    "left": 0,
    "right": 0,
    "z-index": 900
  }).appendTo(content).hide()

  var devicesList = $('<ol>',{style:"position: absolute;top: 35px;bottom: 0;left: 0;right: 0px;"})
    .appendTo(content)
    .editableList({
      addButton: false,
      scrollOnAdd: false,
      sort: function(device1,device2) {
        return device1.id.localeCompare(device2.id);
      },
      filter: function(data) {
        if (activeFilter === "" ) {
          return true
        }
        
        return data.name.indexOf(activeFilter) > -1
      },
      addItem: function(container,i,device) {
        var entry = device;
        if (entry) {
          var headerRow = $('<div class="device-header">').appendTo(container)
          //.css("cursor","pointer")

          var titleRow = $('<div class="device-meta device-name"><i class="fa fa-podcast" style="margin-right: 5px;"></i></div>').appendTo(headerRow);
          $('<span>').html(entry.name).appendTo(titleRow);

          var memoryRow = $('<div class="device-meta device-memory"></div>').appendTo(headerRow);
          var cpuRow = $('<div class="device-meta device-cpu"></div>').appendTo(headerRow);
          
          var memoryBar = $('<div style="line-height: 17px; height: 17px; width: ' + entry.freeMem + '%; background: #54A964; color: white; margin-bottom: 5px">MEM</div>').appendTo(memoryRow) 
          var cpuBar = $('<div style="line-height: 17px; height: 17px; width: ' + entry.cpuFree + '%; background: #00B1B8; color: white;">CPU</div>').appendTo(cpuRow) 
          // var cpuText = $('<span>').html(entry.cpus).appendTo(cpuRow) 

          var privacyRow = $('<div class="device-meta device-privacyTags"><i class="fa fa-tags" style="margin-right: 5px;"></i></div>').appendTo(headerRow);
          var privacyText = $('<span>').html(entry.privacyText).appendTo(privacyRow) 

          var metaRow = $('<div class="device-meta device-lastSeen"><i class="fa fa-clock-o" style="margin-right: 5px;"></i></div>').appendTo(headerRow);

          var lastSeenText = $('<span>').html(entry.lastSeen).appendTo(metaRow)

          var statusText = $('<span>').html(entry.status).css({"float":"right",
            "color": entry.status == 'disconnected' ? 'red' : 'green'
          }).appendTo(metaRow)

          var shade = $('<div class="device-shade hide"><img src="red/images/spin.svg" class="palette-spinner"/></div>').appendTo(container);

          device.elements = {
            statusText: statusText,
            lastSeenText: lastSeenText,
            memoryBar: memoryBar,
            cpuBar: cpuBar,
            privacyText: privacyText,
            // cpuText: cpuText,
            container: container,
            headerRow: headerRow,
            shade: shade
          }
        } else {
            $('<div>',{class:"red-ui-search-empty"}).html(RED._('search.empty')).appendTo(container);
        }
      }
  })

  var devices = {}
  var markers = []
  var MAP_ZOOM = 10
  var map

  RED.sidebar.addTab({
    id: "devices",
    label: "devices",
    name: "device tab name",
    content: content,
    toolbar: toolbar,
    closeable: true,
    visible: false,
    onchange: function() { }
  })

  RED.actions.add("dnr:show-devices-tab",function() {RED.sidebar.show('devices')});

  function init(){
    if (typeof google === 'undefined'){
      console.log('map api not loaded')
      return
    }
    map = new google.maps.Map(document.getElementById('deviceMap'), {
      zoom: MAP_ZOOM,
      center: {lat: 49.269801, lng: -123.109489}
    })

    $("#workspace-devices-map-view").on("click", function(e) {
      // e.preventDefault()
      updateMap()
      devicesList.toggle()
      mapView.toggle()
      google.maps.event.trigger(map, 'resize')
    })

    $.ajax({
      url: "dnr/devices",
      type:"GET",
      success: function(resp) {
        for (var i = 0; i< resp.length; i++){
          var aDev = resp[i]
          addOrUpdateNewDevice(aDev)
        }
      },
      error: function(jqXHR,textStatus,errorThrown) {
        console.log('cannot get devices')  
      }
    })

    RED.comms.subscribe("devices/#",function(topic,device) {
      if (topic === 'devices/connected'){
        addOrUpdateNewDevice(device)
      }

      if (topic === 'devices/disconnected'){
        devices[device.id].elements.statusText.html('disconnected').css({
          "float":"right", "color": 'red'
        })
        devices[device.id].destroyTimer = setTimeout(function(){
          devicesList.editableList('removeItem', devices[device.id]);
          delete devices[device.id]
        },2000)
      }

      if (topic === 'devices/heartbeat'){
        var ctx = JSON.stringify(device.context)
        devices[device.id].context = device.context
        devices[device.id].lastSeen = device.lastSeen
        var lastSeenTime = new Date(device.lastSeen)
        devices[device.id].elements.lastSeenText.html(
          lastSeenTime.getHours() + ':' +
          lastSeenTime.getMinutes() + ':' +
          lastSeenTime.getSeconds()
        )
        devices[device.id].elements.memoryBar.css('width', devices[device.id].context.freeMem/4000000000 + '%')
        devices[device.id].elements.cpuBar.css('width', devices[device.id].context.cpuFree + '%')
        var privacyTagsString = JSON.stringify(devices[device.id].context.privacy.tags);
        devices[device.id].elements.privacyText.html(privacyTagsString);
        devices[device.id].elements.headerRow.attr("title", ctx)
        updateMap()
      }
    })
  }

  function addOrUpdateNewDevice(device){
    if (!devices[device.id]){
      devices[device.id] = {
        id: device.id,
        name: device.name,
        lastSeen: Date.now(),
        status: 'connected',
        context: device.context
      }
      devicesList.editableList('addItem', devices[device.id]);
    } else {
      devices[device.id].status = 'connected'
      devices[device.id].lastSeen = Date.now()
      devices[device.id].elements.statusText.html('connected').css({
        "float":"right", "color": 'green'
      })
      devices[device.id].elements.lastSeenText.html(Date.now())
      clearTimeout(devices[device.id].destroyTimer)
    }
    loadedList = Object.values(devices)
  }

  function updateMap(){
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null)
    }

    var latlngs = []

    console.log(devices)

    for (var id in devices){
      if (!devices[id].context || 
          !devices[id].context.location ||
          Object.keys(devices[id].context.location).length !== 2){
        continue
      }

      latlngs.push({
        id: id,
        freeMem: devices[id].context.freeMem,
        cpuFree: devices[id].context.cpuFree,
        cores: devices[id].context.cores,
        lat: devices[id].context.location.lat,
        lng: devices[id].context.location.lng,
      })
    }

    markers = latlngs.map(function(el, i) {
      var marker = new google.maps.Marker({
        position: el,
        map: map,
        id: id
      })
      google.maps.event.addListener(marker , 'click', function(){
        var infowindow = new google.maps.InfoWindow({
          content:'Device Id: ' + el.id + ', freeMem: ' + el.freeMem + ', cores: ' + el.cores,
          position: el,
        })
        infowindow.open(map);
        setTimeout(function () { infowindow.close(); }, 2000);
      })
      return marker
    })
  }

  return {
    init: init
  }
})()