var Point = Class.extend({
  init : function(x, y) {
    this.x = x;
    this.y = y;
  }
});

var Piece = Point.extend({
  init : function(x, y, marker) {
    this._super(x, y);
    this.marker = marker || undefined;
  }
});

var PHASE = {
  PLACING: {value: 0, name:'Placing pieces'},
  MOVING:  {value: 1, name:'Moving pieces'},
  FLYING:  {value: 2, name:'Flying'}
};

var Player = Class.extend({
  init: function(type, username, marker) {
    this.type          = type;
    this.stockPieces   = 12;
    this.username      = username;
    this.marker        = marker;
    this.phase         = PHASE.PLACING;
  }
});