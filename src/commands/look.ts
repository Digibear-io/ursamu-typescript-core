import cmds from "../api/commands";
import db, { DBObj } from "../api/database";
import mu from "../api/mu";
import flags from "../api/flags";
import { MuRequest } from "../api/parser";

export default () => {
  cmds.add({
    name: "Look",
    pattern: /^l\s?(.*)|^l[ook]+?\s?(.*)/i,
    flags: "connected",
    exec: async (req: MuRequest, args: string[]) => {
      // Check to see if the enactor can see the target.
      const canSee = (en: DBObj, tar: DBObj) => {
        if (flags.hasFlags(tar, "dark")) {
          if (
            (flags.canEdit(en, tar) || tar.owner === en.id) &&
            (en.location === tar.location ||
              en.location === tar.id ||
              tar.location === en.id)
          ) {
            return true;
          } else {
            return false;
          }
        } else if (
          en.location === tar.location ||
          en.location === tar.id ||
          tar.location === en.id
        ) {
          return true;
        } else {
          return false;
        }
      };

      // Get the enactor
      const en = mu.connMap.get(req.socket.id) as DBObj;
      let tar;
      // Find the first DBO with the name or ID or target.
      if (args[1] === "here") {
        tar = await db.get({ id: en.location });
      } else if (args[1] === "me") {
        tar = en;
      } else if (!args[1]) {
        tar = await db.get({ id: en?.location });
      } else {
        tar = await db.get({
          $where: function() {
            this.name.toLowerCase() === args[1]?.toLowerCase() ||
              this.id === args[1];
          }
        });
      }

      if (canSee(en!, tar)) {
        return {
          socket: req.socket,
          payload: {
            command: "message",
            message: `**${tar.name}**\n\n${tar.desc}`,
            data: req.payload.data
          }
        };
      } else {
        return {
          socket: req.socket,
          payload: {
            command: req.payload.command,
            message: "I don't see that here.",
            data: req.payload.data
          }
        };
      }
    }
  });
};
