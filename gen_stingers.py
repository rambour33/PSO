import os

OUT = r'p:\PSO 2\PSO\public'

TMPL = """\
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Stinger – {title}</title>
  <style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ width:1920px; height:1080px; overflow:hidden; background:transparent; position:relative; }}
{css}
  </style>
</head>
<body>
{body}
  <div id="logo-wrap" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:100">
    <img id="logo-img" src="" alt="" style="max-width:500px;max-height:340px;display:none;opacity:0" />
  </div>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    var DUR = 1.9;
    function applyConfig(cfg) {{
      if (cfg && cfg.logoUrl) {{
        var img = document.getElementById('logo-img');
        img.src = cfg.logoUrl; img.style.display = 'block';
      }}
    }}
    function build() {{
{js_build}
    }}
    fetch('/api/stinger').then(function(r){{return r.json();}}).then(function(cfg){{applyConfig(cfg);build();}}).catch(function(){{build();}});
    var socket = io();
    socket.on('stingerConfig', function(){{ location.reload(); }});
  </script>
</body>
</html>"""

def make(name, title, css, body, js_build):
    content = TMPL.format(title=title, css=css, body=body, js_build=js_build)
    path = os.path.join(OUT, f'stinger-{name}.html')
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print(f'  created stinger-{name}.html')

# ── 1. Blanc Négatif ──────────────────────────────────────────────────────────
make('whitespace', 'Blanc Négatif',
css="""\
    @keyframes wipe-top { 0%{transform:translateY(0)} 100%{transform:translateY(-100%)} }
    @keyframes wipe-bot { 0%{transform:translateY(0)} 100%{transform:translateY(100%)} }
    @keyframes logo-in  { 0%{opacity:0;transform:scale(.92)} 60%{opacity:1;transform:scale(1)} 100%{opacity:1} }
    .ws-panel { position:absolute; left:0; width:1920px; height:540px; background:#ffffff; }
    #wsp-top  { top:0; }
    #wsp-bot  { bottom:0; }""",
body="""\
  <div class="ws-panel" id="wsp-top"></div>
  <div class="ws-panel" id="wsp-bot"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('wsp-top').style.animation = 'wipe-top '+d+' .55s cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('wsp-bot').style.animation = 'wipe-bot '+d+' .55s cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 2. Monochrome Strict ──────────────────────────────────────────────────────
make('monochrome', 'Monochrome Strict',
css="""\
    @keyframes sweep { 0%{transform:scaleX(0);transform-origin:left} 45%{transform:scaleX(1);transform-origin:left} 46%{transform:scaleX(1);transform-origin:right} 100%{transform:scaleX(0);transform-origin:right} }
    @keyframes logo-pop { 0%,40%{opacity:0} 60%{opacity:1} 100%{opacity:1} }
    #mono-bar { position:absolute; top:0; left:0; width:1920px; height:1080px; background:#111111; transform:scaleX(0); transform-origin:left; }""",
body="""\
  <div id="mono-bar"></div>""",
js_build="""\
      document.getElementById('mono-bar').style.animation = 'sweep '+DUR+'s ease forwards';
      document.getElementById('logo-img').style.animation = 'logo-pop '+DUR+'s ease forwards';""")

