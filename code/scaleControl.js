/**
 * @file scaleControl.js
 * @description Handles the rendering of key signatures and scale-mode-specific controls in a Max for Live device.
 */

var {
  detectBlackKey,
  normalize,
  getScaleCountType,
  getIntervalSeq,
  getAllMaxclass,
} = require("utilities");

// used by handleKeyType to determine whether key type has changed
var lastKey = 0;

// MAIN FUNCTIONS
/**
 * @function list
 * @description Receives a list of semitones in a scale and renders key signatures and an additional nslider for each note.
 */
function list() {
  var semitones = arrayfromargs(arguments);

  g = new Global("ref");

  reset(); // reset patcher to original state

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

    var scaleCountType = getScaleCountType(normalizedSemitones); // get scale count type
    var intervalSeq = getIntervalSeq(semitones); // get sequence of intervals in scale in one of two formats (Whole Half tones or Interval names)
    var isDiatonic = intervalSeq == "2 - 2 - 1 - 2 - 2 - 2"; // check if interval sequence is diatonic

    var targetSemitones = getTargetSemitones(normalizedSemitones); // get semitones to be altered in key signature

    if (isDiatonic) {
      scaleCountType = "Diatonic"; // if interval sequence is diatonic, adjust scale count type to reflect this
      var sortedSemitones = getDiatonicKeySignature(normalizedSemitones[0]); // get diatonic key signature semitones

      renderKeySignature(
        // render key signature comments
        sortedSemitones,
        xPos,
        yPos,
        width,
        height,
        fontSize,
        g.useSharp,
        xInterval,
        yInterval,
        "nslider[bg]" // render main key signature to the background nslider
      );
    }

    handleKeyType(normalizedSemitones); // adjust key type tabs object if necessary

    renderScaleNSliders("nslider[1]", semitones); // render scale nsliders

    outputRefLabel(scaleCountType, 1); // output scale count type to ref label 1

    var accidentalType = g.useSharp
      ? targetSemitones.length == 1
        ? " sharp"
        : " sharps"
      : targetSemitones.length == 1
      ? " flat"
      : " flats";
    var blackKeyCount = String(targetSemitones.length) + accidentalType;

    outputRefLabel(blackKeyCount, 2); // output black key count to ref label 2
    outputRefLabel(intervalSeq, 3); // output interval sequence to ref label 3
  }
}

/**
 * @function reset
 * @description Resets the patcher to its original state.
 */
function reset() {
  // reposition input n slider
  resetInputNslider();
  // remove all comments before rendering new ones
  removeAllComments();
  // hide secondary comments
  this.patcher.getnamed("refLabel[1][1]").message("hidden", 1);
  this.patcher.getnamed("refLabel[1][2]").message("hidden", 1);
  this.patcher.getnamed("refLabel[1][3]").message("hidden", 1);
  // remove scale nsliders
  removeScaleNSliders();
}

/**
 * @function renderKeySignature
 * @description Renders all comments for the key signature.
 * @param {number[]} semitones - The semitones to be rendered in the key signature.
 * @param {number} xPos - The x-position of the key signature.
 * @param {number} yPos - The y-position of the key signature.
 * @param {number} width - The width of the comment box.
 * @param {number} height - The height of the comment box.
 * @param {number} fontSize - The font size of the comment box.
 * @param {boolean} useSharp - Whether to use sharp notation.
 * @param {number} xInterval - The horizontal interval between comments.
 * @param {number} yInterval - The vertical interval between comments.
 */
function renderKeySignature(
  semitones,
  xPos,
  yPos,
  width,
  height,
  fontSize,
  useSharp,
  xInterval,
  yInterval,
  nSliderScriptingName
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
      true,
      nSliderScriptingName
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
      false,
      nSliderScriptingName
    );
  }
}

/**
 * @function renderScaleNSliders
 * @description Renders the scale nsliders based on the given semitones.
 * @param {number[]} semitones - The list of semitones in a scale.
 */
