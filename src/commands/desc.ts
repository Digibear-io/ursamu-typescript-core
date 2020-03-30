import commands from "../api/commands";
import { MuRequest } from "../api/parser";
import db, { target, DBObj } from "../api/database";
import mu from "../api/mu";
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
        console.log(flags.canEdit(en, tar));
        if (flags.canEdit(en, tar)) {
          tar.desc = args[2];
          await db.update({ id: tar.id }, tar);
          return {
            socket: req.socket,
            payload: {
              command: req.payload.command,
              message: "Description set.",
              data: req.payload.data
            }
          };
        } else {
          return {
            socket: req.socket,
            payload: {
              command: req.payload.command,
              message: "Permission deined.",
              data: req.payload.data
            }
          };
        }
      } else {
        return {
          socket: req.socket,
          payload: {
            command: req.payload.command,
            message: "I can't find that.",
            data: req.payload.data
          }
        };
      }
    }
  });
};
