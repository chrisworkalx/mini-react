import concurrentModeAndFiberRender from './concurrentModeAndFiber';
import renderCommit from './renderCommit';
import reconciliation from './reconciliation';

function createTextElementDom() {
  return document.createTextNode('');
}

/**
 *
 * 1. 递归渲染 层级深的话 遍历循环 主线程一直被js调用占用， 会造成浏览器出现卡顿
 */
function render(element, container) {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? createTextElementDom()
      : document.createElement(element.type);

  //将属性赋值到dom元素上
  const isProperty = (key) => key !== 'children';
  Object.keys(element?.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  //递归遍历 子节点塞入html文档中
  // TODO:这一步需要优化
  element?.props?.children?.forEach((child) => render(child, dom));

  container.appendChild(dom);
}

export { concurrentModeAndFiberRender, renderCommit, reconciliation };
export default render;
