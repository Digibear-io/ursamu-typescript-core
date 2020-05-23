import { MuRequest, DBObj } from "../types";
import mu, { cmds, db, payload, help } from "../mu";

export default () => {
  cmds.add({
    name: "say",
    flags: "connected",
    pattern: /(?:say\s+?|")(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const room = await db.get(en.location);
      let message = `${en.name} says, `;

      if (args[1].startsWith('"')) {
        message += `"${args[1].substring(1)}"`;
      } else {
        message += `"${args[1].split(" ").slice(0).join(" ").trim()}"`;
      }

      return payload(req, { message, data: { en, tar: room } });
    },
  });
};
