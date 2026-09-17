import {getOpenAI,json,tutorInstructions} from "../../lib/openai.js";

export default async function handler(req,res){
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});
  const client=getOpenAI();
  if(!client) return json(res,503,{error:"OPENAI_API_KEY is not configured"});

  try{
    // Vercel parses text/plain bodies into req.body. Accept string/buffer/object defensively.
    let sdp=req.body;
    if(Buffer.isBuffer(sdp)) sdp=sdp.toString("utf8");
    if(typeof sdp!=="string" && sdp && typeof sdp.text==="string") sdp=sdp.text;

    if(typeof sdp!=="string" || !sdp.trim()) {
      return json(res,400,{error:"SDP offer is required"});
    }

    const tutor=req.headers["x-rimbara-tutor"]||"Raka";
    const topic=req.headers["x-rimbara-topic"]||"Daily Conversation";
    const slow=req.headers["x-rimbara-slow"]==="1";
    const name=tutor==="Rara"?"Rara":"Raka";
    const instructions=tutorInstructions(name,topic)+` Tutor name is ${name}. ${slow?"Speak noticeably slower than normal and leave clear pauses.":"Use a comfortable natural speaking pace."} Use British English pronunciation and intonation.`;

    const call=await client.realtime.calls.create({
      sdp,
      session:{
        type:"realtime",
        model:process.env.OPENAI_REALTIME_MODEL||"gpt-realtime-2.1",
        instructions,
        output_modalities:["audio"],
        audio:{input:{transcription:{model:"gpt-live-transcribe",languages:["en"]}}}
      }
    });

    const answer=typeof call==="string"?call:(call?.data||call?.body||"");
    if(!answer) throw new Error("OpenAI did not return an SDP answer");
    res.status(200).setHeader("Content-Type","application/sdp");
    res.end(answer);
  }catch(e){
    console.error(e);
    json(res,500,{error:e?.message||"Realtime call creation failed"});
  }
}
