/**
 * @file inputParser.js
 * @description Receives player input in the form of note on/note off messages. This is then stored locally and compared to data (e.g. intervals, chords...) dependent on the current mode. The data is then displayed on the patcher.
 */

inlets = 1;
setinletassist(0, "\n Input");
outlets = 1;
setoutletassist(0, "\n 0: Output");

// Import necessary functions for hiding and showing note labels over the kslider objects
var { hideNote, showNote } = require("interfaceControl");
var { normalizeToC } = require("utilities");

// Semitones that are currently being played are stored here
var notes = [];

// "Off" | "Note" | "Single Interval" | "Multi Interval" | "Chord"
var mode = "Off";

// Collections of data imported from JSON files
var chords;
var intervals;

// Holds objects with patcher panel / comment objects: { firstNote: firstNote, secondNote: secondNote, panel: panel, comment: comment }
var patcherIntervals = [];

// colors used for interval panels and comments
var color1 = [0.0, 0.886, 1.0, 1.0]; // light blue
var color2 = [0.992, 1.0, 0.0, 1.0]; // yellow

// MAX FUNCTIONS
/**
 * @function loadbang
 * @description Loads local data from JSON files when the patcher is loaded.
 */
function loadbang() {
  // if no intervals exist for reference, import them
  if (!intervals) importIntervals();
}

/**
 * @function list
 * @description Handles incoming MIDI note data and performs actions based on the current mode.
 * @param {...number} noteVeloPair - MIDI note and velocity pairs.
 */
function list() {
  var noteVeloPair = arrayfromargs(arguments);

  // add or remove notes from local notes array
  localizeNote(noteVeloPair);

  switch (mode) {
    case "Single Interval":
      if (!intervals) importIntervals();
      handleSingleInterval();
      break;
    case "Multi Interval":
      if (!intervals) importIntervals();
      handleMultiInterval();
      break;
    case "Chord":
      if (!chords) importChords();
      handleChord();
      break;
    default:
      break;
  }
}

// LOCAL SETTERS
/**
 * @function localizeNote
 * @description Adds or removes notes from the local notes array based on MIDI input.
 * @param {number[]} noteVeloPair - MIDI note and velocity pair.
 */
function localizeNote(noteVeloPair) {
  var note = noteVeloPair[0];
  // check for both positive and negative (positive is sharp, negative is flat, but they represent the same note and should be treated as one)
  note = Math.abs(note);
  var velocity = noteVeloPair[1];

  // add note if it is new
  if (
    (notes.indexOf(note) == -1) &&
    velocity > 0
  ) {
    notes.push(note);
    showNote(note);
  }

  // remove note if it is old
  if (
    (notes.indexOf(note) != -1) &&
    velocity == 0
  ) {
    notes = notes.filter(function (existingNote) {
      if (existingNote == note) {
        hideNote(note);
      }
      if (existingNote == note) {
        hideNote(note);
      }
      return existingNote != note;
    });
  }
}

/**
 * @function importIntervals
 * @description Imports interval data from "factory_intervals.json".
 */
function importIntervals() {
  var d = new Dict("tempIntervals"); // import to temporary dictionary
  d.import_json("factory_intervals.json");

  intervals = JSON.parse(d.stringify());
  post("Imported intervals \n");
}

/**
 * @function importChords
 * @description Imports chord data from "factory_chords.json".
 */
function importChords() {
  var d = new Dict("tempChords"); // import to temporary dictionary
  d.import_json("factory_chords.json");

  intervals = JSON.parse(d.stringify());
  post("Imported chords \n");
}

/**
 * @function setMode
 * @description Sets the parser mode.
 * @param {string} v - The mode to be set.
 */
function setMode(v) {
  mode = v;
}

// PARSER FUNCTIONS
/**
 * @function handleSingleInterval
 * @description Handles the display of a single interval.
 */
function handleSingleInterval() {
  removeAllIntervals();

  // detect and show last interval if more than one note
  if (notes.length > 1) {
    showInterval(notes[notes.length - 2], notes[notes.length - 1]);
  }
}

/**
 * @function handleMultiInterval
 * @description Handles the display of multiple intervals.
 */
function handleMultiInterval() {
  removeAllIntervals();

  // sort notes by pitch
  var orderedNotes = notes.slice().sort(function (a, b) {
    return a - b;
  });

  // iterate through ordered notes and show each interval
  for (var i = 0; i < orderedNotes.length - 1; i++) {
    if (orderedNotes[i + 1]) {
      showInterval(orderedNotes[i], orderedNotes[i + 1], i % 2 != 0);
    }
  }
}

/**
 * @function handleChord
 * @description Handles the display of a single interval.
 */
function handleChord() {
  removeAllIntervals();
}

// HELPER FUNCTIONS
/**
 * @function getIntervalName
 * @description Returns the name of the interval based on the provided notes.
 * @param {number} firstNote - The first note of the interval.
 * @param {number} secondNote - The second note of the interval.
 * @returns {string} The name of the interval.
 */
