import MarkdownIt from "markdown-it";
const underline = require("markdown-it-underline");
const md = MarkdownIt({
  breaks: true,
  html: true,
  linkify: true,
  typographer: true
});

md.use(underline);
export default md;
