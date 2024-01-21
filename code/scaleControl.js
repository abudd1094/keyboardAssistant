var {
  detectBlackKey,
  normalize,
  getScaleCountType,
  getIntervalSeq,
} = require("utilities");

// array of max comment objects used to display key signature
var trebleCommentObjects = [];
var bassCommentObjects = [];
var scaleNSliderObjects = [];

// used by handleKeyType to determine whether key type has changed
var lastKey = 0;

// EXT MAIN: receives list of semitones in a scale
function list() {
  var semitones = arrayfromargs(arguments);
  g = new Global("ref");

  reset();

  if (g.refMode == "Scale") {
    var normalizedSemitones = normalize(semitones);
    // define variables for comment positioning
    var viewport = this.patcher
      .getnamed("nslider[0]") // use leftmost nslider as reference
      .getattr("presentation_rect");

    var xInterval = 6; // pixels between comments
    var yInterval = 2.5;
    var xPos = viewport[0];
    var yPos = viewport[1];

    var width = 21; // lowest possible with font size 14
    var height = 22;
    var fontSize = 14;

    handleKeyType(normalizedSemitones);
    handleScaleCountType(normalizedSemitones);
    handleIntervalSeq(normalizedSemitones);

    var targetSemitones = getTargetSemitones(normalizedSemitones);
    var sortedSemitones = sortSemitones(targetSemitones);

    renderKeySignature(
      sortedSemitones,
      xPos,
      yPos,
      width,
      height,
      fontSize,
      g.useSharp,
      xInterval,
      yInterval
    );

    renderScaleNSliders(semitones);
  }
}

// MAIN: reset the patcher to its original state
function reset() {
  // reposition input n slider
  resetInputNslider();
  // remove all comments before rendering new ones
  removeAllComments();
  // hide secondary comments
  this.patcher.getnamed("refLabel[1][1]").message("hidden", 1);
  this.patcher.getnamed("refLabel[1][2]").message("hidden", 1);
  // remove scale nsliders
  removeScaleNSliders();
}

// HELPER: reset: original viewport is [171. 0. 150. 169.]
function resetInputNslider() {
  var nslider = this.patcher.getnamed("nslider[0]");

  nslider.setattr("presentation_rect", [171, 0, 150, 169]);
}

// HELPER: reset: removes all comment objects from the patcher
function removeAllComments() {
  for (var i = 0; i < trebleCommentObjects.length; i++) {
    this.patcher.remove(trebleCommentObjects[i]);
    this.patcher.remove(bassCommentObjects[i]);
  }

  trebleCommentObjects = [];
  bassCommentObjects = [];
}

// MAIN: renders all comments for the key signature
function renderKeySignature(
  semitones,
  xPos,
  yPos,
  width,
  height,
  fontSize,
  useSharp,
  xInterval,
  yInterval
) {
  // render comments for each sharp or flat in the key signature
  for (var i = 0; i < semitones.length; i++) {
    // bass clef
    renderComment(
      semitones[i],
      xPos,
      yPos,
      width,
      height,
      fontSize,
      useSharp,
      xInterval,
      yInterval,
      true
    );

    // treble clef
    renderComment(
      semitones[i],
      xPos,
      yPos,
      width,
      height,
      fontSize,
      useSharp,
      xInterval,
      yInterval,
      false
    );
  }
}

