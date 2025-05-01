const MarkdownIT = require("markdown-it");

const md = MarkdownIT({
  html: true
});

module.exports =
md.use(
  require("markdown-it-anchor")
);
