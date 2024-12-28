const less = require("less");

module.exports = (eleventyConfig) => {

  // Add custom templates
  eleventyConfig.addTemplateFormats("less");
  eleventyConfig.addExtension("less", {
    outputFileExtension: "css",
    compile: async function (input, inputPath) {
      try {
        const output = await less.render(input, {
          math: "always" // required for use with Skeleton
        });

        this.addDependencies(inputPath, output.imports);
        return async () => output.css;
      } catch(err) {
        console.error(`Error compiling less:\n`, err);
        throw err;
      }
    }
  });

  eleventyConfig.setLibrary("md", require("./plugins/markdown-it.js"));

  // return config
  return {
    markdownTemplateEngine: false,
    // ^^ We can't parse md in liquidjs or njk, because our docs seem to have
    // naturally occurring instances of both of their delimiters.
    // So for now we will just disable any templating on markdown
    dir: {
      input: "blog",
      output: "_dist",
      includes: "less",
      // Below values are relative to the `./docs` folder
      layouts: "../layouts",
      data: "../data"
    }
  };

};
