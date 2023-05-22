/* eslint-disable no-loop-func */
//目的是为了diff
//更新阶段不可能所有的节点继续render一次 diff算法主要为了节约性能 优化方案

let nextUnitOfWork = null; //下一个工作单元 可以理解为一个fiber结构
let wipRoot = null;
let currentRoot = null; //缓存当前已经commitRender阶段的fiber树
let deletions = [];

function reconcileChildren(wipFiber, elements) {
  //FIXME: 新老fiber树比较
  let index = 0;
  let prevSibling = null;
  //alternate定义为缓存旧节点fiber
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length || !!oldFiber) {
    const child = elements[index];
    console.log('child', child);
    // 简易比较
    let newFiber = null;
    const sameType = oldFiber && child && child.type === oldFiber.type;

    //同节点比较
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: child.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      };
    }

    //新增
    if (!sameType && child) {
      newFiber = {
        type: child.type,
        props: child.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      };
    }

    //删除
    if (!sameType && oldFiber) {
      //deletion操作
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      //第一个子节点 挂载到父节点child上
      wipFiber.child = newFiber;
    } else {
      // 子节点的兄弟节点
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}
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

  // parent \ child  \ sibling
  let elements = fiber?.props?.children;

  // 处理下一个单元
  //return 下一个任务单元
  // diff比较
  reconcileChildren(fiber, elements);

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

//筛选出事件

const isEvent = (key) => key.startsWith('on');

// 筛选出非children属性
const isProperty = (key) => key !== 'children' && !isEvent(key);

//筛选出要移除的属性
const isGone = (prev, next) => (key) => !(key in next);

//挑选出新的属性
const isNew = (prev, next) => (key) => prev[key] !== next[key];

//更新dom操作
function updateDom(dom, prevProps, nextProps) {
  //移除旧的监听事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      (key) =>
        isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key)
    )
    .forEach((name) => {
      // 截取如onClick -> click
      const eventType = name.toLocaleLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  //移除掉不存在新props里的属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = '';
    });

  //新增属性挂载
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });

  //新增事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      // 截取如onClick -> click
      const eventType = name.toLocaleLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  // debugger;

  //获取父节点
  const domParent = fiber.parent.dom;

  switch (fiber.effectTag) {
    case 'PLACEMENT':
      !!fiber.dom && domParent.appendChild(fiber.dom);
      break;
    case 'UPDATE':
      !!fiber.dom && updateDom(fiber.dom, fiber.alternate, fiber.props);
      break;

    case 'DELETION':
      !!fiber.dom && domParent.removeChild(fiber.dom);
      break;
    default:
      break;
  }

  commitWork(fiber.child); //循环遍历子节点
  commitWork(fiber.sibling); //遍历兄弟节点
}

function commitRoot() {
  //做真实dom渲染操作
  commitWork(wipRoot.child);
  //遍历执行删除操作
  deletions.forEach(commitWork);
  currentRoot = wipRoot;
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
  }

  //当没有工作单元且定义一个用于追踪fiber树 有没有遍历完
  if (!nextUnitOfWork && wipRoot) {
    // 统一提交一次commit
    commitRoot();
    //commit后当前缓存的fiber树
    currentRoot = wipRoot;
  }
  //requestIdleCallback 会为参数注入一个当前桢剩余时间方法
  requestIdleCallback(workLoop);
}

// requestIdleCallback这个方法可以侦测浏览器空余时间
requestIdleCallback(workLoop);

function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? createTextElementDom()
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);
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
    },
    alternate: currentRoot
  };

  //这里建立了一个映射
  nextUnitOfWork = wipRoot;
  deletions = [];
}

export default render;
