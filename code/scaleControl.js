var { detectBlackKey, normalize, getScaleCountType } = require("utilities");

// array of max comment objects used to display key signature
var trebleCommentObjects = [];
var bassCommentObjects = [];

var lastKey = 0;

function reset() {
  // remove all comments before rendering new ones
  removeAllComments();
  // reposition input n slider
  resetInputNslider();
  // hide secondary comments
  this.patcher.getnamed("refLabel[1][1]").message("hidden", 1);
}

// receives list of semitones in a scale
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
  }
}

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

// renders a comment object for a key signature
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

// removes all comment objects from the patcher
function removeAllComments() {
  for (var i = 0; i < trebleCommentObjects.length; i++) {
    this.patcher.remove(trebleCommentObjects[i]);
    this.patcher.remove(bassCommentObjects[i]);
  }

  trebleCommentObjects = [];
  bassCommentObjects = [];
}

// get the y offset for the key signature comment (based on traditional notation)
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

// returns semitones in the tradional order of sharps or flats
function sortSemitones(semitones) {
  // B♭, E♭, A♭, D♭, G♭, C♭, F♭
  var order = g.useSharp ? [5, 0, 7, 2, 9, 4, 11] : [11, 4, 9, 2, 7, 0, 5];

  var filteredSemitones = semitones
    .filter(function (s) {
      return order.indexOf(s) > -1;
    });

  return filteredSemitones.sort(function (a, b) {
    return order.indexOf(a % 12) - order.indexOf(b % 12);
  });
}

// adjust input n slider so that key signature fits on left side
function adjustInputNslider(xOffset) {
  var nslider = this.patcher.getnamed("nslider[0]");

  var newXpos = xOffset - 10;
  var newWidth = 150 - xOffset;

  nslider.setattr("presentation_rect", [newXpos, 0, newWidth, 169]);
}

// original viewport is [0, 0, 150, 169]
function resetInputNslider() {
  var nslider = this.patcher.getnamed("nslider[0]");

  nslider.setattr("presentation_rect", [0, 0, 150, 169]);
}

// checks whether key is traditionally noted with sharps or flats
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

// returns the semitones that should be altered in the key signature for the given key
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
    if (whiteKeys.indexOf(specialSemitones[i]) > -1 && whiteKeys.indexOf(specialSemitones[i] + 1) == -1) {
      targetKeys.push((specialSemitones[i] + 1) % 12);
    }
  }

  return targetKeys.sort();
}

// adjust the key type globally and on the panel (sharp or flat)
function setKeyType(keyType) {
  
  var keyTypeTab = this.patcher.getnamed("key_type[1]");
  keyTypeTab.message("set", keyType);
  g.useSharp = keyType;
  return keyType;
}

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

function handleScaleCountType(semitones) {
  var scaleCountTypeComment = this.patcher.getnamed("refLabel[1][1]");
  scaleCountTypeComment.message("hidden", 0);
  var scaleCountType = getScaleCountType(semitones);
  scaleCountTypeComment.message("set", scaleCountType);
}