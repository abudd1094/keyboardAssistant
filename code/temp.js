/**
 * @file referenceControl.js
 * @description Handles reference modes and controls in a Max for Live device.
 */

// Define the number of inlets
inlets = 1;

// Set the inlet assist message
setinletassist(0, "\n Input");

// Define the number of outlets
outlets = 1;

// Set the outlet assist message
setoutletassist(0, "\n 0: Output");

// Global variable to store reference mode globally
var refMode = "Off";

// Global variable to store the current dictionary object
var currentDict;

/**
 * @function clearAll
 * @description Clears all references and controls.
 */
function clearAll() {
  // ... (code for clearing references and controls)
}

/**
 * @function clear
 * @description Clears a specific patcher object.
 * @param {string} scriptingName - The scripting name of the object to be cleared.
 */
function clear(scriptingName) {
  // ... (code for clearing a specific patcher object)
}

/**
 * @function load
 * @description Loads data based on the selected reference mode.
 * @param {string} mode - The reference mode (e.g., "Scale", "Interval", "Chord").
 */
function load(mode) {
  // ... (code for loading data based on reference mode)
}

/**
 * @function loadScales
 * @description Loads scale data into the current dictionary object.
 * @param {Dict} d - The dictionary object to load data into.
 */
function loadScales(d) {
  // ... (code for loading scale data)
}

/**
 * @function loadIntervals
 * @description Loads interval data into the current dictionary object.
 * @param {Dict} d - The dictionary object to load data into.
 */
function loadIntervals(d) {
  // ... (code for loading interval data)
}

/**
 * @function loadChords
 * @description Loads chord data into the current dictionary object.
 * @param {Dict} d - The dictionary object to load data into.
 */
function loadChords(d) {
  // ... (code for loading chord data)
}

/**
 * @function handleRefLabel
 * @description Handles the visibility of the reference label based on the current reference mode.
 */
function handleRefLabel() {
  // ... (code for handling the visibility of the reference label)
}

/**
 * @function handleControls
 * @description Shows/hides/adjusts patcher object controls based on the reference mode.
 * @param {boolean} hide - Whether to hide or show controls.
 */
function handleControls(hide) {
  // ... (code for showing/hiding/adjusting patcher object controls)
}

/**
 * @function useSharp
 * @description Sets the global variable for using sharp notation.
 * @param {number} v - 0 for flat, 1 for sharp.
 */
function useSharp(v) {
  // ... (code for setting the global variable for using sharp notation)
}
