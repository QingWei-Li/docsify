/* eslint-disable no-unused-vars */
import { init as initComponent, update as updateComponent } from './component';
import { init as initSearch } from './search';

const CONFIG = {
  placeholder: 'Type to search',
  noData: 'No Results!',
  paths: 'auto',
  depth: 2,
  maxAge: 86400000, // 1 day
  hideOtherSidebarContent: false,
  namespace: undefined,
  pathNamespaces: undefined,
};

const install = function(hook, vm) {
  // Fix the CI, see 1396
  // No sidebar, no search
  if (vm.config.hideSidebar) {
    return;
  }
  const { util } = Docsify;
  const opts = vm.config.search || CONFIG;

  if (Array.isArray(opts)) {
    CONFIG.paths = opts;
  } else if (typeof opts === 'object') {
    CONFIG.paths = Array.isArray(opts.paths) ? opts.paths : 'auto';
    CONFIG.maxAge = util.isPrimitive(opts.maxAge) ? opts.maxAge : CONFIG.maxAge;
    CONFIG.placeholder = opts.placeholder || CONFIG.placeholder;
    CONFIG.noData = opts.noData || CONFIG.noData;
    CONFIG.depth = opts.depth || CONFIG.depth;
    CONFIG.hideOtherSidebarContent =
      opts.hideOtherSidebarContent || CONFIG.hideOtherSidebarContent;
    CONFIG.namespace = opts.namespace || CONFIG.namespace;
    CONFIG.pathNamespaces = opts.pathNamespaces || CONFIG.pathNamespaces;
  }

  const isAuto = CONFIG.paths === 'auto';

  hook.mounted(_ => {
    initComponent(CONFIG, vm);
    !isAuto && initSearch(CONFIG, vm);
  });
  hook.doneEach(_ => {
    updateComponent(CONFIG, vm);
    isAuto && initSearch(CONFIG, vm);
  });
};

$docsify.plugins = [].concat(install, $docsify.plugins);
