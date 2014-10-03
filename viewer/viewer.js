
require.config({
    baseUrl: '..',
    paths: {
        'gen': 'lib',
        'rand31': 'build/rand31/rand31',
        'underscore': 'build/underscore/underscore'},
    //urlArgs: 'bust=' + (new Date()).getTime()
});

require(['gen/generator', './viewer/painter'],
function(Generator,painter){

var view = document.getElementById('view');

function val(id){
    return document.querySelector('#'+id).value;
}

function generate(seed){
    seed = seed||Date.now();
    document.querySelector('#seed').value = seed;
    var g = new Generator(seed, {spaces: val('spaces'),
        keys: val('keys'), switches: val('switches')});
    return g.generate();
}

function redraw(seed){
    var data = generate(seed);
    view.width = view.width;
    painter(view.getContext('2d'), data);
}

function redraw_seed(){
    var sin = document.querySelector('#seed');
    redraw(sin.value);
}

var gbtn = document.querySelector('#generate');
gbtn.addEventListener('click', redraw_seed);
var rbtn = document.querySelector('#random');
rbtn.addEventListener('click', function(){ redraw(); });
redraw();

});
