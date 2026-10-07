const SUPABASE_URL = 'https://nfdrezutavvxhmblsqdk.supabase.co';

const SUPABASE_KEY = 'sb_publishable_FQmEnU0iXInf1Q8lvmMunw_o5UacvKM';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MAXLISTS=3,AVG=720,CLAIM=90;

let E=[],RAW={eq:[],wl:[],se:[]},busy=false;
const GROUPS=['Chest','Back','Legs','Shoulders','Arms','Cardio'];
const S={screen:'login',stack:[],me:null,checked:true,speed:1,warp:0,group:null,q:'',sel:null,claim:null,mins:12,msg:''};
try{S.warp=+localStorage.getItem('spotWarp')||0}catch(x){}
const vnow=()=>Date.now()+S.warp,iso=t=>new Date(t).toISOString();
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
const using=()=>E.find(e=>e.status==='inuse'&&e.by==='You');
const busyMsg=()=>'You are already using '+using().name+'. Finish that session before starting another.';
function banner(){const u=using();return u&&S.screen!=='login'?`<div class="card now"><b>You are using ${u.name}</b><span class="sub"> · ${fmt(u.rem)} left</span><br><button class="link" data-a="finish" data-id="${u.id}">Finish session</button></div>`:''}
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
 else if(e.by==='You')act=`<p>You are using this machine right now, so you can't join its waitlist.</p><button class="btn alt" data-a="finish" data-id="${e.id}">Finish session</button>`;
 else if(pos)act=`<p>You are number ${pos} in line.</p><button class="btn" data-a="mylists">See my waitlist</button>`;
 else act=`<button class="btn" data-a="join">Join waitlist</button>`;
 const alts=e.status!=='available'?E.filter(x=>x.g===e.g&&x.status==='available'&&x.id!==e.id):[];
 return`<h2>${e.name}</h2><span class="pill s-${e.status}">${LABEL[e.status]}</span>
 <div class="stats"><div class="stat"><b>${e.status==='unavailable'?'–':e.status==='available'?'0 min':'~'+wait(e)+' min'}</b>Estimated wait</div><div class="stat"><b>${e.queue.length}</b>Waiting</div></div>
 ${e.status==='inuse'?`<p>Session ends in ${fmt(e.rem)}.</p>`:''}${e.status==='unavailable'?'<p>This equipment is out of service, so you cannot join its waitlist.</p>':''}
 ${act}${S.msg?`<p class="err" role="alert">${S.msg}</p>`:''}
 ${alts.length?`<h3 style="margin-top:22px">Free right now, same muscle group</h3><div class="floor">${alts.map(tile).join('')}</div>`:''}`},
mylists:()=>{const l=mine();return`<h2>My waitlists</h2>${l.length?l.map(e=>`<div class="card"><h3>${e.name}</h3><div class="stats"><div class="stat"><b>#${e.queue.indexOf('You')+1}</b>Your position</div><div class="stat"><b>~${wait(e)-(e.queue.length-1-e.queue.indexOf('You'))*AVG/60|0} min</b>Estimated wait</div></div><p class="hint">${e.status==='reserved'?'Held for the next person in line.':fmt(e.rem||0)+' left on the current session.'}</p><button class="btn danger" data-a="cancel" data-id="${e.id}">Cancel my spot</button></div>`).join(''):'<p>You are not on any waitlist. Find equipment to join one.</p>'}<button class="btn alt" data-a="find">Find more equipment</button>`},
claim:()=>{const e=get(S.claim);return`<div class="card claim-card"><h2>${e.name} is ready</h2><p>Claim it before the timer runs out, or the next person gets it.</p><div class="big" aria-live="off">${fmt(e.claimLeft)}</div><p>How long will you use it?</p>${mins()}${S.msg?`<p class="err" role="alert">${S.msg}</p>`:''}<button class="btn" data-a="claim">Claim equipment</button><button class="btn danger" data-a="cancel" data-id="${e.id}">Give up my spot</button></div>`}};
function banner(){const u=using();return u&&S.screen!=='login'?`<div class="card now"><b>You are using ${u.name}</b><span class="sub"> · ${fmt(u.rem)} left</span><br><button class="link" data-a="finish" data-id="${u.id}">Finish session</button></div>`:''}

