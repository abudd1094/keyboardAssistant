var { detectBlackKey } = require("utilities");

var sharps = [];
var flats = [];

function list() {
  var semitones = arrayfromargs(arguments);
  g = new Global("ref");

  if (g.refMode == "Scale") {
    error("scaleControl semitones" + "\n");
    post(JSON.stringify(semitones) + "\n");

    var viewport = this.patcher
      .getnamed("nslider[0]")
      .getattr("presentation_rect");
    post(viewport + "\n");
  }
}

function t(noteNo) {
  // TEST TEMP: done above, get the nslider viewport to calculate intial offsets
  var viewport = this.patcher
    .getnamed("nslider[0]")
    .getattr("presentation_rect");

  error("TEST" + "\n");
  post(viewport + "\n");

  var useSharp = true;

  // define variables for comment positioning
  var yInterval = 2.5; // pixels between notes

  var xPos = viewport[0];
  var yPos = viewport[1];

  var xOffset = 20;
  var yOffset = getKeySigYOffset(noteNo % 12, useSharp, yInterval);

  var width = 21; // lowest possible with font size 14
  var height = 22;

  var fontSize = 14;

  renderComment(
    xPos,
    yPos,
    xOffset,
    yOffset,
    width,
    height,
    fontSize,
    useSharp
  );
}

function renderComment(
  xPos,
  yPos,
  xOffset,
  yOffset,
  width,
  height,
  fontSize,
  useSharp
) {
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
