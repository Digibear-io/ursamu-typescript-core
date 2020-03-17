import { UrsaMajor } from "../classes/ursamajor.class";

export default (app: UrsaMajor) => {
  app.command({
    name: "Test",
    pattern: /^[+@]?test$/,
    exec: async (id: string, args: any[]) => {
      return "TESTING!!";
    }
  });
};
