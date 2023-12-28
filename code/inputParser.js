inlets = 1;
setinletassist(0, "\n Input");
outlets = 1;
setoutletassist(0, "\n 0: Output");

var { hideNote, showNote } = require("interfaceControl");

// holds predefined chord data objects
var chords;
// holds predefined interval data objects
var intervals;
// holds integers representing notes
var notes = [];
// holds objects with patcher panel / comment objects:
// { firstNote: firstNote, secondNote: secondNote, panel: panel, comment: comment }
var patcherIntervals = [];
// "Off" | "Note" | "Single Interval" | "Multi Interval" | "Chord"
var mode = "Off";
// colors used for interval panels and comments
var color1 = [0.0, 0.886, 1.0, 1.0]; // light blue
var color2 = [0.992, 1.0, 0.0, 1.0]; // yellow

function loadbang() {
  // if no intervals exist for reference, import them
  if (!intervals) importIntervals();
}

function importChords() {
  var d = new Dict("tempChords"); // import to temporary dictionary
  d.import_json("factory_chords.json");

  intervals = JSON.parse(d.stringify());
  post("Imported intervals \n");
}

function importIntervals() {
  var d = new Dict("tempIntervals"); // import to temporary dictionary
  d.import_json("factory_intervals.json");

  intervals = JSON.parse(d.stringify());
  post("Imported intervals \n");
}

function setMode(v) {
  mode = v;
}

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
    default:
      break;
  }
}

function handleSingleInterval() {
  removeAllIntervals();

  // detect and show last interval if more than one note
  if (notes.length > 1) {
    showInterval(notes[notes.length - 2], notes[notes.length - 1]);
  }
}

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

function localizeNote(noteVeloPair) {
  var note = noteVeloPair[0];
  // check for both positive and negative (positive is sharp, negative is flat, but they represent the same note and should be treated as one)
  var absNote = Math.abs(note);
  var velocity = noteVeloPair[1];

  // add note if it is new
  if (
    (notes.indexOf(absNote) == -1 || notes.indexOf(note) == -1) &&
    velocity > 0
  ) {
    notes.push(note);
    showNote(note);
  }

  // remove note if it is old
  if (
    (notes.indexOf(absNote) != -1 || notes.indexOf(note) != -1) &&
    velocity == 0
  ) {
    notes = notes.filter(function (existingNote) {
      if (existingNote == absNote) {
        hideNote(absNote);
      }
      if (existingNote == note) {
        hideNote(note);
      }
      return existingNote != note;
    });
  }
}

function showInterval(firstNote, secondNote, altColor) {
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
      panel.setattr("bgfillcolor", color1);
    } else {
      panel.setattr("bgfillcolor", color2);
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
      comment.setattr("textcolor", color1);
    } else {
      comment.setattr("textcolor", color2);
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

// returns interval name
function getIntervalName(firstNote, secondNote) {
  var intervalNotes = [firstNote, secondNote];

  // normalize to first octave in key of C (lowest note should be zero)
  var normalizedSemitones = intervalNotes.map(function (semitone) {
    return semitone - intervalNotes[0];
  });

  // normalize to the same octave if more than one octave difference
  normalizedSemitones = normalizedSemitones.map(function (semitone) {
    return semitone % 12;
  });

  // iterate through intervals to find a match and return the name
  for (var intervalName in intervals) {
    var currentInterval = intervals[intervalName];
    var semitoneDifference =
      currentInterval.semitones[1] - normalizedSemitones[1];

    if (semitoneDifference == 12) return "Octave";
    if (!semitoneDifference) return intervalName;
  }
}

function removeInterval(interval) {
  // remove patcher objects
  if (interval.panel) this.patcher.remove(interval.panel);
  if (interval.comment) this.patcher.remove(interval.comment);

  // remove interval object from patcherIntervals array
  patcherIntervals = patcherIntervals.filter(function (existingInterval) {
    return existingInterval != interval;
  });
}

function removeAllIntervals() {
  patcherIntervals.forEach(function (interval) {
    removeInterval(interval);
  });
}
