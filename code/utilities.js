/**
 * @file utilities.js
 */

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
  var blackKeys = semitonesArr.filter(function (s) {
    return (
      s % 12 == 1 || s % 12 == 3 || s % 12 == 6 || s % 12 == 8 || s % 12 == 10
    );
  });
  return normalize
    ? blackKeys.map(function (s) {
        return s % 12;
      })
    : blackKeys;
}

// Normalizes all semitones to first octave
function normalize(semitones) {
  return semitones.map(function (s) {
    return s % 12;
  });
}

// Returns the term for the scale type based on the number of semitones
function getScaleCountType(semitones) {
  switch (semitones.length) {
    case 1:
      return "Monotonic - 1 note";
      break;
    case 2:
      return "Ditonic - 2 notes";
      break;
    case 3:
      return "Tritonic - 3 notes";
      break;
    case 4:
      return "Tetraonic - 4 notes";
      break;
    case 5:
      return "Pentatonic - 5 notes";
      break;
    case 6:
      return "Hexatonic - 6 notes";
      break;
    case 7:
      return "Heptatonic - 7 notes";
      break;
    case 8:
      return "Octatonic - 8 notes";
      break;
    case 9:
      return "Nonatonic - 9 notes";
      break;
    case 10:
      return "Decatonic - 10 notes";
      break;
    case 11:
      return "Undecatonic - 11 notes";
      break;
    case 12:
      return "Duodecatonic - 12 notes";
      break;
    default:
      return "";
      break;
  }
}

// Returns the interval sequence for a given array of semitones (either in terms of half steps or whole steps or interval names if not possible)
function getIntervalSeq(semitones) {
  var intervals = [];
  var tones = [];

  for (var i = 0; i <= semitones.length; i++) {
    switch (semitones[i + 1] - semitones[i]) {
      case 1:
        intervals.push("m2");
        tones.push("H");
        break;
      case 2:
        intervals.push("M2");
        tones.push("W");
        break;
      case 3:
        intervals.push("m3");
        break;
      case 4:
        intervals.push("M3");
        break;
      case 5:
        intervals.push("P4");
        break;
      case 6:
        intervals.push("TT");
        break;
      case 7:
        intervals.push("P5");
        break;
      case 8:
        intervals.push("m6");
        break;
      case 9:
        intervals.push("M6");
        break;
      case 10:
        intervals.push("m7");
        break;
      case 11:
        intervals.push("M7");
        break;
      default:
        break;
    }
  }

  if (intervals.length > tones.length) {
    return intervals.join("-");
  } else {
    return tones.join("-");
  }
}

// EXPORTS
exports.parseNoteName = parseNoteName;
exports.detectBlackKey = detectBlackKey;
exports.getBlackKeyCount = getBlackKeyCount;
exports.getBlackKeys = getBlackKeys;
exports.normalize = normalize;
exports.getScaleCountType = getScaleCountType;
exports.getIntervalSeq = getIntervalSeq;
