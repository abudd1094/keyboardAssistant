/**
 * @file patchControl.js
 * @description Handles reference modes and controls in a Max for Live device.
 */
inlets = 1;
setinletassist(0, "\n Input");
outlets = 1;
setoutletassist(0, "\n 0: Output");

// current reference mode
var refMode = "Off";
// current mode JSON data is loaded into the currentDict object
var currentDict;

// MAX FUNCTIONS
/**
 * @function clearAll
 * @description Clears all references and controls.
 */
function clearAll() {
  var d = new Dict("ref_1");
  d.clear(); // clear passed in dictionary
  clear("umenu_ref[1]"); // clear ref umenu
  clear("nslider[1]"); // clear ref 1 nslider
  clear("kslider[1]"); // clear ref 1 kslider
  clear("kslider[2]"); // clear ref 1 secondary kslider
  this.patcher.getnamed("ref1_controls_RAM_set").message("bang"); // clear the RAM message so nothing is shown on initial load
}

/**
 * @function load
 * @description Loads data based on the selected reference mode.
 * @param {string} mode - The reference mode (e.g., "Scale", "Interval", "Chord").
 */
function load(mode) {
  var d = new Dict("ref_1");

  // set mode globally & locally
  g = new Global("ref");
  g.refMode = mode;
  refMode = mode;

  handleRefLabel();

  // clear old data
  clearAll();

  // hide controls if off
  handleControls(mode == "Off");

  // load new data
  if (mode == "Scale") loadScales(d);
  if (mode == "Interval") loadIntervals(d);
  if (mode == "Chord") loadChords(d);
}

/**
 * @function useSharp
 * @description Sets the global variable for using sharp notation. Flat or sharp mode uses tab object where 0 = flat and 1 = sharp.
 * @param {number} v - 0 for flat, 1 for sharp.
 */
function useSharp(v) {
  g = new Global("ref");
  g.useSharp = v;
}

// HELPER FUNCTIONS
/**
 * @function clear
 * @description Clears a specific patcher object.
 * @param {string} scriptingName - The scripting name of the object to be cleared.
 */
function clear(scriptingName) {
  var maxobj = this.patcher.getnamed(scriptingName);
  maxobj.message("clear");
}

/**
 * @function loadScales
 * @description Loads scale data into the current dictionary object.
 * @param {Dict} d - The dictionary object to load data into.
 */
function loadScales(d) {
  currentDict = d;
  d.import_json("factory_scales.json");
}

/**
 * @function loadIntervals
 * @description Loads interval data into the current dictionary object.
 * @param {Dict} d - The dictionary object to load data into.
 */
function loadIntervals(d) {
  currentDict = d;
  d.import_json("factory_intervals.json");

  // show nslider 1
  this.patcher.getnamed("nslider[1]").setattr("hidden", 0);
}

/**
 * @function loadChords
 * @description Loads chord data into the current dictionary object.
 * @param {Dict} d - The dictionary object to load data into.
 */
function loadChords(d) {
  currentDict = d;
  d.import_json("factory_chords.json");

  // show nslider 1
  this.patcher.getnamed("nslider[1]").setattr("hidden", 0);
}


/**
 * @function handleControls
 * @description Shows/hides/adjusts patcher object controls based on the reference mode.
 * @param {boolean} hide - Whether to hide or show controls.
 */
function handleControls(hide) {
  var hiddenValue = hide ? 1 : 0;

  // show / hide controls
  this.patcher.getnamed("kslider_root[1]_label").setattr("hidden", hiddenValue);
  this.patcher.getnamed("kslider_root[1]").setattr("hidden", hiddenValue);
  this.patcher.getnamed("button_hideRootLabels").message(0);
  this.patcher.getnamed("button_hideRootLabels").setattr("hidden", hiddenValue);
  this.patcher.getnamed("key_type[1]").setattr("hidden", hiddenValue);
  this.patcher.getnamed("extend[1]").setattr("hidden", hiddenValue);
  this.patcher
    .getnamed("nslider[1]")
    .setattr("hidden", refMode == "Scale" ? 1 : hiddenValue); // hide nslider[1] for scale mode
  this.patcher.getnamed("umenu_ref[1]_label").setattr("hidden", hiddenValue);
  this.patcher.getnamed("umenu_ref[1]_label").message("set", refMode); // set ref umenu label to mode name
  this.patcher.getnamed("umenu_ref[1]").setattr("hidden", hiddenValue);
  this.patcher.getnamed("num_octave[1]_label").setattr("hidden", hiddenValue);
  this.patcher
    .getnamed("num_octave[1]_label")
    .message("set", refMode == "Chord" ? "Oct / Inv" : "Octave"); // extend octave label to "Oct / Inv" for chord mode
  this.patcher.getnamed("num_octave[1]").setattr("hidden", hiddenValue);

  // only show inversion for chord mode
  if (refMode == "Chord") {
    this.patcher.getnamed("num_inversion[1]").setattr("hidden", 0);
  } else {
    this.patcher.getnamed("num_inversion[1]").setattr("hidden", 1);
  }
  // adjust octave umenu width for chord mode so inversion umenu can fit
  var octaveUmenuPresentationRect = this.patcher
    .getnamed("num_octave[1]")
    .getattr("presentation_rect");
  var umenuWidth = refMode == "Chord" ? 48 : 100; // adjust width to accommodate inversion menu
  this.patcher
    .getnamed("num_octave[1]")
    .setattr("presentation_rect", [
      octaveUmenuPresentationRect[0],
      octaveUmenuPresentationRect[1],
      umenuWidth,
      octaveUmenuPresentationRect[3],
    ]);
}

/**
 * @function handleRefLabel
 * @description Handles the visibility of the reference label based on the current reference mode. (hides it if off)
 */
function handleRefLabel() {
  this.patcher.getnamed("refLabel[1]").setattr("hidden", refMode == "Off");
}
