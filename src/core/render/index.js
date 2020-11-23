/* eslint-disable no-unused-vars */
import tinydate from 'tinydate';
import DOMPurify from 'dompurify';
import * as dom from '../util/dom';
import cssVars from '../util/polyfill/css-vars';
import { callHook } from '../init/lifecycle';
import { getAndActive, sticky } from '../event/sidebar';
import { getPath, isAbsolutePath } from '../router/util';
import { isMobile, inBrowser } from '../util/env';
import { isPrimitive } from '../util/core';
import { scrollActiveSidebar } from '../event/scroll';
import { Compiler } from './compiler';
import * as tpl from './tpl';
import { prerenderEmbed } from './embed';

function executeScript() {
  const script = dom
    .findAll('.markdown-section>script')
    .filter(s => !/template/.test(s.type))[0];
  if (!script) {
    return false;
  }

  const code = script.innerText.trim();
  if (!code) {
    return false;
  }

  new Function(code)();
}

function formatUpdated(html, updated, fn) {
  updated =
    typeof fn === 'function'
      ? fn(updated)
      : typeof fn === 'string'
      ? tinydate(fn)(new Date(updated))
      : updated;

  return html.replace(/{docsify-updated}/g, updated);
}

function renderMain(html) {
  if (!html) {
    html = '<h1>404 - Not found</h1>';
  }

  this._renderTo('.markdown-section', html);

  // Render sidebar with the TOC
  !this.config.hideSidebar && !this.config.loadSidebar && this._renderSidebar();

  // Execute markdown <script>
  if (
    this.config.executeScript ||
    ('Vue' in window && this.config.executeScript !== false)
  ) {
    executeScript();
  }

  // Handle Vue content not handled by markdown <script>
  if ('Vue' in window) {
    const mainElm = document.querySelector('#main') || {};
    const childElms = mainElm.children || [];
    const vueVersion =
      window.Vue.version && Number(window.Vue.version.charAt(0));

    for (let i = 0, len = childElms.length; i < len; i++) {
      const elm = childElms[i];
      const isValid = elm.tagName !== 'SCRIPT';

      if (!isValid) {
        continue;
      }

      // Vue 3
      if (vueVersion === 3) {
        const isAlreadyVue = Boolean(elm._vnode && elm._vnode.__v_skip);

        if (!isAlreadyVue) {
          const app = window.Vue.createApp({});

          app.mount(elm);
        }
      }
      // Vue 2
      else if (vueVersion === 2) {
        const isAlreadyVue = Boolean(elm.__vue__ && elm.__vue__._isVue);

        if (!isAlreadyVue) {
          new window.Vue({
            mounted: function() {
              this.$destroy();
            },
          }).$mount(elm);
        }
      }
    }
  }
}

function renderNameLink(vm) {
  const el = dom.getNode('.app-name-link');
  const nameLink = vm.config.nameLink;
  const path = vm.route.path;

  if (!el) {
    return;
  }

  if (isPrimitive(vm.config.nameLink)) {
    el.setAttribute('href', nameLink);
  } else if (typeof nameLink === 'object') {
    const match = Object.keys(nameLink).filter(
      key => path.indexOf(key) > -1
    )[0];

    el.setAttribute('href', nameLink[match]);
  }
}

