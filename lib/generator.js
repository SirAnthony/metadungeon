

define(['./dungeon', './room', './util/random', 'underscore'],
function(Dungeon, Room, random, _){

function compare_edge_count(r1, r2){
    return r1.links - r2.links; }
function compare_intensity(r1, r2){
    return r1.intensity > r2.intensity ? -1 :
        r2.intensity > r1.intensity ? 1 : 0;
}

var Generator = function(seed, options){
    console.log('Create with seed: '+seed);
    this.seed = seed;
    random.seed(seed);
    this.options = options;
    this.comparator = options.comparator||compare_intensity;
};

var G = Generator.prototype;
G.generate = function(attempts){
    var attempt = attempts||30;
    while (--attempt>0){
        var dungeon = new Dungeon(this.options);
        var levels = [];
        try {
            this.start(dungeon, levels);
            this.fill(dungeon, levels);
            this.finish(dungeon, levels);
            dungeon.emit('prepared');
            this.intensity(dungeon, levels);
            this.keys(levels);
            if (!dungeon.acceptable(this.options))
                throw new Error('Wrong dungeon was generated');
            return dungeon;
        } catch(e){ console.log(e); }
    }
};
G.start = function(dungeon, levels){
    var entries = this.options.coords||[{x: 0, y: 0}];
    var l = entries.length;
    var coords = entries[Math.min(random.nextInt(l), l-1)];
    var room = new Room(coords);
    dungeon.add(room);
    levels.push([]);
    levels[0].push(room);
};
G.fill = function(dungeon, levels){
    var per_lock = (this.options.spaces/this.options.keys)|0;
    var level = 0;
    var key = null;
    var cond = new Room.condition();
    if (this.options.switches)
        dungeon.bind('prepared', switches);
    while (dungeon.rooms.length < this.options.spaces){
        var lock = false;
        if (levels[level].length >= per_lock &&
            level < this.options.keys - 1){
            levels.push([]);
            key = level++;
            cond = cond.and(key);
            lock = true;
        }
        var proom = null;
        if (!lock && random.nextInt(10) > 0)
            proom = freeEdged(levels[level], dungeon);
        if (!proom){
            proom = freeEdged(dungeon.rooms, dungeon);
            lock = true;
        }
        if (!proom)
            throw new Error('No free parent room found');
        var room = new Room(proom.next, proom.room, null, cond);
        dungeon.add(room);
        dungeon.bind('prepared', _.partial(graphify, room));
        levels[level].push(room);
    }
    dungeon.bind('prepared', function(){
        var boss = this.boss;
        this.goal.edges.forEach(function(edge){
            if (!edge)
                return;
            var r1 = edge.r1, r2 = edge.r2;
            if (r1 != boss && r2 != boss){
                var e1 = r1.edges.indexOf(edge);
                var e2 = r2.edges.indexOf(edge);
                r1.edges[e1] = r2.edges[e2] = void 0;
            }
        })
    })
};
G.finish = function(dungeon, levels){
    var goals = [];
    dungeon.map(function(room){
        var par = room.parent;
        if (!room.children.length && !room.item && par &&
            par.children.length == 1 && par.implies(room))
            goals.push(room);
    });

    if (!goals.length)
        throw new Error('No goals found');

    var gnum = Math.min(random.nextInt(goals.length), goals.length-1);
    var goal = goals[gnum], boss = goal.parent;
    var ol = boss.precond.level, nl = levels.length;
    var boss_key = nl;
    goal.item = Room.symbol.GOAL;
    boss.item = Room.symbol.BOSS;
    [goal, boss].forEach(function(item){
        levels[ol].splice(levels[ol].indexOf(item), 1);
        levels[nl] = levels[nl]||[];
        levels[nl].push(item);
    });
    goal.precond = boss.precond = boss.precond.and(boss_key);
    boss.parent.link(boss);
    boss.link(goal);
    dungeon.boss = boss;
    dungeon.goal = goal;
};
G.intensity = function(dungeon, levels){
    var base = 0.0;
    levels.forEach(function(rooms, level){
        var ints = base + 0.8;
        rooms.forEach(function(room){
            if (!room.parent || !room.parent.implies(room))
                base = Math.max(base, applyIntensity(room, ints));
        });
    });
    var rooms = dungeon.rooms;
    var max = _.reduce(rooms, function(x, y) {
        return x.intensity > y.intensity ? x : y; });
    max = max.intensity;
    rooms.forEach(function(room){
        room.intensity = room.intensity * 0.99 / max });
    dungeon.boss.intensity = 1.0;
    dungeon.goal.intensity = 0.0;
};
G.keys = function(levels){
    levels = levels.splice(0, levels.length-1);
    var cmp = this.comparator;
    levels.forEach(function(rooms, key){
        key++;
        rooms = shuffle(rooms, random);
        rooms.sort(cmp);
        var last_symbol = null;
        for (var r=0; r<rooms.length; ++r){
            var room = rooms[r];
            if (!room.item){
                if (!room.precond)
                    room.precond = new room.Condition(key-1);
                else
                    room.precond.add(key-1);
                room.item = last_symbol = key;
                break;
            }
        }
        if (last_symbol===null)
            throw new Error('No key were placed on level '+key);
    });
};

function applyIntensity(room, intensity){
    intensity *= 1.0 - 0.1/2.0 + 0.1 * random.nextDouble();
    room.intensity = intensity;
    var max = intensity;
    room.children.forEach(function(child){
        if (room.implies(child))
            max = Math.max(max, applyIntensity(child, intensity+1.0));
    });
    return max;
};

function removeTree(arr, elem){
    arr.splice(arr.indexOf(elem), 1);
    for (var c in elem.children)
        removeTree(arr, elem.children[c]);
}

function freeEdged(rooms, dungeon){
    var srooms = shuffle(rooms);
    for (var r=0; r<srooms.length; ++r){
        var room = srooms[r];
        var valid = null;
        room.mapAround(function(d, coords){
            if (!valid && dungeon.valid(coords) && !dungeon.get(coords))
                valid = {room: room, next: coords};
        });
        if (valid)
            return valid;
    }
}

function shuffle(obj) {
    var set = obj.slice(0), length = set.length;
    var min = Math.min, lmax = length-1;
    while (length){
        var r = min(random.nextInt(length), lmax);
        var elem = set[--length];
        set[length] = set[r];
        set[r] = elem;
    }
    return set;
};

function switches(){
    var solutions = this.path();
    var drooms = this.rooms;
    for (var at=0; at<10; ++at){
        var rooms = shuffle(drooms);
        solutions = shuffle(solutions);
        var base = _.find(solutions, function(room){
            return room.children.length > 1 && room.parent; });
        if (!base)
            throw new Error('Base room not found');
        removeTree(rooms, base);
        var rswitch = _.find(rooms, function(room){
            return !room.item && base.implies(room); });
        if (rswitch && base.switchLock(0)){
            rswitch.item = Room.symbol.SWITCH;
            return;
        }
        return;
    }
    throw new Error('Switches not found');
}

function graphify(room){
    if (!room.linkable)
        return;
    var dungeon = this;
    room.mapAround(function(d, coords){
        if (room.edges[d])
            return;
        var next = dungeon.get(coords);
        if (!next)
            return;
       if (room.implies(next) && next.implies(room)){
            if (random.nextInt(5))
                room.link(next);
        } else {
            var diff = room.diff(next);
            if (diff && (diff.switch || random.nextInt(5)))
                room.link(next);
        }
    });
}

return Generator;

});
