const less = require("less");

module.exports = (eleventyConfig) => {

  eleventyConfig.setServerOptions({
    // Prevent the server from trying to do a clever hot-reload when only
    // Markdown is changed. We have JavaScript code that needs to react to
    // changed content, so it's better to reload the page instead.
    domDiff: false
  });

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

  eleventyConfig.addTemplateFormats("js");
  eleventyConfig.addExtension("js", require("./plugins/terser.js"));

  eleventyConfig.setLibrary("md", require("./plugins/markdown-it.js"));

  // Add passthrough file copies

  // copy the data from static to static
  eleventyConfig.addPassthroughCopy({ "static": "static" });

  // Add our custom collection of blog posts
  eleventyConfig.addCollection("blog-posts", (collectionApi) => {
    return collectionApi.getFilteredByGlob("blog/posts/*.md").reverse();
  });

  eleventyConfig.addWatchTarget("./less/");

  // Since 11ty doesn't natively provide EJS with filters, we have to manually
  // define our helpers like this. In a magical way found by @savetheclocktower
  globalThis.helpers = {
    // Add a function to allow extraction of the text before `<!-- more -->`
    // in blog posts, to maintain compatibility with our old blog system summaries
    findPostSummary: (value) => {
      if (typeof value !== "string") {
        return "";
      }
      const summary = value.split("<!-- more -->")[0];
      return summary ?? "";
    }
  };

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
