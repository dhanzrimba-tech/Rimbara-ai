const state={tutor:'Raka',topic:'Daily Conversation',slow:false,mode:'happy'};
const expr={
  Raka:{happy:'assets/avatars/raka-1.jpg',speaking:'assets/avatars/raka-2.jpg',listening:'assets/avatars/raka-3.jpg',thinking:'assets/avatars/raka-4.jpg',praise:'assets/avatars/raka-5.jpg'},
  Rara:{happy:'assets/avatars/rara-1.jpg',speaking:'assets/avatars/rara-2.jpg',listening:'assets/avatars/rara-3.jpg',thinking:'assets/avatars/rara-4.jpg',praise:'assets/avatars/rara-5.jpg'}
};
const prompts={
  'Daily Conversation':`Hi! I'm {name}. Tell me about your day at school.`,
  'Forestry English':`Hello! Let's talk forestry. What do you learn in the forest?`,
  'PKL / Field Practice':`Hi! Imagine you're at PKL. What activity did you do today?`,
  'Job Interview':`Good morning. Please introduce yourself for a job interview.`,
  'Pronunciation Practice':`Let's practise. Say: “Sustainable forest management protects our future.”`
};
const replies={
  'Daily Conversation':`That sounds great. Try: “Today I studied with my classmates.”`,
  'Forestry English':`Nice! You can say: “I learn about forest inventory and conservation.”`,
  'PKL / Field Practice':`Good job. You can say: “Today I joined a field practice activity.”`,
  'Job Interview':`Well done. Keep it clear: “My name is … and I study forestry.”`,
  'Pronunciation Practice':`Excellent effort. Focus on the rhythm: sustainable • forest • management.`
};
const $=id=>document.getElementById(id);
let activePhoto='A';
let speechTimer=null;
let speechFlip=false;
let runToken=0;

function photoFor(tutor,mode='happy'){
  return expr[tutor][mode]||expr[tutor].happy;
}
function swapCoachPhoto(src){
  const next=activePhoto==='A'?'B':'A';
  const nextEl=next==='A'?$('coachPhotoA'):$('coachPhotoB');
  const currentEl=activePhoto==='A'?$('coachPhotoA'):$('coachPhotoB');
  nextEl.src=src;
  nextEl.classList.add('visible');
  currentEl.classList.remove('visible');
  activePhoto=next;
}
function setMotion(mode){
  const wrap=$('coachWrap');
  wrap.className=`coach-photo-wrap ${mode}`;
  $('dot').classList.toggle('active',mode!=='happy');
  $('wave').classList.toggle('active',mode==='speaking');
  $('motionLabel').textContent={
    happy:'READY',speaking:'SPEAKING',listening:'LISTENING',thinking:'THINKING',praise:'APPLAUSE'
  }[mode]||'READY';
}
function setState(mode,label){
  state.mode=mode;
  interactionToken++;
  clearInterval(speechTimer);
  speechTimer=null;
  setMotion(mode);
  $('state').textContent=label;
  $('characterBadge').textContent={
    happy:'READY • Siap belajar',
    speaking:'SPEAKING • Sedang berbicara',
    listening:'LISTENING • Mendengarkan',
    thinking:'THINKING • Sedang berpikir',
    praise:'APPLAUSE • Memberi apresiasi'
  }[mode]||'READY • Siap belajar';
  swapCoachPhoto(photoFor(state.tutor,mode));
  if(mode==='thinking') $('coachWrap').setAttribute('data-thinking','true');
  else $('coachWrap').removeAttribute('data-thinking');
}
function preloadTutor(tutor){
  Object.values(expr[tutor]).forEach(src=>{const img=new Image();img.src=src;});
}
function updateTutor(){
  $('coachName').textContent=state.tutor;
  $('msgTutorName').textContent=`${state.tutor} 🇬🇧`;
  $('promptText').textContent=prompts[state.topic].replace('{name}',state.tutor);
  ++runToken;
  clearInterval(speechTimer);speechTimer=null;
  setState('happy','Ready to practice');
  document.querySelectorAll('.coach-select').forEach(b=>b.classList.toggle('active',b.dataset.tutor===state.tutor));
  preloadTutor(state.tutor);
}
function speak(text){
  if(!('speechSynthesis' in window)){
    $('feedback').innerHTML='<b>Demo mode:</b> Browser ini belum mendukung suara tutor.';
    return;
  }
  const u=new SpeechSynthesisUtterance(text);
  u.lang='en-GB';
  u.rate=state.slow?.78:.95;
  u.pitch=state.tutor==='Rara'?1.06:.96;
  const token=++runToken;
  speechFlip=false;
  clearInterval(speechTimer);speechTimer=null;
  setState('speaking',`${state.tutor} is speaking…`);
  speechSynthesis.cancel();
  // Gentle frame crossfade creates a visible speech/lip rhythm using the approved character frames.
  speechTimer=setInterval(()=>{
    if(token!==runToken||!speechSynthesis.speaking){clearInterval(speechTimer);speechTimer=null;return;}
    speechFlip=!speechFlip;
    swapCoachPhoto(photoFor(state.tutor,speechFlip?'happy':'speaking'));
  },320);
  u.onend=()=>{
    if(token!==runToken)return;
    clearInterval(speechTimer);speechTimer=null;
    setState('praise',`${state.tutor} says: Well done!`);
    setTimeout(()=>{
      if(token===runToken)setState('happy','Ready for your reply');
    },900);
  };
  u.onerror=()=>{
    clearInterval(speechTimer);speechTimer=null;
    if(token===runToken)setState('happy','Ready for your reply');
  };
  speechSynthesis.speak(u);
}
function addStudent(text){
  if(!text.trim())return;
  const box=document.createElement('div');
  box.className='message student';
  box.innerHTML=`<b>You</b><p>${escapeHtml(text)}</p>`;
  $('conversation').appendChild(box);
  const token=++runToken;
  clearInterval(speechTimer);speechTimer=null;
  setState('listening',`${state.tutor} is listening…`);
  setTimeout(()=>{
    if(token!==runToken)return;
    setState('thinking',`${state.tutor} is thinking…`);
    setTimeout(()=>{
      if(token!==runToken)return;
      const reply=replies[state.topic];
      const m=document.createElement('div');
      m.className='message tutor';
      m.innerHTML=`<b>${state.tutor} 🇬🇧</b><p>${reply}</p>`;
      $('conversation').appendChild(m);
      $('feedback').innerHTML=`<b>Demo feedback:</b> Great try! ${state.slow?'Use short, clear sentences first.':'Keep your answer natural and complete.'} 🌱`;
      speak(reply);
    },650);
  },650);
}
function escapeHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

