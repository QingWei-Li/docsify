/**
 * Converts a colon formatted string to a object with properties.
 *
 * This is process a provided string and look for any tokens in the format
 * of `:name[=value]` and then convert it to a object and return.
 * An example of this is ':include :type=code :fragment=demo' is taken and
 * then converted to:
 *
 * ```
 * {
 *  include: '',
 *  type: 'code',
 *  fragment: 'demo'
 * }
 * ```
 *
 * @param {string}   str   The string to parse.
 *
 * @return {object}  The original string and parsed object, { str, config }.
 */
export function getAndRemoveConfig(str = '') {
  const config = {};

  if (str) {
    str = str
      .replace(/^("|')/, '')
      .replace(/("|')$/, '')
      .replace(/(?:^|\s):([\w-]+:?)=?([\w-%]+)?/g, (m, key, value) => {
        if (key.indexOf(':') === -1) {
          config[key] = (value && value.replace(/&quot;/g, '')) || true;
          return '';
        }

        return m;
      })
      .trim();
  }

  return { str, config };
}
