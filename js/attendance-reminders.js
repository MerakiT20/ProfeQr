/* In-app reminders for pending daily attendance report */
(function(){
  const META_KEY='profeqr_attendance_report_meta_v1';
  const NOTICE_KEY='profeqr_attendance_notice_v1';
  function todayIso(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'')||{};}catch(e){return {};}}
  function mark(key){const seen=read(NOTICE_KEY);seen[todayIso()+':'+key]=true;localStorage.setItem(NOTICE_KEY,JSON.stringify(seen));}
  function wasSeen(key){return !!read(NOTICE_KEY)[todayIso()+':'+key];}
  function isReported(){
    const date=todayIso();
    const meta=read(META_KEY)[date];
    if(!meta||!['sent','queued'].includes(meta.status))return false;
    if(window.ProfeQrAttendanceSync?.attendanceSignature&&meta.signature){
      return meta.signature===window.ProfeQrAttendanceSync.attendanceSignature(date);
    }
    return true;
  }
  function notify(key,message){
    if(wasSeen(key)||isReported())return;
    mark(key);
    if(typeof toast==='function')toast(message);
    if('Notification' in window&&Notification.permission==='granted'){
      try{new Notification('ProfeQR',{body:message,tag:'attendance-'+key});}catch(e){}
    }
  }
  function check(){
    const d=new Date();const min=d.getHours()*60+d.getMinutes();
    if(min>=15*60)notify('late','⚠ La asistencia de hoy sigue sin reportarse a Dirección.');
    else if(min>=14*60+40)notify('reminder','Asistencia pendiente: confirma el reporte de tu grupo.');
  }
  setTimeout(check,3000);setInterval(check,60000);
})();
