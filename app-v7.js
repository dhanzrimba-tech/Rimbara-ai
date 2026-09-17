const $ = id => document.getElementById(id);
let tutor = 'Raka', topic = 'Daily Conversation', slow = false;
let connected = false, recognition = null, recognizing = false, voiceAnim = null, userTranscript = [], turn = 0;
let demoInput, demoSend;

const starters = {
  'Daily Conversation': "Hi! I'm {name}. Tell me about your day at school.",
  'Forestry English': "Hello! I'm {name}. Let's talk about forestry. What forest activity have you done recently?",
  'PKL / Field Practice': "Hi! I'm {name}. Tell me about your PKL or field practice.",
  'Job Interview': "Good morning. I'm {name}, your interview practice partner. Why are you interested in forestry?"
};

const replies = {
  'Daily Conversation': [
    'That sounds interesting. What did you enjoy most at school today?',
    'Nice! Tell me one thing you learned today.',
    'Great. What are you planning to do after school?'
  ],
  'Forestry English': [
    'Good answer. What tools or equipment did you use in the field?',
    'Interesting. How did you help protect the forest during the activity?',
    'Excellent. Can you describe one forestry skill you want to improve?'
  ],
  'PKL / Field Practice': [
    'Good. What was your main responsibility during PKL?',
    'That is useful experience. What did you learn from your supervisor?',
    'Well done. Which field activity was the most challenging for you?'
  ],
  'Job Interview': [
    'Thank you. Can you describe one strength that would help you in a forestry job?',
    'Good. Tell me about a time you worked successfully in a team.',
    'Excellent. Why should an employer choose you for this position?'
  ]
};

