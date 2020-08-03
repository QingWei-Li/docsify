import { noop } from '../util/core';

/** This class sets of lifecycle hooks that plugins can hook into. */
export function lifecycleMixin(Base = class {}) {
  return class Lifecycle extends Base {
    initLifecycle() {
      const hooks = [
        'init',
        'mounted',
        'beforeEach',
        'afterEach',
        'doneEach',
        'ready',
      ];

      this._hooks = {};
      this._lifecycle = {};
      hooks.forEach(hook => {
        const arr = (this._hooks[hook] = []);
        this._lifecycle[hook] = fn => arr.push(fn);
      });
    }

    callHook(hook, data, next = noop) {
      const queue = this._hooks[hook];

      const step = function(index) {
        const hook = queue[index];
        if (index >= queue.length) {
          next(data);
        } else if (typeof hook === 'function') {
          if (hook.length === 2) {
            hook(data, result => {
              data = result;
              step(index + 1);
            });
          } else {
            const result = hook(data);
            data = result === undefined ? data : result;
            step(index + 1);
          }
        } else {
          step(index + 1);
        }
      };

      step(0);
    }
  };
}
