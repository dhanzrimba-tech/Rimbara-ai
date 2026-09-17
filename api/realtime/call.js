import {json,tutorInstructions} from "../../lib/openai.js";

function multipartBody(fields,boundary){
  const chunks=[];
  for(const field of fields){
    chunks.push(Buffer.from(`--${boundary}\r\n`,'utf8'));
    chunks.push(Buffer.from(`Content-Disposition: form-data; name="${field.name}"\r\n`,'utf8'));
    if(field.contentType) chunks.push(Buffer.from(`Content-Type: ${field.contentType}\r\n`,'utf8'));
    chunks.push(Buffer.from('\r\n','utf8'));
    chunks.push(Buffer.isBuffer(field.value)?field.value:Buffer.from(String(field.value),'utf8'));
    chunks.push(Buffer.from('\r\n','utf8'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`,'utf8'));
  return Buffer.concat(chunks);
}

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});

  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey) return json(res,503,{error:"OPENAI_API_KEY is not configured"});

  try{
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

    // OpenAI's /v1/realtime/calls endpoint expects multipart/form-data with
    // an SDP text field (content type application/sdp) and an optional session
    // JSON field. Build the multipart payload explicitly so the SDP is a
    // normal form field, not a file upload with a filename.
    const boundary=`----RimbaraBoundary${Date.now()}${Math.random().toString(16).slice(2)}`;
    const body=multipartBody([
      {name:"sdp",contentType:"application/sdp",value:sdp},
      {name:"session",contentType:"application/json",value:JSON.stringify(session)}
    ],boundary);

    const response=await fetch("https://api.openai.com/v1/realtime/calls",{
      method:"POST",
      headers:{
        Authorization:`Bearer ${apiKey}`,
        Accept:"application/sdp",
        "Content-Type":`multipart/form-data; boundary=${boundary}`
      },
      body
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
