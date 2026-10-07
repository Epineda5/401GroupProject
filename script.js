const SUPABASE_URL = 'https://nfdrezutavvxhmblsqdk.supabase.co';

const SUPABASE_KEY = 'sb_publishable_FQmEnU0iXInf1Q8lvmMunw_o5UacvKM';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const MAXLISTS=3,AVG=720;
const E=[
{id:1,name:'Bench press',g:'Chest',status:'inuse',rem:300,queue:['Jordan']},
{id:2,name:'Chest fly machine',g:'Chest',status:'inuse',rem:540,queue:[]},
{id:3,name:'Lat pulldown',g:'Back',status:'available',queue:[]},
{id:4,name:'Seated row',g:'Back',status:'available',queue:[]},
{id:5,name:'Leg press',g:'Legs',status:'inuse',rem:45,queue:[]},
{id:6,name:'Squat rack',g:'Legs',status:'inuse',rem:700,queue:['Sam','Priya']},
{id:7,name:'Shoulder press',g:'Shoulders',status:'available',queue:[]},
{id:8,name:'Cable station',g:'Arms',status:'inuse',rem:100,queue:[]},
{id:9,name:'Treadmill 1',g:'Cardio',status:'available',queue:[]},
{id:10,name:'Rowing machine',g:'Cardio',status:'unavailable',queue:[]}];
const GROUPS=['Chest','Back','Legs','Shoulders','Arms','Cardio'];
const S={screen:'login',stack:[],checked:true,speed:1,group:null,q:'',sel:null,claim:null,mins:12,msg:''};
const $=s=>document.querySelector(s),app=$('#screen');
const fmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const get=id=>E.find(e=>e.id===id);
const mine=()=>E.filter(e=>e.queue.includes('You'));
const wait=e=>Math.ceil(((e.status==='inuse'?e.rem:e.status==='reserved'?e.claimLeft:0)+e.queue.length*AVG)/60);
const LABEL={available:'Available',inuse:'In use',reserved:'Reserved',unavailable:'Unavailable'};
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,3500)}
function go(s,push=true){if(push&&S.screen!=='login')S.stack.push(S.screen);else if(push)S.stack=[];S.screen=s;S.msg='';render();window.scrollTo(0,0)}
function sub(e){
 if(e.status==='available')return'Ready to use';
 if(e.status==='inuse')return`${fmt(e.rem)} left · ${e.queue.length} waiting`;
 if(e.status==='reserved')return`Held for next person · ${e.queue.length} waiting`;
 return'Out of service'}
