const cloudinary = require('norska/frontend/cloudinary');
cloudinary.init(window.CONFIG.cloudinary);
const lazyloadAttributes = require('norska/frontend/lazyload/attributes');

module.exports = {
  preview(item) {
    const baseUrl = window.CONFIG.baseUrl;
    const { gameSlug, slug } = item;
    const pictureUrl = `${baseUrl}/assets/pictures/${gameSlug}/${slug}.png`;
    const isProduction = window.CONFIG.isProduction;

    // Do not go through cloudinary in dev
    if (!isProduction) {
      return { placeholder: pictureUrl, full: pictureUrl };
    }

    const options = { width: 600, placeholder: { width: 200 } };
    return lazyloadAttributes(pictureUrl, options);
  },
};
