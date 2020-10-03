import { inBrowser } from '../../util/env';
import { on } from '../../util/dom';
import { parseQuery } from '../util';
import { History } from './base';
import { HashHistory } from './hash';
import { HTML5History } from './html5';

export class AbstractHistory extends History {
  constructor(config) {
    super(config);
    this.mode = this.config.routerMode;
  }

  onchange() {
    if (inBrowser) {
      on('hashchange', e => {
        let hash = e.target.location.hash;
        let parsed = this.parse(hash);
        let path = parsed.path;

        window.open(path, '_self');
      });
    }
  }

  parse(path = '') {
    if (this.mode === 'history') {
      let query = '';

      const queryIndex = path.indexOf('?');
      if (queryIndex >= 0) {
        query = path.slice(queryIndex + 1);
        path = path.slice(0, queryIndex);
      }

      return {
        path,
        file: this.getFile(path),
        query: parseQuery(query),
      };
    } else {
      return HashHistory.prototype.parse.bind(this)(path);
    }
  }

  toURL(path, params, currentRoute = '') {
    return this.mode === 'history'
      ? HTML5History.prototype.toURL.bind(this)(path, params, currentRoute)
      : HashHistory.prototype.toURL.bind(this)(path, params, currentRoute);
  }
}
