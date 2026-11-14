(function(){
"use strict";
var D=864e5;
function id(){return "x"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function iso(n){var d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
var DEFAULT_TPL="السلام عليكم أ. {الكاتب}،\nهذه روابط النشر الجديدة لكتاب «{الكتاب}»:\n\n{الروابط}\n\nمع التحية،\nفريق التسويق";
var S={authors:[],marketers:[],books:[],links:[],template:DEFAULT_TPL};
var FB=null, SAVED=null, ENTRY_URL=new URL("index.html",location.href).href;
var UI={tab:"today",open:{},showArch:false,showArchM:false,month:0};
var PLAT=[["instagram.com","إنستقرام"],["tiktok.com","تيك توك"],["x.com","إكس"],["twitter.com","إكس"],["snapchat.com","سناب شات"],["youtube.com","يوتيوب"],["youtu.be","يوتيوب"],["facebook.com","فيسبوك"],["threads.net","ثريدز"],["threads.com","ثريدز"]];
var PNAMES=PLAT.map(function(x){return x[1]}).filter(function(n,i,a){return a.indexOf(n)===i});
var STAGES=["تجهيز","جارية","إقفال","أرشيف"];

/* ---------- graphics ---------- */
var IC={
  today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  book:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.6a6 6 0 0 1 3.5 5.4"/>',
  pen:'<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  gear:'<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.5"/><circle cx="8" cy="17" r="2.5"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  money:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',
  trash:'<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  check:'<path d="M5 12l5 5 9-10"/>',
  warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  box:'<path d="M3 5h18v4H3zM5 9v10h14V9M10 13h4"/>',
  bell:'<path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21h4"/>',
  next:'<path d="M15 6l-6 6 6 6"/>',
  prev:'<path d="M9 6l6 6-6 6"/>',
  chart:'<path d="M4 20V11M10 20V4M16 20v-6M21 20H3"/>'
};
function ico(n){return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">'+IC[n]+'</svg>'}
function ring(n,t,big){
  var r=15, c=2*Math.PI*r, f=t?Math.min(1,n/t):0, cls=f>=1?"good":n?"wait":"bad";
  return '<svg class="ring '+cls+(big?" big":"")+'" viewBox="0 0 40 40" role="img" aria-label="'+n+' من '+t+'"><circle class="bg" cx="20" cy="20" r="'+r+'"/>'+
    '<circle class="fg" cx="20" cy="20" r="'+r+'" stroke-dasharray="'+(c*f).toFixed(1)+' '+c.toFixed(1)+'" transform="rotate(-90 20 20)"/>'+
    '<text x="20" y="24.5" text-anchor="middle">'+n+'/'+t+'</text></svg>';
}
function dots(st){return '<span class="dots" role="img" aria-label="المرحلة: '+STAGES[st]+'">'+STAGES.map(function(_,i){return '<i class="'+(i<st?"done":i===st?"cur":"")+'"></i>'}).join("")+'<b>'+STAGES[st]+'</b></span>'}
function stepper(st){
  return '<ol class="steps">'+STAGES.map(function(s,i){return '<li class="'+(i<st?"done":i===st?"cur":"")+'"><i>'+(i<st?ico("check"):"")+'</i><span>'+s+'</span></li>'}).join("")+'</ol>';
}

/* ---------- helpers ---------- */
function $(s){return document.getElementById(s)}
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function plat(u){try{var x=new URL(u);if(!/^https?:$/.test(x.protocol))return null;var h=x.hostname.replace(/^www\./,"");for(var i=0;i<PLAT.length;i++){if(h===PLAT[i][0]||h.endsWith("."+PLAT[i][0]))return PLAT[i][1]}}catch(e){}return null}
function norm(u){return u.trim().replace(/\/+$/,"").toLowerCase()}
function M(i){return S.marketers.find(function(x){return x.id===i})}
function B(i){return S.books.find(function(x){return x.id===i})}
function A(b){return S.authors.find(function(x){return x.id===b.authorId})||{id:"",name:"",phone:""}}
var dd=new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{day:"numeric",month:"short"});
function day(s){return s?dd.format(new Date(s+"T12:00:00")):"غير محدد"}
function money(n){return Number(n||0).toLocaleString("en-US")+" ريال"}
function pct(a,b){return b?Math.round(a/b*100)+"%":"—"}
function nLinks(n){return n===1?"رابط واحد":n===2?"رابطان":n+" روابط"}
function nPosts(n){return n===1?"منشور واحد":n===2?"منشوران":n+" منشورات"}
function clean(h){return String(h).trim().replace(/^@/,"").toLowerCase()}
function handleOf(u){
  try{var x=new URL(u), h=x.hostname.replace(/^www\./,""), seg=x.pathname.split("/").filter(Boolean);
    if(/tiktok\.com$/.test(h)){return seg[0]&&seg[0].charAt(0)==="@"?clean(seg[0]):null}
    if(/^(x|twitter)\.com$/.test(h)){return seg[0]&&["i","share","intent","home","search","hashtag"].indexOf(seg[0])<0?clean(seg[0]):null}
    if(/instagram\.com$/.test(h)){if(seg[0]==="stories"&&seg[1])return clean(seg[1]);return null}
  }catch(e){}
  return null;
}
function check(l){
  var m=M(l.m), p=plat(l.url);
  if(!p)return {c:"bad",t:"منصة غير معروفة"};
  if(!m)return null;
  var accs=(m.accounts||[]).filter(function(a){return a.p===p});
  if(!accs.length)return {c:"wait",t:"لا حساب له على "+p};
  var h=handleOf(l.url); if(!h)return null;
  return accs.some(function(a){return clean(a.h)===h})?{c:"good",t:"مطابق"}:{c:"bad",t:"حساب آخر: @"+h};
}
function wa(phone,text){
  var d=String(phone||"").replace(/\D/g,"");
  if(d.indexOf("05")===0)d="966"+d.slice(1); else if(d.length===9&&d.charAt(0)==="5")d="966"+d;
  return "https://wa.me/"+d+"?text="+encodeURIComponent(text);
}
function daysTo(s){if(!s)return null;var t=new Date();t.setHours(12,0,0,0);return Math.round((new Date(s+"T12:00:00").getTime()-t.getTime())/D)}
function left(b){return daysTo(b.end)}
function ended(b){var d=left(b);return d!==null&&d<0}
function endsIn(d){return d===0?"اليوم":d===1?"غدًا":d===2?"يومان":d+" أيام"}
function count(b,m,st){return S.links.filter(function(l){return (!b||l.b===b)&&(!m||l.m===m)&&(!st||l.status===st)}).length}
function behind(b){return b.mk.filter(function(i){var m=M(i);return m&&m.active&&count(b.id,i,"")<(b.target||1)})}
function pay(b,mid){if(!b.pay)b.pay={};return b.pay[mid]||(b.pay[mid]={amount:0,paid:false,paidAt:""})}
function stage(b){
  if(b.archived)return 3;
  if(ended(b))return 2;
  var s=daysTo(b.start);
  if(!b.authorId||!b.mk.length||(s!==null&&s>0))return 0;
  return 1;
}
function checks(b){
  return {links:!count(b.id,"","pending"),pay:b.mk.every(function(i){var p=pay(b,i);return !p.amount||p.paid})};
}
function nextStep(b){
  var st=stage(b), n=count(b.id,"","pending"), c;
  if(st===0)return !b.authorId?"اختاري الكاتب":!b.mk.length?"كلّفي المسوقين":"تبدأ "+day(b.start);
  if(st===1)return n?"أرسلي "+(n===1?"رابطًا واحدًا":n===2?"رابطين":n+" روابط")+" للكاتب":behind(b).length?"بانتظار "+behind(b).length+" من المسوقين":"اكتمل المطلوب";
  if(st===2){c=checks(b);return !c.links?"أرسلي الروابط الباقية":!c.pay?"حوّلي المستحقات":"اكتمل الإقفال"}
  return "";
}
function dues(){
  var out=[];
  S.books.forEach(function(b){b.mk.forEach(function(mid){
    var p=pay(b,mid); if(p.amount>0&&!p.paid&&(count(b.id,mid,"")>=(b.target||1)||ended(b)))out.push({b:b,m:M(mid),p:p});
  })});
  return out;
}
function record(m){
  var books=S.books.filter(function(b){return b.mk.indexOf(m.id)>-1}), got=0, need=0, ontime=0, all=0, owed=0, paid=0;
  books.forEach(function(b){var tg=b.target||1, p=pay(b,m.id);need+=tg;got+=Math.min(tg,count(b.id,m.id,""));if(p.paid)paid+=p.amount;else owed+=p.amount});
  S.links.forEach(function(l){if(l.m!==m.id)return;var b=B(l.b);if(!b||!b.end)return;all++;if(l.at<=new Date(b.end+"T23:59:59").getTime())ontime++});
  return {books:books,got:got,need:need,ontime:ontime,all:all,owed:owed,paid:paid};
}
function ibanClean(v){return String(v||"").replace(/\s+/g,"").toUpperCase()}
function ibanShow(v){return ibanClean(v).replace(/(.{4})/g,"$1 ").trim()}
function ibanOk(v){
  v=ibanClean(v); if(!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v))return false;
  if(v.indexOf("SA")===0&&v.length!==24)return false;
  var r=(v.slice(4)+v.slice(0,4)).replace(/[A-Z]/g,function(c){return c.charCodeAt(0)-55}), m=0;
  for(var i=0;i<r.length;i++)m=(m*10+ +r.charAt(i))%97;
  return m===1;
}
function ibanPill(v){return !ibanClean(v)?"":ibanOk(v)?'<span class="pill good">'+ico("check")+'صحيح</span>':'<span class="pill bad">'+ico("warn")+'راجعي الرقم</span>'}
var ALPHA="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function newCode(){var c,i;do{c="";for(i=0;i<6;i++)c+=ALPHA.charAt(Math.floor(Math.random()*ALPHA.length))}while(S.marketers.some(function(x){return x.code===c}));return c}
var toastT;
function toast(t){var el=$("toast");el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){el.hidden=true},3500)}
function copy(text,ok,el){
  var man=function(){if(el){el.focus();el.select();toast("حدّدت النص. انسخيه يدويًا.")}else toast("تعذّر النسخ: "+text)};
  try{navigator.clipboard.writeText(text).then(function(){toast(ok)},man)}catch(e){man()}
}
function det(key,sum,body,cls){
  return '<details class="'+(cls||"file")+'" data-key="'+key+'"'+(UI.open[key]?" open":"")+'><summary>'+sum+'</summary><div class="body">'+body+'</div></details>';
}
function ibtn(icon,label,act,attrs,cls){return '<button type="button" class="ib '+(cls||"")+'" data-act="'+act+'" '+(attrs||"")+' title="'+label+'" aria-label="'+label+'">'+ico(icon)+'</button>'}
function walink(href,label,text,icon){return '<a class="btn small wa" target="_blank" rel="noopener" href="'+esc(href)+'" title="'+label+'" aria-label="'+label+'">'+ico(icon||"chat")+(text||"")+'</a>'}

/* ---------- texts ---------- */
function message(b){
  var groups={}, order=[];
  S.links.filter(function(l){return l.b===b.id&&l.status==="pending"}).forEach(function(l){
    var p=plat(l.url)||"أخرى"; if(!groups[p]){groups[p]=[];order.push(p)} groups[p].push(l.url);
  });
  var body=order.map(function(p){return p+":\n"+groups[p].join("\n")}).join("\n\n");
  return S.template.replace("{الكاتب}",A(b).name).replace("{الكتاب}",b.title).replace("{الروابط}",body);
}
function remind(b,m){
  return "أهلًا "+m.name+"،\nتذكير بنشر كتاب «"+b.title+"». المطلوب "+nPosts(b.target||1)+" ووصلنا "+count(b.id,m.id,"")+"."+(b.end?"\nتنتهي الحملة "+day(b.end)+".":"")+"\nشكرًا لك.";
}

/* ---------- manager ---------- */
var TABS=[["today","اليوم","today"],["books","الكتب","book"],["marketers","المسوقون","users"],["authors","الكتّاب","pen"],["reports","تقاريري","chart"],["settings","الإعدادات","gear"]];
function render(){
  S.books.forEach(function(b){
    if(b.archived||b.autoDone||stage(b)!==2)return;
    var c=checks(b); if(c.links&&c.pay){b.archived=true;b.autoDone=true;toast("اكتمل إقفال «"+b.title+"» ونُقل للأرشيف.")}
  });
  var n=S.books.filter(function(b){return count(b.id,"","pending")}).length+dues().length;
  $("tabs").innerHTML=TABS.map(function(t){
    return '<button type="button" data-tab="'+t[0]+'" id="tab-'+t[0]+'" class="'+(UI.tab===t[0]?"on":"")+'">'+ico(t[2])+'<span>'+t[1]+'</span>'+(t[0]==="today"&&n?'<b class="badge">'+n+'</b>':'')+'</button>';
  }).join("");
  $("panel").innerHTML=({today:pToday,marketers:pMarketers,books:pBooks,authors:pAuthors,reports:pReports,settings:pSettings})[UI.tab]();
  applyTheme();
  persist();
}

/* ---------- saving to Firestore: write only what changed ---------- */
function wantedCodes(){
  var out={};
  S.marketers.forEach(function(m){
    var bs=S.books.filter(function(b){return !b.archived&&b.mk.indexOf(m.id)>-1});
    out[m.code]={m:m.id,name:m.name,active:!!(m.active&&!m.archived),bookIds:bs.map(function(b){return b.id}),
      books:bs.map(function(b){return {id:b.id,title:b.title,start:b.start||"",end:b.end||""}})};
  });
  return out;
}
// JSON بترتيب ثابت للمفاتيح، لأن Firestore لا يحفظ ترتيب الحقول
function stab(v){
  if(Array.isArray(v))return "["+v.map(stab).join(",")+"]";
  if(v&&typeof v==="object")return "{"+Object.keys(v).sort().map(function(k){return JSON.stringify(k)+":"+stab(v[k])}).join(",")+"}";
  return JSON.stringify(v===undefined?null:v);
}
function baseline(codes){
  SAVED={authors:{},marketers:{},books:{},codes:{},links:{},template:S.template};
  ["authors","marketers","books"].forEach(function(c){S[c].forEach(function(o){SAVED[c][o.id]=stab(o)})});
  Object.keys(codes||{}).forEach(function(k){SAVED.codes[k]=stab(codes[k])});
  S.links.forEach(function(l){SAVED.links[l.id]=l.status});
}
// الحفظ: لا يُعتبر التعديل محفوظًا إلا بعد ما يؤكده Firebase. إذا فشل يُعاد المحاولة تلقائيًا.
var saving=false, again=false, retryT=null;
function persist(){
  if(!FB||!SAVED)return;
  if(saving){again=true;return}
  var ops=[], done=[];
  function diff(c,now){
    Object.keys(now).forEach(function(k){var j=stab(now[k]);if(SAVED[c][k]!==j){ops.push({t:"set",c:c,id:k,data:JSON.parse(JSON.stringify(now[k]))});done.push(function(){SAVED[c][k]=j})}});
    Object.keys(SAVED[c]).forEach(function(k){if(!(k in now)){ops.push({t:"del",c:c,id:k});done.push(function(){delete SAVED[c][k]})}});
  }
  ["authors","marketers","books"].forEach(function(c){var now={};S[c].forEach(function(o){now[o.id]=o});diff(c,now)});
  diff("codes",wantedCodes());
  var live={};
  S.links.forEach(function(l){live[l.id]=1;if(l.id in SAVED.links&&SAVED.links[l.id]!==l.status){var st=l.status;ops.push({t:"upd",c:"links",id:l.id,data:{status:st}});done.push(function(){SAVED.links[l.id]=st})}});
  Object.keys(SAVED.links).forEach(function(k){if(!live[k]){ops.push({t:"del",c:"links",id:k});done.push(function(){delete SAVED.links[k]})}});
  if(SAVED.template!==S.template){var tp=S.template;ops.push({t:"set",c:"settings",id:"main",data:{template:tp}});done.push(function(){SAVED.template=tp})}
  if(!ops.length)return;
  var mine=SAVED;
  saving=true;clearTimeout(retryT);
  FB.commit(ops).then(function(){
    if(SAVED===mine)done.forEach(function(f){f()});
    saving=false;
    if(again){again=false;persist()}
  },function(){
    saving=false;again=false;
    if(SAVED!==mine)return;
    toast("تعذّر الحفظ. ستُعاد المحاولة تلقائيًا، لا تغلقي الصفحة.");
    retryT=setTimeout(persist,5000);
  });
}
function unsaved(){
  if(!FB||!SAVED)return false;
  if(saving||again)return true;
  var s=SAVED, d=false;
  ["authors","marketers","books"].forEach(function(c){var ids={};S[c].forEach(function(o){ids[o.id]=1;if(s[c][o.id]!==stab(o))d=true});Object.keys(s[c]).forEach(function(k){if(!ids[k])d=true})});
  S.links.forEach(function(l){if(l.id in s.links&&s.links[l.id]!==l.status)d=true});
  return d||s.template!==S.template;
}
window.addEventListener("beforeunload",function(e){if(unsaved()){e.preventDefault();e.returnValue=""}});
function pToday(){
  var nb=S.books.filter(function(b){return count(b.id,"","pending")}), du=dues();
  var soon=S.books.filter(function(b){var d=left(b);return stage(b)===1&&d!==null&&d<=5}), closing=S.books.filter(function(b){return stage(b)===2});
  var tot=du.reduce(function(a,x){return a+x.p.amount},0);
  var h='<div class="tiles">'+
    '<div class="tile wait">'+ico("link")+'<b>'+count("","","pending")+'</b><span>روابط جديدة</span></div>'+
    '<div class="tile">'+ico("money")+'<b>'+tot.toLocaleString("en-US")+'</b><span>ريال للتحويل</span></div>'+
    '<div class="tile">'+ico("clock")+'<b>'+(soon.length+closing.length)+'</b><span>حملات تنتهي</span></div></div>';
  var td=new Date(), dim=new Date(td.getFullYear(),td.getMonth()+1,0).getDate(), mEnd=dim-td.getDate()<=2, mStart=td.getDate()<=3;
  if(soon.length||closing.length||mEnd||mStart)h+='<div class="chips">'+
    (mEnd||mStart?'<button type="button" class="chip" data-act="month-open" data-d="'+(mStart?-1:0)+'">'+ico("chart")+'ملخص الشهر<b>جاهز</b></button>':'')+soon.map(function(b){
      return '<button type="button" class="chip wait" data-act="file" data-id="'+b.id+'">'+ico("clock")+esc(b.title)+'<b>'+endsIn(left(b))+'</b></button>';
    }).join("")+closing.map(function(b){
      return '<button type="button" class="chip" data-act="file" data-id="'+b.id+'">'+ico("box")+esc(b.title)+'<b>إقفال</b></button>';
    }).join("")+'</div>';
  if(nb.length)h+='<section class="sec"><h2>'+ico("link")+'روابط جديدة</h2><div class="rows">'+nb.map(function(b){
    var odd=S.links.filter(function(l){var c;return l.b===b.id&&l.status==="pending"&&(c=check(l))&&c.c!=="good"}).length;
    return '<button type="button" class="row go" data-act="file" data-id="'+b.id+'"><span class="meta"><strong>'+esc(b.title)+'</strong>'+
      (odd?'<span class="pill bad">'+ico("warn")+odd+'</span>':'')+'</span><span class="num">'+count(b.id,"","pending")+'</span>'+ico("next")+'</button>';
  }).join("")+'</div></section>';
  if(du.length)h+='<section class="sec"><h2>'+ico("money")+'مستحقات</h2><div class="rows">'+du.map(function(x){
    return '<div class="row"><span class="meta"><strong>'+esc(x.m.name)+'</strong><small>'+esc(x.b.title)+'</small></span><span class="num">'+x.p.amount.toLocaleString("en-US")+'</span>'+
      '<span class="acts">'+(x.m.iban?ibtn("copy","نسخ الآيبان","copy-iban",'data-id="'+x.m.id+'"'):'<span class="pill bad" title="لا يوجد آيبان">'+ico("warn")+'آيبان</span>')+
      ibtn("check","تم التحويل","paid",'data-id="'+x.b.id+'" data-m="'+x.m.id+'"',"primary")+'</span></div>';
  }).join("")+'</div></section>';
  if(!S.books.length)h+='<section class="sec card"><h2>البداية</h2><ol class="guide">'+
    [[S.marketers.length,"users","أضيفي المسوقين","marketers"],[S.authors.length,"pen","أضيفي كاتبًا","authors"],[0,"book","أضيفي كتابًا وكلّفي مسوقيه","books"]].map(function(g){
      return '<li><span class="dot '+(g[0]?"good":"wait")+'"></span><button type="button" class="small" data-act="goto" data-tab="'+g[3]+'">'+ico(g[1])+g[2]+'</button></li>';
    }).join("")+'</ol></section>';
  else if(!nb.length&&!du.length&&!soon.length&&!closing.length)h+='<p class="empty">'+ico("check")+'لا يوجد شيء يحتاجك الآن.</p>';
  return h;
}
function isDup(l){var k=norm(l.url);return S.links.some(function(o){return o.id!==l.id&&norm(o.url)===k&&(o.at<l.at||(o.at===l.at&&o.id<l.id))})}
function linkLine(l){
  var ck=isDup(l)?{c:"bad",t:"مكرر"}:check(l), nw=l.status==="pending";
  return '<div class="lk'+(nw?" new":"")+'"><span class="dot '+(nw?"wait":"good")+'" title="'+(nw?"جديد":"أُرسل")+'"></span><span class="pill plain">'+(plat(l.url)||"أخرى")+'</span>'+
    (ck&&ck.c!=="good"?'<span class="pill '+ck.c+'">'+ico("warn")+esc(ck.t)+'</span>':'')+
    '<a class="ltr" href="'+esc(l.url)+'" target="_blank" rel="noopener">'+esc(l.url)+'</a>'+ibtn("trash","حذف الرابط","del",'data-id="'+l.id+'"',"danger")+'</div>';
}
function mBlocks(b,withLinks){
  var tg=b.target||1;
  return '<div class="assign">'+b.mk.map(function(i){
    var m=M(i), n=count(b.id,i,""), done=n>=tg, p=pay(b,i);
    var ls=withLinks?S.links.filter(function(l){return l.b===b.id&&l.m===i}).sort(function(a,c){return (a.status==="pending"?0:1)-(c.status==="pending"?0:1)||c.at-a.at}):[];
    return '<div class="mblock"><div class="arow"><span class="who">'+ring(n,tg)+'<strong>'+esc(m.name)+'</strong>'+
      (!done&&m.active&&m.phone&&stage(b)===1?walink(wa(m.phone,remind(b,m)),"تذكير بالواتساب","تذكير","bell"):'')+'</span>'+
      '<span class="money"><input type="number" min="0" step="10" id="amt-'+b.id+'-'+i+'" data-amt="'+b.id+'" data-m="'+i+'" value="'+(p.amount||"")+'" placeholder="0" aria-label="المبلغ بالريال"><span>ريال</span>'+
      '<label class="chk" for="pd-'+b.id+'-'+i+'"><input type="checkbox" id="pd-'+b.id+'-'+i+'" data-paid="'+b.id+'" data-m="'+i+'"'+(p.paid?" checked":"")+'>حُوّل</label>'+
      (count(b.id,i,"")?'':ibtn("trash","إزالة من الحملة","unassign",'data-id="'+b.id+'" data-m="'+i+'"',"danger"))+'</span></div>'+
      ls.map(linkLine).join("")+'</div>';
  }).join("")+'</div>';
}
function assignAdd(b){
  var free=S.marketers.filter(function(m){return m.active&&!m.archived&&b.mk.indexOf(m.id)<0});
  return free.length?'<div class="inline"><select id="asel-'+b.id+'" aria-label="مسوق">'+free.map(function(m){return '<option value="'+m.id+'">'+esc(m.name)+'</option>'}).join("")+'</select>'+
    '<button type="button" class="small" data-act="assign" data-id="'+b.id+'">'+ico("plus")+'تكليف</button></div>':'';
}
function sendBox(b){
  var a=A(b);
  if(!count(b.id,"","pending"))return '<h4>رسالة الكاتب</h4><p class="hint">لا روابط جديدة للإرسال.</p>';
  return '<h4>رسالة الكاتب</h4><section class="send"><textarea id="send-'+b.id+'" readonly aria-label="رسالة الكاتب">'+esc(message(b))+'</textarea>'+
    '<div class="acts"><button type="button" class="small" data-act="copy-msg" data-id="'+b.id+'">'+ico("copy")+'نسخ</button>'+
    (a.phone?walink(wa(a.phone,message(b)),"واتساب الكاتب","واتساب"):'')+
    '<button type="button" class="small primary" data-act="mark" data-id="'+b.id+'">'+ico("check")+'تم الإرسال</button></div></section>';
}
function dataForm(b){
  return '<div class="bar">'+
    '<div><label for="bt-'+b.id+'">العنوان</label><input id="bt-'+b.id+'" data-bf="title" data-bid="'+b.id+'" value="'+esc(b.title)+'"></div>'+
    '<div><label for="ba-'+b.id+'">الكاتب</label><select id="ba-'+b.id+'" data-bf="authorId" data-bid="'+b.id+'"><option value="">اختاري</option>'+
      S.authors.map(function(a){return '<option value="'+a.id+'"'+(a.id===b.authorId?" selected":"")+'>'+esc(a.name)+'</option>'}).join("")+'</select></div>'+
    '<div><label for="bs-'+b.id+'">البداية</label><input type="date" id="bs-'+b.id+'" data-bf="start" data-bid="'+b.id+'" value="'+esc(b.start||"")+'"></div>'+
    '<div><label for="be-'+b.id+'">النهاية</label><input type="date" id="be-'+b.id+'" data-bf="end" data-bid="'+b.id+'" value="'+esc(b.end||"")+'"></div>'+
    '<div><label for="tg-'+b.id+'">منشورات لكل مسوق</label><input type="number" min="1" max="50" id="tg-'+b.id+'" data-target="'+b.id+'" value="'+(b.target||1)+'"></div></div>';
}
function pBooks(){
  var list=S.books.filter(function(b){return !b.archived||UI.showArch}).sort(function(a,b){return stage(a)===stage(b)?0:[1,0,2,3][stage(a)]-[1,0,2,3][stage(b)]});
  var arch=S.books.filter(function(b){return b.archived}).length;
  var h='<div class="files">'+list.map(function(b){
    var st=stage(b), d=left(b), pend=count(b.id,"","pending"), c=checks(b), ns=nextStep(b);
    var sum='<span class="s-name">'+esc(b.title)+'<small>'+esc(A(b).name)+'</small></span><span class="s-meta">'+
      (pend?'<span class="pill wait">'+ico("link")+pend+'</span>':'')+
      (st===1&&d!==null?'<span class="pill '+(d<=5?"wait":"plain")+'">'+ico("clock")+endsIn(d)+'</span>':'')+dots(st)+'</span>';
    var body=stepper(st)+(ns?'<p class="nextstep">'+ico("next")+esc(ns)+'</p>':'');
    if(st===0){
      body+=dataForm(b)+(b.mk.length?mBlocks(b,false):'')+assignAdd(b);
    }else{
      if(st>=2)body+='<div class="closing">'+[["links","الروابط أُرسلت"],["pay","المستحقات حُوّلت"]].map(function(k){
        return '<span class="'+(c[k[0]]?"ok":"")+'"><i>'+(c[k[0]]?ico("check"):"")+'</i>'+k[1]+'</span>';
      }).join("")+'</div>';
      body+=mBlocks(b,true)+(st===1?assignAdd(b):'')+sendBox(b);
      body+=det("ed"+b.id,"بيانات الحملة",dataForm(b),"sub");
    }
    body+='<div class="acts end"><button type="button" class="small" data-act="report" data-id="'+b.id+'">'+ico("chart")+'تقريري</button>'+
      '<button type="button" class="small" data-act="dup" data-id="'+b.id+'">'+ico("copy")+'تكرار</button>'+
      '<button type="button" class="small" data-act="arch" data-id="'+b.id+'">'+ico("box")+(b.archived?"استرجاع":"أرشفة")+'</button></div>';
    return det(b.id,sum,body);
  }).join("")+'</div>';
  h+='<div class="foot">'+det("add-b",ico("plus")+"كتاب جديد",'<form id="add-book"><div class="bar">'+
    '<div><label for="ab-title">العنوان</label><input id="ab-title" required></div>'+
    '<div><label for="ab-author">الكاتب</label><select id="ab-author"><option value="">كاتب جديد</option>'+S.authors.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>'}).join("")+'</select></div>'+
    '<div><label for="ab-new">اسم الكاتب الجديد</label><input id="ab-new"></div>'+
    '<div><button type="submit" class="small primary" id="ab-save">إضافة</button></div></div></form>',"sub tool")+
    (arch?'<button type="button" class="small" data-act="show-arch">'+ico("box")+(UI.showArch?"إخفاء الأرشيف":"الأرشيف "+arch)+'</button>':'')+'</div>';
  return h;
}
function pMarketers(){
  var list=S.marketers.filter(function(m){return !m.archived||UI.showArchM})
    .sort(function(a,b){return ((a.archived?1:0)-(b.archived?1:0))||(b.active-a.active)||(count("",b.id,"")-count("",a.id,""))});
  var archM=S.marketers.filter(function(m){return m.archived}).length;
  var h='<div class="files">'+list.map(function(m){
    var r=record(m);
    var sum='<span class="s-name">'+esc(m.name)+'</span><span class="s-meta">'+(m.archived?'<span class="pill plain">'+ico("box")+'مؤرشف</span>':m.active?'':'<span class="pill bad">موقوف</span>')+
      (r.owed?'<span class="pill plain">'+ico("money")+r.owed.toLocaleString("en-US")+'</span>':'')+ring(r.got,r.need)+'</span>';
    var codeMsg="أهلًا "+m.name+"،\nرمزك لإرسال روابط النشر: "+m.code+"\nرابط الصفحة: "+ENTRY_URL;
    var body='<div class="facts"><span><b class="ltr">'+esc(m.phone||"بدون جوال")+'</b></span><span>الرمز <b class="code">'+m.code+'</b></span>'+
      '<span>في الموعد <b>'+pct(r.ontime,r.all)+'</b></span><span>حُوّل له <b>'+money(r.paid)+'</b></span></div>'+
      '<div class="accs">'+m.accounts.map(function(a,i){
        return '<span class="acc"><span class="pill plain">'+esc(a.p)+'</span><span class="ltr">'+esc(a.h)+'</span>'+ibtn("trash","حذف الحساب","acc-del",'data-id="'+m.id+'" data-i="'+i+'"',"danger")+'</span>';
      }).join("")+'</div>'+
      '<div class="inline"><select id="acp-'+m.id+'" aria-label="المنصة">'+PNAMES.map(function(n){return '<option>'+n+'</option>'}).join("")+'</select>'+
      '<input id="ach-'+m.id+'" class="ltr" placeholder="@الحساب" aria-label="اسم الحساب"><button type="button" class="small" data-act="acc-add" data-id="'+m.id+'">'+ico("plus")+'حساب</button></div>'+
      (r.books.length?'<div class="rec">'+r.books.map(function(b){
        return '<span class="recrow">'+ring(count(b.id,m.id,""),b.target||1)+esc(b.title)+'</span>';
      }).join("")+'</div>':'')+
      det("k"+m.id,"العنوان والآيبان",
        '<div class="field"><label for="addr-'+m.id+'">العنوان</label><input id="addr-'+m.id+'" data-fld="address" data-mid="'+m.id+'" value="'+esc(m.address||"")+'"></div>'+
        '<div class="field"><label for="iban-'+m.id+'">الآيبان</label><div class="inline"><input id="iban-'+m.id+'" class="ltr code" style="letter-spacing:.04em" data-fld="iban" data-mid="'+m.id+'" value="'+esc(ibanShow(m.iban))+'" placeholder="SA00 0000 0000 0000 0000 0000" autocomplete="off">'+
        ibtn("copy","نسخ الآيبان","copy-iban",'data-id="'+m.id+'"')+'</div><span id="ibst-'+m.id+'">'+ibanPill(m.iban)+'</span></div>',"sub")+
      det("n"+m.id,"ملاحظاتي",'<textarea id="note-'+m.id+'" data-note="'+m.id+'" aria-label="ملاحظاتي">'+esc(m.notes)+'</textarea>',"sub")+
      '<div class="acts end">'+(m.archived?'':'<button type="button" class="small" data-act="toggle" data-id="'+m.id+'">'+(m.active?"إيقاف":"تفعيل")+'</button>')+
      '<button type="button" class="small" data-act="m-arch" data-id="'+m.id+'">'+ico("box")+(m.archived?"استرجاع":"أرشفة")+'</button>'+
      '<button type="button" class="small" data-act="recode" data-id="'+m.id+'">رمز جديد</button>'+
      (m.phone?walink(wa(m.phone,codeMsg),"إرسال الرمز بالواتساب","الرمز"):'')+'</div>';
    return det(m.id,sum,body);
  }).join("")+'</div>';
  h+='<div class="foot">'+det("add-m",ico("plus")+"مسوقون جدد",'<form id="bulk-marketers">'+
    '<label for="bm-text">سطر لكل مسوق: الاسم، الجوال</label>'+
    '<textarea id="bm-text" placeholder="سارة الدوسري، 0500000021"></textarea>'+
    '<div class="acts"><button type="submit" class="small primary" id="bm-save">إضافة</button></div></form>',"sub tool")+
    (archM?'<button type="button" class="small" data-act="show-arch-m">'+ico("box")+(UI.showArchM?"إخفاء الأرشيف":"الأرشيف "+archM)+'</button>':'')+'</div>';
  return h;
}
function pAuthors(){
  var h='<div class="files">'+S.authors.map(function(a){
    var bs=S.books.filter(function(b){return b.authorId===a.id});
    var sum='<span class="s-name">'+esc(a.name)+'</span><span class="s-meta"><span class="pill plain">'+ico("book")+bs.length+'</span></span>';
    var body='<div class="bar"><div><label for="an-'+a.id+'">الاسم</label><input id="an-'+a.id+'" data-af="name" data-aid="'+a.id+'" value="'+esc(a.name)+'"></div>'+
      '<div><label for="ap-'+a.id+'">الجوال</label><input id="ap-'+a.id+'" class="ltr" inputmode="tel" data-af="phone" data-aid="'+a.id+'" value="'+esc(a.phone||"")+'"></div></div>'+
      '<div class="inline"><input id="nb-'+a.id+'" placeholder="عنوان كتاب جديد" aria-label="عنوان كتاب جديد"><button type="button" class="small" data-act="a-book" data-id="'+a.id+'">'+ico("plus")+'كتاب</button></div>'+
      (bs.length?'<div class="rec">'+bs.map(function(b){return '<button type="button" class="recrow link" data-act="file" data-id="'+b.id+'">'+esc(b.title)+dots(stage(b))+'</button>'}).join("")+'</div>'
        :'<div class="acts end"><button type="button" class="small danger" data-act="a-del" data-id="'+a.id+'">'+ico("trash")+'حذف</button></div>');
    return det(a.id,sum,body);
  }).join("")+'</div>';
  h+='<div class="foot">'+det("add-a",ico("plus")+"كاتب جديد",'<form id="add-author"><div class="bar">'+
    '<div><label for="aa-name">الاسم</label><input id="aa-name" required></div>'+
    '<div><label for="aa-phone">الجوال</label><input id="aa-phone" class="ltr" inputmode="tel"></div>'+
    '<div><button type="submit" class="small primary" id="aa-save">إضافة</button></div></div></form>',"sub tool")+'</div>';
  return h;
}
var mf=new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{month:"long",year:"numeric"});
function monthData(off){
  var t=new Date(), a=new Date(t.getFullYear(),t.getMonth()+off,1), z=new Date(t.getFullYear(),t.getMonth()+off+1,1);
  var a0=a.getTime(), z0=z.getTime(), ym=a.getFullYear()+"-"+("0"+(a.getMonth()+1)).slice(-2);
  var ls=S.links.filter(function(l){return l.at>=a0&&l.at<z0}), byM={}, byP={};
  ls.forEach(function(l){byM[l.m]=(byM[l.m]||0)+1;var p=plat(l.url)||"أخرى";byP[p]=(byP[p]||0)+1});
  var camps=S.books.filter(function(b){return b.start&&b.end&&new Date(b.start+"T00:00:00").getTime()<z0&&new Date(b.end+"T23:59:59").getTime()>=a0});
  var paid=0, owed=0;
  S.books.forEach(function(b){b.mk.forEach(function(i){var p=pay(b,i);if(p.paid){if((p.paidAt||"").slice(0,7)===ym)paid+=p.amount}else owed+=p.amount})});
  return {label:mf.format(a),links:ls.length,
    byM:Object.keys(byM).map(function(k){return [M(k).name,byM[k]]}).sort(function(x,y){return y[1]-x[1]}),
    byP:Object.keys(byP).map(function(k){return [k,byP[k]]}).sort(function(x,y){return y[1]-x[1]}),
    camps:camps.length,endedN:camps.filter(function(b){return b.end.slice(0,7)===ym&&ended(b)}).length,paid:paid,owed:owed};
}
function monthText(d){
  return "ملخص "+d.label+"\n\nالمنشورات: "+d.links+"\nالحملات: "+d.camps+" (انتهى منها "+d.endedN+")\nحُوّل هذا الشهر: "+money(d.paid)+"\nمستحقات باقية: "+money(d.owed)+
    "\n\nحسب المسوق:\n"+(d.byM.length?d.byM.map(function(x){return "- "+x[0]+": "+x[1]}).join("\n"):"- لا يوجد")+
    "\n\nحسب المنصة:\n"+(d.byP.length?d.byP.map(function(x){return "- "+x[0]+": "+x[1]}).join("\n"):"- لا يوجد");
}
function bars(list){
  if(!list.length)return '<p class="hint">لا يوجد.</p>';
  var mx=list[0][1]||1;
  return '<div class="bars">'+list.map(function(x){return '<span>'+esc(x[0])+'</span><i><u style="width:'+Math.round(x[1]/mx*100)+'%"></u></i><b>'+x[1]+'</b>'}).join("")+'</div>';
}
function report(b){
  var ls=S.links.filter(function(l){return l.b===b.id}), byP={}, pOrder=[], tg=b.target||1, tot=0, pd=0;
  ls.forEach(function(l){var p=plat(l.url)||"أخرى";if(!byP[p]){byP[p]=0;pOrder.push(p)}byP[p]++});
  b.mk.forEach(function(i){var p=pay(b,i);tot+=p.amount;if(p.paid)pd+=p.amount});
  return "تقرير حملة «"+b.title+"»\nالكاتب: "+(A(b).name||"غير محدد")+"\nالفترة: "+day(b.start)+" إلى "+day(b.end)+"\nالمرحلة: "+STAGES[stage(b)]+
    "\n\nإجمالي المنشورات: "+ls.length+"\nالمستحقات: "+money(tot)+" (حُوّل "+money(pd)+")"+
    "\n\nحسب المنصة:\n"+(pOrder.length?pOrder.map(function(p){return "- "+p+": "+byP[p]}).join("\n"):"- لا يوجد")+
    "\n\nحسب المسوق:\n"+(b.mk.length?b.mk.map(function(i){var p=pay(b,i);return "- "+M(i).name+": "+count(b.id,i,"")+" من "+tg+"، "+money(p.amount)+(p.paid?" (حُوّل)":"")}).join("\n"):"- لا يوجد")+
    "\n\nالروابط:\n"+(ls.length?ls.map(function(l){return l.url}).join("\n"):"لا يوجد");
}
function pReports(){
  var d=monthData(UI.month);
  var h='<section class="sec"><div class="monthnav">'+ibtn("prev","الشهر السابق","month",'data-d="-1"')+'<h2>'+ico("chart")+'ملخص '+esc(d.label)+'</h2>'+
    (UI.month<0?ibtn("next","الشهر التالي","month",'data-d="1"'):'<span class="ib ghost"></span>')+'</div>'+
    '<div class="tiles four"><div class="tile">'+ico("link")+'<b>'+d.links+'</b><span>منشور</span></div>'+
    '<div class="tile">'+ico("book")+'<b>'+d.camps+'</b><span>حملة</span></div>'+
    '<div class="tile">'+ico("check")+'<b>'+d.paid.toLocaleString("en-US")+'</b><span>ريال حُوّل</span></div>'+
    '<div class="tile wait">'+ico("money")+'<b>'+d.owed.toLocaleString("en-US")+'</b><span>ريال باقٍ</span></div></div>'+
    '<div class="two"><div><h4>المسوقون</h4>'+bars(d.byM)+'</div><div><h4>المنصات</h4>'+bars(d.byP)+'</div></div>'+
    '<div class="acts end"><button type="button" class="small" data-act="copy-month">'+ico("copy")+'نسخ الملخص</button></div></section>';
  h+='<section class="sec"><h2>'+ico("book")+'تقارير الحملات</h2><div class="files">'+S.books.map(function(b){
    var sum='<span class="s-name">'+esc(b.title)+'<small>'+esc(A(b).name)+'</small></span><span class="s-meta"><span class="pill plain">'+ico("link")+count(b.id,"","")+'</span>'+dots(stage(b))+'</span>';
    return det("rp"+b.id,sum,'<textarea id="rp-'+b.id+'" readonly style="min-height:170px;margin-top:10px" aria-label="تقرير الحملة">'+esc(report(b))+'</textarea>'+
      '<div class="acts end"><button type="button" class="small" data-act="copy-report" data-id="'+b.id+'">'+ico("copy")+'نسخ</button></div>');
  }).join("")+'</div></section>';
  return h;
}
function pSettings(){
  return '<section class="sec"><h2>رابط صفحة المسوقين</h2><div class="inline" style="margin:0"><input id="entry-url" class="ltr" readonly value="'+esc(ENTRY_URL)+'" aria-label="رابط صفحة المسوقين">'+ibtn("copy","نسخ الرابط","copy-entry")+'</div></section>'+
  '<section class="sec"><h2>المظهر</h2><div class="acts" style="align-items:center">'+
    '<div class="swatches" id="swatches" role="group" aria-label="لون الواجهة">'+
    [["teal","#0f6b63","زمردي"],["navy","#2a4f92","كحلي"],["maroon","#8c2f45","عنّابي"],["plum","#6a3f8a","بنفسجي"]].map(function(c){
      return '<button type="button" class="sw" data-act="color" data-color="'+c[0]+'" style="background:'+c[1]+'" title="'+c[2]+'" aria-label="'+c[2]+'"></button>';
    }).join("")+'</div><button type="button" class="small" data-act="mode" id="mode-btn">الوضع الداكن</button></div></section>'+
  '<section class="sec"><h2>رسالة الكاتب</h2><textarea id="tpl" style="min-height:150px" aria-label="قالب رسالة الكاتب">'+esc(S.template)+'</textarea></section>'+
  '<section class="sec"><h2>نسخة احتياطية</h2><div class="acts"><button type="button" class="small primary" data-act="backup" id="bk-btn">تنزيل</button></div></section>'+
  '<section class="sec"><h2>الحساب</h2><div class="acts"><button type="button" class="small" data-act="signout">تسجيل الخروج</button></div></section>';
}

