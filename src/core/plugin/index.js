import { isFn } from '../util/core';

/** This class gets all plugins that were specified in the Docsify config can calls them. */
export function pluginMixin(Base = class {}) {
  return class Plugin extends Base {
    initPlugin() {
      []
        .concat(this.config.plugins)
        .forEach(fn => isFn(fn) && fn(this._lifecycle, this));
    }
  };
}
