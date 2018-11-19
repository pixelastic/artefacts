import firost from 'firost';
import qs from 'query-string';
import he from 'he';
import got from 'got';
import wtf from 'wtf_wikipedia';
import { _ } from 'golgoth';

/**
 * Collection of methods to extract data from wikis following the Wikimedia
 * pattern. This includes Wikipedia and Wikia
 **/
const module = {
  baseUrl: null,
  _cacheUrl: {},
  _cacheWtf: {},
  _cacheImage: {},
  init(baseUrl) {
    this.baseUrl = baseUrl;
  },

  /**
   * Read json at a specified url. Uses an internal cache
   * @param {String} url Url of the JSON data
   * @returns {Object} JSON-parsed object
   **/
  async readJsonUrl(url) {
    // Return the version cached in RAM if any
    if (this._cacheUrl[url]) {
      return this._cacheUrl[url];
    }

    // Check if we have a copy on disk and return it
    const cachePath = [
      '_cache',
      firost.urlToFilepath(url, { extension: 'json' }),
    ].join('/');
    if (await firost.isFile(cachePath)) {
      return firost.readJson(cachePath);
    }

    // No copy, we get it from the url
    const data = await firost.readJsonUrl(url);
    await firost.writeJson(cachePath, data);
    this._cacheUrl[url] = data;
    return data;
  },

  /**
   * Convert a page title to its url
   * @param {String} title Page title
   * @returns {String} Url of the page
   **/
  titleToUrl(title) {
    return _.chain(title)
      .replace(/ /g, '_')
      .replace(/'/g, '%27')
      .value();
  },

  /**
   * Return the list of all articles in a given category
   * @param {String} categoryName Name of the category
   * @param {Object} userOptions Options:
   *     - limit: Max number of items to fetch (default 10k)
   * @returns {Array} List of articles with .id, .title and .url
   **/
  async articles(categoryName, userOptions) {
    const querystring = qs.stringify({
      limit: 10000,
      category: categoryName,
      ...userOptions,
    });
    const url = `${this.baseUrl}/api/v1/Articles/List?${querystring}`;

    const response = await this.readJsonUrl(url);
    return _.chain(response)
      .get('items')
      .drop(1) // First item is always the list itself, so we remove it
      .map(article => ({
        id: article.id,
        title: article.title,
        url: `${this.baseUrl}${article.url}`,
      }))
      .sortBy(['title'])
      .value();
  },

  /**
   * Returns the list of all category members of a given category
   * @param {String} categoryName Name of the category
   * @returns {Array} List of child pages of this category
   **/
  async categoryMembers(categoryName) {
    const querystring = qs.stringify({
      action: 'query',
      cmlimit: 'max',
      cmtitle: `Category:${categoryName}`,
      format: 'json',
      list: 'categorymembers',
    });
    const url = `${this.baseUrl}/api.php?${querystring}`;

    const response = await this.readJsonUrl(url);
    return _.chain(response)
      .get('query.categorymembers')
      .reject(page => {
        const regexp = /(Category|Thread|User|Portal|Template):/i;
        return regexp.test(page.title);
      })
      .map(page => ({
        url: `${this.baseUrl}/${this.titleToUrl(page.title)}`,
        title: page.title,
      }))
      .value();
  },

  /**
   * Get article raw markup
   * @param {String} pageName Slug of the article
   * @returns {String} Raw page markup
   **/
  async markup(pageName) {
    const options = qs.stringify({
      action: 'query',
      prop: 'revisions',
      rvprop: 'content',
      format: 'json',
      titles: pageName,
    });
    const url = `${this.baseUrl}/api.php?${options}`;

    const response = await this.readJsonUrl(url);
    const pages = _.get(response, 'query.pages');
    const id = _.first(_.keys(pages));
    return _.get(pages, `${id}.revisions[0]['*']`);
  },

  /**
   * Get parsed document, as exposed by wtf_wikipedia
   * https://github.com/spencermountain/wtf_wikipedia
   * @param {String} pageName Slug of the article
   * @returns {Object} wtf_wikipedia document
   **/
  async doc(pageName) {
    if (this._cacheWtf[pageName]) {
      return this._cacheWtf[pageName];
    }
    const content = await this.markup(pageName);
    const doc = wtf(content);
    this._cacheWtf[pageName] = doc;
    return doc;
  },

  /**
   * Return page data as JSON format
   * @param {String} pageName Slug of the article
   * @returns {Object} Data object
   **/
  async json(pageName) {
    const doc = await this.doc(pageName);
    return doc.json();
  },

  /**
   * Returns the url of an image identified by its name
   * @param {String} imageName Name of the image
   * @returns {String} Url of the image
   * Note: It will check that the url actually resolve and will use
   * ./_cache/images.json as a cache.
   **/
  async imageUrl(imageName) {
    const cacheFile = `_cache/images.json`;
    const imageUrlName = this.titleToUrl(he.decode(imageName));

    // Load disk cache in RAM
    if (_.isEmpty(this._cacheImage)) {
      const diskCache = await firost.readJson(cacheFile);
      this._cacheImage = diskCache || {};
    }

    // Check the cache in RAM
    const cacheHit = _.chain(this._cacheImage)
      .get(this.baseUrl)
      .get(imageUrlName)
      .value();
    if (cacheHit) {
      return cacheHit;
    }

    // Not in RAM, we fetch the real address
    const specialUrl = `${this.baseUrl}/wiki/Special:FilePath/${imageUrlName}`;
    let imageUrl = null;
    try {
      const response = await got(specialUrl);
      imageUrl = response.url;
    } catch (error) {
      return null;
    }

    const cachePath = `['${this.baseUrl}']['${imageUrlName}']`;
    _.set(this._cacheImage, cachePath, imageUrl);
    await firost.writeJson(cacheFile, this._cacheImage);

    return imageUrl;
  },

  /**
   * Returns an object representing the infobox
   * @param {String} pageName Name of the page
   * @returns {Object} Infobox as an object
   **/
  async infobox(pageName) {
    const raw = await this.json(pageName);
    return _.chain(raw)
      .get('sections')
      .find(section => !_.isEmpty(section.infoboxes))
      .get('infoboxes')
      .first()
      .mapValues(value => _.get(value, 'text'))
      .mapKeys((value, key) => _.camelCase(key))
      .value();
  },

  /**
   * Check if the page is a stub
   * @param {String} pageName Name of the page
   * @returns {Boolean} True if is a stub
   **/
  async isStub(pageName) {
    const markup = await this.markup(pageName);
    if (_.includes(markup, '{{stub}}')) {
      return true;
    }
    return false;
  },

  /**
   * Check if the page is a redirect
   * @param {String} pageName Name of the page
   * @returns {Boolean} True if is a redirect
   **/
  async isRedirect(pageName) {
    const markup = await this.markup(pageName);
    return _.includes(markup, '#REDIRECT');
  },
};

export default _.bindAll(module, _.functions(module));