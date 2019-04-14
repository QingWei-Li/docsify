import * as dom from '../util/dom'
import * as tpl from './tpl'
import cssVars from '../util/polyfill/css-vars'
import tinydate from 'tinydate'
import {callHook} from '../init/lifecycle'
import {Compiler} from './compiler'
import {getAndActive, sticky} from '../event/sidebar'
import {getPath, isAbsolutePath} from '../router/util'
import {isMobile, inBrowser} from '../util/env'
import {isPrimitive} from '../util/core'
import {scrollActiveSidebar, scroll2Top} from '../event/scroll'
import {prerenderEmbed} from './embed'

function executeScript() {
  const script = dom
    .findAll('.markdown-section>script')
    .filter(s => !/template/.test(s.type))[0]
  if (!script) {
    return false
  }
  const code = script.innerText.trim()
  if (!code) {
    return false
  }

  setTimeout(_ => {
    window.__EXECUTE_RESULT__ = new Function(code)()
  }, 0)
}

function formatUpdated(html, updated, fn) {
  updated =
    typeof fn === 'function' ?
      fn(updated) :
      typeof fn === 'string' ?
        tinydate(fn)(new Date(updated)) :
        updated

  return html.replace(/{docsify-updated}/g, updated)
}

function renderMain(html) {
  if (!html) {
    html = '<h1>404 - Not found</h1>'
  }

  this._renderTo('.markdown-section', html)
  // Render sidebar with the TOC
  !this.config.loadSidebar && this._renderSidebar()

  // Execute script
  if (
    this.config.executeScript !== false &&
    typeof window.Vue !== 'undefined' &&
    !executeScript()
  ) {
    setTimeout(_ => {
      const vueVM = window.__EXECUTE_RESULT__
      vueVM && vueVM.$destroy && vueVM.$destroy()
      window.__EXECUTE_RESULT__ = new window.Vue().$mount('#main')
    }, 0)
  } else {
    this.config.executeScript && executeScript()
  }
}

function renderNameLink(vm) {
  const el = dom.getNode('.app-name-link')
  const nameLink = vm.config.nameLink
  const path = vm.route.path

  if (!el) {
    return
  }

  if (isPrimitive(vm.config.nameLink)) {
    el.setAttribute('href', nameLink)
  } else if (typeof nameLink === 'object') {
    const match = Object.keys(nameLink).filter(key => path.indexOf(key) > -1)[0]

    el.setAttribute('href', nameLink[match])
  }
}

export function renderMixin(proto) {
  proto._renderTo = function (el, content, replace) {
    const node = dom.getNode(el)
    if (node) {
      node[replace ? 'outerHTML' : 'innerHTML'] = content
    }
  }

  proto._renderSidebar = function (text) {
    const {maxLevel, subMaxLevel, loadSidebar} = this.config

    this._renderTo('.sidebar-nav', this.compiler.sidebar(text, maxLevel))
    const activeEl = getAndActive(this.router, '.sidebar-nav', true, true)
    if (loadSidebar && activeEl) {
      activeEl.parentNode.innerHTML +=
        this.compiler.subSidebar(subMaxLevel) || ''
    } else {
      // Reset toc
      this.compiler.subSidebar()
    }
    // Bind event
    this._bindEventOnRendered(activeEl)
  }

  proto._bindEventOnRendered = function (activeEl) {
    const {autoHeader, auto2top} = this.config

    scrollActiveSidebar(this.router)

    if (autoHeader && activeEl) {
      const main = dom.getNode('#main')
      const firstNode = main.children[0]
      if (firstNode && firstNode.tagName !== 'H1') {
        const h1 = dom.create('h1')
        h1.innerText = activeEl.innerText
        dom.before(main, h1)
      }
    }

    auto2top && scroll2Top(auto2top)
  }

  proto._renderNav = function (text) {
    text && this._renderTo('nav', this.compiler.compile(text))
    if (this.config.loadNavbar) {
      getAndActive(this.router, 'nav')
    }
  }

  proto._renderMain = function (text, opt = {}, next) {
    if (!text) {
      return renderMain.call(this, text)
    }

    callHook(this, 'beforeEach', text, result => {
      let html
      const callback = () => {
        if (opt.updatedAt) {
          html = formatUpdated(html, opt.updatedAt, this.config.formatUpdated)
        }

        callHook(this, 'afterEach', html, text => renderMain.call(this, text))
      }
      if (this.isHTML) {
        html = this.result = text
        callback()
        next()
      } else {
        prerenderEmbed(
          {
            compiler: this.compiler,
            raw: result
          },
          tokens => {
            html = this.compiler.compile(tokens)
            callback()
            next()
          }
        )
      }
    })
  }

  proto._renderCover = function (text, coverOnly) {
    const el = dom.getNode('.cover')

    dom.toggleClass(dom.getNode('main'), coverOnly ? 'add' : 'remove', 'hidden')
    if (!text) {
      dom.toggleClass(el, 'remove', 'show')
      return
    }
    dom.toggleClass(el, 'add', 'show')

    let html = this.compiler.cover(text, this.coverIsHTML)

    this._renderTo('.cover-placeholder', html, true)

    sticky()
  }

  proto._updateRender = function () {
    // Render name link
    renderNameLink(this)
  }
}

export function initRender(vm) {
  const config = vm.config

  // Init markdown compiler
  vm.compiler = new Compiler(config, vm.router)
  if (inBrowser) {
    window.__current_docsify_compiler__ = vm.compiler
  }

  const id = config.el || '#app'
  const navEl = dom.find('nav') || dom.create('nav')

  const el = dom.find(id)
  let html = ''
  let navAppendToTarget = dom.body

  if (el) {
    if (config.repo) {
      html += tpl.corner(config.repo)
    }

    if (config.coverpage) {
      html += '<div class=cover-placeholder></div>'
    }

    if (config.logo) {
      const isBase64 = /^data:image/.test(config.logo)
      const isExternal = /(?:http[s]?:)?\/\//.test(config.logo)
      const isRelative = /^\./.test(config.logo)

      if (!isBase64 && !isExternal && !isRelative) {
        config.logo = getPath(vm.router.getBasePath(), config.logo)
      }
    }

    html += tpl.main(config)
    // Render main app
    vm._renderTo(el, html, true)
  } else {
    vm.rendered = true
  }

  if (config.mergeNavbar && isMobile) {
    navAppendToTarget = dom.find('.sidebar')
  } else {
    navEl.classList.add('app-nav')

    if (!config.repo) {
      navEl.classList.add('no-badge')
    }
  }

  // Add nav
  if (config.loadNavbar) {
    dom.before(navAppendToTarget, navEl)
  }

  if (config.themeColor) {
    dom.$.head.appendChild(
      dom.create('div', tpl.theme(config.themeColor)).firstElementChild
    )
    // Polyfll
    cssVars(config.themeColor)
  }
  vm._updateRender()
  dom.toggleClass(dom.body, 'ready')
}
