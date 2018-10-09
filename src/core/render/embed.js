import {get} from '../fetch/ajax'
import {merge} from '../util/core'

const cached = {}

function walkFetchEmbed({embedTokens, compile, fetch}, cb) {
  let token
  let step = 0
  let count = 1

  if (!embedTokens.length) {
    return cb({})
  }

  while ((token = embedTokens[step++])) {
    const next = (function (token) {
      return text => {
        let embedToken
        if (text) {
          if (token.embed.type === 'markdown') {
            embedToken = compile.lexer(text)
          } else if (token.embed.type === 'code') {
            embedToken = compile.lexer(
              '```' +
                token.embed.lang +
                '\n' +
                text.replace(/`/g, '@DOCSIFY_QM@') +
                '\n```\n'
            )
          }
        }
        cb({token, embedToken})
        if (++count >= step) {
          cb({})
        }
      }
    })(token)

    if (process.env.SSR) {
      fetch(token.embed.url).then(next)
    } else {
      get(token.embed.url).then(next)
    }
  }
}

export function prerenderEmbed({compiler, raw = '', fetch}, done) {
  let hit
  if ((hit = cached[raw])) {
    return done(hit)
  }

  const compile = compiler._marked
  let tokens = compile.lexer(raw)
  const embedTokens = []
  const embedHtmlTokens = []
  const linkRE = compile.InlineLexer.rules.link
  const links = tokens.links

  tokens.forEach((token, index) => {
    if (token.type === 'html') {
      token.text = token.text.replace(
        new RegExp(linkRE.source, 'gm'),
        (src, filename, href, title) => {
          const embed = compiler.compileEmbed(href, title)
          if (embed) {
            if (embed.type === 'markdown' || embed.type === 'code') {
              embedHtmlTokens.push({
                src,
                embed,
                index: index
              })
            }
            return src
          }

          return src
        }
      )
    }
    if (token.type === 'paragraph') {
      token.text = token.text.replace(
        new RegExp(linkRE.source, 'g'),
        (src, filename, href, title) => {
          const embed = compiler.compileEmbed(href, title)

          if (embed) {
            if (embed.type === 'markdown' || embed.type === 'code') {
              embedTokens.push({
                index,
                embed
              })
            }
            return embed.code
          }

          return src
        }
      )
    }
  })

  walkFetchEmbed({compile, embedTokens: embedHtmlTokens, fetch}, ({embedToken, token}) => {
    if (token) {
      const html = compiler.compile(embedToken)
      tokens[token.index].text = tokens[token.index].text.replace(token.src, html)
    }
  })

  let moveIndex = 0
  walkFetchEmbed({compile, embedTokens, fetch}, ({embedToken, token}) => {
    if (token) {
      const index = token.index + moveIndex

      merge(links, embedToken.links)

      tokens = tokens
        .slice(0, index)
        .concat(embedToken, tokens.slice(index + 1))
      moveIndex += embedToken.length - 1
    } else {
      cached[raw] = tokens.concat()
      tokens.links = cached[raw].links = links
      done(tokens)
    }
  })
}
