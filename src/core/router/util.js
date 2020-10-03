import { cached } from '../util/core';

const decode = decodeURIComponent;
const encode = encodeURIComponent;

export function parseQuery(query) {
  const res = {};

  query = query.trim().replace(/^(\?|#|&)/, '');

  if (!query) {
    return res;
  }

  // Simple parse
  query.split('&').forEach(function(param) {
    const parts = param.replace(/\+/g, ' ').split('=');

    res[parts[0]] = parts[1] && decode(parts[1]);
  });

  return res;
}

export function stringifyQuery(obj, ignores = []) {
  const qs = [];

  for (const key in obj) {
    if (ignores.indexOf(key) > -1) {
      continue;
    }

    qs.push(
      obj[key]
        ? `${encode(key)}=${encode(obj[key])}`.toLowerCase()
        : encode(key)
    );
  }

  return qs.length ? `?${qs.join('&')}` : '';
}

export const isAbsolutePath = cached((path = '') => {
  return /(:|(\/{2}))/g.test(path);
});

export const removeParams = cached((path = '') => {
  return path.split(/[?#]/)[0];
});

export const getParentPath = cached((path = '') => {
  if (/\/$/g.test(path)) {
    return path;
  }

  const matchingParts = path.match(/(\S*\/)[^/]+$/);
  return matchingParts ? matchingParts[1] : '';
});

export const cleanPath = cached((path = '') => {
  return path.replace(/^\/+/, '/').replace(/([^:])\/{2,}/g, '$1/');
});

export const resolvePath = cached((path = '') => {
  const segments = path.replace(/^\//, '').split('/');
  let resolved = [];
  for (let i = 0, len = segments.length; i < len; i++) {
    const segment = segments[i];
    if (segment === '..') {
      resolved.pop();
    } else if (segment !== '.') {
      resolved.push(segment);
    }
  }

  return '/' + resolved.join('/');
});

export function getPath(...args) {
  return cleanPath(args.join('/'));
}

export const replaceSlug = cached((path = '') => {
  return path.replace('#', '?id=');
});
