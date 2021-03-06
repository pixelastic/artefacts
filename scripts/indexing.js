const indexing = require('algolia-indexing');
const pMap = require('golgoth/pMap');
const _ = require('golgoth/lodash');
const readJson = require('firost/readJson');
const glob = require('firost/glob');
const config = require('../src/_data/config.js');

(async function () {
  const credentials = {
    appId: config.algolia.appId,
    apiKey: process.env.ALGOLIA_API_KEY,
    indexName: config.algolia.indexName,
  };
  const settings = {
    searchableAttributes: ['title', 'description'],
    attributesForFaceting: ['game', 'gameSlug', 'uniqueSlug', 'type'],
    customRanking: ['desc(wordCount)'],
  };

  indexing.verbose();
  indexing.config({
    batchMaxSize: 100,
  });

  const files = await glob('./src/_data/baldur.json');
  const gameRecords = await pMap(files, async (filepath) => {
    const items = await readJson(filepath);
    return _.map(items, (item) => {
      const wordCount = _.words(item.description).length;
      return {
        ...item,
        wordCount,
      };
    });
  });
  const records = _.flatten(gameRecords);
  await indexing.fullAtomic(credentials, records, settings);
})();
