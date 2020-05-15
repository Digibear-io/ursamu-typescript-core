import mu, { db, payload, flags, attrs, parser } from "../mu";
import { DBObj, MuRequest } from "../types";

export interface LookData {
  [index: string]: any;
  en: DBObj | undefined;
  tar: DBObj | undefined;
  thing: DBObj[] | undefined;
  player: DBObj[] | undefined;
  exit: DBObj[] | undefined;
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
        player: [],
        thing: [],
        exit: [],
      };

      const description = "";
      // TODO:  Move this to grid.ts
      const canSee = (en: DBObj, tar: DBObj) => {
        if (flags.hasFlags(tar, "dark")) {
          if (
            (flags.canEdit(en, tar) || tar.owner === en._id) &&
            (en.location === tar.location ||
              en.location === tar._id ||
              tar.location === en._id)
          ) {
            return true;
          } else {
            return false;
          }
        } else if (
          en.location === tar.location ||
          en.location === tar._id ||
          tar.location === en._id
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

          // collect DBObj types ...
          for (const item of tar.contents) {
            const obj = await db.get({ _id: item });
            if (obj && obj.type) {
              look[obj.type].push(obj);
            }
          }

          // Either use the object's name, or name format depending
          // on if it exists, and the looker is within the target.
          const namefmt = attrs.get(en!, tar, "nameformat");
          let name = "";
          if (namefmt && en!.location === tar._id) {
            name +=
              (await parser.string(
                en!,
                namefmt.value.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
                {
                  "%0": db.name(en!, tar!),
                }
              )) + "\n";
          } else {
            name += db.name(en!, tar) + "\n";
          }
          name = parser.colorSub(name);

          // Get a list of contents then filter the array for
          // items dark to the enactor before grabbing the name of the
          // object and then sort the array, and then turn it into a string!
          let contents = "";
          if (tar.contents.length >= 1) {
            contents +=
              tar.type === "player" ? "\n\nCarrying:\n" : "\n\nContents:\n";
          }
          if (look.player && look.thing) {
            contents += [...look.player, ...look.thing]
              .filter((item) =>
                flags.hasFlags(item, "!dark") || flags.canEdit(en!, item)
                  ? true
                  : false
              )
              .map((item) => item.name)
              .sort()
              .join("\n");
          } else {
            contents = "\n";
          }

          return payload(req, {
            command: "desc",
            message: `${name}\n` + tar.desc + contents,
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