function renderScaleNSliders(nSliderScriptingName, semitones) {
  var viewport = this.patcher
    .getnamed(nSliderScriptingName) // use ref nslider as base
    .getattr("presentation_rect");

  var xPos = viewport[0];
  var yPos = viewport[1];

  var width = viewport[2] / 11; // divide width by highest possible number of semitones (chromatic scale: 11)
  var height = viewport[3]; // match height of ref nslider

  for (var i = 0; i < semitones.length; i++) {
    renderNslider(
      semitones[i],
      xPos,
      yPos,
      width,
      height,
      nSliderScriptingName + "[" + i + "]"
    );
    xPos += width;
  }

  // render last first note of next octave
  renderNslider(
    semitones[0] + 12,
    xPos,
    yPos,
    width,
    height,
    nSliderScriptingName + "[firstNoteOfNextOctave]"
  );
}

/**
 * @function renderSupplementalScale
 * @description
 * @param {number[]} semitones -
 */
function renderSupplementalScale(semitones) {}

// HELPER FUNCTIONS
/**
 * @function renderNslider
 * @description Renders an nslider for a given semitone and position.
 * @param {number} semitone - The semitone value.
 * @param {number} xPos - The x-position of the nslider.
 * @param {number} yPos - The y-position of the nslider.
 * @param {number} width - The width of the nslider.
 * @param {number} height - The height of the nslider.
 */
function renderNslider(semitone, xPos, yPos, width, height, varname) {
  width = width > 50 ? Math.floor(width) : 50; // adjust width to display note, 50 is the minimum width for a visible note (left hand clef margin is always present)
  var g = new Global("ref");

  var nSlider = this.patcher.newdefault(0, 0, "nslider");
  nSlider.setattr("varname", varname);
  nSlider.setattr("presentation", 1);
  nSlider.setattr("presentation_rect", xPos, yPos, 50, height);
  nSlider.setattr("clefs", 0);
  nSlider.setattr("staffs", 0);
  nSlider.setattr("ignoreclick", 1);
  nSlider.setattr("bgcolor", 0.2, 0.2, 0.2, 0.0);

  var d = new Dict("colors"); // import user colors
  d.import_json("colors.json");
  colors = JSON.parse(d.stringify());

  detectBlackKey(semitone % 12)
    ? nSlider.setattr("fgcolor", colors.nslider.blackKey)
    : nSlider.setattr("fgcolor", colors.nslider.default);
  nSlider.message(g.useSharp ? semitone : 0 - semitone);

  this.patcher.bringtofront(nSlider);
}

/**
 * @function renderComment
 * @description Renders a comment object for a key signature.
 * @param {number} semitone - The MIDI note value of the key signature.
 * @param {number} xPos - The x-coordinate of the comment box.
 * @param {number} yPos - The y-coordinate of the comment box.
 * @param {number} width - The width of the comment box.
 * @param {number} height - The height of the comment box.
 * @param {number} fontSize - The font size of the comment box.
 * @param {boolean} useSharp - Whether to use sharp notation.
 * @param {number} xInterval - The horizontal interval between comments.
 * @param {number} yInterval - The vertical interval between comments.
 * @param {boolean} bassClef - Whether the comment is for bass clef.
 */
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
  bassClef,
  nSliderScriptingName
) {
  // if fed black key, adjust to relative white key accordingly (down for sharps, up for flats)
  if (detectBlackKey(semitone)) {
    if (useSharp) {
      semitone -= 1;
    } else {
      semitone += 1;
    }
  }

  // determine offsets
  var clefOffset = 20;
  var xOffset = clefOffset + xInterval * getKeySigCleffCount(nSliderScriptingName, "treble"); // adjust x offset based on number of comments
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
  var bassOrTreble = bassClef ? "[bass]" : "[treble]";
  var commentVarname = nSliderScriptingName + bassOrTreble + "[" + semitone + "]";
  comment.setattr("varname", commentVarname);
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
}

