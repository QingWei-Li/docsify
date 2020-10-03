import {
  getPath,
  isAbsolutePath,
  stringifyQuery,
  cleanPath,
  replaceSlug,
  resolvePath,
} from '../util';
import { noop, merge } from '../../util/core';

const cached = {};

function getAlias(path, alias, last) {
  const match = Object.keys(alias).filter(key => {
    const re = cached[key] || (cached[key] = new RegExp(`^${key}$`));
    return re.test(path) && path !== last;
  })[0];

  return match
    ? getAlias(path.replace(cached[match], alias[match]), alias, path)
    : path;
}

function getFileName(path, ext) {
  return new RegExp(`\\.(${ext.replace(/^\./, '')}|html)$`, 'g').test(path)
    ? path
    : /\/$/g.test(path)
    ? `${path}README${ext}`
    : `${path}${ext}`;
}

export class History {
  constructor(config) {
    this.config = config;
  }

  getBasePath() {
    return this.config.basePath;
  }

  getFile(path = this.getCurrentPath(), isRelative) {
    const { config } = this;
    const base = this.getBasePath();
    const ext = typeof config.ext === 'string' ? config.ext : '.md';

    path = config.alias ? getAlias(path, config.alias) : path;
    path = getFileName(path, ext);
    path = path === `/README${ext}` ? config.homepage || path : path;
    path = isAbsolutePath(path) ? path : getPath(base, path);

    if (isRelative) {
      path = path.replace(new RegExp(`^${base}`), '');
    }

    return path;
  }

  onchange(cb = noop) {
    cb();
  }

  getCurrentPath() {}

  normalize() {}

  parse() {}

  toURL(path = '', params = {}, currentRoute = '') {
    const local = currentRoute && path[0] === '#';
    const route = this.parse(replaceSlug(path));

    route.query = merge({}, route.query, params);
    path = route.path + stringifyQuery(route.query);
    path = path.replace(/\.md(\?)|\.md$/, '$1');

    if (local) {
      const idIndex = currentRoute.indexOf('?');
      path =
        (idIndex > 0 ? currentRoute.substring(0, idIndex) : currentRoute) +
        path;
    }

    if (this.config.relativePath && path.indexOf('/') !== 0) {
      const currentDir = currentRoute.substring(
        0,
        currentRoute.lastIndexOf('/') + 1
      );
      return cleanPath(resolvePath(currentDir + path));
    }

    return cleanPath('/' + path);
  }
}