// HELPER: renderKeySignature: renders a comment object for a key signature
function renderComment(
  semitone,
  xPos,
  yPos,
  width,
  height,
  fontSize,
  useSharp,
  xInterval,
  yInterval,
  bassClef
) {
  // if fed black key, adjust to white key accordingly (down for sharps, up for flats)
  if (detectBlackKey(semitone)) {
    if (useSharp) {
      semitone -= 1;
    } else {
      semitone += 1;
    }
  }

  // determine offsets
  var clefOffset = 20;
  var xOffset = clefOffset + xInterval * trebleCommentObjects.length; // adjust x offset based on number of comments
  var yOffset = getKeySigYOffset(semitone % 12, useSharp, yInterval); // adjust y offset based on sharp or flat note

  if (bassClef) yOffset += 35; // adjust y offset for bass clef

  // move input nslider right to accommodate key signature width
  adjustInputNslider(xOffset);

  // render key signature comment
  var comment = this.patcher.newobject(
    "comment",
    xPos + xOffset,
    yPos + yOffset,
    width,
    height
  );
  comment.setattr(
    "varname",
    "keySig[1]_" + bassClef ? "bass_" : "treble_" + semitone
  );
  comment.setattr("fontsize", fontSize);
  comment.setattr("fontname", "Times New Roman");
  comment.setattr("presentation", 1);
  this.patcher.bringtofront(comment);

  // set comment text to sharp or flat symbol
  if (useSharp) {
    comment.message("set", "♯");
  } else {
    comment.message("set", "♭");
  }

  // add comment to array of comment objects for future manipulation
  if (bassClef) {
    bassCommentObjects.push(comment);
  } else {
    trebleCommentObjects.push(comment);
  }
}

// HELPER: renderComment: get the y offset for the key signature comment (based on traditional notation)
function getKeySigYOffset(normalizedNoteNo, useSharp, yInterval) {
  // slightly different y for centered key signature characters
  var lowestFlatY = useSharp ? 66.5 : 65.5;

  switch (normalizedNoteNo) {
    case 4: // E
      return lowestFlatY - yInterval * 6;
    case 2: // D
      return lowestFlatY - yInterval * 5;
    case 0: // C
      return lowestFlatY - yInterval * 4;
    case 11: // B
      return lowestFlatY - yInterval * 3;
    case 9: // A
      return lowestFlatY - yInterval * 2;
    // if using sharps, F and G move to top of staff
    case 7: // G (highest sharp)
      return useSharp ? lowestFlatY - yInterval * 8 : lowestFlatY - yInterval;
    case 5: // F (lowest flat)
      return useSharp ? lowestFlatY - yInterval * 7 : lowestFlatY;
    default:
      return 0;
  }
}

// HELPER: renderComment: adjust input n slider so that key signature fits on left side
function adjustInputNslider(xOffset) {
  var nslider = this.patcher.getnamed("nslider[0]");

  var newXpos = 171 + xOffset - 10;
  var newWidth = 150 - xOffset;

  nslider.setattr("presentation_rect", [newXpos, 0, newWidth, 169]);
}

// HELPER: list: returns semitones in the tradional order of sharps or flats
function sortSemitones(semitones) {
  // B♭, E♭, A♭, D♭, G♭, C♭, F♭
  var order = g.useSharp ? [5, 0, 7, 2, 9, 4, 11] : [11, 4, 9, 2, 7, 0, 5];

  var filteredSemitones = semitones.filter(function (s) {
    return order.indexOf(s) > -1;
  });

  return filteredSemitones.sort(function (a, b) {
    return order.indexOf(a % 12) - order.indexOf(b % 12);
  });
}

// HELPER: list: returns the semitones that should be altered in the key signature for the given key
function getTargetSemitones(semitones) {
  var whiteKeys = [0, 2, 4, 5, 7, 9, 11];
  var blackKeys = [1, 3, 6, 8, 10];
  var usedBlackKeys = [];
  var targetKeys = whiteKeys;

  for (var i = 0; i < semitones.length; i++) {
    var wIndex = whiteKeys.indexOf(semitones[i]);

    if (wIndex > -1) {
      whiteKeys.splice(wIndex, 1);
    }
  }

  // adjust for white keys that have white siblings
  var specialFlats = [0, 5]; // C, F
  var specialSharps = [4, 11]; // E, B
  var specialSemitones = g.useSharp ? specialSharps : specialFlats;

  for (var i = 0; i < specialSemitones.length; i++) {
    if (
      whiteKeys.indexOf(specialSemitones[i]) > -1 &&
      whiteKeys.indexOf(specialSemitones[i] + 1) == -1
    ) {
      targetKeys.push((specialSemitones[i] + 1) % 12);
    }
  }

  return targetKeys.sort();
}

