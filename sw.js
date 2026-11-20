// 성경읽기 차트 + 낭독: 앱 화면을 오프라인에서도 열리게 보관하고, 매일 알림을 띄웁니다.
// (낭독 오디오는 앱의 "오프라인 오디오"에서 따로 저장)
const CACHE="bible-chart-audio-v2";
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin) return;   // jw.org·Firebase는 건드리지 않음
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); } return r; })
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("./index.html"))));
});

// ── 매일 알림 (앱이 열릴 때마다 다시 예약됨)
let alarmTimer=null;
function msUntil(hhmm){
  const [h,m]=String(hhmm||"08:00").split(":").map(Number), now=new Date();
  const next=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0,0);
  if(next<=now) next.setDate(next.getDate()+1);
  return next-now;
}
function schedule(hhmm){
  clearTimeout(alarmTimer);
  alarmTimer=setTimeout(()=>{
    self.registration.showNotification("오늘의 성경 읽기",{body:"오늘 읽을 말씀을 확인하고 낭독을 들어 보세요.",icon:"./icon-192.png",tag:"bible-daily"});
    schedule(hhmm);
  },msUntil(hhmm));
}
self.addEventListener("message",e=>{
  const d=e.data||{};
  if(d.type==="SCHEDULE_ALARM") schedule(d.alarmTime);
  if(d.type==="CANCEL_ALARM") clearTimeout(alarmTimer);
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{
    for(const c of cs){ if("focus" in c) return c.focus(); }
    return self.clients.openWindow("./");
  }));
});
