import config from '../config';

/**
 * This class is responsible to initializing all other mixins in a certain
 * order, and calling lifecycle hooks at appropriate times.
 */
export function initMixin(Base = class {}) {
  return class extends Base {
    constructor() {
      super();

      this.config = config(this);

      this.initLifecycle(); // Init hooks
      this.initPlugin(); // Install plugins
      this.callHook('init');
      this.initRouter(); // Add router
      this.initRender(); // Render base DOM
      this.initEvent(); // Bind events
      this.initFetch(); // Fetch data
      this.callHook('mounted');
    }
  };
}
