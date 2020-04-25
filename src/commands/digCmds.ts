import mu, {MuRequest, payload} from "../mu";

export default () => {
  mu.cmd({
    name: "dig",
    pattern: /@dig\s+?(.*)/i,
    flags: "admin connected",
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id);

      return payload(req);
    }
  });
};
