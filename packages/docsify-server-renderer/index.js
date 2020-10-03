import { readFileSync } from 'fs';
import { resolve as resolvePath, isAbsolute, basename } from 'path';
import { resolve as resolveUrl } from 'url';
import fetch from 'node-fetch';
import debug from 'debug';
import DOMPurify from 'dompurify';
import { AbstractHistory } from '../../src/core/router/history/abstract';
import { Compiler } from '../../src/core/render/compiler';
import configHandler from '../../src/core/config';
import * as tpl from '../../src/core/render/tpl';
import { prerenderEmbed } from '../../src/core/render/embed';

function resolve(base, ...args) {
  for (let i in args) {
    let arg = args[i];
    if (isExternal(arg)) {
      return resolveUrl('', ...args);
    }
  }
  if (isExternal(base)) {
    return resolveUrl(base, ...args);
  } else if (isAbsolute(base)) {
    return resolvePath(base, ...args);
  } else {
    return resolvePath(process.cwd(), base, ...args);
  }
}

function isExternal(url) {
  let check = /^https?:\/\//gi.test(url);
  return check;
}

function mainTpl(config) {
  let html = `<nav class="app-nav${
    config.repo ? '' : ' no-badge'
  }"><!--navbar--></nav>`;

  if (config.repo) {
    html += tpl.corner(config.repo);
  }

  if (config.coverpage) {
    html += tpl.cover();
  }

  html += tpl.main(config);

  return html;
}

export default class Renderer {
  constructor({ template, config, cache }) {
    this.html = template;
    this.cache = cache;
    this.config = config = configHandler(null, config);

    this.router = new AbstractHistory(config);
    this.compiler = new Compiler(config, this.router);

    this.basePath = this.router.getBasePath();
    this.isExternal = isExternal(this.basePath);

    this._renderHtml(
      'inject-config',
      `<script>window.$docsify = ${JSON.stringify(
        this._getWebConfig()
      )}</script>`
    );
    this._renderHtml('inject-app', mainTpl(config));

    this.template = this.html;
  }

  async renderToString(url) {
    this.html = this.template;
    this.url = url = this.router.getFile(url, true);
    const { loadSidebar, loadNavbar, coverpage } = this.config;

    const mainFile = this._getPath(url);
    this._renderHtml('main', await this._render(mainFile, 'main'));

    if (loadSidebar) {
      const name = loadSidebar === true ? '_sidebar.md' : loadSidebar;
      const sidebarFile = this._getPath(name);
      this._renderHtml('sidebar', await this._render(sidebarFile, 'sidebar'));
    }

    if (loadNavbar) {
      const name = loadNavbar === true ? '_navbar.md' : loadNavbar;
      const navbarFile = this._getPath(name);
      this._renderHtml('navbar', await this._render(navbarFile, 'navbar'));
    }

    if (coverpage) {
      let path = null;
      if (typeof coverpage === 'string') {
        if (url === '/') {
          path = coverpage;
        }
      } else if (Array.isArray(coverpage)) {
        path = coverpage.indexOf(url) > -1 && '_coverpage.md';
      } else {
        const cover = coverpage[url];
        path = cover === true ? '_coverpage.md' : cover;
      }

      const coverFile = this._getPath(path);
      this._renderHtml('cover', await this._render(coverFile, 'cover'));
    }

    let html = this.isExternal ? DOMPurify.sanitize(this.html) : this.html;
    return html;
  }

  _getWebConfig() {
    let config = Object.assign({}, this.config);
    config.routerMode = 'abstract';

    if (!this.isExternal) {
      config.basePath = config.baseUrl;
      delete config.baseUrl;
    }

    return config;
  }

  _getPath(url) {
    let path = this.router.getFile(url, true);
    let outPath = resolve(this.basePath, path);

    return outPath;
  }

  async _loadFile(filePath) {
    debug('docsify')(`load > ${filePath}`);
    let content;

    try {
      if (isExternal(filePath)) {
        const res = await fetch(filePath);
        if (!res.ok) {
          throw Error();
        }

        content = await res.text();
        this.lock = 0;
      } else {
        filePath = resolve(filePath);
        content = await readFileSync(filePath, 'utf8');
        this.lock = 0;
      }

      return content;
    } catch (e) {
      this.lock = this.lock || 0;
      if (++this.lock > 10) {
        this.lock = 0;
        return;
      }

      const fileName = basename(filePath);
      const result = await this._loadFile(resolve(filePath, `../${fileName}`));

      return result;
    }
  }

  async _render(path, type) {
    let html = await this._loadFile(path);
    const { subMaxLevel, maxLevel } = this.config;
    let tokens;

    switch (type) {
      case 'sidebar':
        html =
          this.compiler.sidebar(html, maxLevel) +
          `<script>window.__SUB_SIDEBAR__ = ${JSON.stringify(
            this.compiler.subSidebar(subMaxLevel)
          )}</script>`;
        break;
      case 'cover':
        html = this.compiler.cover(html);
        break;
      case 'main':
        tokens = await new Promise(r => {
          prerenderEmbed(
            {
              fetch: url => this._loadFile(this._getPath(url)),
              compiler: this.compiler,
              raw: html,
            },
            r
          );
        });
        html = this.compiler.compile(tokens);
        break;
      case 'navbar':
      case 'article':
      default:
        html = this.compiler.compile(html);
        break;
    }

    return html;
  }

  _renderHtml(match, content) {
    this.html = this.html.replace(new RegExp(`<!--${match}-->`, 'g'), content);
  }
}

Renderer.version = '__VERSION__';
