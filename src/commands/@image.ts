import mu, { payload, flags, db, MuRequest, cmds } from "../mu";

export default () => {
  cmds.add({
    name: "image",
    flags: "connected",
    pattern: /@image(\/avatar)?\s+?(.*)\s?=\s?(.*)/,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id);
      const tar = await db.target(en!, args[2]);

      // Either set an image or an avatar depending on
      // if the /avatar flag is used.
      if (tar) {

        if (flags.canEdit(en!, tar)) {
          if (!args[1]) {
            tar.image = args[3];
          } else {
            tar.avatar = args[3];
          }
        }
      
      await db.update({ id: tar.id }, tar);
      return payload(req, {command: "command", message: "Image set." });
      } else {
        return payload(req, {command: "command", message: "I can't find that."})
      }
    },
  });
};
