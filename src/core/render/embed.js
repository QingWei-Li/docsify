import stripIndent from 'strip-indent';
import { get } from '../fetch/ajax';
import { merge } from '../util/core';

const cached = {};

function walkFetchEmbed({ embedTokens, compile, fetch }, cb) {
  let token;
  let step = 0;
  let count = 1;

  if (!embedTokens.length) {
    return cb({});
  }

  while ((token = embedTokens[step++])) {
    // eslint-disable-next-line no-shadow
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
              if (x.slice(linkBeginIndex, linkBeginIndex + 2) === '(.') {
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
        if (++count >= step) {
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

export function prerenderEmbed(
  { compiler, raw = '', fetch, beforeEmbed },
  done
) {
  let hit = cached[raw];
  if (hit) {
    const copy = hit.slice();
    copy.links = hit.links;
    return done(copy);
  }

  const compile = compiler._marked;

  if (!beforeEmbed) {
    beforeEmbed = (tokens, done) => done(tokens);
  } // noop
  beforeEmbed(compile.lexer(raw), tokens => {
    const embedTokens = [];
    const linkRE = compile.Lexer.rules.inline.link;
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

    // keep track of which tokens have been embedded so far
    // so that we know where to insert the embedded tokens as they
    // are returned
    const moves = [];
    walkFetchEmbed({ compile, embedTokens, fetch }, ({ embedToken, token }) => {
      if (token) {
        // iterate through the array of previously inserted tokens
        // to determine where the current embedded tokens should be inserted
        let index = token.index;
        moves.forEach(pos => {
          if (index > pos.start) {
            index += pos.length;
          }
        });

        merge(links, embedToken.links);

        tokens = tokens
          .slice(0, index)
          .concat(embedToken, tokens.slice(index + 1));
        moves.push({ start: index, length: embedToken.length - 1 });
      } else {
        cached[raw] = tokens.concat();
        tokens.links = cached[raw].links = links;
        done(tokens);
      }
    });
  });
}