function getIntervalName(firstNote, secondNote) {
  var intervalNotes = [firstNote, secondNote];

  // normalize to first octave in key of C (lowest note should be zero)
  var normalizedSemitones = normalizeToC(intervalNotes);

  // iterate through intervals to find a match and return the name
  for (var intervalName in intervals) {
    var currentInterval = intervals[intervalName];
    var semitoneDifference =
      currentInterval.semitones[1] - normalizedSemitones[1];

    if (semitoneDifference == 12) return "Octave";
    if (!semitoneDifference) return intervalName;
  }
}

/**
 * @function getChordName
 * @description Returns the name of the interval based on the provided notes.
 * @param {number} firstNote - The first note of the interval.
 * @param {number} secondNote - The second note of the interval.
 * @returns {string} The name of the interval.
 */
function getChordName(semitones) {
  var normalizedSemitones = normalizeToC(semitones);

  // iterate through intervals to find a match and return the name
  for (var chordName in chords) {
    var currentChord = chords[chordName];

    if (currentChord.semitones == normalizedSemitones) {
      return chordName;
    } else {
      return "";
    }
  }
}

/**
 * @function showInterval
 * @description Displays the interval on the Max patcher using comments / panels above the kslider objects.
 * @param {number} firstNote - The first note of the interval.
 * @param {number} secondNote - The second note of the interval.
 * @param {boolean} altColor - Whether to use an alternate color for the interval.
 */
function showInterval(firstNote, secondNote, altColor) {
  var d = new Dict("colors"); // import user colors
  d.import_json("colors.json");
  colors = JSON.parse(d.stringify());

  // get patcher objects to calculate display coordinates
  var kslider = this.patcher.getnamed("kslider[2]");
  var kslider_presentation_rect = kslider.getattr("presentation_rect");
  var intervalName = getIntervalName(firstNote, secondNote);

  var firstNoteComment = this.patcher.getnamed("comment_note_" + firstNote);
  var firstNotePresentationRect = firstNoteComment.getattr("presentation_rect");
  var firstNoteX = firstNotePresentationRect[0];

  var secondNoteComment = this.patcher.getnamed("comment_note_" + secondNote);
  var secondNotePresentationRect =
    secondNoteComment.getattr("presentation_rect");
  var secondNoteX = secondNotePresentationRect[0];

  // calculate display coordinates
  var startingXpos = firstNote < secondNote ? firstNoteX : secondNoteX;
  var ypos = kslider_presentation_rect[1] - 5;
  var panelWidth = Math.abs(firstNoteX - secondNoteX);
  var panelHeight = 2; // fixed
  var offsetX = 4;

  // render panel over interval
  var panel = this.patcher.newdefault(10, 10, "panel");
  panel.setattr("rounded", 0);
  panel.setattr("presentation", true);
  panel.setattr(
    "presentation_rect",
    startingXpos + offsetX,
    ypos,
    panelWidth + offsetX,
    panelHeight
  );
  // set color
  if (mode != "Single Interval") {
    if (altColor) {
      panel.setattr("bgfillcolor", colors.parserComment.default);
    } else {
      panel.setattr("bgfillcolor", colors.parserComment.alt);
    }
  }
  this.patcher.bringtofront(panel);

  // render comment over panel
  var comment = this.patcher.newdefault(
    startingXpos + offsetX,
    ypos - 15,
    "comment"
  );
  comment.setattr("presentation", true);
  // use full name for single interval or symbol for multiple
  if (mode == "Single Interval") {
    comment.message("set", intervalName);
  } else {
    comment.message("set", intervals[intervalName].symbol);
    comment.setattr(
      "presentation_rect",
      startingXpos + offsetX,
      ypos - 30,
      17,
      29
    );
    // set color
    if (altColor) {
      comment.setattr("textcolor", colors.parserComment.default);
    } else {
      comment.setattr("textcolor", colors.parserComment.alt);
    }
  }
  this.patcher.bringtofront(comment);

  // store interval object locally for later removal
  patcherIntervals.push({
    firstNote: firstNote,
    secondNote: secondNote,
    panel: panel,
    comment: comment,
  });
}

/**
 * @function removeInterval
 * @description Removes the interval from the Max patcher.
 * @param {Object} interval - The interval object containing panel and comment.
 */
function removeInterval(interval) {
  // remove patcher objects
  if (interval.panel) this.patcher.remove(interval.panel);
  if (interval.comment) this.patcher.remove(interval.comment);

  // remove interval object from patcherIntervals array
  patcherIntervals = patcherIntervals.filter(function (existingInterval) {
    return existingInterval != interval;
  });
}

/**
 * @function removeAllIntervals
 * @description Removes all intervals from the Max patcher.
 */
function removeAllIntervals() {
  patcherIntervals.forEach(function (interval) {
    removeInterval(interval);
  });
}
