
define(['underscore'], function(_){

function hsvToHex(r, g, b){

    r *= 255, g *= 255, b *= 255;
    return "#" + ((1 << 24) + (r << 16) +
        (g << 8) + b).toString(16).slice(1);
}

function point(c, size, mod){
    return {
        x: c.x * size * mod + c.x * size + size/2,
        y: c.y * size * mod + c.y * size + size/2,
    };
}

var a_code = 'A'.charCodeAt(0);
function toChar(code){
    return String.fromCharCode(a_code+code-1); }

function drawEdge(ctx, size, mod, room){
    room.mapAround(function(d, next){
        var edge = room.edges[d];
        if (!edge)
            return;
        var r = point(edge.r1.coords, size, mod);
        var e = point(edge.r2.coords, size, mod);
        ctx.beginPath();
        ctx.moveTo(r.x,r.y);
        ctx.lineTo(e.x,e.y);
        ctx.stroke();
        var cond = edge.condition;
        if (cond){
            var mid = {x: (r.x+e.x)/2, y: (r.y+e.y)/2};
            ctx.font="1em Georgia";
            ctx.fillStyle = "#000";
            if (cond.level){
                ctx.beginPath();
                var x = mid.x + (edge.vertical ? 0 : -8);
                var y = mid.y + (edge.vertical ? 10 : -2);
                ctx.fillText(toChar(cond.level), x, y);
            }
            if (cond.switch){
                var x = mid.x + (edge.vertical ? -20 : -18);
                var y = mid.y + (edge.vertical ? -20 : -25);
                ctx.fillText(cond.switch < 0 ? 'OFF' : 'ON', x, y);
            }
        }
    });
};

function drawRoom(ctx, size, mod, room){
    var o = {
        x: room.coords.x * size * mod,
        y: room.coords.y * size * mod,
    }
    var c = {
        x: room.coords.x * size + size/2,
        y: room.coords.y * size + size/2,
    };
    ctx.beginPath();
    ctx.arc(c.x + o.x, c.y + o.y, size/2, 0, 2 * Math.PI);
    ctx.fillStyle = 'hsl('+(0.6-room.intensity*0.6)*360+', 70%, 80%)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000";
    ctx.stroke();
    ctx.font="1em Georgia";
    ctx.fillStyle = "#000";
    if (room.goal){
        ctx.beginPath();
        ctx.arc(c.x + o.x, c.y + o.y, size/3, 0, 2 * Math.PI);
        ctx.fillStyle = "#5AF";
        ctx.fill();
    }
    ctx.fillStyle = "#000";
    if (room.item)
        ctx.fillText(toChar(room.item), c.x+o.x - 6, c.y+o.y - 4);
    ctx.fillText(room.intensity.toFixed(2), c.x+o.x-18, c.y+o.y+14);
};

var Painter = function(context, data){
    var rooms = data.rooms;
    var mod = 0.3;
    var count = {
        x: data.bounds.left - data.bounds.x + 1,
        y: data.bounds.top - data.bounds.y + 1,
    };
    var cc = {x: context.canvas.width, y: context.canvas.height};
    var sc = {
        x: cc.x/(count.x+(count.x-1)*mod),
        y: cc.y/(count.y+(count.y-1)*mod),
    };
    var size = sc.x > sc.y ? sc.y : sc.x;
    rooms.forEach(_.partial(drawEdge, context, size, mod));
    rooms.forEach(_.partial(drawRoom, context, size, mod));
};

return Painter;
})

