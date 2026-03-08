// main.tsx - 应用入口
import ReactDOM from 'react-dom/client';

import { App } from './App';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('未找到根节点 #root');
}

ReactDOM.createRoot(rootElement).render(<App />);
