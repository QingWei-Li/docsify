/* eslint-disable no-unused-vars */
import tinydate from 'tinydate';
import DOMPurify from 'dompurify';
import * as dom from '../util/dom';
import cssVars from '../util/polyfill/css-vars';
import { getAndActive, sticky } from '../event/sidebar';
import { getPath, isAbsolutePath } from '../router/util';
import { isMobile, inBrowser } from '../util/env';
import { isPrimitive } from '../util/core';
import { scrollActiveSidebar } from '../event/scroll';
import { Compiler } from './compiler';
import * as tpl from './tpl';
import { prerenderEmbed } from './embed';

/**
 * This class is provides methods for rendering the Docsify site content using
 * the Compiler to convert markdown into HTML. It wires up the Compiler with
 * the router.
 */
export function renderMixin(Base = class {}) {
  return class extends Base {
    _executeScript() {
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

      setTimeout(_ => {
        window.__EXECUTE_RESULT__ = new Function(code)();
      }, 0);
    }

    _formatUpdated(html, updated, fn) {
      updated =
        typeof fn === 'function'
          ? fn(updated)
          : typeof fn === 'string'
          ? tinydate(fn)(new Date(updated))
          : updated;

      return html.replace(/{docsify-updated}/g, updated);
    }

    __renderMain(html) {
      if (!html) {
        html = '<h1>404 - Not found</h1>';
      }

      this._renderTo('.markdown-section', html);
      // Render sidebar with the TOC
      !this.config.loadSidebar && this._renderSidebar();

      // Execute script
      if (
        this.config.executeScript !== false &&
        typeof window.Vue !== 'undefined' &&
        !this._executeScript()
      ) {
        setTimeout(_ => {
          const vueVM = window.__EXECUTE_RESULT__;
          vueVM && vueVM.$destroy && vueVM.$destroy();
          window.__EXECUTE_RESULT__ = new window.Vue().$mount('#main');
        }, 0);
      } else {
        this.config.executeScript && this._executeScript();
      }
    }

    _renderNameLink(vm) {
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

    _renderTo(el, content, replace) {
      const node = dom.getNode(el);
      if (node) {
        node[replace ? 'outerHTML' : 'innerHTML'] = content;
      }
    }

    _renderSidebar(text) {
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
    }

    _bindEventOnRendered(activeEl) {
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
    }

    _renderNav(text) {
      text && this._renderTo('nav', this.compiler.compile(text));
      if (this.config.loadNavbar) {
        getAndActive(this.router, 'nav');
      }
    }

    _renderMain(text, opt = {}, next) {
      if (!text) {
        return this.__renderMain(text);
      }

      this.callHook('beforeEach', text, result => {
        let html;
        const callback = () => {
          if (opt.updatedAt) {
            html = this._formatUpdated(
              html,
              opt.updatedAt,
              this.config.formatUpdated
            );
          }

          this.callHook('afterEach', html, text => this.__renderMain(text));
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
    }

    _renderCover(text, coverOnly) {
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
    }

    _render_updateRender() {
      // Render name link
      this._renderNameLink(this);
    }

    initRender() {
      const config = this.config;

      // Init markdown compiler
      this.compiler = new Compiler(config, this.router);
      if (inBrowser) {
        // TODO @trusktr, get rid of globals!
        window.__current_docsify_compiler__ = this.compiler;
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
            config.logo = getPath(this.router.getBasePath(), config.logo);
          }
        }

        html += tpl.main(config);
        // Render main app
        this._renderTo(el, html, true);
      } else {
        this.rendered = true;
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

      this._render_updateRender();
      dom.toggleClass(dom.body, 'ready');
    }
  };
}