export function renderMixin(proto) {
  proto._renderTo = function(el, content, replace) {
    const node = dom.getNode(el);
    if (node) {
      node[replace ? 'outerHTML' : 'innerHTML'] = content;
    }
  };

  proto._renderSidebar = function(text) {
    const { maxLevel, subMaxLevel, loadSidebar } = this.config;

    this._renderTo('.sidebar-nav', this.compiler.sidebar(text, maxLevel));
    const activeEl = getAndActive(this.router, '.sidebar-nav', true, true);
    if (loadSidebar && activeEl) {
      activeEl.parentNode.innerHTML +=
        this.compiler.subSidebar(subMaxLevel) || '';
    } else {
      // Reset toc
      this.compiler.subSidebar();
    }

    // Bind event
    this._bindEventOnRendered(activeEl);
  };

  proto._bindEventOnRendered = function(activeEl) {
    const { autoHeader } = this.config;

    scrollActiveSidebar(this.router);

    if (autoHeader && activeEl) {
      const main = dom.getNode('#main');
      const firstNode = main.children[0];
      if (firstNode && firstNode.tagName !== 'H1') {
        const h1 = this.compiler.header(activeEl.innerText, 1);
        const wrapper = dom.create('div', h1);
        dom.before(main, wrapper.children[0]);
      }
    }
  };

  proto._renderNav = function(text) {
    text && this._renderTo('nav', this.compiler.compile(text));
    if (this.config.loadNavbar) {
      getAndActive(this.router, 'nav');
    }
  };

  proto._renderMain = function(text, opt = {}, next) {
    if (!text) {
      return renderMain.call(this, text);
    }

    callHook(this, 'beforeEach', text, result => {
      let html;
      const callback = () => {
        if (opt.updatedAt) {
          html = formatUpdated(html, opt.updatedAt, this.config.formatUpdated);
        }

        callHook(this, 'afterEach', html, hookData =>
          renderMain.call(this, hookData)
        );
      };

      if (this.isHTML) {
        html = this.result = text;
        callback();
        next();
      } else {
        prerenderEmbed(
          {
            compiler: this.compiler,
            raw: result,
          },
          tokens => {
            html = this.compiler.compile(tokens);
            html = this.isRemoteUrl ? DOMPurify.sanitize(html) : html;
            callback();
            next();
          }
        );
      }
    });
  };

  proto._renderCover = function(text, coverOnly) {
    const el = dom.getNode('.cover');

    dom.toggleClass(
      dom.getNode('main'),
      coverOnly ? 'add' : 'remove',
      'hidden'
    );
    if (!text) {
      dom.toggleClass(el, 'remove', 'show');
      return;
    }

    dom.toggleClass(el, 'add', 'show');

    let html = this.coverIsHTML ? text : this.compiler.cover(text);

    const m = html
      .trim()
      .match('<p><img.*?data-origin="(.*?)"[^a]+alt="(.*?)">([^<]*?)</p>$');

    if (m) {
      if (m[2] === 'color') {
        el.style.background = m[1] + (m[3] || '');
      } else {
        let path = m[1];

        dom.toggleClass(el, 'add', 'has-mask');
        if (!isAbsolutePath(m[1])) {
          path = getPath(this.router.getBasePath(), m[1]);
        }

        el.style.backgroundImage = `url(${path})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center center';
      }

      html = html.replace(m[0], '');
    }

    this._renderTo('.cover-main', html);
    sticky();
  };

  proto._updateRender = function() {
    // Render name link
    renderNameLink(this);
  };
}

export function initRender(vm) {
  const config = vm.config;

  // Init markdown compiler
  vm.compiler = new Compiler(config, vm.router);
  if (inBrowser) {
    /* eslint-disable-next-line camelcase */
    window.__current_docsify_compiler__ = vm.compiler;
  }

  const id = config.el || '#app';
  const navEl = dom.find('nav') || dom.create('nav');

  const el = dom.find(id);
  let html = '';
  let navAppendToTarget = dom.body;

  if (el) {
    if (config.repo) {
      html += tpl.corner(config.repo, config.cornerExternalLinkTarge);
    }

    if (config.coverpage) {
      html += tpl.cover();
    }

    if (config.logo) {
      const isBase64 = /^data:image/.test(config.logo);
      const isExternal = /(?:http[s]?:)?\/\//.test(config.logo);
      const isRelative = /^\./.test(config.logo);

      if (!isBase64 && !isExternal && !isRelative) {
        config.logo = getPath(vm.router.getBasePath(), config.logo);
      }
    }

    html += tpl.main(config);
    // Render main app
    vm._renderTo(el, html, true);
  } else {
    vm.rendered = true;
  }

  if (config.mergeNavbar && isMobile) {
    navAppendToTarget = dom.find('.sidebar');
  } else {
    navEl.classList.add('app-nav');

    if (!config.repo) {
      navEl.classList.add('no-badge');
    }
  }

  // Add nav
  if (config.loadNavbar) {
    dom.before(navAppendToTarget, navEl);
  }

  if (config.themeColor) {
    dom.$.head.appendChild(
      dom.create('div', tpl.theme(config.themeColor)).firstElementChild
    );
    // Polyfll
    cssVars(config.themeColor);
  }

  vm._updateRender();
  dom.toggleClass(dom.body, 'ready');
}
