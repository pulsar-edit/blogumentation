
// Simple Prism-based syntax highlighting for Tree-sitter query files.
const SCM_LANGUAGE = {
  comment: {
    pattern: /(^|[^\\:]);.*/,
    lookbehind: true,
    greedy: true
  },
  string: {
    pattern: /(["])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/
  },
  variable: {
    pattern: /@[a-zA-Z_.-]*[a-zA-Z_]/,
    inside: {
      punctuation: /^@/
    }
  },
  function: {
    pattern: /#[a-z]*[a-z-]*[a-z][?!]/
  },
  constant: {
    pattern: /(\()[a-z_]+\b/,
    lookbehind: true
  }
}

module.exports = SCM_LANGUAGE;