/**
 * @function removeScaleNSliders
 * @description Removes all the temporary scale nsliders from the patcher.
 */
function removeScaleNSliders() {
  var nsliders = getAllMaxclass("nslider");
  var tempNsliders = nsliders.filter(function (nslider) { return nslider.varname != "nslider[bg]" && nslider.varname != "nslider[0]" && nslider.varname != "nslider[1]" });

  if (tempNsliders.length > 0) {
    for (var i = 0; i < tempNsliders.length; i++) {
      this.patcher.remove(tempNsliders[i]);
    }
  }
}

/**
 * @function removeAllComments
 * @description Removes all comment objects from the patcher.
 */
function removeAllComments() {
  var comments = getAllMaxclass("comment");
  var keySigComments = comments.filter(function (comment) { return comment.varname.indexOf("nslider") != -1; });

  for (var i = 0; i < keySigComments.length; i++) {
    this.patcher.remove(keySigComments[i]);
  }
}

/**
 * @function removeAllComments
 * @description Removes all comment objects from the patcher.
 * @param {string} nSliderScriptingName - The associated nslider scripting name.
 * @param {string} cleff - The target cleff of the key signature.
 * @returns {number} Number of rendered comments in the target key signature (used to calculate x offset).
 */
function getKeySigCleffCount(nSliderScriptingName, cleff) {
  var comments = getAllMaxclass("comment");
  var keySigComments = comments.filter(function (comment) { return comment.varname.indexOf(nSliderScriptingName) != -1 && comment.varname.indexOf(cleff) != -1; });

  return keySigComments.length;
}

/**
 * @function resetInputNslider
 * @description Resets the input n slider to its original position. Original viewport is [171. 0. 150. 169.]
 */
function resetInputNslider() {
  var nslider = this.patcher.getnamed("nslider[0]");

  nslider.setattr("presentation_rect", [171, 0, 150, 169]);
  nslider.message("clear"); // TODO: do we need to clear to prevent bug when using pedal / input to alter root?
}

/**
 * @function getKeySigYOffset
 * @description Gets the y offset for the key signature comment (based on traditional notation).
 * @param {number} normalizedNoteNo - The normalized note number.
 * @param {boolean} useSharp - Whether to use sharp notation.
 * @param {number} yInterval - The vertical interval between comments.
 * @returns {number} The y offset for the key signature comment.
 */
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

/**
 * @function adjustInputNslider
 * @description Adjusts the input n slider so that the key signature fits on the left side.
 * @param {number} xOffset - The x offset to adjust the input n slider.
 */
function adjustInputNslider(xOffset) {
  var nslider = this.patcher.getnamed("nslider[0]");

  var newXpos = 171 + xOffset - 10;
  var newWidth = 150 - xOffset;

  nslider.setattr("presentation_rect", [newXpos, 0, newWidth, 169]);
}

/**
 * @function getDiatonicKeySignature
 * @description Returns the key signature for a diatonic scale starting with the given first semitone.
 * @param {number} firstSemitone - The first semitone of the scale.
 * @returns {number[]} The key signature for the diatonic scale.
 */
function getDiatonicKeySignature(firstSemitone) {
  if (g.useSharp) {
    // Sharp Keys: C, G, D, A, E, B, F#, C#
    // Signature notation order: F#, C#, G#, D#, A#, E#, B#
    switch (firstSemitone) {
      case 0: // C
        return [];
      case 7: // G
        return [5];
      case 2: // D
        return [5, 0];
      case 9: // A
        return [5, 0, 7];
      case 4: // E
        return [5, 0, 7, 2];
      case 11: // B
        return [5, 0, 7, 2, 9];
      case 6: // F#
        return [5, 0, 7, 2, 9, 4];
      case 1: // C#
        return [5, 0, 7, 2, 9, 4, 11];
      default:
        return [];
    }
  } else {
    // Flat Keys: C, F, B♭, E♭, A♭, D♭, G♭, C♭
    // Signature notation order: B♭, E♭, A♭, D♭, G♭, C♭, F♭
    switch (firstSemitone) {
      case 0: // C
        return [];
      case 5: // F
        return [11];
      case 10: // B♭
        return [11, 4];
      case 3: // E♭
        return [11, 4, 9];
      case 8: // A♭
        return [11, 4, 9, 2];
      case 1: // D♭
        return [11, 4, 9, 2, 7];
      case 6: // G♭
        return [11, 4, 9, 2, 7, 0];
      case 11: // C♭
        return [11, 4, 9, 2, 7, 0, 5];
      default:
        return [];
    }
  }
}

