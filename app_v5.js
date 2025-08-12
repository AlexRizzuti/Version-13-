
// Alex's Hybrid — v5 (Guided + Smart Swaps + Tips + Settings fix)
(function(){
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r=>r.unregister())).catch(()=>{});
  }
  const LS = {
    get(k,d=null){ try{return JSON.parse(localStorage.getItem(k)) ?? d}catch(_){return d} },
    set(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
  };
  const $ = (s)=>document.querySelector(s);
  const on = (s,e,fn)=>{ const el=$(s); if(el) el.addEventListener(e,fn); };
  function setTxt(id,txt){ const el=document.getElementById(id); if(el) el.textContent=txt; }
  function val(id){ const el=document.getElementById(id); return el?el.value:''; }

  let AC=null, sound = LS.get('soundOn', true);
  function beep(freq=880,dur=0.08,vol=60){
    if(!sound) return;
    try{
      AC = AC || new (window.AudioContext||window.webkitAudioContext)();
      const o=AC.createOscillator(), g=AC.createGain();
      o.type='sine'; o.frequency.value=freq; g.gain.value=vol/100;
      o.connect(g).connect(AC.destination); o.start(); setTimeout(()=>o.stop(), dur*1000);
    }catch(e){}
  }
  function flash(t){
    const s=$('#status'); if(!s) return;
    s.textContent=t; s.style.background='var(--accent)'; s.style.color='#062016';
    setTimeout(()=>{ s.textContent='Ready'; s.style.background='var(--card)'; s.style.color='var(--muted)'; }, 1400);
  }

  const ex=(name,sets,reps,rest,equip,cat,swaps)=>({name,sets,reps,rest,equip,cat,swaps:swaps||[],originalName:name});
  const PLAN = { days:[
    { id:"Day 1 – Power + Lower", blocks:[
      ex("Back Squat",4,"5",90,["Barbell"],"Squat",["Front Squat","Goblet Squat"]),
      ex("Romanian Deadlift",4,"8",90,["Barbell"],"Hinge",["DB Romanian Deadlift","Good Morning"]),
      ex("Bulgarian Split Squat",3,"10 / leg",60,["Dumbbells","Bodyweight"],"Lunge",["Walking Lunge","Reverse Lunge"]),
      ex("Box Jump",3,"8",60,["Bodyweight"],"Plyo",["Broad Jump","Jump Squat"]),
      ex("Plank",3,"45s",45,["Bodyweight"],"Core: Anti-Ext",["Side Plank","Hollow Hold"]),
    ]},
    { id:"Day 2 – Push Focus", blocks:[
      ex("Bench Press",4,"5",120,["Barbell"],"Horizontal Push",["DB Bench Press","Push-Ups"]),
      ex("Overhead Press",4,"6",120,["Barbell"],"Vertical Push",["Landmine Press","Incline Push-Ups"]),
      ex("Dumbbell Incline Press",3,"10",75,["Dumbbells"],"Horizontal Push",["Incline Barbell Press","Push-Ups"]),
      ex("Medicine Ball Slam",4,"8",60,["Med Ball"],"Power Throw",["Kettlebell Swing","Push Press 8"]),
      ex("Battle Rope Waves",4,"20s",40,["Battle Rope"],"Conditioning",["Sled Push","Row Erg Sprint 20s"]),
    ]},
    { id:"Day 3 – Athletic Conditioning", blocks:[
      ex("Sled Push",6,"20–30m",60,["Sled/Prowler"],"Conditioning",["Hill Sprint 10–15s","Row Erg Sprint 20s"]),
      ex("Kettlebell Swing",5,"12",60,["Kettlebell"],"Hinge",["DB Swing","Hip Thrust"]),
      ex("Burpees",4,"10",45,["Bodyweight"],"Conditioning",["Up-Downs (no push-up)","Row 150m Sprint"]),
      ex("Hanging Leg Raise",3,"8–12",45,["Bodyweight"],"Core: Lats/Hips",["Captains Chair Knee Raise","Lying Leg Raise"]),
      ex("Side Plank",3,"30s / side",30,["Bodyweight"],"Core: Anti-Ext",["Pallof Press Hold","Bird Dog Hold"]),
    ]},
    { id:"Day 4 – Pull Focus", blocks:[
      ex("Pull-Ups",5,"AMRAP",120,["Bodyweight"],"Row/Pull",["Chin-Ups","Lat Pulldown"]),
      ex("Bent-Over Barbell Row",4,"6–8",90,["Barbell"],"Row/Pull",["One-Arm DB Row","Chest-Supported Row"]),
      ex("Seated Cable Row",3,"10",75,["Cable/Machine"],"Row/Pull",["Machine Row","Inverted Row"]),
      ex("Face Pull",3,"12–15",60,["Cable/Machine","Bands"],"Row/Pull",["Rear Delt Fly","High Row"]),
      ex("Farmer’s Carry",4,"30–40m",60,["Dumbbells","Kettlebell","Trap Bar"],"Carry",["Suitcase Carry","Trap Bar Carry"]),
    ]},
    { id:"Day 5 – Power Upper + Conditioning", blocks:[
      ex("Jump Squat",4,"6",60,["Bodyweight"],"Plyo",["Box Jump","Broad Jump"]),
      ex("Explosive Push-Ups",4,"5–6",75,["Bodyweight"],"Horizontal Push",["Clap Push-Ups","DB Bench 10"]),
      ex("Med Ball Overhead Throw",4,"6",75,["Med Ball"],"Power Throw",["MB Slam 10","Push Press 10","Landmine Push Press 8"]),
      ex("KB Clean & Press (each arm)",3,"8/arm",90,["Kettlebell"],"Vertical Push",["DB Clean & Press 8/arm","Push Press 10"]),
      ex("Mountain Climbers",3,"30s",30,["Bodyweight"],"Conditioning",["SkiErg 20s","Row Erg Sprint 20s"]),
    ]}
  ]};

  const DESC = {
    "Back Squat":"Bar on upper traps, brace, sit between hips, knees over toes.",
    "Romanian Deadlift":"Hinge; soft knees; bar slides along thighs; neutral back.",
    "Bulgarian Split Squat":"Back foot elevated; tall torso; front shin vertical.",
    "Box Jump":"Load hips & arms, jump softly, stand tall to finish.",
    "Plank":"Elbows under shoulders; ribs down; glutes tight; straight line.",
    "Bench Press":"Feet planted; bar to mid-chest; elbows ~45°; press to lockout.",
    "Overhead Press":"Bar from shoulders to overhead; head through; ribs down.",
    "Dumbbell Incline Press":"30–45° bench; DBs to chest line; press up.",
    "Medicine Ball Slam":"Reach tall; hinge; drive ball down explosively.",
    "Battle Rope Waves":"Athletic stance; quick even waves; torso quiet.",
    "Sled Push":"Forward lean; neutral spine; short powerful steps.",
    "Kettlebell Swing":"Hinge; snap hips; bell floats to chest height.",
    "Burpees":"Hands down; jump to plank; back to feet; small jump.",
    "Hanging Leg Raise":"Dead hang; raise legs without swinging.",
    "Side Plank":"Feet stacked; elbow under shoulder; hips high.",
    "Pull-Ups":"Overhand; chest to bar; control down.",
    "Bent-Over Barbell Row":"Hinge ~45°; pull to ribs; back flat.",
    "Seated Cable Row":"Tall torso; pull to ribs; squeeze blades.",
    "Face Pull":"Rope to eye line; elbows high; thumbs back.",
    "Farmer’s Carry":"Heavy bells at sides; tall; brisk walk.",
    "Jump Squat":"Quarter-squat and jump; land softly.",
    "Explosive Push-Ups":"Powerful push; core tight; hands light/off floor.",
    "Med Ball Overhead Throw":"Dip then drive ball up/forward explosively.",
    "KB Clean & Press (each arm)":"Rack clean; press overhead; glutes tight.",
    "Mountain Climbers":"Plank; knees drive under chest; hips level."
  };

  const EQUIP_ALL = ["Barbell","Dumbbells","Kettlebell","Cable/Machine","Bands","Bodyweight","Med Ball","Sled/Prowler","Battle Rope","Erg/Row/Ski","Landmine"];
  const defaultEquip = Object.fromEntries(EQUIP_ALL.map(e=>[e,true]));
  const state = { day:+LS.get('currentDay',0), cursor:0, guided:LS.get('guided',true) };

  function applyTheme(light){ document.documentElement.setAttribute('data-theme', light?'light':'dark'); }
  function updateThemeBadge(){ $('#themeBadge').textContent = document.documentElement.getAttribute('data-theme')==='light' ? 'Light' : 'Dark'; }

  function mount(){
    const root=document.createElement('div'); root.className='container'; root.innerHTML = `
      <header>
        <h1>Alex’s Hybrid</h1>
        <span class="badge" id="themeBadge">Dark</span>
        <label class="toggle"><input id="themeToggle" type="checkbox"><span>Light mode</span></label>
        <button id="settingsBtn" class="ghost">⚙️ Settings</button>
        <button id="guidedBtn" class="ghost">🎧 Guided: ${state.guided?'On':'Off'}</button>
      </header>

      <div class="controls">
        <select id="daySelect"></select>
        <button id="backExercise" class="ghost">← Back</button>
        <button id="nextExercise" class="ghost">Next →</button>
        <button id="startBtn" class="primary">Start Workout</button>
        <button id="finishBtn" class="ghost">Finish</button>
        <button id="resetBtn" class="ghost">Reset</button>
        <span class="badge" id="status">Ready</span>
      </div>

      <div id="workoutList" class="grid"></div>

      <div class="card">
        <h3>Timer</h3>
        <div class="row">
          <button id="workBtn" class="primary">Start Work</button>
          <button id="restBtn" class="warn">Start Rest</button>
          <button id="pauseBtn" class="ghost">Pause</button>
          <button id="resumeBtn" class="ghost">Resume</button>
          <button id="stopBtn" class="ghost">Stop</button>
          <span class="badge timer-big" id="clock">00:00</span>
        </div>
        <div class="progress"><div id="bar"></div></div>
        <div class="small" id="timerLabel">Idle</div>
        <div class="row" style="margin-top:8px">
          <label>Work (s): <input id="workSecs" type="number" value="45" min="1" style="width:80px"></label>
          <label>Rest (s): <input id="restSecs" type="number" value="60" min="1" style="width:80px"></label>
          <button id="soundToggle" class="ghost">🔔 Sound: ${sound?'On':'Off'}</button>
        </div>
      </div>

      <div class="modal" id="swapModal">
        <div class="sheet">
          <header><h3 id="swapTitle" style="margin:0;font-size:18px">Swap Exercise</h3><span class="x" id="swapClose">✕</span></header>
          <div class="chips" id="swapMeta"></div>
          <input id="swapSearch" type="text" placeholder="Search exercise…"/>
          <div class="list" id="swapList"></div>
          <div class="row" style="margin-top:10px;justify-content:flex-end">
            <button id="swapRevert" class="ghost">↩︎ Revert to Original</button>
            <button id="swapApply" class="primary">Apply</button>
          </div>
        </div>
      </div>

      <div class="modal" id="settingsModal">
        <div class="sheet">
          <header><h3 style="margin:0;font-size:18px">Settings — Equipment</h3><span class="x" id="settingsClose">✕</span></header>
          <div class="settings-grid" id="equipGrid"></div>
          <div class="small">Turn OFF anything you don’t have (e.g., Med Ball). Suggestions will match.</div>
          <div class="row" style="margin-top:10px;justify-content:flex-end"><button id="settingsSave" class="primary">Save</button></div>
        </div>
      </div>

      <footer>Guided mode: “Set done” → auto-rest with chime, then prompt next set. Smart swaps respect your equipment.</footer>
    `;
    document.body.appendChild(root);

    const pref = LS.get('themeLight', null);
    const systemLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const isLight = pref===null ? systemLight : !!pref;
    applyTheme(isLight); $('#themeToggle').checked = isLight; updateThemeBadge();
    on('#themeToggle','change',e=>{ const light=e.target.checked; applyTheme(light); LS.set('themeLight', light); updateThemeBadge(); });

    LS.set('equip', LS.get('equip', Object.fromEntries(["Barbell","Dumbbells","Kettlebell","Cable/Machine","Bands","Bodyweight","Med Ball","Sled/Prowler","Battle Rope","Erg/Row/Ski","Landmine"].map(e=>[e,true]))));

    const sel=$('#daySelect'); PLAN.days.forEach((d,i)=> sel.innerHTML+=`<option value="${i}">${d.id}</option>`); sel.value=state.day;
    sel.onchange = e=>{ state.day=+e.target.value; LS.set('currentDay',state.day); state.cursor=0; renderDay(); };

    on('#guidedBtn','click', ()=>{ state.guided=!state.guided; LS.set('guided',state.guided); $('#guidedBtn').textContent=`🎧 Guided: ${state.guided?'On':'Off'}`; flash(`Guided ${state.guided?'On':'Off'}`); });
    on('#settingsBtn','click', openSettings); on('#settingsClose','click',()=>$('#settingsModal').style.display='none'); on('#settingsSave','click', saveSettings);
    on('#startBtn','click',()=>{ flash('Workout started'); beep(700,0.1); });
    on('#finishBtn','click',()=>{ flash('Workout finished'); beep(500,0.1); setTimeout(()=>beep(820,0.12,90),110); });
    on('#resetBtn','click', resetDay);
    on('#backExercise','click', prevExercise);
    on('#nextExercise','click', nextExercise);
    on('#workBtn','click', ()=> startTimer(+val('workSecs')||45,'work'));
    on('#restBtn','click', ()=> startTimer(+val('restSecs')||60,'rest'));
    on('#pauseBtn','click', ()=>{ t.paused=true; setTxt('timerLabel','Paused'); });
    on('#resumeBtn','click', ()=>{ t.paused=false; setTxt('timerLabel','Resumed'); });
    on('#stopBtn','click', stopTimer);
    on('#soundToggle','click', ()=>{ sound=!sound; LS.set('soundOn',sound); $('#soundToggle').textContent=`🔔 Sound: ${sound?'On':'Off'}`; });

    renderDay();
  }

  function renderDay(){
    const list=$('#workoutList'); const day=PLAN.days[state.day];
    list.innerHTML='';
    const doneMap=LS.get(`hybrid_done_day${state.day}`,{}), notesMap=LS.get(`hybrid_notes_day${state.day}`,{});

    day.blocks.forEach((b, idx)=>{
      const id=`ex-${idx}`;
      const card=document.createElement('div'); card.className='card'+(state.cursor===idx?' current':'');
      const tipsBtn = DESC[b.name] ? `<button class="ghost" data-action="tips" data-i="${idx}">Tips</button>` : '';
      card.innerHTML = `
        <h3>${b.name}</h3>
        <div class="kv">Sets: <b id="${id}-setsDone">${doneMap[idx]||0}</b> / ${b.sets} • Reps: <b>${b.reps}</b> • Rest: <b>${b.rest}s</b></div>
        <div class="tags">${[b.cat,...b.equip].map(t=>`<span class="tag">${t}</span>`).join('')}</div>
        <div class="actions">
          <button class="success" data-action="set" data-i="${idx}">Set done</button>
          <button class="ghost" data-action="swap" data-i="${idx}">Swap</button>
          ${tipsBtn}
          <button class="ghost" data-action="note" data-i="${idx}">Notes</button>
          <span class="small" id="${id}-note">${notesMap[idx]?"📝 "+notesMap[idx]:""}</span>
        </div>
        <input type="hidden" id="${id}-count" value="${doneMap[idx]||0}" />
      `;
      list.appendChild(card);
    });

    list.onclick = (e)=>{
      const btn=e.target.closest('button'); if(!btn) return;
      const i=+btn.dataset.i; const exercise=PLAN.days[state.day].blocks[i]; const id=`ex-${i}`;
      if(btn.dataset.action==='set'){
        let v=+$('#'+id+'-count').value+1; if(v>exercise.sets) v=exercise.sets;
        $('#'+id+'-count').value=v; $('#'+id+'-setsDone').textContent=v;
        const m=LS.get(`hybrid_done_day${state.day}`,{}); m[i]=v; LS.set(`hybrid_done_day${state.day}`,m);
        beep(880,0.06);
        if(state.guided){ startTimer(parseInt(exercise.rest,10)||60,'rest'); setTxt('timerLabel',`Rest ${exercise.rest}s — next: ${exercise.name}`); }
        if(v===exercise.sets){ flash('Completed!'); if(i===state.cursor) nextExercise(); }
      }
      if(btn.dataset.action==='swap'){ openSwap(i); }
      if(btn.dataset.action==='note'){
        const nm=LS.get(`hybrid_notes_day${state.day}`,{}); const txt=prompt('Add/edit note for this exercise:', nm[i]||'');
        if(txt!==null){ nm[i]=txt; LS.set(`hybrid_notes_day${state.day}`,nm); $('#'+id+'-note').textContent = txt ? "📝 "+txt : ""; }
      }
      if(btn.dataset.action==='tips'){ alert(`${exercise.name}\n\n${DESC[exercise.name]||'No tips yet.'}`); }
    };
  }

  function nextExercise(){ const d=PLAN.days[state.day]; state.cursor=Math.min(d.blocks.length-1, state.cursor+1); renderDay(); }
  function prevExercise(){ state.cursor=Math.max(0, state.cursor-1); renderDay(); }

  function openSwap(i){
    const day=PLAN.days[state.day]; const ex=day.blocks[i];
    const pool=Array.from(new Set(PLAN.days.flatMap(d=>d.blocks.flatMap(b=>[b.name,...(b.swaps||[]),b.originalName])))).filter(Boolean).sort();
    const modal=$('#swapModal'), list=$('#swapList'), search=$('#swapSearch');
    $('#swapTitle').textContent=`Swap "${ex.name}"`;
    $('#swapMeta').innerHTML = `<span class="chip">Pattern: ${ex.cat}</span>` + ex.equip.map(e=>`<span class="chip">${e}</span>`).join('');
    modal.style.display='flex';

    const eqAvail=LS.get('equip', defaultEquip);
    function isEquipOk(name){
      const key=name.toLowerCase();
      const rules=[
        ["barbell","Barbell"],["bench","Barbell"],["front squat","Barbell"],["deadlift","Barbell"],
        ["dumbbell","Dumbbells"],[" db","Dumbbells"],
        ["kettlebell","Kettlebell"],[" kb","Kettlebell"],
        ["cable","Cable/Machine"],["machine","Cable/Machine"],["lat pulldown","Cable/Machine"],
        ["band","Bands"],
        ["med ball","Med Ball"],[" mb","Med Ball"],["slam","Med Ball"],["throw","Med Ball"],
        ["sled","Sled/Prowler"],["prowler","Sled/Prowler"],
        ["rope","Battle Rope"],
        ["row erg","Erg/Row/Ski"],["skierg","Erg/Row/Ski"],["erg","Erg/Row/Ski"],
        ["landmine","Landmine"],
        ["push-up","Bodyweight"],["plank","Bodyweight"],["burpee","Bodyweight"],["jump","Bodyweight"],["pull-up","Bodyweight"]
      ];
      for(const [kw, tag] of rules){ if(key.includes(kw) && !eqAvail[tag]) return false; }
      return true;
    }
    function inferCat(n){
      const s=n.toLowerCase();
      if(/(split|lunge)/.test(s)) return "Lunge";
      if(/deadlift|rdl|hinge|good morning|swing|hip thrust/.test(s)) return "Hinge";
      if(/squat/.test(s) && !/jump/.test(s)) return "Squat";
      if(/row|pull-?up|chin-?up|face pull|lat pulldown/.test(s)) return "Row/Pull";
      if(/bench|push-?up|incline|press(?!.*overhead)/.test(s)) return "Horizontal Push";
      if(/overhead|push press|clean & press|landmine/.test(s)) return "Vertical Push";
      if(/carry/.test(s)) return "Carry";
      if(/plank|pallof|hollow|bird dog/.test(s)) return "Core: Anti-Ext";
      if(/leg raise/.test(s)) return "Core: Lats/Hips";
      if(/box jump|jump squat|broad jump/.test(s)) return "Plyo";
      if(/slam|throw/.test(s)) return "Power Throw";
      if(/sled|erg|skierg|battle rope|burpee|mountain climber|sprint/.test(s)) return "Conditioning";
      return "Conditioning";
    }

    function build(){
      const arr=pool.map(n=>({name:n,cat:inferCat(n),score:0}));
      arr.forEach(o=>{
        o.score += (o.cat===ex.cat ? 2 : 0);
        o.score += isEquipOk(o.name) ? 1 : -2;
        if(o.name.toLowerCase()===ex.name.toLowerCase()) o.score -= 2;
      });
      arr.sort((a,b)=>b.score-a.score);
      const suggested=arr.filter(o=>o.score>=2).map(o=>o.name);
      const others=pool.filter(n=>!suggested.includes(n));
      return {suggested, others};
    }

    const {suggested, others} = build();
    function draw(q=''){
      list.innerHTML='';
      const group=(title,items)=>{
        const g=document.createElement('div'); g.className='group';
        g.innerHTML=`<h4>${title}</h4>`;
        items.filter(n=>n.toLowerCase().includes(q.toLowerCase())).forEach(n=>{
          const b=document.createElement('button'); b.textContent=n; b.onclick=()=>select(n,b); g.appendChild(b);
        });
        list.appendChild(g);
      };
      group("Suggested (matches pattern & your equipment)", suggested);
      group("All options", others);
    }
    let chosen=null; function select(n,btn){ chosen=n; list.querySelectorAll('button').forEach(x=>x.style.background='transparent'); btn.style.background='rgba(255,255,255,.06)'; }
    draw(); search.oninput=()=>draw(search.value);
    $('#swapClose').onclick=()=>modal.style.display='none';
    $('#swapRevert').onclick=()=>{ ex.name=ex.originalName; modal.style.display='none'; renderDay(); };
    $('#swapApply').onclick=()=>{ if(chosen){ ex.name=chosen; modal.style.display='none'; renderDay(); } };
  }

  const t={timer:null,remaining:0,total:0,paused:false,running:false};
  function startTimer(seconds,mode){
    stopTimer(); t.running=true; t.paused=false; t.remaining=seconds; t.total=seconds;
    setTxt('timerLabel', mode==='work'?'Work interval running…':`Rest ${seconds}s`);
    tick(); t.timer=setInterval(tick,1000);
  }
  function tick(){
    if(t.paused) return;
    if(t.remaining<=0){
      stopTimer(); beep(660,0.08); setTimeout(()=>beep(880,0.12,90),100); flash('Rest done — start next set'); return;
    }
    t.remaining--;
    const mm=String(Math.floor(t.remaining/60)).padStart(2,'0'), ss=String(t.remaining%60).padStart(2,'0');
    setTxt('clock',`${mm}:${ss}`);
    const p=Math.max(0,Math.min(100,100*((t.total-t.remaining)/t.total))); const bar=document.getElementById('bar'); if(bar) bar.style.width=p+'%';
    if(t.remaining<=3) beep(520+t.remaining*30,0.06);
  }
  function stopTimer(){ if(t.timer) clearInterval(t.timer); t.timer=null; t.running=false; setTxt('clock','00:00'); const bar=document.getElementById('bar'); if(bar) bar.style.width='0%'; setTxt('timerLabel','Idle'); }
  function resetDay(){ const d=PLAN.days[state.day]; d.blocks.forEach((b,i)=>{ const inp=document.getElementById(`ex-${i}-count`); if(inp){ inp.value=0; setTxt(`ex-${i}-setsDone`,'0'); } }); stopTimer(); flash('Reset'); }

  function openSettings(){
    const eq=LS.get('equip',defaultEquip); const grid=$('#equipGrid'); grid.innerHTML='';
    for(const name of ["Barbell","Dumbbells","Kettlebell","Cable/Machine","Bands","Bodyweight","Med Ball","Sled/Prowler","Battle Rope","Erg/Row/Ski","Landmine"]){
      const id='eq-'+name.replace(/[^a-z0-9]/ig,'_'); const row=document.createElement('label'); row.innerHTML=`<input type="checkbox" id="${id}" ${eq[name]?'checked':''}> <span>${name}</span>`; grid.appendChild(row);
    }
    $('#settingsModal').style.display='flex';
  }
  function saveSettings(){
    const eq={}; for(const name of ["Barbell","Dumbbells","Kettlebell","Cable/Machine","Bands","Bodyweight","Med Ball","Sled/Prowler","Battle Rope","Erg/Row/Ski","Landmine"]){
      const id='eq-'+name.replace(/[^a-z0-9]/ig,'_'); const el=document.getElementById(id); eq[name]=!!(el&&el.checked);
    }
    LS.set('equip',eq); $('#settingsModal').style.display='none'; flash('Equipment saved');
  }

  document.addEventListener('DOMContentLoaded', ()=>{ document.body.innerHTML=''; mount(); });
})();