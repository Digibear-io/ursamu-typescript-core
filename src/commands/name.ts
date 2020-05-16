import mu, { cmds, db, flags, payload } from "../mu";
import { MuRequest, DBObj } from "../types";

export default () => {
  cmds.add({
    name: "@name",
    flags: "connected",
    pattern: /[@\+]?name\s+?(\w+)\s?=\s?(\w+)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const tar = await db.target(en, args[1]);

      if (tar) {
        if (flags.canEdit(en, tar)) {
          tar.name = args[2];
          await db.update({ _id: tar._id }, tar);
          return payload(req, { message: "Done. Name changed." });
        } else {
          return payload(req, { message: "Permission denied." });
        }
      } else {
        return payload(req, { message: "I can't find that." });
      }
    },
  });
};
