

define(['rand31'], function(Random){
var random;
Random.create = function(seed){
    return random = new Random(seed);
}
random = random||Random.create(Date.now());
return random;
});