$('startPractice').onclick=()=>$('practice').scrollIntoView({behavior:'smooth'});
$('scrollFeatures').onclick=()=>$('features').scrollIntoView({behavior:'smooth'});
$('topic').onchange=e=>{state.topic=e.target.value;updateTutor()};
document.querySelectorAll('.coach-select').forEach(b=>b.onclick=()=>{state.tutor=b.dataset.tutor;updateTutor()});
$('slowToggle').onclick=()=>{state.slow=!state.slow;$('slowToggle').textContent=`🐢 Slow: ${state.slow?'ON':'OFF'}`};
$('hearBtn').onclick=()=>speak(prompts[state.topic].replace('{name}',state.tutor));
$('speakBtn').onclick=()=>{
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){
    $('studentText').focus();
    setState('listening','Type your answer below…');
    $('feedback').innerHTML='<b>Demo mode:</b> Browser ini tidak menyediakan voice input. Ketik jawaban pada kolom bawah.';
    return;
  }
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;
  const r=new R();
  r.lang='en-GB';r.interimResults=false;r.maxAlternatives=1;
  let gotResult=false;
  setState('listening',`${state.tutor} is listening…`);
  r.start();
  r.onresult=e=>{gotResult=true;addStudent(e.results[0][0].transcript)};
  r.onerror=()=>{setState('happy','Coba lagi atau ketik jawaban');$('studentText').focus()};
  r.onend=()=>{if(!gotResult&&state.mode==='listening')setState('happy','Ready for your reply')};
};
$('sendText').onclick=()=>{const v=$('studentText').value;$('studentText').value='';addStudent(v)};
$('studentText').addEventListener('keydown',e=>{if(e.key==='Enter')$('sendText').click()});

// Preload both tutors so expression changes feel immediate.
preloadTutor('Raka');preloadTutor('Rara');
updateTutor();
