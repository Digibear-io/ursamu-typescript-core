import { readFileSync } from "fs";
import { resolve } from "path";

const file = readFileSync(resolve(__dirname, "../../config/config.json"), {
  encoding: "utf8"
});
const config = JSON.parse(file);
export default config;
