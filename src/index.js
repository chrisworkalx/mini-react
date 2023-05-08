import MyReact from './mini-react/';

const element = MyReact.createElement(
  'div',
  {
    id: 'app',
    title: 'my-react'
  },
  '实现一个mini-react',
  MyReact.createElement('a', null, 'hello')
);

console.log('element', element);

const container = document.querySelector('#root');
MyReact.render(element, container);
