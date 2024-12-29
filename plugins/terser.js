const { minify } = require("terser");

module.exports = {
  outputFileExtension: "js",
  compile: async (input) => {
    try {
      const output = await minify(input);

      return async (data) => {
        return output.code;
      };

    } catch(err) {
      console.error(err);
      throw err;
    }
  }
};