# ── 3. Grid Brutaliste ────────────────────────────────────────────────────────
make('brutaliste', 'Grid Brutaliste',
css="""\
    @keyframes h-in  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
    @keyframes v-in  { from{transform:scaleY(0)} to{transform:scaleY(1)} }
    @keyframes bg-in { 0%{opacity:0} 40%{opacity:1} 75%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in { 0%,45%{opacity:0;transform:scale(1.1)} 70%{opacity:1;transform:scale(1)} 100%{opacity:1} }
    .hline { position:absolute; left:0; width:1920px; height:6px; background:#000; transform:scaleX(0); transform-origin:left; }
    .vline { position:absolute; top:0; width:6px; height:1080px; background:#000; transform:scaleY(0); transform-origin:top; }
    #gbg   { position:absolute; inset:0; background:#fff; opacity:0; }""",
body="""\
  <div id="gbg"></div>
  <div class="hline" style="top:270px"></div>
  <div class="hline" style="top:540px"></div>
  <div class="hline" style="top:810px"></div>
  <div class="vline" style="left:480px"></div>
  <div class="vline" style="left:960px"></div>
  <div class="vline" style="left:1440px"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('gbg').style.animation = 'bg-in '+d+' ease forwards';
      document.querySelectorAll('.hline').forEach(function(el,i){ el.style.animation='h-in '+d+' '+(i*0.08)+'s cubic-bezier(.22,1,.36,1) forwards'; });
      document.querySelectorAll('.vline').forEach(function(el,i){ el.style.animation='v-in '+d+' '+(i*0.08+0.12)+'s cubic-bezier(.22,1,.36,1) forwards'; });
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 4. Flat Design 2.0 ────────────────────────────────────────────────────────
make('flatdesign', 'Flat Design 2.0',
css="""\
    @keyframes slide-in  { from{transform:translateX(100%)} to{transform:translateX(0)} }
    @keyframes slide-out { from{transform:translateX(0)} to{transform:translateX(-100%)} }
    @keyframes logo-in   { 0%,40%{opacity:0} 65%{opacity:1} 100%{opacity:1} }
    .fblock { position:absolute; top:0; height:1080px; }
    #fb1 { left:0;     width:640px; background:#E74C3C; }
    #fb2 { left:640px; width:640px; background:#3498DB; }
    #fb3 { left:1280px;width:640px; background:#2ECC71; }""",
body="""\
  <div class="fblock" id="fb1"></div>
  <div class="fblock" id="fb2"></div>
  <div class="fblock" id="fb3"></div>""",
js_build="""\
      var d = DUR+'s';
      [['fb1',0],['fb2',0.08],['fb3',0.16]].forEach(function(p){
        var el = document.getElementById(p[0]);
        el.style.transform = 'translateX(100%)';
        el.style.animation = 'slide-in '+d+' '+p[1]+'s cubic-bezier(.22,1,.36,1) forwards, slide-out '+d+' '+(p[1]+DUR*0.45)+'s cubic-bezier(.76,0,.24,1) forwards';
      });
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 5. Glassmorphism ──────────────────────────────────────────────────────────
make('glass', 'Glassmorphism',
css="""\
    @keyframes glass-expand { 0%{opacity:0;transform:translate(-50%,-50%) scale(.6)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1)} 85%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.05)} }
    @keyframes logo-in { 0%,30%{opacity:0} 60%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
    #glasspanel { position:absolute; top:50%; left:50%; width:900px; height:500px; border-radius:24px; background:rgba(255,255,255,.18); backdrop-filter:blur(32px); -webkit-backdrop-filter:blur(32px); border:1.5px solid rgba(255,255,255,.45); box-shadow:0 8px 64px rgba(0,0,0,.18); opacity:0; }""",
body="""\
  <div id="glasspanel"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('glasspanel').style.animation = 'glass-expand '+d+' ease forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 6. Neumorphism ────────────────────────────────────────────────────────────
make('neuro', 'Neumorphism',
css="""\
    @keyframes neuro-grow { 0%{opacity:0;transform:translate(-50%,-50%) scale(.5)} 55%{opacity:1;transform:translate(-50%,-50%) scale(1)} 85%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1)} }
    @keyframes logo-in    { 0%,35%{opacity:0} 60%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
    body { background:#E0E5EC; }
    #neuro-bg   { position:absolute; inset:0; background:#E0E5EC; }
    #neuro-card { position:absolute; top:50%; left:50%; width:860px; height:460px; border-radius:32px; background:#E0E5EC; box-shadow:14px 14px 28px #b8bec7,-14px -14px 28px #ffffff; opacity:0; }""",
body="""\
  <div id="neuro-bg"></div>
  <div id="neuro-card"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('neuro-card').style.animation = 'neuro-grow '+d+' cubic-bezier(.34,1.56,.64,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 7. Clay 3D ────────────────────────────────────────────────────────────────
make('clay', 'Clay 3D',
css="""\
    @keyframes blob1 { 0%{opacity:0;transform:scale(0) translate(-80px,-60px)} 55%{opacity:1;transform:scale(1) translate(-80px,-60px)} 80%{opacity:1} 100%{opacity:0} }
    @keyframes blob2 { 0%{opacity:0;transform:scale(0) translate(80px,-60px)}  55%{opacity:1;transform:scale(1) translate(80px,-60px)}  80%{opacity:1} 100%{opacity:0} }
    @keyframes blob3 { 0%{opacity:0;transform:scale(0) translate(0,80px)}      55%{opacity:1;transform:scale(1) translate(0,80px)}      80%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in { 0%,40%{opacity:0} 65%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
    .clay-blob { position:absolute; top:50%; left:50%; }
    #cb1 { width:600px; height:600px; margin:-300px 0 0 -300px; background:#FF7F7F; border-radius:60% 40% 70% 30%/30% 60% 40% 70%; box-shadow:inset -20px -20px 40px rgba(0,0,0,.15),inset 20px 20px 40px rgba(255,255,255,.4); opacity:0; }
    #cb2 { width:500px; height:500px; margin:-250px 0 0 -250px; background:#FFD700; border-radius:40% 60% 30% 70%/60% 40% 70% 30%; box-shadow:inset -16px -16px 32px rgba(0,0,0,.15),inset 16px 16px 32px rgba(255,255,255,.4); opacity:0; }
    #cb3 { width:550px; height:550px; margin:-275px 0 0 -275px; background:#77DDAA; border-radius:70% 30% 50% 50%/40% 60% 40% 60%; box-shadow:inset -18px -18px 36px rgba(0,0,0,.15),inset 18px 18px 36px rgba(255,255,255,.4); opacity:0; }""",
body="""\
  <div class="clay-blob" id="cb1"></div>
  <div class="clay-blob" id="cb2"></div>
  <div class="clay-blob" id="cb3"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('cb1').style.animation = 'blob1 '+d+' cubic-bezier(.34,1.56,.64,1) forwards';
      document.getElementById('cb2').style.animation = 'blob2 '+d+' .1s cubic-bezier(.34,1.56,.64,1) forwards';
      document.getElementById('cb3').style.animation = 'blob3 '+d+' .2s cubic-bezier(.34,1.56,.64,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 8. Paper Origami ──────────────────────────────────────────────────────────
make('paper', 'Paper Origami',
css="""\
    @keyframes fold-top { 0%{transform:perspective(1200px) rotateX(-90deg)} 50%{transform:perspective(1200px) rotateX(0deg)} 80%{transform:perspective(1200px) rotateX(0deg)} 100%{transform:perspective(1200px) rotateX(90deg)} }
    @keyframes fold-bot { 0%{transform:perspective(1200px) rotateX(90deg)}  50%{transform:perspective(1200px) rotateX(0deg)} 80%{transform:perspective(1200px) rotateX(0deg)} 100%{transform:perspective(1200px) rotateX(-90deg)} }
    @keyframes logo-in  { 0%,40%{opacity:0} 65%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
    .paper-panel { position:absolute; left:0; width:1920px; height:540px; background:#F5F0E8; }
    #pp-top { top:0;    transform-origin:bottom; transform:perspective(1200px) rotateX(-90deg); }
    #pp-bot { bottom:0; transform-origin:top;    transform:perspective(1200px) rotateX(90deg); }""",
body="""\
  <div class="paper-panel" id="pp-top"></div>
  <div class="paper-panel" id="pp-bot"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('pp-top').style.animation = 'fold-top '+d+' cubic-bezier(.37,0,.63,1) forwards';
      document.getElementById('pp-bot').style.animation = 'fold-bot '+d+' cubic-bezier(.37,0,.63,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 9. Grain & Noise ──────────────────────────────────────────────────────────
make('grain', 'Grain & Noise',
css="""\
    @keyframes grain-anim { 0%,100%{background-position:0 0} 20%{background-position:-40px -20px} 40%{background-position:30px 50px} 60%{background-position:-50px 30px} 80%{background-position:20px -40px} }
    @keyframes curtain    { 0%{transform:translateX(-100%)} 40%{transform:translateX(0)} 70%{transform:translateX(0)} 100%{transform:translateX(100%)} }
    @keyframes logo-in    { 0%,35%{opacity:0} 55%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    #grain-curtain { position:absolute; inset:0; overflow:hidden; }
    #grain-texture { position:absolute; inset:-60px; width:calc(100% + 120px); height:calc(100% + 120px); background-color:#1A1A2E; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.85'/%3E%3C/svg%3E"); background-size:200px 200px; animation:grain-anim .18s steps(1) infinite; }""",
body="""\
  <div id="grain-curtain">
    <div id="grain-texture"></div>
  </div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('grain-curtain').style.animation = 'curtain '+d+' cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 10. Dark Élégant ────────────────────────────────────────────────────────
make('darkelegant', 'Dark Élégant',
css="""\
    @keyframes panel-in  { 0%{transform:translateX(-100%)} 35%{transform:translateX(0)} 70%{transform:translateX(0)} 100%{transform:translateX(100%)} }
    @keyframes gold-line { 0%{transform:scaleX(0);opacity:0} 25%{opacity:1;transform:scaleX(1)} 75%{opacity:1;transform:scaleX(1)} 100%{transform:scaleX(0);opacity:0} }
    @keyframes logo-in   { 0%,30%{opacity:0} 55%{opacity:1} 78%{opacity:1} 100%{opacity:0} }
    #dark-panel { position:absolute; inset:0; background:#0A0A0F; }
    #gold-line  { position:absolute; top:50%; left:10%; width:80%; height:2px; background:linear-gradient(90deg,transparent,#C9A84C,transparent); transform:scaleX(0); transform-origin:center; margin-top:-1px; }""",
body="""\
  <div id="dark-panel"></div>
  <div id="gold-line"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('dark-panel').style.animation = 'panel-in '+d+' cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('gold-line').style.animation  = 'gold-line '+d+' ease forwards';
      document.getElementById('logo-img').style.animation   = 'logo-in '+d+' ease forwards';""")

# ── 11. Néon Noir ────────────────────────────────────────────────────────────
make('neonoir', 'Néon Noir',
css="""\
    @keyframes scan-v  { from{top:-4px;opacity:0} 5%{opacity:1} 95%{opacity:1} to{top:1084px;opacity:0} }
    @keyframes flick   { 0%,100%{opacity:1} 30%{opacity:.7} 31%{opacity:1} 60%{opacity:.9} }
    @keyframes logo-in { 0%,25%{opacity:0} 50%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    #neon-bg   { position:absolute; inset:0; background:#000; }
    #neon-glow { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 50%,rgba(255,0,127,.12) 0%,transparent 70%); }
    #scanline  { position:absolute; left:0; width:1920px; height:4px; background:rgba(0,255,204,.7); box-shadow:0 0 18px 4px rgba(0,255,204,.5); top:-4px; }""",
body="""\
  <div id="neon-bg"></div>
  <div id="neon-glow"></div>
  <div id="scanline"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('scanline').style.animation  = 'scan-v '+d+' linear forwards';
      document.getElementById('neon-glow').style.animation = 'flick '+d+' ease forwards';
      document.getElementById('logo-img').style.animation  = 'logo-in '+d+' ease forwards';""")

# ── 12. Pastel Doux ───────────────────────────────────────────────────────────
make('pastel', 'Pastel Doux',
css="""\
    @keyframes circle-grow { 0%{transform:scale(0);opacity:0} 40%{transform:scale(1);opacity:.85} 75%{transform:scale(1);opacity:.85} 100%{transform:scale(1.2);opacity:0} }
    @keyframes logo-in     { 0%,35%{opacity:0} 60%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    .pcircle { position:absolute; border-radius:50%; opacity:0; }
    #pc1 { width:1400px; height:1400px; top:-200px; left:-200px; background:#FFB3D9; }
    #pc2 { width:1200px; height:1200px; top:0; right:-150px; background:#B3D9FF; }
    #pc3 { width:1000px; height:1000px; bottom:-100px; left:50%; margin-left:-500px; background:#FFE5A0; }""",
body="""\
  <div class="pcircle" id="pc1"></div>
  <div class="pcircle" id="pc2"></div>
  <div class="pcircle" id="pc3"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('pc1').style.animation = 'circle-grow '+d+' cubic-bezier(.22,1,.36,1) forwards';
      document.getElementById('pc2').style.animation = 'circle-grow '+d+' .12s cubic-bezier(.22,1,.36,1) forwards';
      document.getElementById('pc3').style.animation = 'circle-grow '+d+' .22s cubic-bezier(.22,1,.36,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 13. Duotone ───────────────────────────────────────────────────────────────
make('duotone', 'Duotone',
css="""\
    @keyframes dt-left  { 0%{transform:translateX(-100%)} 38%{transform:translateX(0)} 68%{transform:translateX(0)} 100%{transform:translateX(-100%)} }
    @keyframes dt-right { 0%{transform:translateX(100%)}  38%{transform:translateX(0)} 68%{transform:translateX(0)} 100%{transform:translateX(100%)} }
    @keyframes logo-in  { 0%,33%{opacity:0} 55%{opacity:1} 68%{opacity:1} 100%{opacity:0} }
    #dt1 { position:absolute; top:0; left:0;  width:960px; height:1080px; background:#0D0221; }
    #dt2 { position:absolute; top:0; right:0; width:960px; height:1080px; background:#FF6EC7; }""",
body="""\
  <div id="dt1"></div>
  <div id="dt2"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('dt1').style.animation = 'dt-left '+d+' cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('dt2').style.animation = 'dt-right '+d+' cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 14. Aurora Boréale ────────────────────────────────────────────────────────
make('aurora', 'Aurora Boréale',
css="""\
    @keyframes aurora-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes aurora-fade  { 0%{opacity:0} 30%{opacity:1} 75%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in      { 0%,30%{opacity:0} 55%{opacity:1} 78%{opacity:1} 100%{opacity:0} }
    #aurora-bg   { position:absolute; inset:0; background:#0D1B2A; }
    #aurora-wave { position:absolute; inset:0; background:linear-gradient(135deg,#50FA7B,#7FFFD4,#9966FF,#FF6EC7,#50FA7B); background-size:400% 400%; opacity:0; }""",
body="""\
  <div id="aurora-bg"></div>
  <div id="aurora-wave"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('aurora-wave').style.animation = 'aurora-shift 3s ease infinite, aurora-fade '+d+' ease forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 15. Bauhaus ───────────────────────────────────────────────────────────────
make('bauhaus', 'Bauhaus',
css="""\
    @keyframes circle-drop { 0%{transform:translateY(-600px) scale(.5);opacity:0} 55%{transform:translateY(0) scale(1);opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes rect-slide  { 0%{transform:translateX(800px);opacity:0} 50%{transform:translateX(0);opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes tri-rise    { 0%{transform:translateY(600px);opacity:0} 60%{transform:translateY(0);opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in     { 0%,42%{opacity:0} 65%{opacity:1} 82%{opacity:1} 100%{opacity:0} }
    #bh-bg     { position:absolute; inset:0; background:#FFFFFF; }
    #bh-circle { position:absolute; width:520px; height:520px; border-radius:50%; background:#CC0000; top:50%; left:50%; margin:-260px 0 0 -560px; opacity:0; }
    #bh-rect   { position:absolute; width:380px; height:260px; background:#002FA7; top:50%; left:50%; margin:-130px 0 0 50px; opacity:0; }
    #bh-tri    { position:absolute; width:0; height:0; border-left:200px solid transparent; border-right:200px solid transparent; border-bottom:346px solid #FFCC00; top:50%; left:50%; margin:-180px 0 0 200px; opacity:0; }""",
body="""\
  <div id="bh-bg"></div>
  <div id="bh-circle"></div>
  <div id="bh-rect"></div>
  <div id="bh-tri"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('bh-circle').style.animation = 'circle-drop '+d+' cubic-bezier(.34,1.56,.64,1) forwards';
      document.getElementById('bh-rect').style.animation   = 'rect-slide '+d+' .08s cubic-bezier(.22,1,.36,1) forwards';
      document.getElementById('bh-tri').style.animation    = 'tri-rise '+d+' .16s cubic-bezier(.34,1.56,.64,1) forwards';
      document.getElementById('logo-img').style.animation  = 'logo-in '+d+' ease forwards';""")

# ── 16. Art Déco ──────────────────────────────────────────────────────────────
make('artdeco', 'Art Déco',
css="""\
    @keyframes fan-open { 0%{transform:scaleY(0);opacity:0} 50%{transform:scaleY(1);opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes deco-bg  { 0%{opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in  { 0%,38%{opacity:0} 62%{opacity:1} 82%{opacity:1} 100%{opacity:0} }
    #deco-bg { position:absolute; inset:0; background:#1A1206; opacity:0; }
    .deco-bar { position:absolute; top:0; height:1080px; width:12px; background:linear-gradient(180deg,#C9A84C,#8B6A2A,#C9A84C); transform-origin:top center; transform:scaleY(0); opacity:0; }""",
body="""\
  <div id="deco-bg"></div>
  <div class="deco-bar" style="left:calc(50% - 320px)"></div>
  <div class="deco-bar" style="left:calc(50% - 220px)"></div>
  <div class="deco-bar" style="left:calc(50% - 120px)"></div>
  <div class="deco-bar" style="left:calc(50% - 6px)"></div>
  <div class="deco-bar" style="left:calc(50% + 108px)"></div>
  <div class="deco-bar" style="left:calc(50% + 208px)"></div>
  <div class="deco-bar" style="left:calc(50% + 308px)"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('deco-bg').style.animation = 'deco-bg '+d+' ease forwards';
      var delays = [0,.06,.12,.18,.12,.06,0];
      document.querySelectorAll('.deco-bar').forEach(function(el,i){
        el.style.animation = 'fan-open '+d+' '+delays[i]+'s cubic-bezier(.34,1.26,.64,1) forwards';
      });
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 17. Y2K ───────────────────────────────────────────────────────────────────
make('y2k', 'Y2K',
css="""\
    @keyframes chrome-in { 0%{transform:scaleX(0)} 45%{transform:scaleX(1)} 75%{transform:scaleX(1)} 100%{transform:scaleX(0)} }
    @keyframes star-spin { 0%{transform:rotate(0deg) scale(0);opacity:0} 40%{transform:rotate(180deg) scale(1);opacity:1} 80%{opacity:1} 100%{opacity:0;transform:rotate(360deg) scale(0)} }
    @keyframes logo-in   { 0%,35%{opacity:0} 58%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    #y2k-bg { position:absolute; inset:0; background:linear-gradient(135deg,#C0C0C0,#E8E8E8,#A0A0A0); }
    .chrome-bar { position:absolute; left:0; width:1920px; height:80px; background:linear-gradient(180deg,#E8E8E8,#888,#E8E8E8); transform:scaleX(0); transform-origin:left; }
    .y2k-star { position:absolute; width:80px; height:80px; clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); background:#FFD700; opacity:0; }""",
body="""\
  <div id="y2k-bg"></div>
  <div class="chrome-bar" style="top:200px"></div>
  <div class="chrome-bar" style="top:460px"></div>
  <div class="chrome-bar" style="top:720px"></div>
  <div class="y2k-star" style="top:150px;left:200px"></div>
  <div class="y2k-star" style="top:700px;right:250px"></div>
  <div class="y2k-star" style="top:400px;left:100px;width:60px;height:60px"></div>""",
js_build="""\
      var d = DUR+'s';
      document.querySelectorAll('.chrome-bar').forEach(function(el,i){
        el.style.animation = 'chrome-in '+d+' '+(i*0.1)+'s cubic-bezier(.22,1,.36,1) forwards';
      });
      document.querySelectorAll('.y2k-star').forEach(function(el,i){
        el.style.animation = 'star-spin '+d+' '+(i*0.12)+'s cubic-bezier(.34,1.56,.64,1) forwards';
      });
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 18. Wabi-Sabi ─────────────────────────────────────────────────────────────
make('wabisabi', 'Wabi-Sabi',
css="""\
    @keyframes ink-spread { 0%{clip-path:circle(0% at 50% 50%)} 55%{clip-path:circle(80% at 50% 50%)} 80%{clip-path:circle(80% at 50% 50%)} 100%{clip-path:circle(0% at 50% 50%)} }
    @keyframes logo-in    { 0%,38%{opacity:0} 62%{opacity:1} 82%{opacity:1} 100%{opacity:0} }
    #ws-bg  { position:absolute; inset:0; background:#F5F0E8; }
    #ws-ink { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 50%,#3C3228 0%,#6B5C4E 40%,#8C7B6B 70%,transparent 100%); clip-path:circle(0% at 50% 50%); }""",
body="""\
  <div id="ws-bg"></div>
  <div id="ws-ink"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('ws-ink').style.animation = 'ink-spread '+d+' cubic-bezier(.37,0,.63,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 19. Swiss Style ───────────────────────────────────────────────────────────
make('swiss', 'Swiss Style',
css="""\
    @keyframes rule-shoot { 0%{transform:scaleX(0);transform-origin:left} 30%{transform:scaleX(1);transform-origin:left} 60%{transform:scaleX(1);transform-origin:right} 100%{transform:scaleX(0);transform-origin:right} }
    @keyframes block-drop { 0%{transform:translateY(-100%)} 25%{transform:translateY(0)} 75%{transform:translateY(0)} 100%{transform:translateY(-100%)} }
    @keyframes logo-in    { 0%,30%{opacity:0} 55%{opacity:1} 78%{opacity:1} 100%{opacity:0} }
    #sw-bg    { position:absolute; inset:0; background:#FFFFFF; }
    #sw-block { position:absolute; top:0; left:0; width:1920px; height:380px; background:#FF0000; }
    #sw-rule  { position:absolute; top:380px; left:0; width:1920px; height:10px; background:#000; transform:scaleX(0); transform-origin:left; }""",
body="""\
  <div id="sw-bg"></div>
  <div id="sw-block"></div>
  <div id="sw-rule"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('sw-block').style.animation = 'block-drop '+d+' cubic-bezier(.22,1,.36,1) forwards';
      document.getElementById('sw-rule').style.animation  = 'rule-shoot '+d+' .1s ease forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 20. Biomorphique ──────────────────────────────────────────────────────────
make('biomorphic', 'Biomorphique',
css="""\
    @keyframes morph { 0%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;transform:scale(0)} 40%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%;transform:scale(1.1)} 60%{border-radius:70% 30% 50% 60%/40% 70% 60% 30%;transform:scale(1)} 80%{border-radius:50% 60% 40% 60%/60% 40% 70% 30%;transform:scale(1)} 100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%;transform:scale(0)} }
    @keyframes logo-in { 0%,35%{opacity:0} 58%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    #bio-bg   { position:absolute; inset:0; background:#0D2B1E; }
    #bio-blob { position:absolute; top:50%; left:50%; width:900px; height:900px; margin:-450px 0 0 -450px; background:radial-gradient(circle at 40% 40%,#50C878,#1A5C3A); }""",
body="""\
  <div id="bio-bg"></div>
  <div id="bio-blob"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('bio-blob').style.animation = 'morph '+d+' cubic-bezier(.37,0,.63,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 21. Terreux ───────────────────────────────────────────────────────────────
make('earthy', 'Terreux',
css="""\
    @keyframes earth-rise { 0%{transform:translateY(100%)} 45%{transform:translateY(0)} 75%{transform:translateY(0)} 100%{transform:translateY(100%)} }
    @keyframes logo-in    { 0%,38%{opacity:0} 60%{opacity:1} 78%{opacity:1} 100%{opacity:0} }
    #earth-bg    { position:absolute; inset:0; background:#1A0F0A; }
    #earth-panel { position:absolute; inset:0; background:linear-gradient(180deg,#3D2B1F 0%,#6B4A34 35%,#8C6548 55%,#C4855A 75%,#D4A574 100%); transform:translateY(100%); }""",
body="""\
  <div id="earth-bg"></div>
  <div id="earth-panel"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('earth-panel').style.animation = 'earth-rise '+d+' cubic-bezier(.22,1,.36,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 22. Botanique ─────────────────────────────────────────────────────────────
make('botanik', 'Botanique',
css="""\
    @keyframes leaf-unfurl { 0%{transform:scale(0) rotate(-45deg);opacity:0} 50%{transform:scale(1) rotate(0deg);opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in     { 0%,38%{opacity:0} 62%{opacity:1} 82%{opacity:1} 100%{opacity:0} }
    #bot-bg { position:absolute; inset:0; background:#1A2E1A; }
    #l1 { position:absolute; width:700px; height:700px; top:-100px; left:-100px; border-radius:0 50% 0 50%; background:radial-gradient(circle at 30% 30%,#2D7A2D,#1A4A1A); opacity:0; }
    #l2 { position:absolute; width:600px; height:600px; bottom:-80px; right:-80px; border-radius:50% 0 50% 0; background:radial-gradient(circle at 70% 70%,#3DAA3D,#228B22); opacity:0; }
    #l3 { position:absolute; width:400px; height:400px; top:50%; left:50%; margin:-200px; border-radius:30% 70% 60% 40%; background:radial-gradient(circle at 50% 30%,#50C878,#1A5C1A); opacity:0; }""",
body="""\
  <div id="bot-bg"></div>
  <div id="l1"></div>
  <div id="l2"></div>
  <div id="l3"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('l1').style.animation = 'leaf-unfurl '+d+' cubic-bezier(.34,1.26,.64,1) forwards';
      document.getElementById('l2').style.animation = 'leaf-unfurl '+d+' .15s cubic-bezier(.34,1.26,.64,1) forwards';
      document.getElementById('l3').style.animation = 'leaf-unfurl '+d+' .3s cubic-bezier(.34,1.26,.64,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 23. Aquarelle ─────────────────────────────────────────────────────────────
make('aquarelle', 'Aquarelle',
css="""\
    @keyframes wash { 0%{filter:blur(60px);opacity:0;transform:scale(.8)} 45%{filter:blur(8px);opacity:.9;transform:scale(1)} 75%{filter:blur(8px);opacity:.9} 100%{filter:blur(60px);opacity:0;transform:scale(1.1)} }
    @keyframes logo-in { 0%,38%{opacity:0} 62%{opacity:1} 78%{opacity:1} 100%{opacity:0} }
    #aq-bg   { position:absolute; inset:0; background:#EEF5FF; }
    #aq-wash { position:absolute; inset:-60px; background:radial-gradient(ellipse at 30% 40%,#99BBFF 0%,#6688CC 25%,#AADDEE 50%,#FFB3D9 75%,#B3DDFF 100%); filter:blur(60px); opacity:0; }""",
body="""\
  <div id="aq-bg"></div>
  <div id="aq-wash"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('aq-wash').style.animation = 'wash '+d+' ease forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 24. Cosmos ────────────────────────────────────────────────────────────────
make('cosmos', 'Cosmos',
css="""\
    @keyframes star-burst  { 0%{opacity:0;transform:scale(0)} 30%{opacity:1;transform:scale(1)} 80%{opacity:1} 100%{opacity:0} }
    @keyframes nebula-glow { 0%{opacity:0} 25%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in     { 0%,30%{opacity:0} 55%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    #cos-bg     { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 50%,#050D25,#020818); }
    #cos-nebula { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 50%,rgba(153,102,255,.4) 0%,rgba(255,110,199,.2) 40%,transparent 70%); opacity:0; }
    .cos-star   { position:absolute; width:4px; height:4px; border-radius:50%; background:#fff; box-shadow:0 0 8px 2px rgba(255,255,255,.9); opacity:0; }""",
body="""\
  <div id="cos-bg"></div>
  <div id="cos-nebula"></div>
  <div class="cos-star" style="top:15%;left:20%"></div><div class="cos-star" style="top:25%;left:75%"></div>
  <div class="cos-star" style="top:65%;left:15%"></div><div class="cos-star" style="top:70%;left:80%"></div>
  <div class="cos-star" style="top:45%;left:8%"></div> <div class="cos-star" style="top:40%;left:90%"></div>
  <div class="cos-star" style="top:10%;left:55%"></div><div class="cos-star" style="top:85%;left:45%"></div>
  <div class="cos-star" style="top:35%;left:35%"></div><div class="cos-star" style="top:60%;left:65%"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('cos-nebula').style.animation = 'nebula-glow '+d+' ease forwards';
      document.querySelectorAll('.cos-star').forEach(function(el,i){
        el.style.animation = 'star-burst '+d+' '+(i*0.06)+'s ease forwards';
      });
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 25. Brutalism Digital ─────────────────────────────────────────────────────
make('brutalism', 'Brutalism Digital',
css="""\
    @keyframes hard-in  { 0%{transform:translateX(-100%)} 40%{transform:translateX(0)} 70%{transform:translateX(0)} 100%{transform:translateX(100%)} }
    @keyframes glitch   { 0%{clip-path:inset(0 0 100% 0)} 15%{clip-path:inset(0 0 70% 0)} 30%{clip-path:inset(10% 0 50% 0)} 45%{clip-path:inset(25% 0 30% 0)} 60%{clip-path:inset(40% 0 10% 0)} 75%{clip-path:inset(60% 0 0)} 85%,100%{clip-path:inset(0)} }
    @keyframes logo-in  { 0%,38%{opacity:0} 60%{opacity:1} 78%{opacity:1} 100%{opacity:0} }
    #br-red   { position:absolute; inset:0; background:#FF3300; }
    #br-white { position:absolute; inset:0; background:#fff; }
    #br-black { position:absolute; inset:0; background:#000; clip-path:inset(0 0 100% 0); }""",
body="""\
  <div id="br-red"></div>
  <div id="br-white"></div>
  <div id="br-black"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('br-red').style.animation   = 'hard-in '+d+' cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('br-black').style.animation = 'glitch '+d+' steps(1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 26. Skéuomorphisme ────────────────────────────────────────────────────────
make('skeuo', 'Skéuomorphisme',
css="""\
    @keyframes curtain-open-l { 0%{transform:scaleX(1)} 50%{transform:scaleX(0)} 80%{transform:scaleX(0)} 100%{transform:scaleX(1)} }
    @keyframes curtain-open-r { 0%{transform:scaleX(1)} 50%{transform:scaleX(0)} 80%{transform:scaleX(0)} 100%{transform:scaleX(1)} }
    @keyframes logo-in        { 0%,42%{opacity:0} 65%{opacity:1} 82%{opacity:1} 100%{opacity:0} }
    #sk-bg        { position:absolute; inset:0; background:linear-gradient(160deg,#2C2C2C,#1A1A1A,#383838); }
    #sk-curtain-l { position:absolute; top:0; left:0;  width:960px; height:1080px; background:linear-gradient(90deg,#3A3020,#B8A060,#2A2010); transform-origin:left; }
    #sk-curtain-r { position:absolute; top:0; right:0; width:960px; height:1080px; background:linear-gradient(90deg,#2A2010,#B8A060,#3A3020); transform-origin:right; }""",
body="""\
  <div id="sk-bg"></div>
  <div id="sk-curtain-l"></div>
  <div id="sk-curtain-r"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('sk-curtain-l').style.animation = 'curtain-open-l '+d+' cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('sk-curtain-r').style.animation = 'curtain-open-r '+d+' cubic-bezier(.76,0,.24,1) forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 27. HUD Sci-Fi ────────────────────────────────────────────────────────────
make('hud', 'HUD Sci-Fi',
css="""\
    @keyframes scan-v   { from{top:-4px;opacity:0} 5%{opacity:1} 95%{opacity:1} to{top:1084px;opacity:0} }
    @keyframes hud-fade { 0%,5%{opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in  { 0%,30%{opacity:0} 55%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    #hud-bg      { position:absolute; inset:0; background:#000A00; }
    #hud-grid    { position:absolute; inset:0; background-image:linear-gradient(rgba(0,255,65,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,65,.06) 1px,transparent 1px); background-size:60px 60px; opacity:0; }
    #hud-scan    { position:absolute; left:0; width:1920px; height:4px; top:-4px; background:rgba(0,255,65,.8); box-shadow:0 0 20px 6px rgba(0,255,65,.5); }
    #hud-cross-h { position:absolute; top:50%; left:10%; width:80%; height:2px; background:rgba(0,255,65,.5); margin-top:-1px; opacity:0; }
    #hud-cross-v { position:absolute; left:50%; top:10%; width:2px; height:80%; background:rgba(0,255,65,.5); margin-left:-1px; opacity:0; }""",
body="""\
  <div id="hud-bg"></div>
  <div id="hud-grid"></div>
  <div id="hud-cross-h"></div>
  <div id="hud-cross-v"></div>
  <div id="hud-scan"></div>""",
js_build="""\
      var d = DUR+'s';
      document.getElementById('hud-scan').style.animation    = 'scan-v '+d+' linear forwards';
      document.getElementById('hud-grid').style.animation    = 'hud-fade '+d+' ease forwards';
      document.getElementById('hud-cross-h').style.animation = 'hud-fade '+d+' .1s ease forwards';
      document.getElementById('hud-cross-v').style.animation = 'hud-fade '+d+' .2s ease forwards';
      document.getElementById('logo-img').style.animation    = 'logo-in '+d+' ease forwards';""")

# ── 28. Pixel Art ─────────────────────────────────────────────────────────────
make('pixelart', 'Pixel Art',
css="""\
    @keyframes pixel-fill { 0%{opacity:0} 30%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    @keyframes logo-in    { 0%,28%{opacity:0} 52%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    #px-bg      { position:absolute; inset:0; background:#0F0F2D; }
    #px-overlay { position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 7px,rgba(0,0,0,.3) 8px),repeating-linear-gradient(90deg,transparent,transparent 7px,rgba(0,0,0,.3) 8px); opacity:0; }
    #px1 { position:absolute; top:0; left:0;    width:480px; height:540px; background:#FF0077; opacity:0; }
    #px2 { position:absolute; top:0; right:0;   width:480px; height:540px; background:#FFFF00; opacity:0; }
    #px3 { position:absolute; bottom:0; left:0; width:480px; height:540px; background:#00FFCC; opacity:0; }
    #px4 { position:absolute; bottom:0; right:0;width:480px; height:540px; background:#5577FF; opacity:0; }""",
body="""\
  <div id="px-bg"></div>
  <div id="px1"></div><div id="px2"></div>
  <div id="px3"></div><div id="px4"></div>
  <div id="px-overlay"></div>""",
js_build="""\
      var d = DUR+'s';
      [['px1',0],['px2',.1],['px3',.2],['px4',.15]].forEach(function(p){
        document.getElementById(p[0]).style.animation = 'pixel-fill '+d+' '+p[1]+'s steps(4) forwards';
      });
      document.getElementById('px-overlay').style.animation = 'pixel-fill '+d+' .05s ease forwards';
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

# ── 29. Datavisualization ─────────────────────────────────────────────────────
make('dataviz', 'Datavisualization',
css="""\
    @keyframes bar-rise { 0%{transform:scaleY(0)} 50%{transform:scaleY(1)} 80%{transform:scaleY(1)} 100%{transform:scaleY(0)} }
    @keyframes logo-in  { 0%,40%{opacity:0} 62%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
    #dv-bg   { position:absolute; inset:0; background:#0A1628; }
    #dv-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(78,196,207,.08) 1px,transparent 1px); background-size:100% 108px; }
    .dv-bar  { position:absolute; bottom:0; transform-origin:bottom; transform:scaleY(0); border-radius:4px 4px 0 0; }
    #b1 {left:80px;  width:100px;height:700px;background:linear-gradient(0deg,#FF6B35,#FF9A6C);}
    #b2 {left:220px; width:100px;height:500px;background:linear-gradient(0deg,#4EC4CF,#7FE5EE);}
    #b3 {left:360px; width:100px;height:850px;background:linear-gradient(0deg,#FF6B35,#FF9A6C);}
    #b4 {left:500px; width:100px;height:400px;background:linear-gradient(0deg,#9966FF,#BB99FF);}
    #b5 {left:640px; width:100px;height:620px;background:linear-gradient(0deg,#4EC4CF,#7FE5EE);}
    #b6 {left:780px; width:100px;height:780px;background:linear-gradient(0deg,#FF6B35,#FF9A6C);}
    #b7 {left:920px; width:100px;height:550px;background:linear-gradient(0deg,#9966FF,#BB99FF);}
    #b8 {left:1060px;width:100px;height:680px;background:linear-gradient(0deg,#4EC4CF,#7FE5EE);}
    #b9 {left:1200px;width:100px;height:460px;background:linear-gradient(0deg,#FF6B35,#FF9A6C);}
    #b10{left:1340px;width:100px;height:820px;background:linear-gradient(0deg,#9966FF,#BB99FF);}
    #b11{left:1480px;width:100px;height:590px;background:linear-gradient(0deg,#4EC4CF,#7FE5EE);}
    #b12{left:1620px;width:100px;height:730px;background:linear-gradient(0deg,#FF6B35,#FF9A6C);}
    #b13{left:1760px;width:100px;height:380px;background:linear-gradient(0deg,#9966FF,#BB99FF);}""",
body="""\
  <div id="dv-bg"></div>
  <div id="dv-grid"></div>
  <div class="dv-bar" id="b1"></div><div class="dv-bar" id="b2"></div><div class="dv-bar" id="b3"></div>
  <div class="dv-bar" id="b4"></div><div class="dv-bar" id="b5"></div><div class="dv-bar" id="b6"></div>
  <div class="dv-bar" id="b7"></div><div class="dv-bar" id="b8"></div><div class="dv-bar" id="b9"></div>
  <div class="dv-bar" id="b10"></div><div class="dv-bar" id="b11"></div><div class="dv-bar" id="b12"></div>
  <div class="dv-bar" id="b13"></div>""",
js_build="""\
      var d = DUR+'s';
      var delays = [0,.06,.12,.18,.24,.30,.36,.30,.24,.18,.12,.06,0];
      document.querySelectorAll('.dv-bar').forEach(function(el,i){
        el.style.animation = 'bar-rise '+d+' '+delays[i]+'s cubic-bezier(.22,1,.36,1) forwards';
      });
      document.getElementById('logo-img').style.animation = 'logo-in '+d+' ease forwards';""")

print('Done! All 29 stingers created.')
