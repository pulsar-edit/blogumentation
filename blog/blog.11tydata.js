module.exports = {
  eleventyComputed: {
    // Our templates prefer this property if it exists; otherwise we fall back
    // to the standard `title` property.
    customTitle(data) {
      if (data.tag) {
        return data.tag.title;
      } else if (data.category) {
        return data.category.title;
      }
      return null;
    }
  },
  // Permalink overrides for certain pages.
  permalink (data) {
    // If this is a tag or category listing page, we've done the work ahead of
    // time.
    if (data.tag?.href) {
      return data.tag.href;
    } else if (data.category?.href) {
      return data.category.href;
    }

    // Otherwise, if it has pagination data, it's an “all posts” listing page.
    if (data.pagination) {
      let { pageNumber } = data.pagination
      return pageNumber === 0 ? '/' : `${pageNumber + 1}/`;
    }

    // If we get this far, 11ty should fall back to its ordinary permalink
    // strategy.
  }
};
