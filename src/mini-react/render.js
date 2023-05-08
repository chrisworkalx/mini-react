function createTextElementDom() {
  return document.createTextNode('');
}
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

export default render;
