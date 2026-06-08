const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const localFileRe = /^\//;

const HASH_CACHE = {};

module.exports =
async function transform(content) {
  if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
    const dom = new JSDOM(content);

    const stylesheets = dom.window.document.querySelectorAll("link[rel='stylesheet']");

    integritizeNodeList(stylesheets, "href");

    const scripts = dom.window.document.querySelectorAll("script[src]");

    integritizeNodeList(scripts, "src");

    return dom.serialize();
  }

  return content;
}

// Pass a `nodeList` & a `linkKey` (e.g. 'href' || 'src') and if the file is local,
// And can be found in `_dist` it'll be hashed.
function integritizeNodeList(nodeList, linkKey) {
  for (let i = 0; i < nodeList.length; i++) {
    if (localFileRe.test(nodeList[i][linkKey])) {
      const pathToResource = path.resolve(path.join("_dist", nodeList[i][linkKey]));

      const fileContent = fs.readFileSync(pathToResource, { encoding: "utf8" });

      populateHashCache("sha256", pathToResource, fileContent);
      populateHashCache("sha384", pathToResource, fileContent);
      populateHashCache("sha512", pathToResource, fileContent);

      nodeList[i].setAttribute("integrity", `sha256-${HASH_CACHE[pathToResource].sha256} sha384-${HASH_CACHE[pathToResource].sha384} sha512-${HASH_CACHE[pathToResource].sha512}`);
      nodeList[i].setAttribute("crossorigin", "anonymous");
    }
  }
}

function populateHashCache(algorithm, pathToResource, content) {
  if (!HASH_CACHE[pathToResource]) {
    // Create object if it doesn't exist
    HASH_CACHE[pathToResource] = {};
  }

  if (HASH_CACHE[pathToResource][algorithm]) {
    // Check if we've already hashed this file
    return;
  }

  const hasher = crypto.createHash(algorithm);
  hasher.update(content);
  const hash = hasher.digest("base64");

  HASH_CACHE[pathToResource][algorithm] = hash;
}
