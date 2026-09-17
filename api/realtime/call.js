import {json,tutorInstructions} from "../../lib/openai.js";

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});

  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey) return json(res,503,{error:"OPENAI_API_KEY is not configured"});

  try{
    // Browser sends the SDP offer with Content-Type: application/sdp.
    // Vercel exposes the request body as a string or Buffer depending on runtime.
    let sdp=req.body;
    if(Buffer.isBuffer(sdp)) sdp=sdp.toString("utf8");
    if(typeof sdp!=="string" && sdp && typeof sdp.text==="string") sdp=sdp.text;
    if(typeof sdp!=="string" || !sdp.trim()){
      return json(res,400,{error:"SDP offer is required"});
    }

    const tutor=req.headers["x-rimbara-tutor"]||"Raka";
    const topic=req.headers["x-rimbara-topic"]||"Daily Conversation";
    const slow=req.headers["x-rimbara-slow"]==="1";
    const name=tutor==="Rara"?"Rara":"Raka";
    const instructions=tutorInstructions(name,topic)
      +` Tutor name is ${name}. ${slow?"Speak noticeably slower than normal and leave clear pauses.":"Use a comfortable natural speaking pace."} Use British English pronunciation and intonation.`;

    const session={
      type:"realtime",
      model:process.env.OPENAI_REALTIME_MODEL||"gpt-realtime-2.1",
      instructions,
      output_modalities:["audio"],
      audio:{
        input:{
          transcription:{model:"gpt-live-transcribe",languages:["en"]}
        }
      }
    };

    // Use the Realtime WebRTC HTTP endpoint directly. This avoids relying on
    // a specific OpenAI Node SDK version exposing client.realtime.calls.create().
    const form=new FormData();
    form.append("sdp",new Blob([sdp],{type:"application/sdp"}),"offer.sdp");
    form.append("session",new Blob([JSON.stringify(session)],{type:"application/json"}),"session.json");

    const response=await fetch("https://api.openai.com/v1/realtime/calls",{
      method:"POST",
      headers:{
        Authorization:`Bearer ${apiKey}`,
        Accept:"application/sdp"
      },
      body:form
    });

    const answer=await response.text();
    if(!response.ok){
      throw new Error(answer||`OpenAI Realtime request failed (${response.status})`);
    }
    if(!answer.trim()) throw new Error("OpenAI did not return an SDP answer");

    res.status(200).setHeader("Content-Type","application/sdp");
    res.end(answer);
  }catch(e){
    console.error(e);
    json(res,500,{error:e?.message||"Realtime call creation failed"});
  }
}
