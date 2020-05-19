import stripIndent from 'strip-indent';
import { get } from '../fetch/ajax';
import { merge } from '../util/core';

const INCLUDE_COMPONENT = '__include__';
const cached = {};

function walkFetchEmbed({ embedTokens, compile, fetch }, cb) {
  let token;
  let step = 0;
  let count = 0;

  if (!embedTokens.length) {
    return cb({});
  }

  while ((token = embedTokens[step++])) {
    const next = (function(token) {
      return text => {
        let embedToken;
        if (text) {
          if (token.embed.type === 'markdown') {
            let path = token.embed.url.split('/');
            path.pop();
            path = path.join('/');
            // Resolves relative links to absolute
            text = text.replace(/\[([^[\]]+)\]\(([^)]+)\)/g, x => {
              const linkBeginIndex = x.indexOf('(');
              if (x.substring(linkBeginIndex).startsWith('(.')) {
                return (
                  x.substring(0, linkBeginIndex) +
                  `(${window.location.protocol}//${window.location.host}${path}/` +
                  x.substring(linkBeginIndex + 1, x.length - 1) +
                  ')'
                );
              }
              return x;
            });

            // This may contain YAML front matter and will need to be stripped.
            const frontMatterInstalled =
              ($docsify.frontMatter || {}).installed || false;
            if (frontMatterInstalled === true) {
              text = $docsify.frontMatter.parseMarkdown(text);
            }

            embedToken = compile.lexer(text);
          } else if (token.embed.type === 'code') {
            if (token.embed.fragment) {
              const fragment = token.embed.fragment;
              const pattern = new RegExp(
                `(?:###|\\/\\/\\/)\\s*\\[${fragment}\\]([\\s\\S]*)(?:###|\\/\\/\\/)\\s*\\[${fragment}\\]`
              );
              text = stripIndent((text.match(pattern) || [])[1] || '').trim();
            }

            embedToken = compile.lexer(
              '```' +
                token.embed.lang +
                '\n' +
                text.replace(/`/g, '@DOCSIFY_QM@') +
                '\n```\n'
            );
          } else if (token.embed.type === 'mermaid') {
            embedToken = [
              { type: 'html', text: `<div class="mermaid">\n${text}\n</div>` },
            ];
            embedToken.links = {};
          } else {
            embedToken = [{ type: 'html', text }];
            embedToken.links = {};
          }
        }

        cb({ token, embedToken });
        if (++count >= embedTokens.length) {
          cb({});
        }
      };
    })(token);

    if (token.embed.url) {
      if (process.env.SSR) {
        fetch(token.embed.url).then(next);
      } else {
        get(token.embed.url).then(next);
      }
    } else {
      next(token.embed.html);
    }
  }
}

function expandInclude(tokens) {
  if (!tokens) {
    return tokens;
  }

  const expandedTokens = [];
  tokens.forEach(e => {
    if (e.type === INCLUDE_COMPONENT && e.components) {
      e.components.forEach(c => expandedTokens.push(c));
    } else {
      expandedTokens.push(e);
    }
  });

  return expandedTokens;
}

export function prerenderEmbed({ compiler, raw = '', fetch }, done) {
  let hit = cached[raw];
  if (hit) {
    const copy = hit.slice();
    copy.links = hit.links;
    return done(copy);
  }

  const compile = compiler._marked;
  let tokens = compile.lexer(raw);
  const embedTokens = [];
  const linkRE = compile.InlineLexer.rules.link;
  const links = tokens.links;

  tokens.forEach((token, index) => {
    if (token.type === 'paragraph') {
      token.text = token.text.replace(
        new RegExp(linkRE.source, 'g'),
        (src, filename, href, title) => {
          const embed = compiler.compileEmbed(href, title);

          if (embed) {
            embedTokens.push({
              index,
              embed,
            });
          }

          return src;
        }
      );
    }
  });

  walkFetchEmbed({ compile, embedTokens, fetch }, ({ embedToken, token }) => {
    if (token) {
      merge(links, embedToken.links);

      tokens = tokens.slice(0, token.index).concat(
        {
          type: INCLUDE_COMPONENT,
          components: embedToken,
        },
        tokens.slice(token.index + 1)
      );
    } else {
      tokens = expandInclude(tokens);
      cached[raw] = tokens.concat();
      tokens.links = cached[raw].links = links;
      done(tokens);
    }
  });
}
