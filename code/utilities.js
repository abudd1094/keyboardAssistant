// Returns the note name of a semitone with an optional octave integer (e.g. 60 -> C or C4)
function parseNoteName(semitoneInput, includeOctave) {
  var useFlat = semitoneInput < 0 ? 1 : 0;
  var absoluteSemitoneInput = Math.abs(semitoneInput);

  var octave = Math.floor(absoluteSemitoneInput / 12) - 1;
  var semitone = absoluteSemitoneInput % 12;

  var noteNames = [
    "C",
    ["C#", "D♭"],
    "D",
    ["D#", "E♭"],
    "E",
    "F",
    ["F#", "G♭"],
    "G",
    ["G#", "A♭"],
    "A",
    ["A#", "B♭"],
    "B",
  ];

  var noteName = "";

  switch (semitone) {
    case 0:
      noteName = noteNames[0];
      break;
    case 1:
      noteName = noteNames[1][useFlat];
      break;
    case 2:
      noteName = noteNames[2];
      break;
    case 3:
      noteName = noteNames[3][useFlat];
      break;
    case 4:
      noteName = noteNames[4];
      break;
    case 5:
      noteName = noteNames[5];
      break;
    case 6:
      noteName = noteNames[6][useFlat];
      break;
    case 7:
      noteName = noteNames[7];
      break;
    case 8:
      noteName = noteNames[8][useFlat];
      break;
    case 9:
      noteName = noteNames[9];
      break;
    case 10:
      noteName = noteNames[10][useFlat];
      break;
    case 11:
      noteName = noteNames[11];
      break;
  }

  if (includeOctave) {
    return noteName + octave;
  } else {
    return noteName;
  }
}

// Returns true if key is black
function detectBlackKey(note) {
  switch (note % 12) {
    case 1:
    case 3:
    case 6:
    case 8:
    case 10:
      return true;
    default:
      return false;
  }
}

// Returns the number of black keys in an array of semitones
function getBlackKeyCount(semitonesArr) {
  var blackKeyCount = 0;

  for (var i = 0; i < semitonesArr.length; i++) {
    if (detectBlackKey(semitonesArr[i])) {
      blackKeyCount++;
    }
  }

  return blackKeyCount;
}

// Returns the black keys in an array of semitones
function getBlackKeys(semitonesArr, normalize) {
  var blackKeys = semitonesArr.filter(function (s) { return s % 12 == 1 || s % 12 == 3 || s % 12 == 6 || s % 12 == 8 || s % 12 == 10; });
  return normalize ? blackKeys.map(function (s) { return s % 12; }) : blackKeys;
}

exports.parseNoteName = parseNoteName;
exports.detectBlackKey = detectBlackKey;
exports.getBlackKeyCount = getBlackKeyCount;
exports.getBlackKeys = getBlackKeys;
