import { MuRequest } from "../types";
import mu, { cmds, db, payload, attrs } from "../mu";

export default () => {
  cmds.add({
    name: "pose",
    flags: "connected",
    pattern: /(pose\s+?|:|;)(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      let output = "";
      const en = mu.connections.get(req.socket.id);

      if (en) {
        const name = attrs.get(en, en, "moniker") || en.name;
        switch (args[1].toLowerCase()) {
          case "pose":
            output += `${name} ${args[2]}`;
            break;
          case ":":
            output += `${name} ${args[2]}`;
            break;
          case ";":
            output += `${name}${args[2]}`;
            break;
        }
      }
      return payload(req, { message: output });
    },
  });
};
