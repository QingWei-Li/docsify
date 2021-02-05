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

let vueGlobalData;

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
  const docsifyConfig = this.config;
  const markdownElm = dom.find('.markdown-section');
  const vueVersion =
    'Vue' in window &&
    window.Vue.version &&
    Number(window.Vue.version.charAt(0));

  const isMountedVue = elm => {
    const isVue2 = Boolean(elm.__vue__ && elm.__vue__._isVue);
    const isVue3 = Boolean(elm._vnode && elm._vnode.__v_skip);

    return isVue2 || isVue3;
  };

  if (!html) {
    html = '<h1>404 - Not found</h1>';
  }

  if ('Vue' in window) {
    const mountedElms = dom
      .findAll('.markdown-section > *')
      .filter(elm => isMountedVue(elm));

    // Destroy/unmount existing Vue instances
    for (const mountedElm of mountedElms) {
      if (vueVersion === 2) {
        mountedElm.__vue__.$destroy();
      } else if (vueVersion === 3) {
        mountedElm.__vue_app__.unmount();
      }
    }
  }

  this._renderTo(markdownElm, html);

  // Render sidebar with the TOC
  !docsifyConfig.loadSidebar && this._renderSidebar();

  // Execute markdown <script>
  if (
    docsifyConfig.executeScript ||
    ('Vue' in window && docsifyConfig.executeScript !== false)
  ) {
    executeScript();
  }

  // Handle Vue content not mounted by markdown <script>
  if ('Vue' in window) {
    const vueMountData = [];
    const vueComponentNames = Object.keys(docsifyConfig.vueComponents || {});

    // Register global vueComponents
    if (vueVersion === 2 && vueComponentNames.length) {
      vueComponentNames.forEach(name => {
        const isNotRegistered = !window.Vue.options.components[name];

        if (isNotRegistered) {
          window.Vue.component(name, docsifyConfig.vueComponents[name]);
        }
      });
    }

    // Store global data() return value as shared data object
    if (
      !vueGlobalData &&
      docsifyConfig.vueGlobalOptions &&
      typeof docsifyConfig.vueGlobalOptions.data === 'function'
    ) {
      vueGlobalData = docsifyConfig.vueGlobalOptions.data();
    }

    // vueMounts
    vueMountData.push(
      ...Object.entries(docsifyConfig.vueMounts || {})
        .map(([cssSelector, vueConfig]) => [
          dom.find(markdownElm, cssSelector),
          vueConfig,
        ])
        .filter(([elm, vueConfig]) => elm)
    );

    // Template syntax, vueComponents, vueGlobalOptions
    if (docsifyConfig.vueGlobalOptions || vueComponentNames.length) {
      const reHasBraces = /{{2}[^{}]*}{2}/;
      // Matches Vue full and shorthand syntax as attributes in HTML tags.
      //
      // Full syntax examples:
      // v-foo, v-foo[bar], v-foo-bar, v-foo:bar-baz.prop
      //
      // Shorthand syntax examples:
      // @foo, @foo.bar, @foo.bar.baz, @[foo], :foo, :[foo]
      //
      // Markup examples:
      // <div v-html>{{ html }}</div>
      // <div v-text="msg"></div>
      // <div v-bind:text-content.prop="text">
      // <button v-on:click="doThis"></button>
      // <button v-on:click.once="doThis"></button>
      // <button v-on:[event]="doThis"></button>
      // <button @click.stop.prevent="doThis">
      // <a :href="url">
      // <a :[key]="url">
      const reHasDirective = /<[^>/]+\s([@:]|v-)[\w-:.[\]]+[=>\s]/;

      vueMountData.push(
        ...dom
          .findAll('.markdown-section > *')
          // Remove duplicates
          .filter(elm => !vueMountData.some(([e, c]) => e === elm))
          // Detect Vue content
          .filter(elm => {
            const isVueMount =
              // is a component
              elm.tagName.toLowerCase() in
                (docsifyConfig.vueComponents || {}) ||
              // has a component(s)
              elm.querySelector(vueComponentNames.join(',') || null) ||
              // has curly braces
              reHasBraces.test(elm.outerHTML) ||
              // has content directive
              reHasDirective.test(elm.outerHTML);

            return isVueMount;
          })
          .map(elm => {
            // Clone global configuration
            const vueConfig = Object.assign(
              {},
              docsifyConfig.vueGlobalOptions || {}
            );

            // Replace vueGlobalOptions data() return value with shared data object.
            // This provides a global store for all Vue instances that receive
            // vueGlobalOptions as their configuration.
            if (vueGlobalData) {
              vueConfig.data = function() {
                return vueGlobalData;
              };
            }

            return [elm, vueConfig];
          })
      );
    }

    // Mount
    for (const [mountElm, vueConfig] of vueMountData) {
      const isVueAttr = 'data-isvue';
      const isSkipElm =
        // Is an invalid tag
        mountElm.matches('pre, script') ||
        // Is a mounted instance
        isMountedVue(mountElm) ||
        // Has mounted instance(s)
        mountElm.querySelector(`[${isVueAttr}]`);

      if (!isSkipElm) {
        mountElm.setAttribute(isVueAttr, '');

        if (vueVersion === 2) {
          vueConfig.el = undefined;
          new window.Vue(vueConfig).$mount(mountElm);
        } else if (vueVersion === 3) {
          const app = window.Vue.createApp(vueConfig);

          // Register global vueComponents
          vueComponentNames.forEach(name => {
            const config = docsifyConfig.vueComponents[name];

            app.component(name, config);
          });

          app.mount(mountElm);
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
    const { maxLevel, subMaxLevel, loadSidebar, hideSidebar } = this.config;

    if (hideSidebar) {
      // FIXME : better styling solution
      document.querySelector('aside.sidebar').remove();
      document.querySelector('button.sidebar-toggle').remove();
      document.querySelector('section.content').style.right = 'unset';
      document.querySelector('section.content').style.left = 'unset';
      document.querySelector('section.content').style.position = 'relative';
      document.querySelector('section.content').style.width = '100%';
      return null;
    }

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
            // add "target" attribute to DOMPurify white list to handle external links
            html = this.isRemoteUrl
              ? DOMPurify.sanitize(html, { ADD_ATTR: ['target'] })
              : html;
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
