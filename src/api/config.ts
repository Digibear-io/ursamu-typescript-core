import { readFileSync } from "fs";
import { resolve } from "path";
import { Flag } from "./flags";


export type Config = {
  game: {
    port: number;
    startingRoom: string;
    flags: Flag[];
  }
}

const file = readFileSync(resolve(__dirname, "../../config/config.json"), {
  encoding: "utf8"
});
const config: Config = JSON.parse(file);
export default config;
