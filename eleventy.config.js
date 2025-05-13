const pulsarEleventyConfig = require("11ty-config");

module.exports = (eleventyConfig) => {

  pulsarEleventyConfig(eleventyConfig);

  // Add passthrough file copies
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });

  // Add our custom collection of blog posts
  eleventyConfig.addCollection("blog-posts", (collectionApi) => {
    return collectionApi.getFilteredByGlob("blog/posts/*.md").reverse();
  });

  // Since 11ty doesn't natively provide EJS with filters, we have to manually
  // define our helpers like this. In a magical way found by @savetheclocktower
  globalThis.helpers = {
    // Add a function to allow extraction of the text before `<!-- more -->`
    // in blog posts, to maintain compatibility with our old blog system summaries
    findPostSummary: (value) => {
      if (typeof value !== "string") {
        return "";
      }
      if (!value.includes("<!-- more -->")) {
        // If the post for some reason doesn't include this summary delimiter
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
