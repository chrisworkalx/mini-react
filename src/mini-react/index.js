import createElement from './createElement';

import render, { concurrentModeAndFiberRender, renderCommit } from './render';

console.log('concurrentModeAndFiberRender', concurrentModeAndFiberRender);

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  createElement,
  render,
  concurrentModeAndFiberRender,
  renderCommit
};
