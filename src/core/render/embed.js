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
            if (token.embed.fragment) {
              const fragment = token.embed.fragment
              const pattern = new RegExp(
                `(?:###|\\/\\/\\/)\\s*\\[${fragment}\\]([\\s\\S]*)(?:###|\\/\\/\\/)\\s*\\[${fragment}\\]`
              )
              text = ((text.match(pattern) || [])[1] || '').trim()
            }
            embedToken = compile.lexer(
              '```' +
                token.embed.lang +
                '\n' +
                text.replace(/`/g, '@DOCSIFY_QM@') +
                '\n```\n'
            )
          } else if (token.embed.type === 'mermaid') {
            embedToken = [
              {type: 'html', text: `<div class="mermaid">\n${text}\n</div>`}
            ]
            embedToken.links = {}
          } else {
            embedToken = [{type: 'html', text}]
            embedToken.links = {}
          }
        }
        cb({token, embedToken})
        if (++count >= step) {
          cb({})
        }
      }
    })(token)

    if (token.embed.url) {
      if (process.env.SSR) {
        fetch(token.embed.url).then(next)
      } else {
        get(token.embed.url).then(next)
      }
    } else {
      next(token.embed.html)
    }
  }
}

export function prerenderEmbed({compiler, raw = '', fetch}, done) {
  let hit = cached[raw]
  if (hit) {
    const copy = hit.slice()
    copy.links = hit.links
    return done(copy)
  }

  const compile = compiler._marked
  let tokens = compile.lexer(raw)
  const embedTokens = []
  const linkRE = compile.InlineLexer.rules.link
  const links = tokens.links

  tokens.forEach((token, index) => {
    if (token.type === 'paragraph') {
      token.text = token.text.replace(
        new RegExp(linkRE.source, 'g'),
        (src, filename, href, title) => {
          const embed = compiler.compileEmbed(href, title)

          if (embed) {
            embedTokens.push({
              index,
              embed
            })
          }

          return src
        }
      )
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
