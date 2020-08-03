import { documentReady } from './util/dom';
import { Docsify } from './Docsify';
import initGlobalAPI from './global-api';

initGlobalAPI();

/**
 * Run Docsify
 */
// eslint-disable-next-line no-unused-vars
documentReady(_ => new Docsify());
