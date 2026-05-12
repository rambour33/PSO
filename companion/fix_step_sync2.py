import gzip, json, sys, uuid, shutil
sys.stdout.reconfigure(encoding='utf-8')

CONFIG = 'PSO-Companion (19).companionconfig'
shutil.copy(CONFIG, CONFIG + '.bak')

with open(CONFIG, 'rb') as f:
    data = json.loads(gzip.decompress(f.read()).decode('utf-8', errors='surrogatepass'))

def new_id():
    return str(uuid.uuid4()).replace('-', '')[:22]

def make_set_step(location, step_index):
    return {
        "id": new_id(),
        "definitionId": "button_set_current_step",
        "connectionId": "internal",
        "type": "action",
        "options": {
            "location": {
                "isExpression": False,
                "value": location
            },
            "step_index": {
                "isExpression": False,
                "value": step_index
            }
        },
        "children": {}
    }

def apply_step_sync(btn, locations, label):
    """
    Step 0 (show all): set each button to step 1  (next press = hide)
    Step 1 (hide all): set each button to step 0  (next press = show)
    """
    for step_k, target_step in [('0', 1), ('1', 0)]:
        actions = btn['steps'][step_k]['action_sets']['down']
        # Remove any pre-existing set_step actions
        btn['steps'][step_k]['action_sets']['down'] = [
            a for a in actions if a.get('definitionId') != 'button_set_current_step'
        ]
        for loc in locations:
            btn['steps'][step_k]['action_sets']['down'].append(make_set_step(loc, target_step))
    print(f'{label}: {len(locations)} set_step added to each step')

# ── All Scenes (page 2, row 0, col 7) ────────────────────────────────────────
SCENE_LOCS = [f'2/1/{c}' for c in range(8)] + ['2/2/0']
apply_step_sync(
    data['pages']['2']['controls']['0']['7'],
    SCENE_LOCS,
    'All Scenes (2/0/7)'
)

# ── Overlays master (page 1, row 0, col 7) ───────────────────────────────────
# Derive locations from the bgcolor targets already on the button (excluding self)
overlay_btn = data['pages']['1']['controls']['0']['7']
OVERLAY_LOCS = []
for a in overlay_btn['steps']['0']['action_sets']['down']:
    if a.get('definitionId') == 'bgcolor':
        loc = a['options']['location']['value']
        if 'this:' not in loc:
            OVERLAY_LOCS.append(loc)

apply_step_sync(overlay_btn, OVERLAY_LOCS, f'Overlays (1/0/7) — {len(OVERLAY_LOCS)} targets')

out = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
with open(CONFIG, 'wb') as f:
    f.write(gzip.compress(out.encode('utf-8', errors='surrogatepass')))

print('Done -', CONFIG, 'updated')
