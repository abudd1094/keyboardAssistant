/**
 * @file intervalGenerator.js
 * @description Takes a single interval and replicates it up and down across all octaves.
 */
inlets = 1;
setinletassist(0, "\n Interval pair in");
outlets = 1;
setoutletassist(0, "\n 0: Intervals out");

/**
 * @function list
 * @description Takes a single interval and replicates it up and down across all octaves.
 * @param {...number} intervalPair - MIDI note values representing the interval pair.
 */
function list() {
    var a = arrayfromargs(arguments);

    var root = a[0];
    var interval = a[1] - a[0];
    
    var ascending = root + interval;
    var descending = root - interval;

    while (ascending < 127) {
        outlet(0, ascending, 127);
        ascending = ascending + interval;
    }

    while (descending > 0) {
        outlet(0, descending, 127);
        descending = descending - interval;
    }
}