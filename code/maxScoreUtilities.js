var { getBlackKeyCount } = require("utilities");
// LOCAL VARIABLES
/* 
    Store references to all rendered MaxScore objects.
    Format: [{ scoreNo, maxScoreMessage, maxScore, maxScoreBcanvas }]
*/
var maxScores = [];

// GETTERS
function getMaxScores() {
  return maxScores;
}

// COMPOSED RENDER FUNCTIONS
function renderScale(maxScoreMessage, semitonesArr) {
  for (var i = 0; i < semitonesArr.length; i++) {
    messageMaxScore(maxScoreMessage, [
      // dur, pitch, vel, hold
      "addNote",
      1,
      semitonesArr[i],
      0.5,
      0.8,
    ]);

    var blackKeyCount = getBlackKeyCount(semitonesArr);
    messageMaxScore(maxScoreMessage, [
      "setKeySignature",
      0,
      0,
      blackKeyCount,
      "SHARP_KEY",
    ]);
    messageMaxScore(maxScoreMessage, [
      "setKeySignature",
      0,
      1,
      blackKeyCount,
      "SHARP_KEY",
    ]);
    messageMaxScore(maxScoreMessage, [
      "setKeySignature",
      1,
      0,
      blackKeyCount,
      "SHARP_KEY",
    ]);
    messageMaxScore(maxScoreMessage, [
      "setKeySignature",
      1,
      1,
      blackKeyCount,
      "SHARP_KEY",
    ]);
  }
}

// RENDER FUNCTIONS
/* 
    RENDER 3 OBJECTS: message (for communication), MaxScore (main logic), maxscore.bcanvas (viewport)
    Returns the message object for further communication via other functions.
*/
function renderMaxScore() {
  var a = arrayfromargs(arguments);

  var scoreNo = a[0]; // score number to track instance
  var xPos = a[1]; // render positions
  var yPos = a[2];

  // we need a message object because the MaxScore object does not accept messages directly via the message method
  var maxScoreMessage = this.patcher.newdefault(xPos, yPos - 200, "message");
  maxScoreMessage.setattr("varname", "maxScoreMessage_" + scoreNo);

  // maxScore is the main MaxScore object containing all logic
  var maxScore = this.patcher.newdefault(xPos, yPos - 100, "MaxScore");
  maxScore.setattr("varname", "maxScore_" + scoreNo);

  // maxScoreBcanvas is the bpatcher display window
  var maxScoreBcanvas = this.patcher.newdefault(xPos, yPos, "bpatcher");
  maxScoreBcanvas.setattr("presentation", 1); // setting presentation rect does not work
  maxScoreBcanvas.setattr("varname", "maxScoreBcanvas_" + scoreNo);
  maxScoreBcanvas.setattr("name", "maxscore.bcanvas.maxpat");

  // connect the objects
  this.patcher.connect(maxScoreMessage, 0, maxScore, 0);
  this.patcher.connect(maxScore, 0, maxScoreBcanvas, 0);
  this.patcher.connect(maxScore, 1, maxScoreBcanvas, 1);
  this.patcher.connect(maxScoreBcanvas, 0, maxScore, 0);

  // initialize MaxScore settings
  messageMaxScore(maxScoreMessage, ["newScore", 2, 600, 140]);
  messageMaxScore(maxScoreMessage, ["setClef", 0, 1, "BASS_CLEF"]);
  messageMaxScore(maxScoreMessage, ["setStaffSpacingAbove", 0, 20]);
  messageMaxScore(maxScoreMessage, ["setStaffSpacingBelow", 0, 10]);
  messageMaxScore(maxScoreMessage, ["showTempo", 0]);
  messageMaxScore(maxScoreMessage, ["showTimeSignatures", 0]);
  messageMaxScore(maxScoreMessage, ["showMeasureNumbers", 0]);
  messageMaxScore(maxScoreMessage, ["addMeasure", 4, 4]);

  // maxScoreStateObj
  maxScores.push({
    scoreNo: scoreNo,
    maxScoreMessage: maxScoreMessage,
    maxScore: maxScore,
    maxScoreBcanvas: maxScoreBcanvas,
  });

  return maxScoreMessage;
}

function removeMaxScore(maxScoreStateObj) {
  this.patcher.remove(maxScoreStateObj.maxScoreMessage);
  this.patcher.remove(maxScoreStateObj.maxScore);
  this.patcher.remove(maxScoreStateObj.maxScoreBcanvas);
}

// UTILS
function messageMaxScore(messageObj, messageArr) {
  messageObj.message("set", messageArr);
  messageObj.message("bang");
}

// EXPORTS
exports.getMaxScores = getMaxScores;
exports.renderScale = renderScale;
exports.renderMaxScore = renderMaxScore;
exports.removeMaxScore = removeMaxScore;
exports.removeAllMaxScores = removeAllMaxScores;
