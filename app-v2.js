const state={tutor:'Raka',topic:'Daily Conversation',slow:false,mode:'ready'};
const expr={Raka:{happy:'assets/avatars/raka-1.jpg',speaking:'assets/avatars/raka-2.jpg',listening:'assets/avatars/raka-3.jpg',thinking:'assets/avatars/raka-4.jpg',praise:'assets/avatars/raka-5.jpg'},Rara:{happy:'assets/avatars/rara-1.jpg',speaking:'assets/avatars/rara-2.jpg',listening:'assets/avatars/rara-3.jpg',thinking:'assets/avatars/rara-4.jpg',praise:'assets/avatars/rara-5.jpg'}};
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
function setState(mode,label){state.mode=mode;$('state').textContent=label;$('characterBadge').textContent={happy:'READY • Siap belajar',speaking:'SPEAKING • Sedang berbicara',listening:'LISTENING • Mendengarkan',thinking:'THINKING • Sedang berpikir',praise:'APPLAUSE • Memberi apresiasi'}[mode]||'READY • Siap belajar';$('coachWrap').className='coach-photo-wrap '+mode;const photo=expr[state.tutor][mode]||expr[state.tutor].happy;$('coachPhoto').src=photo;$('dot').classList.toggle('active',mode!=='ready');$('wave').classList.toggle('active',mode==='speaking');}
function updateTutor(){
 $('coachName').textContent=state.tutor;$('msgTutorName').textContent=`${state.tutor} 🇬🇧`;$('promptText').textContent=prompts[state.topic].replace('{name}',state.tutor);
 setState('happy','Ready to practice');
 document.querySelectorAll('.coach-select').forEach(b=>b.classList.toggle('active',b.dataset.tutor===state.tutor));
}
function speak(text){
 const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=state.slow?.78:.95;u.pitch=state.tutor==='Rara'?1.06:.96;
 setState('speaking',`${state.tutor} is speaking…`);speechSynthesis.cancel();speechSynthesis.speak(u);u.onend=()=>setState('happy','Ready for your reply');
}
function addStudent(text){
 if(!text.trim())return;const box=document.createElement('div');box.className='message student';box.innerHTML=`<b>You</b><p>${escapeHtml(text)}</p>`;$('conversation').appendChild(box);setState('listening',`${state.tutor} is listening…`);setTimeout(()=>{setState('thinking',`${state.tutor} is thinking…`);setTimeout(()=>{const reply=replies[state.topic];const m=document.createElement('div');m.className='message tutor';m.innerHTML=`<b>${state.tutor} 🇬🇧</b><p>${reply}</p>`;$('conversation').appendChild(m);$('feedback').innerHTML=`<b>Demo feedback:</b> Great try! ${state.slow?'Use short, clear sentences first.':'Keep your answer natural and complete.'} 🌱`;speak(reply)},600)},650)}
function escapeHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
$('startPractice').onclick=()=>$('practice').scrollIntoView({behavior:'smooth'});
$('scrollFeatures').onclick=()=>$('features').scrollIntoView({behavior:'smooth'});
$('topic').onchange=e=>{state.topic=e.target.value;updateTutor()};
document.querySelectorAll('.coach-select').forEach(b=>b.onclick=()=>{state.tutor=b.dataset.tutor;updateTutor()});
$('slowToggle').onclick=()=>{state.slow=!state.slow;$('slowToggle').textContent=`🐢 Slow: ${state.slow?'ON':'OFF'}`};
$('hearBtn').onclick=()=>speak(prompts[state.topic].replace('{name}',state.tutor));
$('speakBtn').onclick=()=>{
 if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){$('studentText').focus();$('feedback').innerHTML='<b>Demo mode:</b> Browser ini tidak menyediakan voice input. Ketik jawaban pada kolom bawah.';return}
 const R=window.SpeechRecognition||window.webkitSpeechRecognition;const r=new R();r.lang='en-GB';r.interimResults=false;r.maxAlternatives=1;setState('listening',`${state.tutor} is listening…`);r.start();r.onresult=e=>addStudent(e.results[0][0].transcript);r.onerror=()=>{setState('happy','Coba lagi atau ketik jawaban');$('studentText').focus()};
};
$('sendText').onclick=()=>{const v=$('studentText').value; $('studentText').value=''; addStudent(v)};
$('studentText').addEventListener('keydown',e=>{if(e.key==='Enter')$('sendText').click()});
updateTutor();