/* ---------- manager events ---------- */
$("tabs").addEventListener("click",function(e){var t=e.target.closest("[data-tab]");if(t){UI.tab=t.dataset.tab;render()}});
$("panel").addEventListener("toggle",function(e){var k=e.target.dataset&&e.target.dataset.key;if(k)UI.open[k]=e.target.open},true);
$("panel").addEventListener("change",function(e){
  var t=e.target, ds=t.dataset;
  if(ds.note){M(ds.note).notes=t.value}
  else if(ds.fld==="address"){M(ds.mid).address=t.value.trim()}
  else if(ds.fld==="iban"){var mm=M(ds.mid);mm.iban=ibanClean(t.value);t.value=ibanShow(mm.iban);$("ibst-"+mm.id).innerHTML=ibanPill(mm.iban)}
  else if(ds.bf){B(ds.bid)[ds.bf]=t.value.trim();render()}
  else if(ds.af){S.authors.find(function(a){return a.id===ds.aid})[ds.af]=t.value.trim();render()}
  else if(ds.target){B(ds.target).target=Math.max(1,parseInt(t.value,10)||1);render()}
  else if(ds.amt){pay(B(ds.amt),ds.m).amount=Math.max(0,parseFloat(t.value)||0);render()}
  else if(ds.paid){var p=pay(B(ds.paid),ds.m);p.paid=t.checked;p.paidAt=t.checked?iso(0):"";render()}
  else if(t.id==="tpl"){S.template=t.value}
});
$("panel").addEventListener("click",function(e){
  var t=e.target.closest("[data-act]"); if(!t)return;
  var a=t.dataset.act, i=t.dataset.id;
  if(a==="del"){S.links=S.links.filter(function(l){return l.id!==i});render()}
  else if(a==="toggle"){var m=M(i);m.active=!m.active;render()}
  else if(a==="m-arch"){var am=M(i);am.archived=!am.archived;if(am.archived)am.active=false;toast(am.archived?"نُقل للأرشيف وأُوقف رمزه.":"رجع من الأرشيف. فعّليه ليشتغل رمزه.");render()}
  else if(a==="show-arch-m"){UI.showArchM=!UI.showArchM;render()}
  else if(a==="report"){UI.tab="reports";UI.open["rp"+i]=true;render()}
  else if(a==="month-open"){UI.tab="reports";UI.month=+t.dataset.d;render()}
  else if(a==="month"){UI.month+=+t.dataset.d;if(UI.month>0)UI.month=0;render()}
  else if(a==="copy-month"){copy(monthText(monthData(UI.month)),"تم نسخ الملخص.")}
  else if(a==="acc-add"){var hv=$("ach-"+i).value.trim();if(hv){M(i).accounts.push({p:$("acp-"+i).value,h:hv});render()}}
  else if(a==="acc-del"){M(i).accounts.splice(+t.dataset.i,1);render()}
  else if(a==="recode"){M(i).code=newCode();render()}
  else if(a==="copy-iban"){var v=ibanClean(M(i).iban);if(v)copy(v,"تم نسخ الآيبان.",$("iban-"+i));else toast("لا يوجد آيبان لهذا المسوق.")}
  else if(a==="file"){UI.tab="books";if(B(i).archived)UI.showArch=true;UI.open[i]=true;render()}
  else if(a==="assign"){var sb=B(i), sv2=$("asel-"+i).value;if(sv2&&sb.mk.indexOf(sv2)<0){sb.mk.push(sv2);render()}}
  else if(a==="unassign"){var ub=B(i), ui=ub.mk.indexOf(t.dataset.m);if(ui>-1){ub.mk.splice(ui,1);render()}}
  else if(a==="show-arch"){UI.showArch=!UI.showArch;render()}
  else if(a==="paid"){var p=pay(B(i),t.dataset.m);p.paid=true;p.paidAt=iso(0);toast("سُجّل التحويل.");render()}
  else if(a==="arch"){var bk=B(i);bk.archived=!bk.archived;bk.autoDone=true;toast(bk.archived?"نُقل للأرشيف.":"رجع من الأرشيف.");render()}
  else if(a==="a-book"){
    var bt=$("nb-"+i).value.trim(); if(!bt){toast("اكتبي عنوان الكتاب أولًا.");return}
    var ab={id:id(),title:bt,authorId:i,start:iso(0),end:iso(30),target:1,mk:[],archived:false,reportSent:false,pay:{}};
    S.books.unshift(ab);UI.tab="books";UI.open[ab.id]=true;toast("أُضيف الكتاب. كلّفي المسوقين.");render();
  }
  else if(a==="a-del"){S.authors=S.authors.filter(function(x){return x.id!==i});render()}
  else if(a==="dup"){
    var o=B(i), len=o.start&&o.end?Math.round((new Date(o.end)-new Date(o.start))/D):30, nb={id:id(),title:"حملة جديدة",authorId:"",start:iso(0),end:iso(len),target:o.target||1,mk:o.mk.filter(function(x){return M(x).active}),archived:false,reportSent:false,pay:{}};
    nb.mk.forEach(function(x){nb.pay[x]={amount:pay(o,x).amount,paid:false,paidAt:""}});
    S.books.unshift(nb);UI.tab="books";UI.open[nb.id]=true;toast("أُنشئت حملة جديدة. عدّلي العنوان والكاتب.");render();
  }
  else if(a==="mark"){
    var n=0;S.links.forEach(function(l){if(l.b===i&&l.status==="pending"){l.status="sent";n++}});
    toast("سُجّل إرسال "+nLinks(n)+".");render();
  }
  else if(a==="copy-msg"){copy($("send-"+i).value,"تم النسخ.",$("send-"+i))}
  else if(a==="copy-report"){copy($("rp-"+i).value,"تم نسخ التقرير.",$("rp-"+i))}
  else if(a==="copy-entry"){copy(ENTRY_URL,"تم نسخ الرابط.",$("entry-url"))}
  else if(a==="signout"){FB.signOut()}
  else if(a==="goto"){UI.tab=t.dataset.tab;render()}
  else if(a==="color"){T.color=t.dataset.color;applyTheme();saveTheme()}
  else if(a==="mode"){T.mode=root.getAttribute("data-mode")==="dark"?"light":"dark";applyTheme();saveTheme()}
  else if(a==="backup"){backup()}
});
$("panel").addEventListener("submit",function(e){
  e.preventDefault();
  if(e.target.id==="bulk-marketers"){
    $("bm-text").value.split("\n").forEach(function(line){
      var parts=line.split(/[,،\t]/), n=(parts[0]||"").trim(); if(!n)return;
      S.marketers.push({id:id(),name:n,phone:(parts[1]||"").trim(),accounts:[],code:newCode(),active:true,address:"",iban:"",notes:""});
    });UI.open["add-m"]=false;render();
  }else if(e.target.id==="add-author"){
    var an=$("aa-name").value.trim(); if(!an)return;
    S.authors.push({id:id(),name:an,phone:$("aa-phone").value.trim()});UI.open["add-a"]=false;render();
  }else if(e.target.id==="add-book"){
    var t=$("ab-title").value.trim(), aid=$("ab-author").value, nn=$("ab-new").value.trim(); if(!t)return;
    if(!aid&&nn){var na={id:id(),name:nn,phone:""};S.authors.push(na);aid=na.id}
    var nb={id:id(),title:t,authorId:aid||"",start:iso(0),end:iso(30),target:1,mk:[],archived:false,reportSent:false,pay:{}};
    S.books.unshift(nb);UI.open[nb.id]=true;UI.open["add-b"]=false;render();
  }
});
function backup(){
  var data=JSON.stringify({exportedAt:new Date().toISOString(),authors:S.authors,marketers:S.marketers,books:S.books,links:S.links,template:S.template},null,2);
  var a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([data],{type:"application/json"}));
  a.download="marketers-backup-"+iso(0)+".json";
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(a.href)},2000);
}

