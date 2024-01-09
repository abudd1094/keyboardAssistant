var { detectBlackKey, getBlackKeys, getWhiteKeys } = require("utilities");

// array of max comment objects used to display key signature
var commentObjects = [];

function list() {
  var semitones = arrayfromargs(arguments);
  var viewport = this.patcher
    .getnamed("nslider[0]")
    .getattr("presentation_rect");

  g = new Global("ref");

  // define variables for comment positioning
  var xInterval = 7; // pixels between comments
  var yInterval = 2.5;
  var xPos = viewport[0];
  var yPos = viewport[1];

  var width = 21; // lowest possible with font size 14
  var height = 22;
  var fontSize = 14;

  if (g.refMode == "Scale") {
    var viewport = this.patcher
      .getnamed("nslider[0]")
      .getattr("presentation_rect");

    var blackKeys = getBlackKeys(semitones, true); // true arg normalizes returned semitones to 0-11 range: ;
    var sortedBlackKeys = sortBlackSemitones(g.useSharp, blackKeys);

    removeAllComments();

    // render comments for each black key in the key signature
    for (var i = 0; i < sortedBlackKeys.length; i++) {
      renderComment(
        sortedBlackKeys[i],
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
}

function renderComment(
  semitone,
  xPos,
  yPos,
  width,
  height,
  fontSize,
  useSharp,
  xInterval,
  yInterval
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
  var xOffset = 20 + xInterval * commentObjects.length; // adjust x offset based on number of comments
  var yOffset = getKeySigYOffset(semitone % 12, useSharp, yInterval); // adjust y offset based on sharp or flat note

  // render key signature comment
  var comment = this.patcher.newobject(
    "comment",
    xPos + xOffset,
    yPos + yOffset,
    width,
    height
  );
  // comment.setattr("varname", "keySig[1]_" + note);
  comment.setattr("fontsize", fontSize);
  comment.setattr("fontname", "Times New Roman");
  comment.setattr("presentation", 1);

  if (useSharp) {
    comment.message("set", "♯");
  } else {
    comment.message("set", "♭");
  }

  this.patcher.bringtofront(comment);
  commentObjects.push(comment);
}

function removeAllComments() {
  for (var i = 0; i < commentObjects.length; i++) {
    this.patcher.remove(commentObjects[i]);
  }

  commentObjects = [];
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

// returns black key semitones in the tradional order of sharps or flats
function sortBlackSemitones(useSharp, blackKeys) {
  var sortedBlackKeys = blackKeys.slice();

  // Sorting logic for sharp order
  if (useSharp) {
    var sharpOrder = [6, 1, 8, 3, 11, 5]; // BEADGCF
    sortedBlackKeys.sort(function (a, b) {
      return sharpOrder.indexOf(a % 12) - sharpOrder.indexOf(b % 12);
    });
  } else {
    // Sorting logic for flat order
    var flatOrder = [5, 11, 3, 8, 1, 6]; // FCGDAEB
    sortedBlackKeys.sort(function (a, b) {
      return flatOrder.indexOf(a % 12) - flatOrder.indexOf(b % 12);
    });
  }

  return sortedBlackKeys;
}
