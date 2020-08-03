import { supportsPushState } from '../util/env';
import * as dom from '../util/dom';
import { noop } from '../util/core';
import { HashHistory } from './history/hash';
import { HTML5History } from './history/html5';

/**
 * This class wires up the mechanisms that react to URL changes of the browser
 * address bar.
 */
export function routerMixin(Base = class {}) {
  return class extends Base {
    constructor() {
      super();
      this._lastRoute = {};
    }

    initRouter() {
      const config = this.config;
      const mode = config.routerMode || 'hash';
      let router;

      if (mode === 'history' && supportsPushState) {
        router = new HTML5History(config);
      } else {
        router = new HashHistory(config);
      }

      this.router = router;
      this._router_updateRender();
      this._lastRoute = this.route;

      // eslint-disable-next-line no-unused-vars
      router.onchange(params => {
        this._router_updateRender();
        this._render_updateRender();

        if (this._lastRoute.path === this.route.path) {
          this.$resetEvents(params.source);
          return;
        }

        this.$fetch(noop, this.$resetEvents.bind(this, params.source));
        this._lastRoute = this.route;
      });
    }

    _router_updateRender() {
      this.router.normalize();
      this.route = this.router.parse();
      dom.body.setAttribute('data-page', this.route.file);
    }
  };
}
