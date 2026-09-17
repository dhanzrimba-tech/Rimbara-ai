const $=id=>document.getElementById(id);
let tutor='Raka', topic='Daily Conversation', slow=false, pc=null, dc=null, micStream=null, audioEl=null, analyser=null, meterTimer=null, connected=false;
let userTranscript=[], tutorTranscript=[];
const starters={
 'Daily Conversation':"Hi! I'm {name}. Tell me about your day at school.",
 'Forestry English':"Hello! I'm {name}. Let's talk about forestry. What forest activity have you done recently?",
 'PKL / Field Practice':"Hi! I'm {name}. Tell me about your PKL or field practice.",
 'Job Interview':"Good morning. I'm {name}, your interview practice partner. Why are you interested in forestry?"
};
function addBubble(text,who='ai'){const d=document.createElement('div');d.className='bubble '+who;d.innerHTML='<b>'+ (who==='ai'?tutor+' 🇬🇧':'YOU')+'</b><p>'+escapeHtml(text)+'</p>';$('chat').appendChild(d);$('chat').scrollTop=$('chat').scrollHeight}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setTutor(name){tutor=name;$('tutorName').textContent=name;$('avatarFace').classList.toggle('raka',name==='Raka');$('avatarFace').classList.toggle('rara',name==='Rara');$('avatarFace').setAttribute('aria-label',name+' animated tutor');document.querySelectorAll('.char').forEach(x=>x.classList.toggle('active',x.dataset.tutor===name));if(!connected){$('chat').innerHTML='';addBubble(starters[topic].replace('{name}',name));}}
function setState(s){$('state').textContent=s; const w=$('avatarWrap'); w.classList.toggle('listening', /^Listening/i.test(s)); w.classList.toggle('speaking', /speaking/i.test(s));}
function setupOutputMeter(stream){
  try{
    if(audioCtx) audioCtx.close();
    audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const src=audioCtx.createMediaStreamSource(stream); outputAnalyser=audioCtx.createAnalyser(); outputAnalyser.fftSize=256; src.connect(outputAnalyser);
    const data=new Uint8Array(outputAnalyser.frequencyBinCount);
    const bars=[...document.querySelectorAll('.voice-bars i')];
    const tick=()=>{
      if(!outputAnalyser)return; outputAnalyser.getByteFrequencyData(data);
      let sum=0; for(const v of data) sum+=v; const level=Math.min(1,(sum/data.length)/90);
      $('avatarWrap').style.setProperty('--voice-level', level.toFixed(3));
      bars.forEach((b,i)=>b.style.height=(7+level*(18+Math.sin(Date.now()/90+i)*7))+'px');
      voiceAnim=requestAnimationFrame(tick);
    }; tick();
  }catch(err){console.warn('Audio visualiser unavailable',err)}
}
async function createRealtimeCall(sdpOffer){
 const r=await fetch('/api/realtime/call',{
  method:'POST',
  headers:{
   'Content-Type':'application/sdp',
   'X-Rimbara-Tutor':tutor,
   'X-Rimbara-Topic':topic,
   'X-Rimbara-Slow':slow?'1':'0'
  },
  body:sdpOffer
 });
 const text=await r.text();
 if(!r.ok) throw new Error(text || 'Could not create realtime call');
 return text;
}
async function connect(){
 if(connected)return;
 try{
  resetFeedback(); setState('Requesting secure voice session…');$('connect').disabled=true;
  resetFeedback(); setState('Requesting secure voice session…');$('connect').disabled=true;

micStream=await navigator.mediaDevices.getUserMedia({audio:true});
  micStream=await navigator.mediaDevices.getUserMedia({audio:true});
  pc=new RTCPeerConnection(); audioEl=new Audio(); audioEl.autoplay=true; audioEl.playsInline=true;
  pc.ontrack=e=>{audioEl.srcObject=e.streams[0]; $('avatarWrap').classList.add('speaking'); setupOutputMeter(e.streams[0]);};
  pc.onconnectionstatechange=()=>{if(['failed','disconnected','closed'].includes(pc.connectionState)&&connected) stop();};
  micStream.getTracks().forEach(t=>pc.addTrack(t,micStream));
  dc=pc.createDataChannel('oai-events');
  dc.onopen=()=>{dc.send(JSON.stringify({type:'response.create'}));setState('Live — speak naturally');$('stop').disabled=false;connected=true;startMeter();addBubble('Live voice conversation started. I\'m listening.','ai');};
  dc.onmessage=e=>handleRealtimeEvent(e.data);
  const offer=await pc.createOffer();await pc.setLocalDescription(offer);
  const sdp=await createRealtimeCall(offer.sdp);
  await pc.setRemoteDescription({type:'answer',sdp});
 }catch(e){console.error(e);setState('Could not start live voice');$('connect').disabled=false;if(micStream)micStream.getTracks().forEach(t=>t.stop());alert('RIMBARA AI V8.3: '+e.message+'\n\nPastikan server berjalan, API key sudah diatur, dan browser mengizinkan mikrofon.');}
}
function handleRealtimeEvent(raw){
 try{
  const ev=JSON.parse(raw);
  if(ev.type==='input_audio_buffer.speech_started'){setState('Listening…');$('avatarWrap').classList.remove('speaking');}
  if(ev.type==='input_audio_buffer.speech_stopped'){setState(tutor+' is thinking…');}
  if(ev.type==='response.audio.delta'){setState(tutor+' is speaking…');$('avatarWrap').classList.add('speaking');}
  if(ev.type==='response.audio_transcript.delta'){if(ev.delta) appendTutorTranscript(ev.delta);}
  if(ev.type==='response.audio_transcript.done'){setState('Live — your turn');$('avatarWrap').classList.remove('speaking');}
  if(ev.type==='conversation.item.input_audio_transcription.completed' && ev.transcript){appendUserTranscript(ev.transcript);}
  if(ev.type==='response.done'){setState('Live — your turn');$('avatarWrap').classList.remove('speaking');}
  if(ev.type==='error'){console.warn(ev.error);setState('Realtime error — check server/session');}
 }catch{}
}
function appendUserTranscript(text){userTranscript.push(String(text));renderTranscript();}
function appendTutorTranscript(text){if(!tutorTranscript.length)tutorTranscript.push('');tutorTranscript[tutorTranscript.length-1]+=String(text);}
function renderTranscript(){const box=$('transcriptBox');if(!userTranscript.length){box.textContent='No learner transcript yet.';return}box.innerHTML=userTranscript.map((t,i)=>`<div><b>${i+1}.</b> ${escapeHtml(t)}</div>`).join('');}
function resetFeedback(){userTranscript=[];tutorTranscript=[];renderTranscript();['scorePron','scoreFluency','scoreGrammar','scoreVocab'].forEach(id=>$(id).textContent='—');$('feedbackTip').textContent='Finish a live session, then analyse your speaking.'; if($('feedbackBtn')) $('feedbackBtn').disabled=true;$('feedbackBtn').disabled=true;}
async function analyseFeedback(){
 if(!userTranscript.length){$('feedbackTip').textContent='Belum ada transkrip siswa. Coba bicara beberapa kalimat terlebih dahulu.';return;}
 const btn=$('feedbackBtn');btn.disabled=true;btn.textContent='⏳ Analysing…';$('feedbackTip').textContent='RIMBARA sedang menganalisis pronunciation, fluency, grammar, dan vocabulary…';
 try{const r=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tutor,topic,transcript:userTranscript.join(' ')})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Feedback failed');
  $('scorePron').textContent=d.scores.pronunciation+'/10';$('scoreFluency').textContent=d.scores.fluency+'/10';$('scoreGrammar').textContent=d.scores.grammar+'/10';$('scoreVocab').textContent=d.scores.vocabulary+'/10';
  $('feedbackTip').innerHTML='<b>'+escapeHtml(d.summary)+'</b><br>'+escapeHtml(d.next_step||'Keep practising and try to speak a little more each session.');
 }catch(e){$('feedbackTip').textContent='Feedback belum bisa diproses: '+e.message;}finally{btn.disabled=false;btn.textContent='✨ Analyse My Speaking';}
}
function stop(){const wasConnected=connected;connected=false;stopMeter(); if(voiceAnim) cancelAnimationFrame(voiceAnim); voiceAnim=null; if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null;} $('avatarWrap').style.setProperty('--voice-level','0');if(dc)dc.close();if(pc)pc.close();if(micStream)micStream.getTracks().forEach(t=>t.stop());pc=null;dc=null;micStream=null;$('connect').disabled=false;$('stop').disabled=true;$('avatarWrap').classList.remove('speaking','listening');setState('Ready');if(wasConnected && userTranscript.length){$('feedbackBtn').disabled=false;$('feedbackTip').textContent='Session selesai. Klik “Analyse My Speaking” untuk melihat feedback.';}}
function startMeter(){if(!micStream)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C();analyser=ctx.createAnalyser();const src=ctx.createMediaStreamSource(micStream);analyser.fftSize=256;src.connect(analyser);const data=new Uint8Array(analyser.frequencyBinCount);meterTimer=setInterval(()=>{analyser.getByteTimeDomainData(data);let sum=0;for(const x of data){const v=(x-128)/128;sum+=v*v}const rms=Math.sqrt(sum/data.length);$('meterText').textContent=rms>.025?'Microphone: speaking':'Microphone: ready';document.querySelector('.meter span').style.width=Math.min(100,Math.round(rms*500))+'%';},100)}
function stopMeter(){if(meterTimer)clearInterval(meterTimer);meterTimer=null;$('meterText').textContent='Microphone is off';document.querySelector('.meter span').style.width='0%'}

document.querySelectorAll('.char').forEach(b=>b.onclick=()=>setTutor(b.dataset.tutor));
$('topic').onchange=e=>{topic=e.target.value;if(!connected){$('chat').innerHTML='';addBubble(starters[topic].replace('{name}',tutor));}};
$('slow').onclick=()=>{slow=!slow;$('slow').textContent='🐢 Slow: '+(slow?'ON':'OFF');if(connected){alert('Slow mode will apply when the next live session starts.');}};
$('connect').onclick=connect;$('stop').onclick=stop;$('feedbackBtn').onclick=analyseFeedback;
$('reset').onclick=()=>{stop();resetFeedback();$('chat').innerHTML='';addBubble(starters[topic].replace('{name}',tutor));};
window.addEventListener('beforeunload',stop);
