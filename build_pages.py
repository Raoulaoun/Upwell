"""Converts the design-canvas artboards (.dc.html) into the static preview site in public/."""
import re, sys, os, json
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
PAGES = {
  'Main': ('index.html', False, '/m/'), 'Product': ('product.html', False, '/m/product'),
  'Packs': ('box.html', False, '/m/box'), 'Cart': ('cart.html', False, '/m/cart'),
  'M-Home': ('m/index.html', True, '/'), 'M-Product': ('m/product.html', True, '/product'),
  'M-Packs': ('m/box.html', True, '/box'), 'M-Cart': ('m/cart.html', True, '/cart'),
}
LINKS = [('M-Home.dc.html', '/m/'), ('M-Product.dc.html', '/m/product'), ('M-Packs.dc.html', '/m/box'), ('M-Cart.dc.html', '/m/cart'),
         ('Main.dc.html', '/'), ('Product.dc.html', '/product'), ('Packs.dc.html', '/box'), ('Cart.dc.html', '/cart')]
ASSETS = {f.split('.')[0]: f for f in os.listdir(os.path.join(OUT, 'assets'))}
TITLES = {'Main': 'UpWell — Wellness evolved', 'Product': 'UpWell — The drinks', 'Packs': 'UpWell — Build your box', 'Cart': 'UpWell — Your box',
          'M-Home': 'UpWell — Wellness evolved', 'M-Product': 'UpWell — The drinks', 'M-Packs': 'UpWell — Build your box', 'M-Cart': 'UpWell — Your box'}
SWITCH = """<script>(function(){var m=location.search.match(/view=(desktop|mobile)/);try{if(m)sessionStorage.setItem('uw-view',m[1]);var p=sessionStorage.getItem('uw-view');}catch(e){}var small=window.matchMedia('(max-width: 760px)').matches;var want=p?p==='mobile':small;if(want!==%s){location.replace('%s'+location.hash);}})();</script>"""
for name, (out, mobile, other) in PAGES.items():
    s = open(os.path.join(SRC, name + '.dc.html'), encoding='utf-8').read()
    for a, b in LINKS: s = s.replace(a, b)
    s = re.sub(r'/_blob/([0-9a-f]{32})', lambda m: '/assets/' + ASSETS[m.group(1)], s)
    helmet = re.search(r'<helmet>(.*?)</helmet>', s, re.S).group(1)
    helmet = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', helmet)
    helmet = re.sub(r'<link href="https://fonts.googleapis.com[^>]*>', '<link rel="stylesheet" href="/fonts/fonts.css">', helmet)
    body = re.search(r'<x-dc>(.*?)</x-dc>', s, re.S).group(1)
    body = re.sub(r'<helmet>.*?</helmet>', '', body, flags=re.S).strip()
    script = re.search(r'<script type="text/x-dc" data-dc-script data-props=\'(.*?)\'>(.*?)</script>', s, re.S)
    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="description" content="UpWell — functional drinks with a smart cap. Design preview.">
<meta name="theme-color" content="#C42E62">
<title>{TITLES[name]}</title>
<link rel="icon" type="image/png" href="/assets/favicon.png">
{SWITCH % ('true' if mobile else 'false', other)}
{helmet.strip()}
</head>
<body>
<div id="dc-root"></div>
<template id="dc-template">
{body}
</template>
<script id="dc-logic" type="text/x-dc" data-props='{script.group(1)}'>{script.group(2)}</script>
<script src="/js/morphdom.min.js"></script>
<script src="/js/runtime.js"></script>
</body>
</html>
"""
    path = os.path.join(OUT, out); os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(html)
    print('wrote', out, len(html))
