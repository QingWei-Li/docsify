import marked from 'marked';
import { isAbsolutePath, getPath, getParentPath } from '../router/util';
import { isFn, merge, cached, isPrimitive } from '../util/core';
import { tree as treeTpl } from './tpl';
import { genTree } from './gen-tree';
import { slugify } from './slugify';
import { emojify } from './emojify';
import { getAndRemoveConfig } from './utils';
import { imageCompiler } from './compiler/image';
import { highlightCodeCompiler } from './compiler/code';
import { paragraphCompiler } from './compiler/paragraph';
import { taskListCompiler } from './compiler/taskList';
import { taskListItemCompiler } from './compiler/taskListItem';
import { linkCompiler } from './compiler/link';

const cachedLinks = {};

const compileMedia = {
  markdown(url) {
    return {
      url,
    };
  },
  mermaid(url) {
    return {
      url,
    };
  },
  iframe(url, title) {
    return {
      html: `<iframe src="${url}" ${title ||
        'width=100% height=400'}></iframe>`,
    };
  },
  video(url, title) {
    return {
      html: `<video src="${url}" ${title || 'controls'}>Not Support</video>`,
    };
  },
  audio(url, title) {
    return {
      html: `<audio src="${url}" ${title || 'controls'}>Not Support</audio>`,
    };
  },
  code(url, title) {
    let lang = url.match(/\.(\w+)$/);

    lang = title || (lang && lang[1]);
    if (lang === 'md') {
      lang = 'markdown';
    }

    return {
      url,
      lang,
    };
  },
};

export class Compiler {
  constructor(config, router) {
    this.config = config;
    this.router = router;
    this.cacheTree = {};
    this.toc = [];
    this.cacheTOC = {};
    this.linkTarget = config.externalLinkTarget || '_blank';
    this.linkRel =
      this.linkTarget === '_blank' ? config.externalLinkRel || 'noopener' : '';
    this.contentBase = router.getBasePath();

    const renderer = this._initRenderer();
    this.heading = renderer.heading;
    let compile;
    const mdConf = config.markdown || {};

    if (isFn(mdConf)) {
      compile = mdConf(marked, renderer);
    } else {
      marked.setOptions(
        merge({}, mdConf, {
          renderer: merge(renderer, mdConf.renderer),
        })
      );
      compile = marked;
    }

    this._marked = compile;
    this.compile = text => {
      let isCached = true;
      // eslint-disable-next-line no-unused-vars
      const result = cached(_ => {
        isCached = false;
        let html = '';

        if (!text) {
          return text;
        }

        if (isPrimitive(text)) {
          html = compile(text);
        } else {
          html = compile.parser(text);
        }

        html = config.noEmoji ? html : emojify(html);
        slugify.clear();

        return html;
      })(text);

      const curFileName = this.router.parse().file;

      if (isCached) {
        this.toc = this.cacheTOC[curFileName];
      } else {
        this.cacheTOC[curFileName] = [...this.toc];
      }

      return result;
    };
  }

  /**
   * Pulls content from file and renders inline on the page as a embedded item.
   *
   * This allows you to embed different file types on the returned
   * page.
   * The basic format is:
   * ```
   *   [filename](_media/example.md ':include')
   * ```
   *
   * @param {string}   href   The href to the file to embed in the page.
   * @param {string}   title  Title of the link used to make the embed.
   *
   * @return {type} Return value description.
   */
  compileEmbed(href, title) {
    const { str, config } = getAndRemoveConfig(title);
    let embed;
    title = str;

    if (config.include) {
      if (!isAbsolutePath(href)) {
        href = getPath(
          process.env.SSR ? '' : this.contentBase,
          getParentPath(this.router.getCurrentPath()),
          href
        );
      }

      let media;
      if (config.type && (media = compileMedia[config.type])) {
        embed = media.call(this, href, title);
        embed.type = config.type;
      } else {
        let type = 'code';
        if (/\.(md|markdown)/.test(href)) {
          type = 'markdown';
        } else if (/\.mmd/.test(href)) {
          type = 'mermaid';
        } else if (/\.html?/.test(href)) {
          type = 'iframe';
        } else if (/\.(mp4|ogg)/.test(href)) {
          type = 'video';
        } else if (/\.mp3/.test(href)) {
          type = 'audio';
        }

        embed = compileMedia[type].call(this, href, title);
        embed.type = type;
      }

      embed.fragment = config.fragment;

      return embed;
    }
  }