/**
 * @function handleKeyType
 * @description Adjusts the key type (sharp or flat) based on the first semitone in the scale.
 * @param {number[]} semitones - The semitones of the scale.
 */
function handleKeyType(semitones) {
  var firstSemitone = semitones[0];

  if (firstSemitone != lastKey) {
    var traditionalKey = getTraditionalKey(semitones[0]);

    setKeyType(traditionalKey);
  }

  lastKey = firstSemitone;
}

/**
 * @function setKeyType
 * @description Adjusts the key type globally and on the panel (sharp or flat).
 * @param {number} keyType - The key type (0 for flat, 1 for sharp).
 * @returns {number} The adjusted key type.
 */
function setKeyType(keyType) {
  var keyTypeTab = this.patcher.getnamed("key_type[1]");
  keyTypeTab.message(keyType);
  g.useSharp = keyType;
  return keyType;
}

/**
 * @function getTraditionalKey
 * @description Checks whether the key is traditionally noted with sharps or flats.
 * @param {number} firstSemitone - The first semitone of the scale.
 * @returns {number} The traditional key type (0 for flat, 1 for sharp).
 */
function getTraditionalKey(firstSemitone) {
  sharpKeys = [0, 7, 2, 9, 4, 11];
  flatKeys = [5, 10, 3, 8, 1, 6];

  var isSharpKey = sharpKeys.indexOf(firstSemitone) > -1;
  var isFlatKey = flatKeys.indexOf(firstSemitone) > -1;

  if (isFlatKey) {
    return 0;
  }

  if (isSharpKey) {
    return 1;
  }
}

/**
 * @function outputRefLabel
 * @description Outputs string to numbered reference label on patcher.
 * @param {string} message - The text to be set on the reference label.
 * @param {number} labelNo - The label number (1-3) where the text should be shown.
 */
function outputRefLabel(message, labelNo) {
  var labelName = "refLabel[1][" + labelNo + "]";
  var comment = this.patcher.getnamed(labelName);

  comment.message("hidden", 0);
  comment.message("set", message);
}

/**
 * @function getTargetSemitones
 * @description Returns the semitones that should be altered in the key signature for the given key.
 * @param {number[]} semitones - The semitones of the key signature.
 * @returns {number[]} The target semitones to be altered.
 */
function getTargetSemitones(semitones) {
  var whiteKeys = [0, 2, 4, 5, 7, 9, 11];
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

/**
 * @function sortSemitones
 * @description Returns semitones in the traditional order of sharps or flats.
 * @param {number[]} semitones - The semitones to be sorted.
 * @returns {number[]} The sorted semitones.
 */
function sortSemitones(semitones) {
  // F#, C#, G#, D#, A#, E#, B# (sharps order) : B♭, E♭, A♭, D♭, G♭, C♭, F♭ (flats order)
  var order = g.useSharp ? [5, 0, 7, 2, 9, 4, 11] : [11, 4, 9, 2, 7, 0, 5];

  var filteredSemitones = semitones.filter(function (s) {
    return order.indexOf(s) > -1;
  });

  return filteredSemitones.sort(function (a, b) {
    return order.indexOf(a % 12) - order.indexOf(b % 12);
  });
}
