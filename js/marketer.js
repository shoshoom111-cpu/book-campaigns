(function(){
"use strict";
var PLAT=["instagram.com","tiktok.com","x.com","twitter.com","snapchat.com","youtube.com","youtu.be","facebook.com","threads.net","threads.com"];
var FB=null, me=null, code="", timer=null;
function $(s){return document.getElementById(s)}
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function okUrl(u){try{var x=new URL(u);if(!/^https?:$/.test(x.protocol))return false;var h=x.hostname.replace(/^www\./,"");return PLAT.some(function(d){return h===d||h.endsWith("."+d)})}catch(e){return false}}
function norm(u){return u.trim().replace(/\/+$/,"").toLowerCase()}
function today(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function nLinks(n){return n===1?"رابط واحد":n===2?"رابطان":n+" روابط"}
function msg(cls,html){$("entry-msg").innerHTML=html?'<div class="msg '+cls+'">'+html+'</div>':""}

function setBooks(){
  var sel=$("entry-book"), t=today();
  var mine=me?(me.books||[]).filter(function(b){return (!b.start||b.start<=t)&&(!b.end||b.end>=t)}):[];
  sel.disabled=!mine.length;
  sel.innerHTML=!me?'<option value="">اكتب رمزك أولًا</option>':mine.length?mine.map(function(b){return '<option value="'+esc(b.id)+'">'+esc(b.title)+'</option>'}).join(""):'<option value="">لا توجد حملات جارية لك</option>';
  $("entry-send").disabled=!mine.length;
}
function lookup(){
  var c=$("entry-code").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
  $("entry-code").value=c;
  if(c===code)return;
  code=c;me=null;setBooks();$("entry-who").textContent="";
  clearTimeout(timer);
  if(c.length<6)return;
  $("entry-who").textContent="جارٍ التحقق…";
  timer=setTimeout(function(){
    FB.getCode(c).then(function(d){
      if(c!==code)return;
      if(d&&d.active){me=d;$("entry-who").textContent="أهلًا "+d.name}
      else $("entry-who").textContent="الرمز غير صحيح أو موقوف.";
      setBooks();
    }).catch(function(){if(c===code)$("entry-who").textContent="تعذّر الاتصال. حاول مرة ثانية."});
  },350);
}
function submit(e){
  e.preventDefault();
  var b=$("entry-book").value;
  if(!me)return msg("err","اكتب رمزك الصحيح أولًا.");
  if(!b)return msg("err","اختر الكتاب.");
  var lines=$("entry-links").value.split(/\s+/).filter(Boolean);
  if(!lines.length)return msg("err","الصق رابطًا واحدًا على الأقل.");
  if(lines.length>30)return msg("err","أرسل 30 رابطًا كحد أقصى في المرة.");
  var good=[], bad=[], seen={};
  lines.forEach(function(u){
    var k=norm(u);
    if(u.length>500||!okUrl(u))bad.push([u,"ليس رابطًا من منصة مقبولة"]);
    else if(seen[k])bad.push([u,"مكرر"]);
    else{seen[k]=1;good.push(new URL(u.trim()).href)}
  });
  $("entry-send").disabled=true;
  Promise.all(good.map(function(u){
    return FB.addLink(code,me.m,b,u).then(function(){return null},function(){return u});
  })).then(function(res){
    var failed=res.filter(Boolean), ok=good.length-failed.length, h="";
    failed.forEach(function(u){bad.push([u,"لم يُحفظ، حاول مرة ثانية"])});
    if(ok)h+='<div class="msg ok">تم الاستلام: '+nLinks(ok)+'. شكرًا لك.</div>';
    if(bad.length)h+='<div class="msg err">لم تُقبل هذه الروابط:<ul>'+bad.map(function(x){return '<li><span class="ltr">'+esc(x[0])+'</span> ('+x[1]+')</li>'}).join("")+'</ul></div>';
    $("entry-msg").innerHTML=h;
    $("entry-links").value=bad.map(function(x){return x[0]}).join("\n");
    $("entry-send").disabled=false;
  });
}
function boot(){
  FB=window.FB;
  if(!FB||!FB.ok){msg("err","الصفحة غير جاهزة بعد. تواصل مع المديرة.");return}
  $("entry-code").addEventListener("input",lookup);
  $("entry-form").addEventListener("submit",submit);
  setBooks();
}
if(window.FB)boot(); else window.addEventListener("fb-ready",boot);
})();