  _matchNotCompileLink(link) {
    const links = this.config.noCompileLinks || [];

    for (let i = 0; i < links.length; i++) {
      const n = links[i];
      const re = cachedLinks[n] || (cachedLinks[n] = new RegExp(`^${n}$`));

      if (re.test(link)) {
        return link;
      }
    }
  }

  _initRenderer() {
    const renderer = new marked.Renderer();
    const { linkTarget, linkRel, router, contentBase } = this;
    const _self = this;
    const origin = {};

    /**
     * Render anchor tag
     * @link https://github.com/markedjs/marked#overriding-renderer-methods
     * @param {String} text Text content
     * @param {Number} level Type of heading (h<level> tag)
     * @returns {String} Heading element
     */
    origin.heading = renderer.heading = function(text, level) {
      let { str, config } = getAndRemoveConfig(text);
      const nextToc = { level, title: str };

      if (/<!-- {docsify-ignore} -->/g.test(str)) {
        str = str.replace('<!-- {docsify-ignore} -->', '');
        nextToc.title = str;
        nextToc.ignoreSubHeading = true;
      }

      if (/{docsify-ignore}/g.test(str)) {
        str = str.replace('{docsify-ignore}', '');
        nextToc.title = str;
        nextToc.ignoreSubHeading = true;
      }

      if (/<!-- {docsify-ignore-all} -->/g.test(str)) {
        str = str.replace('<!-- {docsify-ignore-all} -->', '');
        nextToc.title = str;
        nextToc.ignoreAllSubs = true;
      }

      if (/{docsify-ignore-all}/g.test(str)) {
        str = str.replace('{docsify-ignore-all}', '');
        nextToc.title = str;
        nextToc.ignoreAllSubs = true;
      }

      const slug = slugify(config.id || str);
      const url = router.toURL(router.getCurrentPath(), { id: slug });
      nextToc.slug = url;
      _self.toc.push(nextToc);

      return `<h${level} id="${slug}"><a href="${url}" data-id="${slug}" class="anchor"><span>${str}</span></a></h${level}>`;
    };

    origin.code = highlightCodeCompiler({ renderer });
    origin.link = linkCompiler({
      renderer,
      router,
      linkTarget,
      linkRel,
      compilerClass: _self,
    });
    origin.paragraph = paragraphCompiler({ renderer });
    origin.image = imageCompiler({ renderer, contentBase, router });
    origin.list = taskListCompiler({ renderer });
    origin.listitem = taskListItemCompiler({ renderer });

    renderer.origin = origin;

    return renderer;
  }

  /**
   * Compile sidebar
   * @param {String} text Text content
   * @param {Number} level Type of heading (h<level> tag)
   * @returns {String} Sidebar element
   */
  sidebar(text, level) {
    const { toc } = this;
    const currentPath = this.router.getCurrentPath();
    let html = '';

    if (text) {
      html = this.compile(text);
    } else {
      for (let i = 0; i < toc.length; i++) {
        if (toc[i].ignoreSubHeading) {
          const deletedHeaderLevel = toc[i].level;
          toc.splice(i, 1);
          // Remove headers who are under current header
          for (
            let j = i;
            j < toc.length && deletedHeaderLevel < toc[j].level;
            j++
          ) {
            toc.splice(j, 1) && j-- && i++;
          }

          i--;
        }
      }

      const tree = this.cacheTree[currentPath] || genTree(toc, level);
      html = treeTpl(tree, '<ul>{inner}</ul>');
      this.cacheTree[currentPath] = tree;
    }

    return html;
  }

  /**
   * Compile sub sidebar
   * @param {Number} level Type of heading (h<level> tag)
   * @returns {String} Sub-sidebar element
   */
  subSidebar(level) {
    if (!level) {
      this.toc = [];
      return treeTpl();
    }

    const currentPath = this.router.getCurrentPath();
    const { cacheTree, toc } = this;

    toc[0] && toc[0].ignoreAllSubs && toc.splice(0);
    toc[0] && toc[0].level === 1 && toc.shift();

    for (let i = 0; i < toc.length; i++) {
      toc[i].ignoreSubHeading && toc.splice(i, 1) && i--;
    }

    const tree = cacheTree[currentPath] || genTree(toc, level);

    cacheTree[currentPath] = tree;
    this.toc = [];
    return treeTpl(tree);
  }

  header(text, level) {
    return this.heading(text, level);
  }

  article(text) {
    return this.compile(text);
  }

  /**
   * Compile cover page
   * @param {Text} text Text content
   * @returns {String} Cover page
   */
  cover(text) {
    const cacheToc = this.toc.slice();
    const html = this.compile(text);

    this.toc = cacheToc.slice();

    return html;
  }
}
