import mu, { db, payload, flags } from "../mu";
import { DBObj, MuRequest } from "../types";

export interface LookData {
  en: DBObj | undefined;
  tar: DBObj | undefined;
  things: DBObj[];
  players: DBObj[];
  exits: DBObj[];
}

export default () => {
  mu.cmd({
    name: "Look",
    pattern: /l(?:\s+?(\w+))?$|^look(?:\s+?(\w+))?$/i,
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

      // TODO:  Move this to grid.ts
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

      const en = mu.connections.get(req.socket.id);
      const tar = await db.target(en!, args[1]);
      if (tar) {
        if (canSee(en!, tar)) {
          look.en = en;
          look.tar = tar;
          return payload(req, {
            command: "desc",
            message: tar.desc,
            data: { en, tar: en, look },
          });
        } else {
          return {
            socket: req.socket,
            payload: {
              command: "command",
              message: "I don't see that here.",
              data: req.payload.data,
            },
          };
        }
      } else {
        return payload(req, {
          command: "command",
          message: "I don't see that here.",
        });
      }
    },
  });
};
