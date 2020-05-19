import { MuRequest } from "../types";
import mu, { cmds, db, payload } from "../mu";

export default () => {
  cmds.add({
    name: "pose",
    flags: "connected",
    pattern: /(pose\s+?|:|;)(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      let output = "";
      const en = mu.connections.get(req.socket.id);

      if (en) {
        switch (args[1].toLowerCase()) {
          case "pose":
            output += `${en.moniker || en.name} ${args[2]}`;
            break;
          case ":":
            output += `${en.moniker || en.name} ${args[2]}`;
            break;
          case ";":
            output += `${en.moniker || en.name}${args[2]}`;
            break;
        }
      }
      return payload(req, { message: output });
    }
  });
};
