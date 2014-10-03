
define(['./util/random', 'underscore'], function(random, _){

var props = ['start', 'goal', 'boss', 'switch'];
var Symbol = {
    START: -1,
    GOAL: -2,
    BOSS: -3,
    SWITCH: -4,
    SWITCH_ON: -5,
    SWITCH_OFF: -6,
};

var Edge = function(r1, r2){
    return {
        r1: r1,
        r2: r2,
        equals: function(other){ return symbol == this.symbol; },
        get vertical(){ return r1.coords.x == r2.coords.x; },
        get condition(){ return new Condition().add(
            this.r1.precond).add(this.r2.precond); },
    };
};

var Condition = function(symbol){
    this.level = 0;
    this.switch = 0;
    this.add(symbol);
};
var C = Condition.prototype;
C.equals = function(c){
    return c.level == this.level && c.switch == this.switch; };
C.add = function(s){
    if (s instanceof Condition){
        this.level = Math.max(s.level, this.level);
        this.switch = s.switch||this.switch;
    } else {
        s = s||0;
        this.level = Math.max(s < 0 ? 0 : s, this.level);
        if (s==Symbol.SWITCH_ON)
            this.switch = 1;
        else if (s==Symbol.SWITCH_OFF)
            this.switch = -1;
    }
    return this;
};
C.and = function(s){
    var n = new Condition();
    n.level = this.level;
    n.switch = this.switch;
    n.add(s);
    return n;
};
C.diff = function(cond){
    if (this.equals(cond))
        return null;
    cond = new Condition(Math.max(this.level, cond.level));
    if (this.switch!=cond.switch){
        if (this.switch && cond.switch)
            return null; // throw new Error('Different switches required');
        var state = this.switch||cond.switch;
        cond.add(state>0 ? Symbol.SWITCH_ON : Symbol.SWITCH_OFF);
    }
    return cond;
};

function switchState(given){
    if (!given)
        return !random.nextInt(1) ? Symbol.SWITCH_ON : Symbol.SWITCH_OFF;
    return given>0 ? Symbol.SWITCH_ON : Symbol.SWITCH_OFF;
}

var dirs = {UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3};
var Direction = {
    items: dirs,
    opposite: [2, 3, 0, 1],
    v: _.values(dirs),
    next: function(d, coords){
        var I = dirs;
        return {
            x: coords.x + (d==I.UP ? 1 : (d==I.DOWN ? -1 : 0)),
            y: coords.y + (d==I.RIGHT ? 1 : (d==I.LEFT ? -1 : 0)),
        };
    },
    to: function(r1, r2){
        var c1 = r1.coords, c2 = r2.coords;
        if (c1.x < c2.x)
            return dirs.RIGHT;
        if (c1.x > c2.x)
            return dirs.LEFT;
        if (c1.y < c2.y)
            return dirs.UP;
        if (c1.y > c2.y)
            return dirs.DOWN;
        throw new Error('Same position');
    },
};

function Room(coords, parent, item, precond){
    var r = this;
    r.coords = {x: coords.x, y: coords.y};
    r.edges = new Array(Direction.length);
    r.precond = precond;
    r.intensity = 0.0;
    r.parent = parent;
    r.item = item;
    if (parent){
        parent.children.push(r);
        this.link(parent, precond);
    } else
        r.item = item||Symbol.START;
    r.children = [];
    Object.defineProperty(r, "links", {
        get: function () {
            var dir = 0;
            for (var i=0; i<Direction.length; ++i)
                dir += (!!r.edges[i])|0;
            return dir;
        }
    });
    props.forEach(function(prop){
        Object.defineProperty(r, prop, {
            get: function(){ return r.item === Symbol[prop.toUpperCase()]; }});
    });
    Object.defineProperty(r, 'linkable', {
        get: function(){ return !r.goal && !r.boss; }});
}
var R = Room.prototype;
R.link = function(r2){
    if (!this.adjacend(r2))
        throw new Error('Not adjacent rooms');
    var d = Direction.to(this, r2);
    var opposite = Direction.opposite[d];
    var edge = this.edges[d];
    if (edge){
        if (edge == r2.edges[opposite])
            return;
        console.log('already have edge');
    }
    r2.edges[opposite] = this.edges[d] = new Edge(this, r2);
};
R.adjacend = function(room){
    var c = this.coords, r = room.coords;
    return c.x <= r.x+1 && c.x >= r.x-1 &&
        c.y <= r.y+1 && c.y >= r.y-1;
};
R.linked = function(r2){
    var d = Direction.to(this, r2);
    return this.edges[d] || r2.edges[Direction.opposite[d]];
};
R.implies = function(room){
    var c1 = this.precond, c2 = room.precond;
    return (!c1 || !c2) || (c1.level >= c2.level &&
        (!c2.switch || c1.switch == c1.switch));
};
R.diff = function(room){
    if (!room.precond)
        return this.precond;
    if (!this.precond)
        return room.precond;
    return this.precond.diff(room.precond);
};
R.switchLock = function(given, skip){
    var any = false;
    var state = switchState(given);
    skip = skip||[];
    this.mapAround(function(dir){
        var edge = this.edges[dir];
        if (!edge || skip.indexOf(edge)>=0)
            return;
        skip.push(edge);
        var next = edge.r1 == this ? edge.r2 : edge.r1;
        if (edge.condition && random.nextInt(4)){
            next.precond = new Condition(next.precond);
            next.precond.add(state);
            this.link(next);
            any = true;
        } else
            any |= next.switchLock(state, skip);
        if (!given){
            state = state==Symbol.SWITCH_OFF ?
                 Symbol.SWITCH_ON : Symbol.SWITCH_OFF;
        }
    });
    return any;
};
R.mapAround = function(f){
    Direction.v.forEach(function(dir){
        f.call(this, dir, this.next(dir)); }, this);
};
R.next = function(dir){
    return Direction.next(dir, this.coords); };
Room.props = props;
Room.symbol = Symbol;
Room.condition = Condition;
return Room;
});
