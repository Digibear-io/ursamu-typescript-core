import { parser } from "../mu";

/**
 * Repeat a sequence of characters, taking '%' substitutions into effect.
 * @param string The string to repeat
 * @param length The number of characters to fill with the repeating elements.
 */
const repeatString = (string = " ", length: number) => {
  // Check to see if the filler string contains ansii substitutions.  If so
  // split the characters of the string into an array and apply ansii substitutions.
  // Else just split the filler string into an array.

  // check how many spaces are left after the filler string is rendered. We will need
  // to render these last few spaces manually.
  const remainder = Math.floor(length % parser.stripSubs(string).length);

  // Split the array and filter out empty cells.
  let cleanArray = string.split("%");
  // If the array length is longer than 1 (more then one cell), process for ansii
  if (cleanArray.length > 1) {
    // If it's just a clear formatting call 'cn' then we don't need to worry
    // about it.  We'll handle making sure ansii is cleared after each substitution manually.

    cleanArray = cleanArray.filter((cell) => {
      if (cell.toLowerCase() !== "cn;") {
        return "&" + cell;
      }
    });
  } else {
    cleanArray = cleanArray[0].split("");
  }
  return (
    string.repeat(length / parser.stripSubs(string).length) +
    cleanArray.slice(0, remainder)
  );
};

/**
 * Create an in-game heading  banner.
 * @param text Text to be added to the banner
 * @param length The length of the banner
 * @param fill The fill character(s) to use when building the string.
 * @param direction Either left, right or center.  Defaults to center.
 */
const header = (text = "", length = 78, fill = " ", direction = "center") => {
  let len, remainder;
  switch (direction) {
    case "left":
      len = length - parser.stripSubs(text).length - 4;
      return parser.colorSub(
        repeatString(fill, 4) + text + repeatString(fill, len)
      );
    default:
      len = (length - parser.stripSubs(text).length) / 2;
      remainder = (length - len) % 2;
      return parser.colorSub(
        repeatString(fill, len) + text + repeatString(fill, len + remainder)
      );
  }
};

export default {
  header,
};