function derive(){const t=vnow();
 E=RAW.eq.map(q=>{const rows=RAW.wl.filter(w=>w.equipment_id===q.equipment_id).sort((a,b)=>a.position-b.position);
  const s=RAW.se.find(x=>x.equipment_id===q.equipment_id);
  const e={id:q.equipment_id,name:q.name,g:q.muscle_group,rows,sess:s,queue:rows.map(w=>w.user_id===S.me?'You':'Other')};
  if(q.status==='unavailable')e.status='unavailable';
  else if(s){e.status='inuse';e.rem=s.duration_minutes*60-(t-Date.parse(s.start_time))/1000;e.by=s.user_id===S.me?'You':null}
  else if(rows.length){e.status='reserved';e.claimLeft=rows[0].notified_at?CLAIM-(t-Date.parse(rows[0].notified_at))/1000:CLAIM}
  else e.status='available';
  return e})}
async function load(){
 const [a,b,c]=await Promise.all([db.from('equipment').select('*').order('equipment_id'),db.from('waitlist').select('*').order('position'),db.from('equipment_session').select('*').is('end_time',null)]);
 const err=a.error||b.error||c.error;if(err){toast('Database error: '+err.message);return false}
 RAW={eq:a.data,wl:b.data,se:c.data};return true}
async function compact(eid){
 const {data}=await db.from('waitlist').select('waitlist_id,position').eq('equipment_id',eid).order('position');
 await Promise.all((data||[]).map((r,i)=>r.position===i+1?null:db.from('waitlist').update({position:i+1,notified_at:null}).eq('waitlist_id',r.waitlist_id)))}
async function maintain(){
 if(busy)return;busy=true;let ch=false;
 try{for(const e of E){
  if(e.sess&&e.rem<=0){
   await db.from('equipment_session').update({end_time:iso(Date.parse(e.sess.start_time)+e.sess.duration_minutes*60000)}).eq('session_id',e.sess.session_id);
   if(e.by==='You')toast('Your session on '+e.name+' has ended.');ch=true}
  else if(!e.sess&&e.status==='reserved'){const f=e.rows[0];
   if(!f.notified_at){await db.from('waitlist').update({notified_at:iso(vnow())}).eq('waitlist_id',f.waitlist_id);ch=true}
   else if(e.claimLeft<=0){await db.from('waitlist').delete().eq('waitlist_id',f.waitlist_id);await compact(e.id);
    if(f.user_id===S.me)toast('Time ran out. Your spot on '+e.name+' was removed.');ch=true}}}
  if(ch){await load();derive()}}
 finally{busy=false}}
async function sync(){if(!S.me)return;if(await load()){derive();await maintain()}view()}
function view(){
 const turn=E.find(e=>e.status==='reserved'&&e.queue[0]==='You');
 if(turn&&S.screen!=='claim'&&S.screen!=='login'){S.claim=turn.id;S.stack=[];S.screen='claim';toast(turn.name+' is ready. Claim it now.')}
 else if(!turn&&S.screen==='claim'){S.claim=null;S.screen='map';S.stack=['find'];S.msg=''}
 if(!['find','groups','login'].includes(S.screen)){const y=window.scrollY;render();window.scrollTo(0,y)}}
function render(){app.innerHTML=banner()+V[S.screen]();$('#back').hidden=!S.stack.length||S.screen==='claim';$('#checkin').hidden=$('#speed').hidden=S.screen==='login'}

async function login(email){
 let {data:u,error}=await db.from('users').select('user_id').eq('email',email).maybeSingle();
 if(error)return{error};
 if(!u){const r=await db.from('users').insert({email,password:'demo-login-not-used'}).select('user_id').single();if(r.error)return{error:r.error};u=r.data}
 await db.from('users').update({checked_in:true}).eq('user_id',u.user_id);
 return{id:u.user_id}}
document.addEventListener('keydown',ev=>{if(ev.key==='Escape')$('#modal').hidden=true});
document.addEventListener('submit',async ev=>{ev.preventDefault();
 if(ev.target.id==='lf'){const em=$('#em').value.trim();
  if(!em||$('#pw').value!=='gym123'){S.msg='We could not log you in. Check your email and password, then try again.';return render()}
  const r=await login(em);if(r.error){S.msg='Could not reach the database: '+r.error.message;return render()}
  S.me=r.id;S.checked=true;S.msg='';await load();derive();S.screen='find';S.stack=[];render()}
 if(ev.target.id==='sf'){S.q=$('#q').value.trim().toLowerCase();S.group=null;go('map')}});
