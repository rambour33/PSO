CARDS_HTML = """
        <!-- ── Design & Styles ── -->
        <div class="themes-group-label" style="grid-column:1/-1">Design &amp; Styles</div>

        <div class="theme-preset-card" data-theme="whitespace">
          <div class="theme-preset-preview" style="background:#FFFFFF;border:1px solid #eee">
            <span style="color:#111;font-family:'Russo One',sans-serif;font-size:13px;letter-spacing:3px">BLANC</span>
          </div>
          <div class="theme-preset-name">Blanc Négatif</div>
        </div>

        <div class="theme-preset-card" data-theme="monochrome">
          <div class="theme-preset-preview" style="background:linear-gradient(90deg,#000 50%,#fff 50%)">
            <span style="color:#888;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px;mix-blend-mode:difference;color:#fff">MONO</span>
          </div>
          <div class="theme-preset-name">Monochrome Strict</div>
        </div>

        <div class="theme-preset-card" data-theme="brutaliste">
          <div class="theme-preset-preview" style="background:#fff;border:3px solid #000;position:relative;overflow:hidden">
            <div style="position:absolute;left:0;top:0;width:8px;height:100%;background:#FF0000"></div>
            <span style="color:#000;font-family:monospace;font-size:14px;font-weight:900;letter-spacing:1px;padding-left:12px">BRUTAL</span>
          </div>
          <div class="theme-preset-name">Grid Brutaliste</div>
        </div>

        <div class="theme-preset-card" data-theme="flatdesign">
          <div class="theme-preset-preview" style="background:#3498DB;position:relative;overflow:hidden;display:flex;align-items:stretch;padding:0">
            <div style="flex:1;background:#E74C3C"></div>
            <div style="flex:1;background:#3498DB;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-family:'Russo One',sans-serif;font-size:10px;letter-spacing:1px">FLAT</span></div>
            <div style="flex:1;background:#2ECC71"></div>
          </div>
          <div class="theme-preset-name">Flat Design 2.0</div>
        </div>

        <div class="theme-preset-card" data-theme="glass">
          <div class="theme-preset-preview" style="background:linear-gradient(135deg,rgba(100,150,255,.3),rgba(200,100,255,.2));backdrop-filter:blur(8px);position:relative">
            <div style="position:absolute;inset:8px;border-radius:8px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.4)"></div>
            <span style="position:relative;color:#fff;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px;text-shadow:0 1px 8px rgba(0,0,0,.4)">GLASS</span>
          </div>
          <div class="theme-preset-name">Glassmorphism</div>
        </div>

        <div class="theme-preset-card" data-theme="neuro">
          <div class="theme-preset-preview" style="background:#E0E5EC;position:relative">
            <div style="position:absolute;inset:10px;border-radius:16px;background:#E0E5EC;box-shadow:6px 6px 12px #b8bec7,-6px -6px 12px #ffffff"></div>
            <span style="position:relative;color:#555577;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px">NEURO</span>
          </div>
          <div class="theme-preset-name">Neumorphism</div>
        </div>

        <div class="theme-preset-card" data-theme="clay">
          <div class="theme-preset-preview" style="background:#FF9999;position:relative;overflow:hidden">
            <div style="position:absolute;width:60px;height:60px;border-radius:60% 40% 70% 30%/30% 60% 40% 70%;background:#FF7F7F;box-shadow:inset -4px -4px 8px rgba(0,0,0,.15),inset 4px 4px 8px rgba(255,255,255,.4);top:50%;left:20%;transform:translate(-50%,-50%)"></div>
            <div style="position:absolute;width:50px;height:50px;border-radius:40% 60% 30% 70%/60% 40% 70% 30%;background:#FFD700;box-shadow:inset -4px -4px 8px rgba(0,0,0,.15),inset 4px 4px 8px rgba(255,255,255,.4);top:50%;left:65%;transform:translate(-50%,-50%)"></div>
          </div>
          <div class="theme-preset-name">Clay 3D</div>
        </div>

        <div class="theme-preset-card" data-theme="paper">
          <div class="theme-preset-preview" style="background:#F5F0E8;position:relative;overflow:hidden">
            <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(60,50,40,.2);transform:skewX(-5deg)"></div>
            <span style="color:#3C3228;font-family:Georgia,serif;font-size:12px;letter-spacing:2px;font-style:italic">origami</span>
          </div>
          <div class="theme-preset-name">Paper Origami</div>
        </div>

        <div class="theme-preset-card" data-theme="grain">
          <div class="theme-preset-preview" style="background:#1A1A2E;position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 64 64%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.4%22/%3E%3C/svg%3E');background-size:64px 64px;opacity:.8"></div>
            <span style="position:relative;color:#E8D5B7;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px">GRAIN</span>
          </div>
          <div class="theme-preset-name">Grain &amp; Noise</div>
        </div>

        <div class="theme-preset-card" data-theme="darkelegant">
          <div class="theme-preset-preview" style="background:#0A0A0F;position:relative">
            <div style="position:absolute;top:50%;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin-top:-0.5px"></div>
            <span style="color:#C9A84C;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:3px;text-shadow:0 0 12px rgba(201,168,76,.5)">ÉLÉGANT</span>
          </div>
          <div class="theme-preset-name">Dark Élégant</div>
        </div>

        <div class="theme-preset-card" data-theme="neonoir">
          <div class="theme-preset-preview" style="background:#000;position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(255,0,127,.2),transparent 70%)"></div>
            <span style="color:#FF007F;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px;text-shadow:0 0 12px #FF007F">NÉ</span>
            <span style="color:#00FFCC;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px;text-shadow:0 0 12px #00FFCC">ON</span>
          </div>
          <div class="theme-preset-name">Néon Noir</div>
        </div>

        <div class="theme-preset-card" data-theme="pastel">
          <div class="theme-preset-preview" style="background:linear-gradient(135deg,#FFB3D9,#B3D9FF,#FFE5A0);position:relative">
            <span style="color:#6B4E71;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px">PASTEL</span>
          </div>
          <div class="theme-preset-name">Pastel Doux</div>
        </div>

        <div class="theme-preset-card" data-theme="duotone">
          <div class="theme-preset-preview" style="background:linear-gradient(90deg,#0D0221 50%,#FF6EC7 50%);position:relative">
            <span style="color:#fff;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px">DUO</span>
          </div>
          <div class="theme-preset-name">Duotone</div>
        </div>

        <div class="theme-preset-card" data-theme="aurora">
          <div class="theme-preset-preview" style="background:linear-gradient(135deg,#0D1B2A,#1A3A2A);position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(80,250,123,.3),rgba(127,255,212,.2),rgba(153,102,255,.3));filter:blur(8px)"></div>
            <span style="position:relative;color:#7FFFD4;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px;text-shadow:0 0 8px rgba(127,255,212,.8)">AURORA</span>
          </div>
          <div class="theme-preset-name">Aurora Boréale</div>
        </div>

        <div class="theme-preset-card" data-theme="bauhaus">
          <div class="theme-preset-preview" style="background:#fff;position:relative;overflow:hidden">
            <div style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:50%;background:#CC0000"></div>
            <div style="position:absolute;left:44px;top:50%;transform:translateY(-50%);width:22px;height:16px;background:#002FA7"></div>
            <div style="position:absolute;left:72px;top:50%;transform:translateY(-50%);width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-bottom:20px solid #FFCC00;margin-top:-10px"></div>
          </div>
          <div class="theme-preset-name">Bauhaus</div>
        </div>

        <div class="theme-preset-card" data-theme="artdeco">
          <div class="theme-preset-preview" style="background:#1A1206;position:relative;overflow:hidden">
            <div style="display:flex;align-items:center;gap:4px;height:100%">
              <div style="width:3px;height:70%;background:linear-gradient(180deg,#C9A84C,#8B6A2A,#C9A84C)"></div>
              <div style="width:3px;height:85%;background:linear-gradient(180deg,#C9A84C,#8B6A2A,#C9A84C)"></div>
              <div style="width:3px;height:95%;background:linear-gradient(180deg,#C9A84C,#8B6A2A,#C9A84C)"></div>
              <div style="width:3px;height:100%;background:linear-gradient(180deg,#C9A84C,#8B6A2A,#C9A84C)"></div>
              <div style="width:3px;height:95%;background:linear-gradient(180deg,#C9A84C,#8B6A2A,#C9A84C)"></div>
              <div style="width:3px;height:85%;background:linear-gradient(180deg,#C9A84C,#8B6A2A,#C9A84C)"></div>
              <div style="width:3px;height:70%;background:linear-gradient(180deg,#C9A84C,#8B6A2A,#C9A84C)"></div>
            </div>
          </div>
          <div class="theme-preset-name">Art Déco</div>
        </div>

        <div class="theme-preset-card" data-theme="y2k">
          <div class="theme-preset-preview" style="background:linear-gradient(135deg,#C0C0C0,#E8E8E8,#A0A0A0);position:relative;overflow:hidden">
            <div style="position:absolute;top:30%;left:0;right:0;height:12px;background:linear-gradient(180deg,#E8E8E8,#888,#E8E8E8)"></div>
            <span style="position:relative;color:#FF00FF;font-family:'Russo One',sans-serif;font-size:13px;letter-spacing:2px;text-shadow:1px 1px 0 #00FFFF">Y2K</span>
          </div>
          <div class="theme-preset-name">Y2K</div>
        </div>

        <div class="theme-preset-card" data-theme="wabisabi">
          <div class="theme-preset-preview" style="background:#F5F0E8;position:relative;overflow:hidden">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:45% 55% 50% 50%;background:rgba(60,50,40,.15)"></div>
            <span style="position:relative;color:#5C5248;font-family:Georgia,serif;font-size:11px;letter-spacing:1px;font-style:italic">侘寂</span>
          </div>
          <div class="theme-preset-name">Wabi-Sabi</div>
        </div>

        <div class="theme-preset-card" data-theme="swiss">
          <div class="theme-preset-preview" style="background:#fff;position:relative;overflow:hidden">
            <div style="position:absolute;top:35%;left:0;right:0;height:28%;background:#FF0000"></div>
            <div style="position:absolute;top:63%;left:0;right:0;height:3px;background:#000"></div>
            <span style="position:relative;color:#000;font-family:'Helvetica Neue',Helvetica,sans-serif;font-size:13px;font-weight:900;letter-spacing:3px">SWISS</span>
          </div>
          <div class="theme-preset-name">Swiss Style</div>
        </div>

        <div class="theme-preset-card" data-theme="biomorphic">
          <div class="theme-preset-preview" style="background:#0D2B1E;position:relative;overflow:hidden">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:52px;height:52px;border-radius:60% 40% 30% 70%/60% 30% 70% 40%;background:radial-gradient(circle at 40% 40%,#50C878,#1A5C3A)"></div>
          </div>
          <div class="theme-preset-name">Biomorphique</div>
        </div>

        <div class="theme-preset-card" data-theme="earthy">
          <div class="theme-preset-preview" style="background:linear-gradient(180deg,#3D2B1F 0%,#8C6548 50%,#D4A574 100%)">
            <span style="color:#F0DCC8;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px">EARTH</span>
          </div>
          <div class="theme-preset-name">Terreux</div>
        </div>

        <div class="theme-preset-card" data-theme="botanik">
          <div class="theme-preset-preview" style="background:#1A2E1A;position:relative;overflow:hidden">
            <div style="position:absolute;top:-10px;left:-10px;width:48px;height:48px;border-radius:0 50% 0 50%;background:radial-gradient(circle at 30% 30%,#2D7A2D,#1A4A1A)"></div>
            <div style="position:absolute;bottom:-8px;right:-8px;width:40px;height:40px;border-radius:50% 0 50% 0;background:radial-gradient(circle at 70% 70%,#3DAA3D,#228B22)"></div>
            <span style="position:relative;color:#90EE90;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px">BOTANIC</span>
          </div>
          <div class="theme-preset-name">Botanique</div>
        </div>

        <div class="theme-preset-card" data-theme="aquarelle">
          <div class="theme-preset-preview" style="background:#EEF5FF;position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(153,187,255,.6),rgba(102,136,204,.3),rgba(255,179,217,.4));filter:blur(6px)"></div>
            <span style="position:relative;color:#3355AA;font-family:Georgia,serif;font-size:11px;font-style:italic;letter-spacing:1px">aquarelle</span>
          </div>
          <div class="theme-preset-name">Aquarelle</div>
        </div>

        <div class="theme-preset-card" data-theme="cosmos">
          <div class="theme-preset-preview" style="background:radial-gradient(ellipse at 50% 50%,#050D25,#020818);position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(153,102,255,.3),transparent 70%)"></div>
            <div style="position:absolute;top:20%;left:25%;width:3px;height:3px;border-radius:50%;background:#fff;box-shadow:0 0 6px 2px rgba(255,255,255,.8)"></div>
            <div style="position:absolute;top:60%;left:70%;width:2px;height:2px;border-radius:50%;background:#fff;box-shadow:0 0 4px 1px rgba(255,255,255,.8)"></div>
            <div style="position:absolute;top:40%;left:55%;width:2px;height:2px;border-radius:50%;background:#fff;box-shadow:0 0 4px 1px rgba(255,255,255,.8)"></div>
            <span style="position:relative;color:#E8D5FF;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px">COSMOS</span>
          </div>
          <div class="theme-preset-name">Cosmos</div>
        </div>

        <div class="theme-preset-card" data-theme="brutalism">
          <div class="theme-preset-preview" style="background:#fff;border:3px solid #000;position:relative;overflow:hidden">
            <div style="position:absolute;top:0;left:0;right:0;height:40%;background:#FF3300"></div>
            <span style="position:relative;color:#000;font-family:monospace;font-size:12px;font-weight:900;letter-spacing:0">BRUTAL!</span>
          </div>
          <div class="theme-preset-name">Brutalism Digital</div>
        </div>

        <div class="theme-preset-card" data-theme="skeuo">
          <div class="theme-preset-preview" style="background:linear-gradient(160deg,#2C2C2C,#1A1A1A,#383838);position:relative;overflow:hidden">
            <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)"></div>
            <div style="position:absolute;inset:6px;background:linear-gradient(135deg,rgba(184,160,96,.15),transparent);border:1px solid rgba(184,160,96,.2);border-radius:2px"></div>
            <span style="position:relative;color:#B8A060;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:2px">SKEUO</span>
          </div>
          <div class="theme-preset-name">Skéuomorphisme</div>
        </div>

        <div class="theme-preset-card" data-theme="hud">
          <div class="theme-preset-preview" style="background:#000A00;position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(0,255,65,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,65,.06) 1px,transparent 1px);background-size:12px 12px"></div>
            <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,255,65,.4)"></div>
            <div style="position:absolute;top:0;left:50%;bottom:0;width:1px;background:rgba(0,255,65,.4)"></div>
            <span style="position:relative;color:#00FF41;font-family:monospace;font-size:11px;letter-spacing:2px;text-shadow:0 0 8px rgba(0,255,65,.8)">H.U.D</span>
          </div>
          <div class="theme-preset-name">HUD Sci-Fi</div>
        </div>

        <div class="theme-preset-card" data-theme="pixelart">
          <div class="theme-preset-preview" style="background:#0F0F2D;image-rendering:pixelated;position:relative;overflow:hidden">
            <div style="position:absolute;top:0;left:0;width:33%;height:50%;background:#FF0077"></div>
            <div style="position:absolute;top:0;right:0;width:33%;height:50%;background:#FFFF00"></div>
            <div style="position:absolute;bottom:0;left:0;width:33%;height:50%;background:#00FFCC"></div>
            <div style="position:absolute;bottom:0;right:0;width:33%;height:50%;background:#5577FF"></div>
            <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.3) 4px),repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(0,0,0,.3) 4px)"></div>
          </div>
          <div class="theme-preset-name">Pixel Art</div>
        </div>

        <div class="theme-preset-card" data-theme="dataviz">
          <div class="theme-preset-preview" style="background:#0A1628;position:relative;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;gap:3px;padding:4px 8px">
            <div style="width:8px;height:55%;background:linear-gradient(0deg,#FF6B35,#FF9A6C);border-radius:2px 2px 0 0"></div>
            <div style="width:8px;height:40%;background:linear-gradient(0deg,#4EC4CF,#7FE5EE);border-radius:2px 2px 0 0"></div>
            <div style="width:8px;height:70%;background:linear-gradient(0deg,#FF6B35,#FF9A6C);border-radius:2px 2px 0 0"></div>
            <div style="width:8px;height:30%;background:linear-gradient(0deg,#9966FF,#BB99FF);border-radius:2px 2px 0 0"></div>
            <div style="width:8px;height:50%;background:linear-gradient(0deg,#4EC4CF,#7FE5EE);border-radius:2px 2px 0 0"></div>
            <div style="width:8px;height:65%;background:linear-gradient(0deg,#FF6B35,#FF9A6C);border-radius:2px 2px 0 0"></div>
            <div style="width:8px;height:45%;background:linear-gradient(0deg,#9966FF,#BB99FF);border-radius:2px 2px 0 0"></div>
          </div>
          <div class="theme-preset-name">Datavisualization</div>
        </div>

"""

lines = open('public/control.html', 'r', encoding='utf-8').readlines()
# Find line 2758 = "<!-- ── Thème Custom ── -->"
insert_at = None
for i, l in enumerate(lines):
    if 'Thème Custom' in l and '<!--' in l:
        insert_at = i
        break
if insert_at is None:
    print('ERROR: Could not find insertion point!')
else:
    lines.insert(insert_at, CARDS_HTML)
    with open('public/control.html', 'w', encoding='utf-8', newline='') as f:
        f.writelines(lines)
    print('Done: 29 theme cards inserted into control.html at line ' + str(insert_at+1))