/* ---------- theme ---------- */
var root=document.documentElement, T={mode:"",color:"teal"};
try{var sv=JSON.parse(localStorage.getItem("mk-theme")||"null");if(sv){T.mode=sv.mode||"";T.color=sv.color||"teal"}}catch(e){}
function sysDark(){var h=root.getAttribute("data-theme");if(h)return h==="dark";return !!(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)}
function applyTheme(){
  var dark=T.mode?T.mode==="dark":sysDark();
  root.setAttribute("data-mode",dark?"dark":"light");
  root.setAttribute("data-color",T.color);
  var mb=$("mode-btn"), sw=$("swatches");
  if(mb)mb.textContent=dark?"الوضع الفاتح":"الوضع الداكن";
  if(sw)Array.prototype.forEach.call(sw.children,function(b){b.classList.toggle("on",b.dataset.color===T.color)});
}
function saveTheme(){try{localStorage.setItem("mk-theme",JSON.stringify(T))}catch(e){}}
try{new MutationObserver(function(){if(!T.mode)applyTheme()}).observe(root,{attributes:true,attributeFilter:["data-theme"]})}catch(e){}
applyTheme();

/* ---------- sign-in and loading ---------- */
function gate(html){$("gate").innerHTML=html;$("gate").hidden=false;$("view-manager").hidden=true;$("calc-link").hidden=true}
function loginForm(msg){
  gate('<form class="card" id="login" novalidate><h2>دخول المديرة</h2>'+
    '<label for="lg-email">البريد</label><input id="lg-email" class="ltr" type="email" autocomplete="username">'+
    '<label for="lg-pass" style="margin-top:8px">كلمة المرور</label><input id="lg-pass" class="ltr" type="password" autocomplete="current-password">'+
    '<button type="submit" class="primary" id="lg-go">دخول</button>'+(msg?'<div class="msg err">'+esc(msg)+'</div>':'')+'</form>');
}
$("gate").addEventListener("submit",function(e){
  e.preventDefault();
  var em=$("lg-email").value.trim(), pw=$("lg-pass").value;
  if(!em||!pw)return loginForm("اكتبي البريد وكلمة المرور.");
  $("lg-go").disabled=true;
  FB.signIn(em,pw).catch(function(){loginForm("البريد أو كلمة المرور غير صحيحة.")});
});
$("gate").addEventListener("click",function(e){if(e.target.closest("[data-act=signout]"))FB.signOut()});
var stopLinks=null;
function start(user){
  gate('<p class="empty">جارٍ التحميل…</p>');
  FB.loadAll().then(function(d){
    S.authors=d.authors;S.marketers=d.marketers;S.books=d.books;S.template=d.template||DEFAULT_TPL;S.links=[];
    baseline(d.codes);
    if(!d.template)SAVED.template="";
    stopLinks=FB.watchLinks(function(links){
      // لا نفقد تعديلات لم تُحفظ بعد (تم الإرسال، حذف) عند وصول روابط جديدة
      var loc={}, have={}, gone={};
      S.links.forEach(function(l){have[l.id]=1;if(l.id in SAVED.links&&SAVED.links[l.id]!==l.status)loc[l.id]=l.status});
      Object.keys(SAVED.links).forEach(function(k){if(!have[k])gone[k]=1});
      SAVED.links={};links.forEach(function(l){SAVED.links[l.id]=l.status});
      S.links=links.filter(function(l){return !gone[l.id]});
      S.links.forEach(function(l){if(l.id in loc)l.status=loc[l.id]});
      $("gate").hidden=true;$("view-manager").hidden=false;$("calc-link").hidden=false;render();
    },function(){toast("انقطع تحديث الروابط. حدّثي الصفحة.")});
  }).catch(function(){
    gate('<div class="card"><h2>هذا الحساب ليس حساب المديرة</h2><p class="hint">تأكدي أن رقم UID في قواعد Firestore هو رقم حسابك.</p><button type="button" class="small" data-act="signout">تسجيل الخروج</button></div>');
  });
}
function boot(){
  FB=window.FB;
  if(!FB||!FB.ok){gate('<div class="card"><h2>الإعداد غير مكتمل</h2><p class="hint">ضعي بيانات مشروع Firebase في الملف js/config.js ثم حدّثي الصفحة.</p></div>');return}
  FB.onAuth(function(u){
    if(stopLinks){stopLinks();stopLinks=null}
    SAVED=null;
    if(u)start(u); else loginForm("");
  });
}
if(window.FB)boot(); else window.addEventListener("fb-ready",boot);
})();
