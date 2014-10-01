
require.config({
    baseUrl: '..',
    paths: {
        'gen': 'lib',
        'rand31': 'bower_components/rand31/rand31',
        'underscore': 'bower_components/underscore/underscore'},
    //urlArgs: 'bust=' + (new Date()).getTime()
});

require(['gen/generator', './viewer/painter'],
function(Generator, Painter){

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
};

function redraw(){
}

var btn = document.querySelector('#generate');
btn.addEventListener('click', function(){
    var data = generate();
    view.width = view.width;
    Painter(view.getContext('2d'), data);
});

});
