import { payload } from "../mu";
import { MuRequest } from "../types";

export default (req: MuRequest): MuRequest => {
  const message = req.payload.message

    // Base ascii colors style colors.
    .replace(/%[cx]x/g, "<span style='color: DarkGrey'>")
    .replace(/%[cx]r/g, "<span style='color: Red'>")
    .replace(/%[cx]g/g, "<span style='color: Green'>")
    .replace(/%[cx]y/g, "<span style='color: Yellow'>")
    .replace(/%[cx]b/g, "<span style='color: Blue'>")
    .replace(/%[cx]m/g, "<span style='color: Magenta'>")
    .replace(/%[cx]c/g, "<span style='color: Cyan'>")
    .replace(/%[cx]w/g, "<span style='color: White'>")
    .replace(/%[cx]n/g, "</span>")

    // Backgrounds
    .replace(/%[CX]x/g, "<span style = 'background-color: DarkGrey'>")
    .replace(/%[CX]r/g, "<span style = 'background-color: Red'>")
    .replace(/%[CX]g/g, "<span style = 'background-color: Green'>")
    .replace(/%[CX]y/g, "<span style = 'background-color: Yellow'>")
    .replace(/%[CX]b/g, "<span style = 'background-color: Blue'>")
    .replace(/%[CX]m/g, "<span style = 'background-color: Magenta'>")
    .replace(/%[CX]c/g, "<span style = 'background-color: Cyan'>")
    .replace(/%[CX]w/g, "<span style = 'background-color: White'>")

    // Hex color codes
    .replace(/<\s?#([\w\d]{3,6})\s?>/g, "<span style = 'color: #$1'>")

    // Html Color names.
    .replace(/<\s?\+([\w]+)\s?>/g, "<span style = 'color: $1'>")
    .replace(
      /<\s?\+#([\w\d]{3,6})\s?>/g,
      "<span style = 'background-color: #$1'>"
    )
    .replace(/%[cx]b/g, "<span style = 'font-weight: bold'>")

    // Other substitutions
    .replace(/%t/gi, "&nbsp;".repeat(4))
    .replace(/%b/gi, "&nbsp;")
    .replace(/%n/gi, "</br>");

  return payload(req, { message });
};
