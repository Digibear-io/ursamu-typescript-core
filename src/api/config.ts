import { readFileSync } from "fs";
import { resolve } from "path";
import { Flag } from "./flags";

export type Config = {
  game: {
    port: number;
    startingRoom: string;
    flags: Flag[];
  };
};

export type Format = {
  header: string;
  before: string;
  after: string;
  seperator: string;
};

const conf = readFileSync(resolve(__dirname, "../../config/config.json"), {
  encoding: "utf8",
});
const frmt = readFileSync(resolve(__dirname, "../../config/formatting.json"), {
  encoding: "utf8",
});

const config: Config = JSON.parse(conf);
export default config;
export const fmt: Format = JSON.parse(frmt);
