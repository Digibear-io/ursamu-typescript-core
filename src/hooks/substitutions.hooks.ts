import { payload } from "../mu";
import { MuRequest } from "../types";

export default async (req: MuRequest): Promise<MuRequest> => {
  const message = req.payload.message
    .replace(/%[cx]([\w\d]+);/g, "<span style='color: $1'>")
    .replace(/%[cx]n;/g, "</span>")

    // Backgrounds
    .replace(/%[CX](.*);/g, "<span style = 'background-color: $1'>")

    .replace(/%b;/g, "<span style = 'font-weight: bold'>")

    // Other substitutions
    .replace(/%t;/gi, "&nbsp;".repeat(4))
    .replace(/%b;/gi, "&nbsp;")
    .replace(/%r;/gi, "</br>");

  return payload(req, { message });
};
