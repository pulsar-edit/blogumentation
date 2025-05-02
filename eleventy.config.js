const less = require("less");
const { feedPlugin } = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const PRISM_LANGUAGE_SCM = require("./plugins/prism-language-scm.js");
const { indexPostsBy, flatPaginate } = require('./plugins/pagination-helpers');
module.exports = (eleventyConfig) => {
  // Don't generate JS files when we encounter `*.11tydata.js` files; those are
  // metadata.
  eleventyConfig.ignores.add("**/*.11tydata.js");

  eleventyConfig.setServerOptions({
    // Prevent the server from trying to do a clever hot-reload when only
    // Markdown is changed. We have JavaScript code that needs to react to
    // changed content, so it's better to reload the page instead.
    domDiff: false
  });

  eleventyConfig.addPlugin(require("@11ty/eleventy-plugin-ejs"));
  eleventyConfig.addPlugin(syntaxHighlight, {
    init({ Prism }) {
      Prism.languages.scm = PRISM_LANGUAGE_SCM;
    }
  });

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom", // or "rss", "json"
    outputPath: "/feed.xml",
    collection: {
      name: "blog-posts-feed", // iterate over `collections.posts`
      limit: 10,     // 0 means no limit
    },
    metadata: {
      language: "en",
      title: "Pulsar Blog",
      subtitle: "The blog for Pulsar: a community-led, hyper-hackable text editor.",
      base: "https://blog.pulsar-edit.dev/",
      author: {
        name: "Pulsar Team",
        email: "", // Optional
      }
    }
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
  // Ensure the CNAME file is in the root dir
  eleventyConfig.addPassthroughCopy({ "static/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });

  // HACK: The feed plugin seems to expect that your blog posts are in
  // chronological order, rather than reverse chronological. So for now let's
  // just define a collection that is chronological solely for feed use.
  eleventyConfig.addCollection("blog-posts-feed", (collectionApi) => {
    return collectionApi.getFilteredByGlob("blog/posts/*.md");
  })

  // Add our custom collection of blog posts
  eleventyConfig.addCollection("blog-posts", (collectionApi) => {
    return collectionApi.getFilteredByGlob("blog/posts/*.md").reverse();
  });

  eleventyConfig.addCollection("tags", (collectionApi) => {
    let posts = collectionApi.getFilteredByGlob("blog/posts/*.md");
    let index = new Map();
    for (let post of posts) {
      for (let tag of post.data.tag ?? []) {
        if (!index.has(tag)) {
          index.set(tag, 0);
        }
        index.set(tag, index.get(tag) + 1);
      }
    }

    let entries = Array.from(index.entries());
    entries.sort((a, b) => b[1] - a[1]);
    return entries;
  });

  // Build a collection of pages that list posts by tag name and are themselves
  // paginated.
  eleventyConfig.addCollection('tagPages', (collectionApi) => {
    let allPosts = collectionApi.getFilteredByGlob("blog/posts/*.md").reverse();
    let index = indexPostsBy(allPosts, (post) => post.data.tag);
    let result = flatPaginate(index, {
      chunkSize: 20,
      // /tag/foo
      slug: 'tag',
      title: (tag) => `Posts tagged with ${tag}`
    });
    return result;
  });

  // Build a collection of pages that list posts by category name and are
  // themselves paginated.
  eleventyConfig.addCollection("categoryPages", (collectionApi) => {
    let allPosts = collectionApi.getFilteredByGlob("blog/posts/*.md").reverse();
    let index = indexPostsBy(allPosts, (post) => post.data.category);
    let result = flatPaginate(index, {
      chunkSize: 20,
      // /category/foo
      slug: 'category',
      title: (category) => `Posts in category ${category}`
    });
    return result;
  });

  eleventyConfig.addWatchTarget("./less/");
  eleventyConfig.addWatchTarget("./layouts/");

  // Since 11ty doesn't natively provide EJS with filters, we have to manually
  // define our helpers like this. In a magical way found by @savetheclocktower
  globalThis.helpers = {
    // Add a function to allow extraction of the text before `<!-- more -->`
    // in blog posts, to maintain compatibility with our old blog system summaries
    findPostSummary: (value) => {
      if (typeof value !== "string") {
        return "";
      }

      if (value.includes("<!-- more -->")) {
        return value.split('<!-- more -->')[0]?.trim();
      }

      // TODO: This is an inferior strategy. We should enforce presence of
      // `<!-- more -->` (or some other summary method) on future blog posts
      // and correct any that already exist and are missing summaries.
      let summary = value.substring(0, 200);
      return summary.length === 200 ? `${summary}…` : summary;
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