const myRow=e=>e.rows.find(w=>w.user_id===S.me);
document.addEventListener('click',async ev=>{const b=ev.target.closest('button');if(!b)return;
 if(b.id==='back'){S.screen=S.stack.pop();S.msg='';return render()}
 if(b.id==='checkin'){$('#modal').hidden=false;$('#co-no').focus();return}
 if(b.id==='co-no'){$('#modal').hidden=true;return}
 if(b.id==='co-yes'){$('#modal').hidden=true;
  for(const x of E){const r=myRow(x);if(r){await db.from('waitlist').delete().eq('waitlist_id',r.waitlist_id);await compact(x.id)}}
  const u=using();if(u)await db.from('equipment_session').update({end_time:iso(vnow())}).eq('session_id',u.sess.session_id);
  await db.from('users').update({checked_in:false}).eq('user_id',S.me);
  S.me=null;S.claim=null;S.screen='login';S.stack=[];S.group=null;S.q='';E=[];toast('You have been checked out.');render();return}
 if(b.id==='speed'){S.speed=S.speed===1?30:1;b.setAttribute('aria-pressed',S.speed>1);return}
 const a=b.dataset.a,e=b.dataset.id&&get(+b.dataset.id);if(!a)return;
 if(a==='groups')go('groups');
 if(a==='group'){S.group=b.dataset.g;S.q='';go('map')}
 if(a==='open'){S.sel=e.id;go('detail')}
 if(a==='mins'){S.mins=+b.dataset.m;render()}
 if(a==='find'){S.stack=[];S.q='';S.group=null;go('find',false)}
 if(a==='mylists')go('mylists');
 if(a==='start'){
  if(using())S.msg=busyMsg();
  else{const {error}=await db.from('equipment_session').insert({user_id:S.me,equipment_id:S.sel,duration_minutes:S.mins,start_time:iso(vnow())});
   if(error)S.msg=error.code==='23505'?'Someone just started on this machine, or you already have a session open.':error.message;
   else toast('Enjoy your set. Your session timer has started.')}
  await sync();render()}
 if(a==='finish'){await db.from('equipment_session').update({end_time:iso(vnow())}).eq('session_id',e.sess.session_id);toast('Session finished.');await sync();render()}
 if(a==='join'){const x=get(S.sel);
  if(x.by==='You')S.msg='You are using this machine right now, so you cannot join its waitlist.';
  else if(!S.checked)S.msg='You need to check in at the gym before you can join a waitlist.';
  else if(x.status==='unavailable')S.msg='This equipment is currently unavailable, so you cannot join its waitlist.';
  else if(mine().length>=MAXLISTS)S.msg='You are on 3 waitlists already. Cancel one to join another.';
  else{const {error}=await db.from('waitlist').insert({user_id:S.me,equipment_id:x.id,position:x.rows.length+1});
   if(error)S.msg=error.code==='23505'?'You are already on this waitlist.':error.message;
   else{await sync();return go('mylists')}}
  render()}
 if(a==='cancel'){const r=myRow(e);if(r){await db.from('waitlist').delete().eq('waitlist_id',r.waitlist_id);await compact(e.id)}
  toast('Removed from the '+e.name+' waitlist.');if(S.screen==='claim'){S.screen='map';S.stack=['find'];S.claim=null}await sync();render()}
 if(a==='claim'){
  if(using()){S.msg=busyMsg();return render()}
  const c=get(S.claim),r=c.rows[0];
  const {error}=await db.from('equipment_session').insert({user_id:S.me,equipment_id:c.id,duration_minutes:S.mins,start_time:iso(vnow())});
  if(error){S.msg=error.code==='23505'?'Someone else started on this machine first.':error.message;return render()}
  await db.from('waitlist').delete().eq('waitlist_id',r.waitlist_id);await compact(c.id);
  S.claim=null;S.sel=c.id;S.stack=['find','map'];S.screen='detail';S.msg='';toast('It is yours. Your session timer has started.');await sync();render()}});
setInterval(()=>{if(!S.me)return;S.warp+=(S.speed-1)*1000;try{localStorage.setItem('spotWarp',S.warp)}catch(x){}derive();view()},1000);
setInterval(()=>{if(S.me)sync()},4000);
render();