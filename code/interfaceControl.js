/**
 * @file interfaceControl.js
 * @description Handles the rendering and removal of UI consisting of comment objects that overlay keys on the kslider object.
 */

inlets = 1;
setinletassist(0, "\n Input");
outlets = 1;
setoutletassist(0, "\n 0: Output");

var { parseNoteName, detectBlackKey } = require("utilities");

// MAX FUNCTIONS
/**
 * @function loadbang
 * @description Loads the interface when the Max patcher is loaded, rendering it with flats by default.
 */
function loadbang() {
  renderInterface();
}

// MAIN FUNCTIONS
/**
 * @function renderInterface
 * @description Renders all interface comments to the patcher.
 */
function renderInterface() {
  interface = {};
  var whiteKeyCount = 52;

  var kslider_2 = this.patcher.getnamed("kslider[2]");
  var kslider_presentation_rect = kslider_2.getattr("presentation_rect");
  var firstVisibleNote = kslider_2.getattr("offset");
  var lastVisibleNote = firstVisibleNote + kslider_2.getattr("range");

  var xpos = kslider_presentation_rect[0];
  var ypos = kslider_presentation_rect[1];
  var width = kslider_presentation_rect[2];
  var height = kslider_presentation_rect[3];

  var whiteKeyWidth = Math.round(width / whiteKeyCount);
  var blackKeyWidth = (whiteKeyWidth * 2) / 3;

  for (
    var currentNote = firstVisibleNote;
    currentNote < lastVisibleNote - 1;
    currentNote++
  ) {
    var distanceToNextNote = getDistanceToNextNote(
      currentNote,
      blackKeyWidth,
      whiteKeyWidth
    );
    var commentYpos = detectBlackKey(currentNote)
      ? ypos + height / 2 - 32
      : ypos + height - 25;
    var isBlackKey = detectBlackKey(currentNote);
    var commentXpos = isBlackKey ? xpos : xpos + 3;
    renderComment(currentNote, commentXpos, commentYpos, whiteKeyWidth, height);

    // render a flat label in addition to sharp label if key is black
    if (isBlackKey) { renderComment(-1 * currentNote, commentXpos, commentYpos, whiteKeyWidth, height); }

    xpos += distanceToNextNote;
  }

  post("Rendered interface \n");
}

/**
 * @function removeInterface
 * @description Removes all interface comments from the Max patcher.
 */
function removeInterface() {
  var kslider_2 = this.patcher.getnamed("kslider[2]");
  var firstVisibleNote = kslider_2.getattr("offset");
  var lastVisibleNote = firstVisibleNote + kslider_2.getattr("range");

  for (
    var currentNote = firstVisibleNote;
    currentNote < lastVisibleNote - 1;
    currentNote++
  ) {
    var isBlackKey = detectBlackKey(currentNote);

    removeComment("comment_note_" + currentNote);

    if (isBlackKey) { removeComment("comment_note_" + -1 * currentNote); }
  }

  post("Removed interface \n");
}

/**
 * @function showNote
 * @description Displays a note by unhiding the corresponding comment box.
 * @param {number} note - The MIDI note value to be displayed.
 */
function showNote(note) {
  var comment = this.patcher.getnamed("comment_note_" + note);
  comment.setattr("hidden", false);
}

/**
 * @function hideNote
 * @description Hides a note by hiding the corresponding comment box.
 * @param {number} note - The MIDI note value to be hidden.
 */
function hideNote(note) {
  var comment = this.patcher.getnamed("comment_note_" + note);
  comment.setattr("hidden", true);
}

// HELPER FUNCTIONS
/**
 * @function renderComment
 * @description Renders a comment box for a given note.
 * @param {number} note - The MIDI note value.
 * @param {number} xpos - The x-coordinate of the comment box.
 * @param {number} ypos - The y-coordinate of the comment box.
 * @param {number} width - The width of the comment box.
 * @param {number} height - The height of the comment box.
 */
function renderComment(note, xpos, ypos, width, height) {
  var existingCommentName = "comment_note_" + note;
  // remove pre-existing comment if any
  if (this.patcher.getnamed(existingCommentName)) {
    removeComment(existingCommentName);
  }

  var comment = this.patcher.newobject("comment", xpos, ypos, width, height);
  comment.setattr("varname", "comment_note_" + note);
  comment.setattr("fontsize", 9.5);
  comment.setattr("presentation", 1);
  var noteName = parseNoteName(note, true);
  comment.message("set", noteName);
  comment.setattr("textcolor", 1, 0, 0, 1);
  comment.setattr("hidden", true);
  this.patcher.bringtofront(comment);
}

/**
 * @function removeComment
 * @description Removes a comment box with the specified name.
 * @param {string} commentName - The name of the comment box to be removed.
 */
function removeComment(commentName) {
  var comment = this.patcher.getnamed(commentName);
  this.patcher.remove(comment);
}

/**
 * @function getDistanceToNextNote
 * @description Calculates the distance to the next note based on the note's MIDI value.
 * @param {number} note - The MIDI note value.
 * @param {number} blackKeyWidth - The width of a black key.
 * @param {number} whiteKeyWidth - The width of a white key.
 * @returns {number} The distance to the next note.
 */
function getDistanceToNextNote(note, blackKeyWidth, whiteKeyWidth) {
  switch (note % 12) {
    case 0:
    case 2:
    case 5:
    case 7:
    case 9:
      return blackKeyWidth;
    case 1:
    case 3:
    case 6:
    case 8:
    case 10:
      return blackKeyWidth / 2;
    case 4:
    case 11:
      return whiteKeyWidth;
  }
}

// EXPORTS
exports.showNote = showNote;
exports.hideNote = hideNote;
