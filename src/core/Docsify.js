import { multiple } from './util/multiple';
import { initMixin } from './init';
import { lifecycleMixin } from './lifecycle';
import { pluginMixin } from './plugin';
import { routerMixin } from './router';
import { renderMixin } from './render';
import { fetchMixin } from './fetch';
import { eventMixin } from './event';

/** This class contains all the magic. */
export class Docsify extends multiple(
  initMixin,
  lifecycleMixin,
  pluginMixin,
  routerMixin,
  renderMixin,
  fetchMixin,
  eventMixin
) {}
