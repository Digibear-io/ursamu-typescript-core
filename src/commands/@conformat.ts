import mu, { cmds, flags, db, attrs, payload } from "../mu";
import { MuRequest, DBObj } from "../types";

export default () => {
  cmds.add({
    name: "@conformat",
    pattern: /@conformat\s+?([^=]+)\s?=\s?(.*)/i,
    flags: "connected",
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const tar = await db.target(en!, args[1]);

      if (tar && flags.canEdit(en, tar!)) {
        attrs.set(en, tar, "conformat", args[2]);
        return payload(req, {
          message: `**Done.** @conformat set om ${tar.name}`,
        });
      } else {
        return payload(req, {
          command: "error",
          message: "Permission denied.",
        });
      }
    },
  });
};
