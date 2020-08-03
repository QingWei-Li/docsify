/* eslint-disable no-unused-vars */
import { getParentPath, stringifyQuery } from '../router/util';
import { noop } from '../util/core';
import { getAndActive } from '../event/sidebar';
import { get } from './ajax';

/**
 * This class provides methods for fetching content (f.e. markdown pages). It
 * coordinates renderMixin with help from the router.
 */
export function fetchMixin(Base = class {}) {
  return class extends Base {
    constructor() {
      super();
      this._lastRequest = null;
    }

    _abort() {
      return (
        this._lastRequest &&
        this._lastRequest.abort &&
        this._lastRequest.abort()
      );
    }

    _request(url, hasbar, requestHeaders) {
      this._abort();
      this._lastRequest = get(url, true, requestHeaders);
      return this._lastRequest;
    }

    _get404Path(path, config) {
      const { notFoundPage, ext } = config;
      const defaultPath = '_404' + (ext || '.md');
      let key;
      let path404;

      switch (typeof notFoundPage) {
        case 'boolean':
          path404 = defaultPath;
          break;
        case 'string':
          path404 = notFoundPage;
          break;

        case 'object':
          key = Object.keys(notFoundPage)
            .sort((a, b) => b.length - a.length)
            .find(key => path.match(new RegExp('^' + key)));

          path404 = (key && notFoundPage[key]) || defaultPath;
          break;

        default:
          break;
      }

      return path404;
    }

    _loadSideAndNav(path, qs, loadSidebar, cb) {
      return () => {
        if (!loadSidebar) {
          return cb();
        }

        const fn = result => {
          this._renderSidebar(result);
          cb();
        };

        // Load sidebar
        this._loadNested(path, qs, loadSidebar, fn, true);
      };
    }

    _fetch(cb = noop) {
      const { path, query } = this.route;
      const qs = stringifyQuery(query, ['id']);
      const { loadNavbar, requestHeaders, loadSidebar } = this.config;
      // Abort last request

      const file = this.router.getFile(path);
      const req = this._request(file + qs, true, requestHeaders);

      this.isRemoteUrl = isExternal(file);
      // Current page is html
      this.isHTML = /\.html$/g.test(file);

      // Load main content
      req.then(
        (text, opt) =>
          this._renderMain(
            text,
            opt,
            this._loadSideAndNav(path, qs, loadSidebar, cb)
          ),
        _ => {
          this._fetchFallbackPage(file, qs, cb) || this._fetch404(file, qs, cb);
        }
      );

      // Load nav
      loadNavbar &&
        this._loadNested(
          path,
          qs,
          loadNavbar,
          text => this._renderNav(text),
          true
        );
    }

    _loadNested(path, qs, file, next, first) {
      path = first ? path : path.replace(/\/$/, '');
      path = getParentPath(path);

      if (!path) {
        return;
      }

      get(
        this.router.getFile(path + file) + qs,
        false,
        this.config.requestHeaders
      ).then(next, _ => this._loadNested(path, qs, file, next));
    }

    _fetchCover() {
      const { coverpage, requestHeaders } = this.config;
      const query = this.route.query;
      const root = getParentPath(this.route.path);

      if (coverpage) {
        let path = null;
        const routePath = this.route.path;
        if (typeof coverpage === 'string') {
          if (routePath === '/') {
            path = coverpage;
          }
        } else if (Array.isArray(coverpage)) {
          path = coverpage.indexOf(routePath) > -1 && '_coverpage';
        } else {
          const cover = coverpage[routePath];
          path = cover === true ? '_coverpage' : cover;
        }

        const coverOnly = Boolean(path) && this.config.onlyCover;
        if (path) {
          path = this.router.getFile(root + path);
          this.coverIsHTML = /\.html$/g.test(path);
          get(
            path + stringifyQuery(query, ['id']),
            false,
            requestHeaders
          ).then(text => this._renderCover(text, coverOnly));
        } else {
          this._renderCover(null, coverOnly);
        }

        return coverOnly;
      }
    }

    $fetch(cb = noop, $resetEvents = this.$resetEvents.bind(this)) {
      const done = () => {
        this.callHook('doneEach');
        cb();
      };

      const onlyCover = this._fetchCover();

      if (onlyCover) {
        done();
      } else {
        this._fetch(() => {
          $resetEvents();
          done();
        });
      }
    }

    _fetchFallbackPage(path, qs, cb = noop) {
      const { requestHeaders, fallbackLanguages, loadSidebar } = this.config;

      if (!fallbackLanguages) {
        return false;
      }

      const local = path.split('/')[1];

      if (fallbackLanguages.indexOf(local) === -1) {
        return false;
      }

      const newPath = path.replace(new RegExp(`^/${local}`), '');
      const req = this._request(newPath + qs, true, requestHeaders);

      req.then(
        (text, opt) =>
          this._renderMain(
            text,
            opt,
            this._loadSideAndNav(path, qs, loadSidebar, cb)
          ),
        () => this._fetch404(path, qs, cb)
      );

      return true;
    }

    /**
     * Load the 404 page
     * @param {String} path URL to be loaded
     * @param {*} qs TODO: define
     * @param {Function} cb Callback
     * @returns {Boolean} True if the requested page is not found
     * @private
     */
    _fetch404(path, qs, cb = noop) {
      const { loadSidebar, requestHeaders, notFoundPage } = this.config;

      const fnLoadSideAndNav = this._loadSideAndNav(path, qs, loadSidebar, cb);
      if (notFoundPage) {
        const path404 = this._get404Path(path, this.config);

        this._request(this.router.getFile(path404), true, requestHeaders).then(
          (text, opt) => this._renderMain(text, opt, fnLoadSideAndNav),
          () => this._renderMain(null, {}, fnLoadSideAndNav)
        );
        return true;
      }

      this._renderMain(null, {}, fnLoadSideAndNav);
      return false;
    }

    initFetch() {
      const { loadSidebar } = this.config;

      // Server-Side Rendering
      if (this.rendered) {
        const activeEl = getAndActive(this.router, '.sidebar-nav', true, true);
        if (loadSidebar && activeEl) {
          activeEl.parentNode.innerHTML += window.__SUB_SIDEBAR__;
        }

        this._bindEventOnRendered(activeEl);
        this.$resetEvents();
        this.callHook('doneEach');
        this.callHook('ready');
      } else {
        this.$fetch(_ => this.callHook('ready'));
      }
    }
  };
}

function isExternal(url) {
  let match = url.match(
    /^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/
  );
  if (
    typeof match[1] === 'string' &&
    match[1].length > 0 &&
    match[1].toLowerCase() !== location.protocol
  ) {
    return true;
  }
  if (
    typeof match[2] === 'string' &&
    match[2].length > 0 &&
    match[2].replace(
      new RegExp(
        ':(' + { 'http:': 80, 'https:': 443 }[location.protocol] + ')?$'
      ),
      ''
    ) !== location.host
  ) {
    return true;
  }
  return false;
}
