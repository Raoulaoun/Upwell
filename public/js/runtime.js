/* UpWell preview runtime: renders the page templates and keeps them interactive.
   Template syntax: {{path}} holes, <sc-for list as>, <sc-if value>, onClick="{{fn}}", ref="{{ref}}". */
(function () {
  'use strict';

  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch) {
      const next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
      this.state = Object.assign({}, this.state, next);
      this.__schedule && this.__schedule();
    }
    forceUpdate() { this.__schedule && this.__schedule(); }
  }
  window.DCLogic = DCLogic;

  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    const parts = path.split('.');
    let v = scope;
    for (const p of parts) {
      if (v == null) return undefined;
      v = v[p];
    }
    return v;
  }
  const str = (v) => (v == null || typeof v === 'function' ? '' : String(v));

  function mount(root, tpl, Component, props) {
    const comp = new Component(props);
    let handlers = [];
    let refs = [];
    let queued = false;

    function renderNode(node, scope, out) {
      if (node.nodeType === 3) {
        const t = node.nodeValue;
        out.appendChild(document.createTextNode(t.indexOf('{{') < 0 ? t : t.replace(HOLE, (_, p) => str(lookup(p, scope)))));
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.localName;
      if (tag === 'sc-for') {
        const list = lookup((node.getAttribute('list') || '').replace(/^\{\{\s*|\s*\}\}$/g, ''), scope) || [];
        const as = node.getAttribute('as') || 'item';
        list.forEach((item, i) => {
          const s = Object.create(scope);
          s[as] = item; s.$index = i;
          node.childNodes.forEach((c) => renderNode(c, s, out));
        });
        return;
      }
      if (tag === 'sc-if') {
        const v = lookup((node.getAttribute('value') || '').replace(/^\{\{\s*|\s*\}\}$/g, ''), scope);
        if (v) node.childNodes.forEach((c) => renderNode(c, scope, out));
        return;
      }
      const el = node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/1999/xhtml'
        ? document.createElementNS(node.namespaceURI, node.localName)
        : document.createElement(node.localName);
      for (const a of Array.from(node.attributes)) {
        const name = a.name, val = a.value;
        if (name.startsWith('hint-')) continue;
        const whole = WHOLE.exec(val);
        if (name.startsWith('on') && whole) {
          const fn = lookup(whole[1], scope);
          if (typeof fn === 'function') { handlers.push(fn); el.setAttribute('data-dc-' + name.slice(2), String(handlers.length - 1)); }
          continue;
        }
        if (name === 'ref' && whole) {
          const r = lookup(whole[1], scope);
          if (r) { refs.push(r); el.setAttribute('data-dc-ref', String(refs.length - 1)); }
          continue;
        }
        let v;
        if (whole) { const raw = lookup(whole[1], scope); if (typeof raw === 'function') continue; v = str(raw); }
        else v = val.indexOf('{{') < 0 ? val : val.replace(HOLE, (_, p) => str(lookup(p, scope)));
        try { el.setAttribute(name, v); } catch (e) { /* skip invalid attribute */ }
      }
      const kids = node.localName === 'template' ? node.content.childNodes : node.childNodes;
      kids.forEach((c) => renderNode(c, scope, el));
      out.appendChild(el);
    }

    function render() {
      queued = false;
      handlers = []; refs = [];
      const vals = comp.renderVals ? comp.renderVals() : {};
      const next = document.createElement('div');
      next.id = root.id;
      tpl.content.childNodes.forEach((c) => renderNode(c, vals, next));
      window.morphdom(root, next, {
        childrenOnly: true,
        onBeforeElUpdated(from, to) {
          if (from.tagName === 'DETAILS') { if (from.open) to.setAttribute('open', ''); else to.removeAttribute('open'); }
          if ((from.tagName === 'INPUT' || from.tagName === 'TEXTAREA' || from.tagName === 'SELECT') && !to.hasAttribute('value')) {
            to.value = from.value;
          }
          return true;
        }
      });
      root.querySelectorAll('[data-dc-ref]').forEach((el) => { const r = refs[+el.getAttribute('data-dc-ref')]; if (r) r.current = el; });
    }
    comp.__schedule = () => { if (!queued) { queued = true; requestAnimationFrame(render); } };

    ['click', 'change', 'input'].forEach((type) => {
      root.addEventListener(type, (e) => {
        const el = e.target.closest && e.target.closest('[data-dc-' + type + ']');
        if (!el || !root.contains(el)) return;
        const fn = handlers[+el.getAttribute('data-dc-' + type)];
        if (fn) fn(e);
      });
    });

    render();
    if (comp.componentDidMount) comp.componentDidMount();
    window.addEventListener('pagehide', () => comp.componentWillUnmount && comp.componentWillUnmount());
  }

  function boot() {
    const tpl = document.getElementById('dc-template');
    const script = document.getElementById('dc-logic');
    const root = document.getElementById('dc-root');
    let props = {};
    try {
      const decl = JSON.parse(script.getAttribute('data-props') || '{}');
      Object.keys(decl).forEach((k) => { if (k[0] !== '$' && decl[k] && 'default' in decl[k]) props[k] = decl[k].default; });
    } catch (e) { props = {}; }
    const Component = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic);
    mount(root, tpl, Component, props);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
