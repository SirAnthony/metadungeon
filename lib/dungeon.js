
define(['./room', 'underscore'], function(Room, _){

function Dungeon(options){
    var d =  this;
    d.rooms = [];
    d.by_coords = {};
    d.bounds = {x: 0, y: 0, top: 0, left: 0};
    d.events = {};
    d.limits = _.extend({x: 0, y: 0, top: 100, left: 100},
        options.bounds||{});
}
var D = Dungeon.prototype;
D.map = function(f){
    this.rooms.forEach(f); }
D.find = function(f){
    var rooms = this.rooms;
    for (var r=0; r<rooms.length; ++r){
        if (f(rooms[r]))
            return rooms[r];
    }
}
D.get = function(coords){
    var x = coords.x, y = coords.y;
    return this.find(function(room){
        return room.coords.x==x && room.coords.y==y; });
};
D.add = function(room){
    this.rooms.push(room);
    // Stretch bounds;
    var b = this.bounds;
    var c = room.coords;
    b.x = c.x < b.x ? c.x : b.x;
    b.left = c.x > b.left ? c.x : b.left;
    b.y = c.y < b.y ? c.y : b.y;
    b.top = c.y > b.y ? c.y : b.top;
}
D.bind = function(name, func){
    if (!(name in this.events))
        this.events[name] = [];
    this.events[name].push(func);
}
D.emit = function(name){
    var events = this.events[name]||[];
    for (var e=0; e<events.length; ++e)
        events[e].call(this);
};
D.valid = function(coords){
    return coords.x >= this.limits.x &&
        coords.x < this.limits.left &&
        coords.y >= this.limits.y &&
        coords.y < this.limits.top;
}
D.path = function(){
    var room = this.goal;
    var s = [room];
    while ((room = room.parent))
        s.push(room);
    return s;
}
D.acceptable = function(options){
    return true;
}

return Dungeon;

});
