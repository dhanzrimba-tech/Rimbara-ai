import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({limit:"1mb"}));

const client = process.env.OPENAI_API_KEY ? new OpenAI({apiKey:process.env.OPENAI_API_KEY}) : null;
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1";

app.get("/api/health", (_req,res)=>res.json({ok:true, configured:Boolean(client), realtimeModel:REALTIME_MODEL}));

function tutorInstructions(tutor, topic){
  const name = tutor === "Rara" ? "Rara" : "Raka";
  return `You are ${name}, a friendly British English speaking tutor for Indonesian SMK Kehutanan Rimba Bahari Sumedang students. Speak naturally in clear British English. Topic: ${topic}. Keep spoken turns concise, usually 1-3 sentences. Encourage the learner, ask one natural follow-up question, and gently recast important grammar errors without embarrassing the student. For pronunciation, model the correct word or phrase naturally rather than giving long technical explanations. Use everyday British wording and natural rhythm. If the learner is a beginner, slow down and use simpler sentences. This is an educational AI tutor.`;
}

app.post("/api/chat", async (req,res)=>{
  try{
    if(!client) return res.status(503).json({error:"OPENAI_API_KEY is not configured"});
    const {message,tutor="Raka",topic="Daily Conversation",history=[]}=req.body || {};
    if(!message || typeof message!=="string") return res.status(400).json({error:"message is required"});
    const safeHistory = Array.isArray(history) ? history.slice(-12) : [];
    const input = [
      {role:"developer",content:tutorInstructions(tutor,topic)},
      ...safeHistory.map(x=>({role:x.role==="assistant"?"assistant":"user",content:String(x.content).slice(0,1200)})),
      {role:"user",content:message.slice(0,2000)}
    ];
    const response = await client.responses.create({model:MODEL,input,max_output_tokens:180});
    res.json({reply:response.output_text?.trim() || "Could you tell me a little more?"});
  }catch(err){ console.error(err); res.status(500).json({error:"AI request failed"}); }
});

app.post("/api/tts", async (req,res)=>{
  try{
    if(!client) return res.status(503).json({error:"OPENAI_API_KEY is not configured"});
    const {text,voice="marin",slow=false}=req.body || {};
    if(!text) return res.status(400).json({error:"text is required"});
    const audio = await client.audio.speech.create({
      model:"gpt-4o-mini-tts", voice, input:String(text).slice(0,4096),
      instructions:"Speak in clear, natural British English with warm teacher-like intonation, accurate word stress and natural pauses. Do not sound robotic.",
      speed: slow ? 0.78 : 0.95, response_format:"mp3"
    });
    res.set("Content-Type","audio/mpeg").send(Buffer.from(await audio.arrayBuffer()));
  }catch(err){ console.error(err); res.status(500).json({error:"TTS request failed"}); }
});

app.post("/api/feedback", async (req,res)=>{
  try{
    if(!client) return res.status(503).json({error:"OPENAI_API_KEY is not configured"});
    const {transcript,tutor="Raka",topic="Daily Conversation"}=req.body || {};
    if(!transcript || typeof transcript!=="string") return res.status(400).json({error:"transcript is required"});
    const prompt = `You are an encouraging British English speaking teacher for Indonesian SMK Kehutanan Rimba Bahari students. Analyse this learner transcript from a ${topic} practice session. Return ONLY valid JSON with this shape: {"scores":{"pronunciation":number,"fluency":number,"grammar":number,"vocabulary":number},"summary":"short supportive sentence","next_step":"one practical next step"}. Scores are 0-10. Important limitation: pronunciation cannot be directly measured from text alone, so estimate pronunciation only from textual evidence very conservatively and mention no certainty. Do not shame the learner.
Tutor: ${tutor}
Learner transcript: ${transcript.slice(0,6000)}`;
    const response=await client.responses.create({model:MODEL,input:[{role:"developer",content:"Return strict JSON only. No markdown."},{role:"user",content:prompt}],max_output_tokens:220});
    let data; try{data=JSON.parse(response.output_text)}catch{data={scores:{pronunciation:5,fluency:5,grammar:5,vocabulary:5},summary:"Good effort. Keep speaking and build your confidence step by step.",next_step:"Try to speak in complete sentences and repeat useful phrases aloud."};}
    res.json(data);
  }catch(err){console.error(err);res.status(500).json({error:"Feedback request failed"});}
});

// Creates a short-lived client secret for browser WebRTC. The permanent API key never reaches the browser.
app.post("/api/realtime/session", async (req,res)=>{
  try{
    if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"OPENAI_API_KEY is not configured"});
    const {tutor="Raka",topic="Daily Conversation",slow=false}=req.body || {};
    const name = tutor === "Rara" ? "Rara" : "Raka";
    const instructions = tutorInstructions(name, topic) + ` Tutor name is ${name}. ${slow ? "Speak noticeably slower than normal and leave clear pauses." : "Use a comfortable natural speaking pace."} Use British English pronunciation and intonation.`;
    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method:"POST",
      headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({session:{type:"realtime",model:REALTIME_MODEL,instructions,output_modalities:["audio"],audio:{input:{transcription:{model:"gpt-live-transcribe",languages:["en"]}}}}})
    });
    const data = await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message || "Could not create realtime client secret"});
    res.json({client_secret:data.value || data.client_secret?.value || data.client_secret, model:REALTIME_MODEL});
  }catch(err){ console.error(err); res.status(500).json({error:"Realtime session creation failed"}); }
});

app.listen(PORT,()=>console.log(`RIMBARA AI V7 server listening on ${PORT}`));