function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function addBubble(text,who='ai'){
  const d=document.createElement('div'); d.className='bubble '+who;
  d.innerHTML='<b>'+ (who==='ai'?tutor+' 🇬🇧':'YOU')+'</b><p>'+escapeHtml(text)+'</p>';
  $('chat').appendChild(d); $('chat').scrollTop=$('chat').scrollHeight;
}
function setState(s){
  $('state').textContent=s;
  $('avatarWrap').classList.toggle('listening',/^Listening/i.test(s));
  $('avatarWrap').classList.toggle('speaking',/speaking/i.test(s));
}
function setTutor(name){
  tutor=name;
  $('tutorName').textContent=name;
  $('avatarFace').classList.toggle('raka',name==='Raka');
  $('avatarFace').classList.toggle('rara',name==='Rara');
  $('avatarFace').setAttribute('aria-label',name+' animated tutor');
  document.querySelectorAll('.char').forEach(x=>x.classList.toggle('active',x.dataset.tutor===name));
  if(!connected){ $('chat').innerHTML=''; addBubble(starters[topic].replace('{name}',name)); speak(starters[topic].replace('{name}',name)); }
}
function pickVoice(){
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  const english = voices.filter(v=>/^en(-|_)/i.test(v.lang));
  const preferredMale=/male|daniel|george|guy|ryan|arthur|oliver/i;
  const preferredFemale=/female|samantha|victoria|kate|hazel|susan|sarah/i;
  let list=tutor==='Rara' ? english.filter(v=>preferredFemale.test(v.name)) : english.filter(v=>preferredMale.test(v.name));
  return (list[0] || english.find(v=>/en-GB|en_GB/i.test(v.lang)) || english[0] || voices[0]);
}
function speak(text){
  if(!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text); u.lang='en-GB';
  const v=pickVoice(); if(v) u.voice=v;
  u.rate=slow?0.72:0.92; u.pitch=tutor==='Rara'?1.08:0.92; u.volume=1;
  u.onstart=()=>{setState(tutor+' is speaking…');$('avatarWrap').classList.add('speaking');startAvatarVoice();};
  u.onend=()=>{stopAvatarVoice(); if(connected){setState('Listening…'); beginRecognition();} else setState('Ready');};
  u.onerror=()=>{stopAvatarVoice(); if(connected)setState('Listening…');};
  speechSynthesis.speak(u);
}
function startAvatarVoice(){
  if(voiceAnim) cancelAnimationFrame(voiceAnim);
  const bars=[...document.querySelectorAll('.voice-bars i')]; let t=0;
  const loop=()=>{t+=0.22; const level=.35+.35*Math.abs(Math.sin(t)); $('avatarWrap').style.setProperty('--voice-level',level.toFixed(2)); bars.forEach((b,i)=>b.style.height=(7+level*(18+Math.sin(t+i)*5))+'px'); voiceAnim=requestAnimationFrame(loop);}; loop();
}
function stopAvatarVoice(){if(voiceAnim)cancelAnimationFrame(voiceAnim);voiceAnim=null;$('avatarWrap').style.setProperty('--voice-level','0');$('avatarWrap').classList.remove('speaking');}
function installDemoInput(){
  if(demoInput) return;
  const wrap=document.createElement('div'); wrap.className='demo-input-wrap'; wrap.innerHTML='<input id="demoInput" type="text" placeholder="Ketik jawaban Bahasa Inggris di sini…" autocomplete="off"><button id="demoSend">Send ↵</button><small id="demoSupport">Demo gratis • voice input otomatis jika browser mendukung</small>';
  const controls=document.querySelector('.live-controls'); controls.insertAdjacentElement('afterend',wrap);
  demoInput=$('demoInput'); demoSend=$('demoSend');
  demoSend.onclick=sendTyped; demoInput.onkeydown=e=>{if(e.key==='Enter')sendTyped();};
}
function sendTyped(){const text=demoInput?.value.trim(); if(!text)return; processUserText(text); demoInput.value='';}
function setupRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){$('demoSupport').textContent='Browser ini tidak mendukung voice input otomatis. Gunakan kotak teks untuk demo.';return null;}
  const r=new SR(); r.lang='en-GB'; r.interimResults=false; r.continuous=false; r.maxAlternatives=1;
  r.onstart=()=>{recognizing=true;setState('Listening…');};
  r.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||''; if(text)processUserText(text);};
  r.onerror=()=>{recognizing=false;setState('Listening…');};
  r.onend=()=>{recognizing=false; if(connected && !speechSynthesis.speaking)setState('Listening…');};
  return r;
}
function beginRecognition(){
  if(!connected)return;
  if(!recognition) recognition=setupRecognition();
  if(recognition && !recognizing){try{recognition.start();}catch(e){}}
  if(demoInput) demoInput.focus();
}
function processUserText(text){
  if(!connected)return;
  if(recognition&&recognizing){try{recognition.stop();}catch(e){}}
  userTranscript.push(text); renderTranscript(); addBubble(text,'user');
  setState(tutor+' is thinking…');
  setTimeout(()=>{
    const pool=replies[topic]||replies['Daily Conversation'];
    const reply=pool[turn++ % pool.length]; addBubble(reply,'ai'); speak(reply);
  },550);
}
function startDemo(){
  if(connected)return;
  connected=true; turn=0; userTranscript=[]; renderTranscript();
  resetScores(); installDemoInput();
  $('connect').disabled=true; $('stop').disabled=false;
  setState('Starting free demo…');
  const greeting=starters[topic].replace('{name}',tutor); $('chat').innerHTML=''; addBubble(greeting,'ai'); speak(greeting);
  $('demoInput').style.display='';
}
function stop(){
  connected=false; if(recognition&&recognizing){try{recognition.stop();}catch(e){}} recognition=null; recognizing=false;
  if('speechSynthesis' in window) speechSynthesis.cancel(); stopAvatarVoice();
  $('connect').disabled=false; $('stop').disabled=true; setState('Ready');
  $('meterText').textContent='Demo mode — microphone optional'; document.querySelector('.meter span').style.width='0%';
  if(userTranscript.length){$('feedbackBtn').disabled=false;$('feedbackTip').textContent='Demo session selesai. Klik “Analyse My Speaking”.';}
}
function renderTranscript(){
  const box=$('transcriptBox');
  if(!userTranscript.length){box.textContent='No learner transcript yet.';return;}
  box.innerHTML=userTranscript.map((t,i)=>`<div><b>${i+1}.</b> ${escapeHtml(t)}</div>`).join('');
}
function resetScores(){['scorePron','scoreFluency','scoreGrammar','scoreVocab'].forEach(id=>$(id).textContent='—');$('feedbackTip').textContent='Demo feedback lokal — tanpa API.';$('feedbackBtn').disabled=true;}
function analyseFeedback(){
  if(!userTranscript.length){$('feedbackTip').textContent='Belum ada jawaban siswa.';return;}
  const words=userTranscript.join(' ').trim().split(/\s+/).filter(Boolean).length;
  const long=Math.min(10,Math.max(4,Math.round(4+words/8)));
  const grammar=/\b(i am|i'm|i like|i want|i learned|i worked|i was|i have|my)\b/i.test(userTranscript.join(' '))?8:6;
  $('scorePron').textContent=Math.min(10,long)+'/10';$('scoreFluency').textContent=Math.min(10,Math.max(5,long-1))+'/10';$('scoreGrammar').textContent=grammar+'/10';$('scoreVocab').textContent=Math.min(10,Math.max(5,long))+'/10';
  $('feedbackTip').innerHTML='<b>Nice practice.</b><br>Try speaking in complete sentences and add one specific detail to make your answer clearer.';
}

document.querySelectorAll('.char').forEach(b=>b.onclick=()=>setTutor(b.dataset.tutor));
$('topic').onchange=e=>{topic=e.target.value;if(!connected){$('chat').innerHTML='';addBubble(starters[topic].replace('{name}',tutor));}};
$('slow').onclick=()=>{slow=!slow;$('slow').textContent='🐢 Slow: '+(slow?'ON':'OFF');};
$('connect').onclick=startDemo; $('stop').onclick=stop; $('feedbackBtn').onclick=analyseFeedback;
$('reset').onclick=()=>{stop();resetScores();$('chat').innerHTML='';addBubble(starters[topic].replace('{name}',tutor));};
window.addEventListener('beforeunload',stop);
if('speechSynthesis' in window) speechSynthesis.onvoiceschanged=()=>{};
installDemoInput();
$('meterText').textContent='Demo mode — microphone optional';
