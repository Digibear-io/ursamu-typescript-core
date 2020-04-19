import mu, {MuRequest, cmds, payload} from "../mu";

export default () => {
  cmds.add({
    name: "dig",
    pattern: /@dig\s+?(.*)/i,
    flags: "admin connected",
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id);

      return payload(req);
    }
  });
};