// MAIN: adjust the key type (sharp or flat) based on the first semitone in the scale
function handleKeyType(semitones) {
  var firstSemitone = semitones[0];

  if (firstSemitone != lastKey) {
    var traditionalKey = getTraditionalKey(semitones[0]);

    // if key can be notated in sharps or flats, leave unchanged, otherwise adjust
    if (traditionalKey != 2) {
      setKeyType(traditionalKey);
    }
  }

  lastKey = firstSemitone;
}

// HELPER: handleKeyType: adjust the key type globally and on the panel (sharp or flat)
function setKeyType(keyType) {
  var keyTypeTab = this.patcher.getnamed("key_type[1]");
  keyTypeTab.message("set", keyType);
  g.useSharp = keyType;
  return keyType;
}

// HELPER: handleKeyType: checks whether key is traditionally noted with sharps or flats
function getTraditionalKey(firstSemitone) {
  sharpKeys = [0, 7, 2, 9, 4, 11, 6, 1];
  flatKeys = [0, 5, 10, 3, 8, 1, 6, 11];

  var isSharpKey = sharpKeys.indexOf(firstSemitone) > -1;
  var isFlatKey = flatKeys.indexOf(firstSemitone) > -1;

  if (isSharpKey && isFlatKey) {
    return 2;
  }

  if (isFlatKey) {
    return 0;
  }

  if (isSharpKey) {
    return 1;
  }
}

// HELPER: list: fetch and output the scale count type (diatonic, pentatonic, etc.)
function handleScaleCountType(semitones) {
  var scaleCountTypeComment = this.patcher.getnamed("refLabel[1][1]");
  scaleCountTypeComment.message("hidden", 0);
  var scaleCountType = getScaleCountType(semitones);
  scaleCountTypeComment.message("set", scaleCountType);
}

// HELPER: list:
function handleIntervalSeq(semitones) {
  var intervalSeqComment = this.patcher.getnamed("refLabel[1][2]");
  intervalSeqComment.message("hidden", 0);
  var intervalSeq = getIntervalSeq(semitones);

  intervalSeqComment.message("set", intervalSeq);
}

function renderScaleNSliders(semitones) {
  var viewport = this.patcher
    .getnamed("nslider[1]") // use ref nslider as base
    .getattr("presentation_rect");

  var xPos = viewport[0];
  var yPos = viewport[1];

  var width = viewport[2] / 11; // divide width by highest possible number of semitones (chromatic scale: 11)
  var height = viewport[3]; // match height of ref nslider 

  for (var i = 0; i < semitones.length; i++) {
    renderNslider(semitones[i], xPos, yPos, width, height);
    xPos += width;
  }

  // render last first note of next octave
  renderNslider(semitones[0] + 12, xPos, yPos, width, height);
}

function removeScaleNSliders() {
  if (scaleNSliderObjects.length > 0) {
    for (var i = 0; i < scaleNSliderObjects.length; i++) {
      this.patcher.remove(scaleNSliderObjects[i]);
    }
  }
}

function renderNslider(semitone, xPos, yPos, width, height) {
  var g = new Global("ref");

  var nSlider = this.patcher.newdefault(
    0,
    0,
    "nslider"
  );
  nSlider.setattr("presentation", 1);

  nSlider.setattr("presentation_rect", xPos, yPos, 50, height);
  nSlider.setattr("clefs", 0);
  nSlider.setattr("staffs", 0);
  nSlider.setattr("ignoreclick", 1);
  nSlider.setattr("bgcolor", 0.200, 0.200, 0.200, 0.000);
  nSlider.setattr("fgcolor", 0.000, 0.000, 0.000, 1.000);
  nSlider.message(g.useSharp ? semitone : 0 - semitone);

  this.patcher.bringtofront(nSlider);

  scaleNSliderObjects.push(nSlider);
}
