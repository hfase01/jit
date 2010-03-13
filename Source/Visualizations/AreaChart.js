$jit.ST.Plot.NodeTypes.implement({
  'areachart-default' : {
    'render' : function(node, canvas) {
      var pos = node.pos.getc(true), 
          nconfig = this.node, 
          width = node.getData('width'),
          height = node.getData('height'),
          algnPos = this.getAlignedPos(pos, width, height),
          y = algnPos.y,
          valueArray = node.getData('valueArray'),
          colorArray = node.getData('colorArray'),
          stringArray = node.getData('stringArray');

      var ctx = canvas.getCtx();
      if (colorArray && valueArray && stringArray) {
        for (var i=0, l=valueArray.length, acumLeft=0, acumRight=0; i<l; i++) {
          ctx.fillStyle = ctx.strokeStyle = colorArray[i];
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(algnPos.x, y - acumLeft);
          ctx.lineTo(algnPos.x + width, y - acumRight);
          ctx.lineTo(algnPos.x + width, y - acumRight - valueArray[i][1]);
          ctx.lineTo(algnPos.x, y - acumLeft - valueArray[i][0]);
          ctx.lineTo(algnPos.x, y - acumLeft);
          ctx.fill();
          ctx.restore();
          acumLeft += (valueArray[i][0] || 0);
          acumRight += (valueArray[i][1] || 0);
        }
      }
    }
  }
});

$jit.AreaChart = new Class({
  st: null,
  colors: ["#416D9C", "#70A35E", "#EBB056", "#C74243", "#83548B", "#909291", "#557EAA"],
  
  initialize: function(opt) {
    this.controller = this.config = 
      $.merge(Options("Canvas", "AreaChart"), opt);
    this.initializeViz();
  },
  
  initializeViz: function() {
    var config = this.config;
    var st = new $jit.ST({
      injectInto: config.injectInto,
      orientation: "bottom",
      levelDistance: 0,
      siblingOffset: 0,
      Node: {
        overridable: true,
        type: 'areachart-' + config.type,
        align: 'left'
      },
      Edge: {
        type: 'none'
      }
    });
    
    var size = st.canvas.getSize();
    st.config.offsetY = -size.height/3;    
    this.st = st;
  },
  
  loadJSON: function(json) {
    var prefix = $.time(), 
        ch = [], 
        that = this,
        size = this.st.canvas.getSize(),
        name = $.splat(json.label), 
        color = $.splat(json.color || that.colors),
        st = this.st,
        config = this.config;
    
    for(var i=0, values=json.values, maxValue=0, l=values.length; i<l-1; i++) {
      var val = values[i];
      var valLeft = values[i].values, valRight = values[i+1].values;
      var valArray = $.zip(valLeft, valRight);
      var acumLeft = 0, acumRight = 0;
      ch.push({
        'id': prefix + val.label,
        'name': val.label,
        'data': {
          'value': valArray,
          '$valueArray': valArray,
          '$colorArray': color,
          '$stringArray': name
        },
        'children': []
      });
      $.each(valArray, function(v) { 
        acumLeft += +v[0];
        acumRight += +v[1];
      });
      var acum = acumRight>acumLeft? acumRight:acumLeft;
      maxValue = maxValue>acum? maxValue:acum;
    }
    var root = {
      'id': prefix + '$root',
      'name': '',
      'data': {
        '$type': 'none',
        '$width': 1,
        '$height': 1
      },
      'children': ch
    };
    st.loadJSON(root);
    
    var fixedDim = size.width / l,
        animate = config.animate;
    $jit.Graph.Util.eachNode(this.st.graph, function(n) {
      var acumLeft = 0, acumRight = 0;
      $.each(n.getData('valueArray'), function(v) {
        acumLeft += +v[0];
        acumRight += +v[1];
      });
      var acum = acumRight>acumLeft? acumRight:acumLeft;
      n.setData('height', acum * size['height'] / maxValue);
      n.setData('width', fixedDim);
    });
    st.compute();
    st.select(st.root);
  }
});