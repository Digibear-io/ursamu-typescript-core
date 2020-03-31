import commands from "../api/commands";
import { MuRequest } from "../api/parser";
import db, { target, DBObj } from "../api/database";
import mu, { payload } from "../api/mu";
import flags from "../api/flags";

export default () => {
  commands.add({
    name: "desc",
    flags: "connected",
    pattern: /@des[cription]+?\s+?(.*)\s?=\s?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connMap.get(req.socket.id) as DBObj;
      const tar = await target(en, args[1]);

      if (tar) {
        if (flags.canEdit(en, tar)) {
          tar.desc = args[2];
          await db.update({ id: tar.id }, tar);
          return payload(req, { message: "Description set." });
        } else {
          return payload(req, { message: "Permission denied." });
        }
      } else {
        return payload(req, { message: "I can't find that" });
      }
    }
  });
};
