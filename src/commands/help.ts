import mu, { cmds, payload, parser, help } from "../mu";
import { MuRequest, DBObj } from "../types";

export default () => {
  cmds.add({
    name: "help",
    flags: "connected",
    pattern: /[@\+]?help(?:\s+?(.*))?/i,
    exec: async (req: MuRequest, args: string[]) => {
      // No topic given, list index.
      const en = mu.connections.get(req.socket.id) as DBObj;
      let output =
        "[center(%cgold;<%cgoldenrod;<%cn; +HELP %cgoldenrod;>%cgold;>%cn;,78,%cdarkblue;=%cblue;-)]%r;";
      output += help.catagories().join("\n");

      return payload(req, {
        message: parser.colorSub(await parser.string(en, output, {})),
      });
    },
  });
};
