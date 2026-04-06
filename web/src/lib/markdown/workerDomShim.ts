// workerDomShim.ts - Web Worker 环境的最小 DOM 垫片
// KaTeX 的 renderToString 内部会引用 document 来创建虚拟节点再序列化为 HTML，
// 在 Web Worker 中 document 不存在会抛出 ReferenceError，
// 这里提供一个最小实现让 KaTeX 的字符串渲染路径能正常工作。

/* eslint-disable @typescript-eslint/no-explicit-any */

if (typeof document === 'undefined') {
  const noop = () => {};

  function createElement(tag: string): any {
    const children: any[] = [];
    const attributes: Record<string, string> = {};
    const classList = new Set<string>();

    const element: any = {
      nodeName: tag,
      tagName: tag.toUpperCase(),
      nodeType: 1,
      attributes,
      children,
      childNodes: children,
      style: {},
      classList: {
        add: (...tokens: string[]) => tokens.forEach((t) => classList.add(t)),
        remove: (...tokens: string[]) => tokens.forEach((t) => classList.delete(t)),
        contains: (token: string) => classList.has(token),
        toggle: (token: string) => {
          if (classList.has(token)) {
            classList.delete(token);
          } else {
            classList.add(token);
          }
        },
      },
      ownerDocument: null as any,
      setAttribute(key: string, value: string) {
        attributes[key] = value;
      },
      getAttribute(key: string) {
        return attributes[key] ?? null;
      },
      hasAttribute(key: string) {
        return key in attributes;
      },
      removeAttribute(key: string) {
        delete attributes[key];
      },
      appendChild(child: any) {
        children.push(child);
        return child;
      },
      removeChild(child: any) {
        const index = children.indexOf(child);
        if (index >= 0) {
          children.splice(index, 1);
        }
        return child;
      },
      insertBefore(newChild: any, refChild: any) {
        const index = children.indexOf(refChild);
        if (index >= 0) {
          children.splice(index, 0, newChild);
        } else {
          children.push(newChild);
        }
        return newChild;
      },
      replaceChild(newChild: any, oldChild: any) {
        const index = children.indexOf(oldChild);
        if (index >= 0) {
          children[index] = newChild;
        }
        return oldChild;
      },
      cloneNode(deep?: boolean) {
        const cloned = createElement(tag);
        Object.assign(cloned.attributes, attributes);
        if (deep) {
          for (const child of children) {
            if (typeof child.cloneNode === 'function') {
              cloned.appendChild(child.cloneNode(true));
            }
          }
        }
        return cloned;
      },
      innerHTML: '',
      textContent: '',
      querySelectorAll: () => [],
      querySelector: () => null,
      getElementsByTagName: () => [],
      getElementsByClassName: () => [],
      addEventListener: noop,
      removeEventListener: noop,
    };

    return element;
  }

  function createTextNode(text: string): any {
    return {
      nodeName: '#text',
      nodeType: 3,
      textContent: text,
      cloneNode() {
        return createTextNode(text);
      },
    };
  }

  const shimDocument: any = {
    createElement,
    createElementNS: (_namespace: string, tag: string) => createElement(tag),
    createTextNode,
    createDocumentFragment: () => {
      const fragment = createElement('#document-fragment');
      fragment.nodeType = 11;
      return fragment;
    },
    createComment: (data: string) => ({
      nodeName: '#comment',
      nodeType: 8,
      textContent: data,
      cloneNode() {
        return shimDocument.createComment(data);
      },
    }),
    body: createElement('body'),
    head: createElement('head'),
    documentElement: createElement('html'),
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => null,
    getElementsByTagName: () => [],
    getElementsByClassName: () => [],
    createRange: () => ({
      setStart: noop,
      setEnd: noop,
      commonAncestorContainer: createElement('div'),
      createContextualFragment: (html: string) => {
        const frag = createElement('#document-fragment');
        frag.innerHTML = html;
        return frag;
      },
    }),
    implementation: {
      createHTMLDocument: () => shimDocument,
    },
    addEventListener: noop,
    removeEventListener: noop,
  };

  // 让 createElement 产生的节点的 ownerDocument 指向 shimDocument
  const originalCreateElement = createElement;
  const patchedCreateElement = (tag: string) => {
    const el = originalCreateElement(tag);
    el.ownerDocument = shimDocument;
    return el;
  };
  shimDocument.createElement = patchedCreateElement;
  shimDocument.createElementNS = (_ns: string, tag: string) => patchedCreateElement(tag);

  (self as unknown as Record<string, any>).document = shimDocument;
}

// rehype-raw / KaTeX 等依赖可能在内部调用 DOMParser.parseFromString，
// Web Worker 中没有 DOMParser，需要提供最小垫片。
if (typeof DOMParser === 'undefined') {
  class ShimDOMParser {
    parseFromString(markup: string, _mimeType: string): any {
      const doc = (self as unknown as Record<string, any>).document;
      const root = doc.createElement('html');
      const head = doc.createElement('head');
      const body = doc.createElement('body');
      root.appendChild(head);
      root.appendChild(body);
      body.innerHTML = markup;
      return {
        documentElement: root,
        head,
        body,
        createElement: doc.createElement.bind(doc),
        createElementNS: doc.createElementNS.bind(doc),
        createTextNode: doc.createTextNode.bind(doc),
        createDocumentFragment: doc.createDocumentFragment.bind(doc),
        createComment: doc.createComment.bind(doc),
        querySelectorAll: () => [],
        querySelector: () => null,
        getElementById: () => null,
        getElementsByTagName: () => [],
        getElementsByClassName: () => [],
      };
    }
  }

  (self as unknown as Record<string, any>).DOMParser = ShimDOMParser;
}