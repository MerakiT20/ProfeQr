// Supabase Edge Function: attendance-reminders
// Invoke with Authorization: Bearer <CRON_SECRET> and body {school_id, mode:"reminder"|"cutoff"}
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async req=>{
  try{
    if((req.headers.get('Authorization')||'')!==`Bearer ${Deno.env.get('CRON_SECRET')}`)throw new Error('UNAUTHORIZED');
    const input=await req.json(),db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!,Deno.env.get('VAPID_PUBLIC_KEY')!,Deno.env.get('VAPID_PRIVATE_KEY')!);
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const [{data:actors},{data:reports}]=await Promise.all([db.from('school_actor_keys').select('actor_id,actor_role,group_name').eq('school_id',input.school_id).eq('active',true),db.from('attendance_reports').select('group_name,present_count,absent_count,total_students').eq('school_id',input.school_id).eq('report_date',today)]);
    const done=new Set((reports||[]).map(r=>r.group_name)),teachers=(actors||[]).filter(a=>a.actor_role==='teacher'),pending=teachers.filter(t=>!done.has(t.group_name));
    let targets:any[]=[],title='',body='';
    if(input.mode==='reminder'){targets=pending;title='Asistencia pendiente';body='Aún no has enviado la asistencia de hoy.';}
    else {targets=(actors||[]).filter(a=>a.actor_role==='director');const present=(reports||[]).reduce((n,r)=>n+(r.present_count||0),0),total=(reports||[]).reduce((n,r)=>n+(r.total_students||0),0);title='Corte diario de asistencia';body=`${reports?.length||0}/6 grupos · ${present}/${total} presentes${pending.length?` · Pendientes: ${pending.map(x=>x.group_name).join(', ')}`:''}`;}
    const ids=targets.map(t=>t.actor_id),{data:subs}=ids.length?await db.from('push_subscriptions').select('*').eq('school_id',input.school_id).in('actor_id',ids).eq('active',true):{data:[]};
    const payload=JSON.stringify({title,body,url:'./'}),results=await Promise.allSettled((subs||[]).map(s=>webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},payload)));
    return new Response(JSON.stringify({date:today,mode:input.mode,pending:pending.map(x=>x.group_name),sent:results.filter(r=>r.status==='fulfilled').length}),{headers:{'Content-Type':'application/json'}});
  }catch(e){return new Response(JSON.stringify({error:String((e as Error).message||e)}),{status:403,headers:{'Content-Type':'application/json'}});}
});