function tile(e){return`<button class="tile s-${e.status}" data-a="open" data-id="${e.id}"><b>${e.name}</b><span class="pill s-${e.status}">${LABEL[e.status]}</span><span class="sub">${sub(e)}</span></button>`}
function mins(){return`<div class="mins" role="group" aria-label="Session time">${[8,12,15].map(m=>`<button class="chip" data-a="mins" data-m="${m}" aria-pressed="${S.mins===m}">${m} min</button>`).join('')}</div>`}
const V={
login:()=>`<h1>Skip the guessing.<br>Know the wait.</h1><p>Log in to see which equipment is free and how long the line is.</p>
<form id="lf" class="card"><label for="em">Email</label><input id="em" type="email" autocomplete="email" value="chris@example.com"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password"><p class="hint">Prototype: use password gym123</p>${S.msg?`<p class="err" role="alert">${S.msg}</p>`:''}<button class="btn" type="submit">Log in</button></form>`,
find:()=>`<h2>What are you training?</h2><form id="sf" class="card"><label for="q">Search equipment</label><input id="q" type="search" placeholder="Bench press, treadmill…"><button class="btn" type="submit">Search</button></form><button class="btn alt" data-a="groups">Browse by muscle group</button>`,
groups:()=>`<h2>Pick a muscle group</h2><div class="chips">${GROUPS.map(g=>`<button class="chip" data-a="group" data-g="${g}" aria-pressed="false">${g}</button>`).join('')}</div>`,
map:()=>{const l=E.filter(e=>(!S.group||e.g===S.group)&&(!S.q||e.name.toLowerCase().includes(S.q)));
 const alt=S.group?'':'';return`<h2>${S.group||(S.q?'Results for “'+S.q+'”':'All equipment')}</h2><p class="hint">Tap a machine to see its wait. You are on ${mine().length} of ${MAXLISTS} waitlists.</p>
 ${l.length?`<div class="floor">${l.map(tile).join('')}</div>`:'<p>No equipment matches. Try another search or muscle group.</p>'}
 ${mine().length?'<button class="btn alt" data-a="mylists">View my waitlists</button>':''}`},
detail:()=>{const e=get(S.sel),pos=e.queue.indexOf('You')+1;let act='';
 if(e.status==='available')act=`<p>Choose your session length, then start.</p>${mins()}<button class="btn" data-a="start">Start using</button>`;
 else if(pos)act=`<p>You are number ${pos} in line.</p><button class="btn" data-a="mylists">See my waitlist</button>`;
 else act=`<button class="btn" data-a="join">Join waitlist</button>`;
 const alts=e.status!=='available'?E.filter(x=>x.g===e.g&&x.status==='available'&&x.id!==e.id):[];
 return`<h2>${e.name}</h2><span class="pill s-${e.status}">${LABEL[e.status]}</span>
 <div class="stats"><div class="stat"><b>${e.status==='unavailable'?'–':e.status==='available'?'0 min':'~'+wait(e)+' min'}</b>Estimated wait</div><div class="stat"><b>${e.queue.length}</b>Waiting</div></div>
 ${e.status==='inuse'?`<p>Session ends in ${fmt(e.rem)}.</p>`:''}${e.status==='unavailable'?'<p>This equipment is out of service, so you cannot join its waitlist.</p>':''}
 ${act}${S.msg?`<p class="err" role="alert">${S.msg}</p>`:''}
 ${alts.length?`<h3 style="margin-top:22px">Free right now, same muscle group</h3><div class="floor">${alts.map(tile).join('')}</div>`:''}`},
mylists:()=>{const l=mine();return`<h2>My waitlists</h2>${l.length?l.map(e=>`<div class="card"><h3>${e.name}</h3><div class="stats"><div class="stat"><b>#${e.queue.indexOf('You')+1}</b>Your position</div><div class="stat"><b>~${wait(e)-(e.queue.length-1-e.queue.indexOf('You'))*AVG/60|0} min</b>Estimated wait</div></div><p class="hint">${e.status==='reserved'?'Held for the next person in line.':fmt(e.rem||0)+' left on the current session.'}</p><button class="btn danger" data-a="cancel" data-id="${e.id}">Cancel my spot</button></div>`).join(''):'<p>You are not on any waitlist. Find equipment to join one.</p>'}<button class="btn alt" data-a="find">Find more equipment</button>`},
claim:()=>{const e=get(S.claim);return`<div class="card claim-card"><h2>${e.name} is ready</h2><p>Claim it before the timer runs out, or the next person gets it.</p><div class="big" aria-live="off">${fmt(e.claimLeft)}</div><p>How long will you use it?</p>${mins()}<button class="btn" data-a="claim">Claim equipment</button><button class="btn danger" data-a="cancel" data-id="${e.id}">Give up my spot</button></div>`}};
function render(){app.innerHTML=V[S.screen]();$('#back').hidden=!S.stack.length||S.screen==='claim';$('#checkin').hidden=$('#speed').hidden=S.screen==='login'}
function startUse(e,m){e.status='inuse';e.rem=m*60;delete e.claimLeft}
function release(e,announce){e.queue=e.queue.filter(x=>x!=='You');
 if(e.status==='reserved'){if(e.queue.length){e.claimLeft=90}else{e.status='available'}}
 if(S.claim===e.id)S.claim=null}
function tick(dt){E.forEach(e=>{
 if(e.status==='inuse'){e.rem-=dt;if(e.rem<=0){if(e.queue.length){e.status='reserved';e.claimLeft=90;if(e.queue[0]==='You'){S.claim=e.id;S.stack=[];S.screen='claim';toast(e.name+' is ready. Claim it now.')}}else e.status='available'}}
 else if(e.status==='reserved'){e.claimLeft-=dt;
  if(e.queue[0]!=='You'&&e.claimLeft<=80){e.queue.shift();startUse(e,12)}
  else if(e.queue[0]==='You'&&e.claimLeft<=0){e.queue.shift();toast('Time ran out. Your spot on '+e.name+' was removed.');S.claim=null;if(S.screen==='claim'){S.screen='map';S.stack=['find']}
   if(e.queue.length)e.claimLeft=90;else e.status='available'}}})}
document.addEventListener('submit',ev=>{ev.preventDefault();
 if(ev.target.id==='lf'){if($('#em').value&&$('#pw').value==='gym123'){S.screen='find';S.stack=[];render()}else{S.msg='We could not log you in. Check your email and password, then try again.';render()}}
 if(ev.target.id==='sf'){S.q=$('#q').value.trim().toLowerCase();S.group=null;go('map')}});
document.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;
 if(b.id==='back'){S.screen=S.stack.pop();S.msg='';return render()}
 if(b.id==='checkin'){S.checked=!S.checked;b.setAttribute('aria-pressed',S.checked);b.textContent=S.checked?'Checked in':'Not checked in';return}
 if(b.id==='speed'){S.speed=S.speed===1?30:1;b.setAttribute('aria-pressed',S.speed>1);return}
 const a=b.dataset.a,e=b.dataset.id&&get(+b.dataset.id);if(!a)return;
 if(a==='groups')go('groups');
 if(a==='group'){S.group=b.dataset.g;S.q='';go('map')}
 if(a==='open'){S.sel=e.id;go('detail')}
 if(a==='mins'){S.mins=+b.dataset.m;render()}
 if(a==='find'){S.stack=[];S.q='';S.group=null;go('find',false)}
 if(a==='mylists')go('mylists');
 if(a==='start'){startUse(get(S.sel),S.mins);toast('Enjoy your set. Your session timer has started.');render()}
 if(a==='join'){const x=get(S.sel);
  if(!S.checked)S.msg='You need to check in at the gym before you can join a waitlist.';
  else if(x.status==='unavailable')S.msg='This equipment is currently unavailable, so you cannot join its waitlist.';
  else if(mine().length>=MAXLISTS)S.msg='You are on 3 waitlists already. Cancel one to join another.';
  else{x.queue.push('You');return go('mylists')}
  render()}
 if(a==='cancel'){release(e);toast('Removed from the '+e.name+' waitlist.');if(S.screen==='claim'){S.screen='map';S.stack=['find']}render()}
 if(a==='claim'){e=get(S.claim);e.queue.shift();startUse(e,S.mins);S.claim=null;S.sel=e.id;S.stack=['find','map'];S.screen='detail';toast('It is yours. Your session timer has started.');render()}});
setInterval(()=>{if(S.screen==='login')return;tick(S.speed);if(!['find','groups'].includes(S.screen)){const y=window.scrollY;render();window.scrollTo(0,y)}},1000);
render();
