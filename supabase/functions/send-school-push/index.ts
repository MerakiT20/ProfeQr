// Supabase Edge Function: send-school-push
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-school-token'};
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!,Deno.env.get('VAPID_PUBLIC_KEY')!,Deno.env.get('VAPID_PRIVATE_KEY')!);
    const auth=req.headers.get('Authorization')||'',token=req.headers.get('x-school-token')||'';
    if(!auth||!token)throw new Error('UNAUTHORIZED');
    const input=await req.json();
    const db=createClient(url,service,{auth:{persistSession:false}});
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
    const tokenHash=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
    const {data:actor}=await db.from('school_actor_keys').select('actor_id,actor_role,school_id').eq('school_id',input.school_id).eq('token_hash',tokenHash).eq('active',true).maybeSingle();
    if(!actor||actor.actor_role!=='director')throw new Error('FORBIDDEN');
    let actorIds:string[]=[];
    if(input.audience_type==='teacher')actorIds=[input.audience_value];
    else if(input.audience_type==='group'){const {data}=await db.from('school_actor_keys').select('actor_id').eq('school_id',input.school_id).eq('group_name',input.audience_value).eq('active',true);actorIds=(data||[]).map(x=>x.actor_id);}
    else {const {data}=await db.from('school_actor_keys').select('actor_id').eq('school_id',input.school_id).eq('actor_role','teacher').eq('active',true);actorIds=(data||[]).map(x=>x.actor_id);}
    const {data:subs}=await db.from('push_subscriptions').select('*').eq('school_id',input.school_id).in('actor_id',actorIds).eq('active',true);
    const payload=JSON.stringify({title:input.title||'Aviso escolar',body:input.body||'',url:'./'});
    const results=await Promise.allSettled((subs||[]).map(async s=>{try{await webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},payload);}catch(e){if((e as any)?.statusCode===404||(e as any)?.statusCode===410)await db.from('push_subscriptions').update({active:false}).eq('id',s.id);throw e;}}));
    return new Response(JSON.stringify({sent:results.filter(r=>r.status==='fulfilled').length,failed:results.filter(r=>r.status==='rejected').length}),{headers:{...cors,'Content-Type':'application/json'}});
  }catch(e){return new Response(JSON.stringify({error:String((e as Error).message||e)}),{status:403,headers:{...cors,'Content-Type':'application/json'}});}
});
