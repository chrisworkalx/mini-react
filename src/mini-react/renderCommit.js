let nextUnitOfWork = null; //下一个工作单元 可以理解为一个fiber结构
let wipRoot = null;
/**
 * <div>
 *   <h1>
 *      <a>123</a>
 *  </h1>
 *  <h2></h2>
 *
 * </div>
 *
 * 深度优先遍历
 * div -> h1 -> a -> h1 -> h2 -> div 执行顺序
 */
function performUnitOfWork(fiber) {
  // reactELement 转换成一个真实的dom
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  //删除节点

  // if (fiber.parent) {
  //   fiber.parent?.dom.appendChild(fiber.dom);
  // }

  // 为当前的节点创建子节点的fiber

  // parent \ child  \ sibling
  let nextSibling = null;
  let elements = fiber?.props?.children;
  elements?.forEach((child, index) => {
    const newFiber = {
      type: child.type,
      parent: fiber,
      props: child.props,
      dom: null
    };

    if (index === 0) {
      //第一个子节点 挂载到父节点child上
      fiber.child = newFiber;
    } else {
      // 子节点的兄弟节点
      nextSibling.sibling = newFiber;
    }
    nextSibling = newFiber;
  });

  // 处理下一个单元
  //return 下一个任务单元

  if (fiber.child) {
    //子节点
    return fiber.child;
  }

  //递归兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  //获取父节点
  const domParent = fiber.parent.dom;

  domParent.appendChild(fiber.dom);
  commitWork(fiber.child); //循环遍历子节点
  commitWork(fiber.sibling); //遍历兄弟节点
}

function commitRoot() {
  //做真实dom渲染操作
  commitWork(wipRoot.child);
  wipRoot = null;
}
//执行机制循环
//目的是为了在浏览器空余时间去执行剩余的任务操作
function workLoop(deadline) {
  let shouldYield = true; //是否超越当前桢剩余时间

  //下一个工作单元存在并且浏览器可以继续渲染 不会阻塞浏览器渲染
  while (nextUnitOfWork && shouldYield) {
    //得到浏览器当前桢剩余时间
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() > 1;
    debugger;
  }

  //当没有工作单元且定义一个用于追踪fiber树 有没有遍历完
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  //requestIdleCallback 会为参数注入一个当前桢剩余时间方法
  requestIdleCallback(workLoop);
}

// requestIdleCallback这个方法可以侦测浏览器空余时间
requestIdleCallback(workLoop);

function createDom(element) {
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
  return dom;
}

function createTextElementDom() {
  return document.createTextNode('');
}

function render(element, container) {
  // 优先创建一个链表头指向根节点
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  };

  //这里建立了一个映射
  nextUnitOfWork = wipRoot;
}

export default render;
