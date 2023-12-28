inlets = 1;
setinletassist(0, "\n Input");
outlets = 1;
setoutletassist(0, "\n 0: Output");

var {
  renderMaxScore,
  renderScale,
  getMaxScores,
  removeAllMaxScores,
  removeMaxScore,
} = require("maxScoreUtilities");

// current reference mode
var currentMode = "Off";
// current mode JSON data is loaded into the currentDict object
var currentDict;

// patcher objects are iterated by reverse z index; input kslider nslider are on top with suffix [0]
function clearAll() {
  var d = new Dict("ref_1");
  d.clear(); // clear passed in dictionary
  clear("umenu_ref[1]"); // clear ref umenu
  clear("nslider[1]"); // clear ref 1 nslider
  clear("kslider[1]"); // clear ref 1 kslider
  clear("kslider[2]"); // clear ref 1 secondary kslider
  this.patcher.getnamed("ref1_controls_RAM_set").message("bang"); // clear the RAM message so nothing is shown on initial load

  removeAllMaxScores();
}

function clear(scriptingName) {
  var maxobj = this.patcher.getnamed(scriptingName);
  maxobj.message("clear");
}

function load(mode) {
  var d = new Dict("ref_1");

  // set mode locally
  currentMode = mode;
  setRefLabel();

  // clear old data
  clearAll();

  var nslider1 = this.patcher.getnamed("nslider[1]");
  
  // hide reference if off
  if (mode == "Off") {
    nslider1.setattr("hidden", 1);
  } else {
    nslider1.setattr("hidden", 0);
    // load new data
    if (mode == "Scale") loadScales(d);
    if (mode == "Interval") loadIntervals(d);
    if (mode == "Chord") loadChords(d);
  }
}

function loadScales(d) {
  currentDict = d;
  d.import_json("factory_scales.json");
}

function loadIntervals(d) {
  currentDict = d;
  d.import_json("factory_intervals.json");
}

function loadChords(d) {
  currentDict = d;
  d.import_json("factory_chords.json");
}

function handleRefChange() {
  var semitones = arrayfromargs(arguments);

  if (currentMode === "Scale") {
    handleScaleChange(semitones);
  }
}

function handleScaleChange(semitones) {
  removeAllMaxScores();

  var maxScoreMessage = renderMaxScore(1, 157, 176);
  renderScale(maxScoreMessage, semitones);
}

function removeAllMaxScores() {
  var maxScores = getMaxScores();

  for (var i = 0; i < maxScores.length; i++) {
    removeMaxScore(maxScores[i]);
  }
}

function setRefLabel() {
  var refLabel = this.patcher.getnamed("refLabel[1]");

  // hide label if off
  refLabel.setattr("hidden", currentMode == "Off");
}
