import cmds from "../api/commands";
import db, { DBObj } from "../api/database";
import mu, { payload } from "../api/mu";
import flags from "../api/flags";
import parser, { MuRequest } from "../api/parser";

export interface LookData {
  en: DBObj | undefined;
  tar: DBObj | undefined;
  things: DBObj[];
  players: DBObj[];
  exits: DBObj[];
}

export default () => {
  cmds.add({
    name: "Look",
    pattern: /(?:^l|^l[ook]+?)(?:\s+?(.*))?/i,
    flags: "connected",
    exec: async (req: MuRequest, args: string[]) => {
      /**
       * Check to see if the enactor can see the target
       * @param en Enactor DBObj
       * @param tar Target DBObj
       */

      const look: LookData = {
        en: undefined,
        tar: undefined,
        players: [],
        things: [],
        exits: [],
      };

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

      /**
       * Build a description for `tar` based on what `en'
       * can see.
       * @param en Enactor DBObj
       * @param tar Target DBObj
       */
      const doLook = async (en: DBObj, tar: DBObj) => {
        // If the object has contents, list it! Else, skip.
        if (tar.contents.length > 0) {
          // Cycle through the contents and build a list
          for (const thing of tar.contents) {
            if (canSee(en, tar)) {
              const item = await db.get({ id: thing });

              // If it's a player that's not dark - or dark and enactor
              // can 'edit' the target.
              if (
                item.type === "player" &&
                (item.flags.indexOf("dark") === -1 || flags.canEdit(en, tar))
              ) {
                look.players?.push(item);
              } else if (
                // If
                item.type === "thing" &&
                (item.flags.indexOf("dark") === -1 || flags.canEdit(en, tar))
              ) {
                look.things?.push(item);
              }
            }
          }
        }

        // If the target has exits
        if (tar.exits) {
          let exits: DBObj[] = [];
          for (const ex of tar.exits) {
            const exit = await db.get({ id: ex });
            if (canSee(en, exit)) {
              exits.push(exit);
              look.exits.push(exit);
            }
          }
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
          $where: function () {
            return this.name.toLowerCase() === args[1]?.toLowerCase() ||
              this.id === args[1]
              ? true
              : false;
          },
        });

        if (!tar) {
          return {
            socket: req.socket,
            payload: {
              command: req.payload.command,
              message: "I don't see that here.",
              data: req.payload.data,
            },
          };
        }
      }

      if (canSee(en!, tar)) {
        return payload(req, {
          message: tar.desc,
          data: look,
        });
      } else {
        return {
          socket: req.socket,
          payload: {
            command: req.payload.command,
            message: "I don't see that here.",
            data: req.payload.data,
          },
        };
      }
    },
  });
};
