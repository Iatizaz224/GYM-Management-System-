'use strict';
var KEY='nextGymV3';
var DAYS=['Sunday','Monday','Wednesday'];
var TIMES=['3:20','4:20','5:10','6:05','6:55'];
var CAPACITY=9;
var DEFAULT_NEW='*NEXT FITNESS*\n\n📅 بداية الاشتراك: {start}\n📅 نهاية الاشتراك: {end}\n💳 قيمة الاشتراك: {fee} ر.ع\n\n❗️\n- مدة الحصة ٤٥ دقيقة\n- الاشتراك شهري ( ٣ حصص في الاسبوع)\n- لا يتم تعويض الحصص\n- الحضور قبل بداية السشن ب ١٠ دقايق للاحماء\n\nأيام التدريب: الاحد - الاثنين - الاربعاء\n\nطريقة الدفع\nIatizaz Al Farsi\nBank Muscat\n0318048416250024\n\nMobile Payment: 94600808\nIatizaz Al Farsi\n\n❤️❤️\nالرجاء ارسال الايصال عند التحويل..\n\nشكرا';
var DEFAULT_RENEW='*NEXT FITNESS*\n\n📅 بداية الاشتراك: {start}\n📅 نهاية الاشتراك: {end}\n💳 قيمة الاشتراك: {fee} ر.ع\n\n❗️\n- مدة الحصة ٤٥ دقيقة\n- الاشتراك شهري ( ٣ حصص في الاسبوع)\n- لا يتم تعويض الحصص\n- الحضور قبل بداية السشن ب ١٠ دقايق للاحماء\n\nأيام التدريب: الاحد - الاثنين - الاربعاء\n\nطريقة الدفع\nIatizaz Al Farsi\nBank Muscat\n0318048416250024\n\nMobile Payment: 94600808\nIatizaz Al Farsi\n\n❤️❤️\nالرجاء ارسال الايصال عند التحويل..\n\nشكرا';
var state={clients:[],bookings:[],payments:[],waiting:[],expenses:[],settings:{waNew:DEFAULT_NEW,waRenew:DEFAULT_RENEW}};
var selectedDay='Sunday',scheduleMode='list',clientView='active',paymentFilter='all',selectedPaymentMonth=monthKey(),selectedReportMonth=monthKey(),bulkSelected=[];
function el(id){return document.getElementById(id)}
window.onerror=function(message,source,line,col){var b=el('errorBanner');if(b){b.style.display='block';b.textContent='App error: '+message+' (line '+line+')'}return false};
function monthKey(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function todayISO(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(a){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[a]})}
function money(n){return Number(n||0).toFixed(3)}
function migrateSharedSchedule(){if(state.settings.sharedScheduleV1)return;var order={Sunday:0,Monday:1,Wednesday:2,ALL:3},usedClients={},usedSpots={},out=[];state.bookings.slice().sort(function(a,b){return (order[a.day]??9)-(order[b.day]??9)}).forEach(function(b){if(!b||!b.clientId||!b.time||usedClients[b.clientId])return;var spot=Number(b.spot||1);if(!usedSpots[b.time])usedSpots[b.time]={};if(usedSpots[b.time][spot]){spot=0;for(var i=1;i<=CAPACITY;i++){if(!usedSpots[b.time][i]){spot=i;break}}if(!spot)return}usedClients[b.clientId]=true;usedSpots[b.time][spot]=true;out.push({id:b.id||uid(),clientId:b.clientId,day:'ALL',time:b.time,spot:spot})});state.bookings=out;state.settings.sharedScheduleV1=true;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function firstAvailableSpot(time,exceptClientId){var used=state.bookings.filter(function(b){return b.time===time&&b.clientId!==exceptClientId}).map(function(b){return Number(b.spot)});for(var s=1;s<=CAPACITY;s++)if(used.indexOf(s)<0)return s;return null}
function syncBookingsFromClientTimes(){state.clients.filter(isActive).forEach(function(x){if(!x.preferredTime||TIMES.indexOf(x.preferredTime)<0)return;var b=state.bookings.find(function(q){return q.clientId===x.id});if(b&&b.time===x.preferredTime)return;var spot=firstAvailableSpot(x.preferredTime,x.id);if(spot===null)return;state.bookings=state.bookings.filter(function(q){return q.clientId!==x.id});state.bookings.push({id:b?b.id:uid(),clientId:x.id,day:'ALL',time:x.preferredTime,spot:spot})})}
function normalize(){['clients','bookings','payments','waiting','expenses'].forEach(function(k){if(!Array.isArray(state[k]))state[k]=[]});if(!state.settings||typeof state.settings!=='object')state.settings={};if(!state.settings.waNew)state.settings.waNew=DEFAULT_NEW;if(!state.settings.waRenew)state.settings.waRenew=DEFAULT_RENEW;if(state.settings.whatsappTemplateVersion!==68){state.settings.waNew=DEFAULT_NEW;state.settings.waRenew=DEFAULT_RENEW;state.settings.whatsappTemplateVersion=68;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}if(state.bulkWhatsApp&&typeof state.bulkWhatsApp!=='object')state.bulkWhatsApp=null;state.clients.forEach(function(x){x.extraDays=Math.max(0,Number(x.extraDays||0));if(x.membershipStart&&!x.membershipEnd)x.membershipEnd=membershipEndFromStart(x.membershipStart,x.extraDays)});migrateSharedSchedule();syncBookingsFromClientTimes()}
function loadState(){try{var raw=localStorage.getItem(KEY);if(raw){var saved=JSON.parse(raw);Object.keys(saved).forEach(function(k){state[k]=saved[k]})}}catch(e){showError('Could not read saved data: '+e.message)}normalize()}
function saveState(){normalize();localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function showError(msg){var b=el('errorBanner');if(b){b.style.display='block';b.textContent=msg}}
function clientById(id){return state.clients.find(function(x){return x.id===id})}
function isActive(x){return !!x&&x.active!==false&&x.status!=='archived'&&x.status!=='waiting'}
function paymentFor(clientId,month){return state.payments.find(function(x){return x.clientId===clientId&&x.month===month})}
function isPaid(clientId,month){return !!paymentFor(clientId,month)}
function formatDate(v){if(!v)return 'Not set';var p=v.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:v}
function dateAddDays(v,days){if(!v)return'';var p=v.split('-').map(Number),d=new Date(Date.UTC(p[0],p[1]-1,p[2]));d.setUTCDate(d.getUTCDate()+days);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')}
function membershipEndFromStart(start,extraDays){if(!start)return'';var p=start.split('-').map(Number),y=p[0],m=p[1],day=p[2],ny=y,nm=m+1;if(nm===13){nm=1;ny++}var daysInTarget=new Date(Date.UTC(ny,nm,0)).getUTCDate();var targetDay=Math.min(day,daysInTarget);var target=ny+'-'+String(nm).padStart(2,'0')+'-'+String(targetDay).padStart(2,'0');var base=dateAddDays(target,-1),extra=Math.max(0,Number(extraDays||0));return extra?dateAddDays(base,extra):base}
function membershipStatus(x){if(!x.membershipStart||!x.membershipEnd)return'NOT SET';var t=todayISO();if(t<x.membershipStart)return'UPCOMING';if(t>x.membershipEnd)return'EXPIRED';return'ACTIVE'}
function remainingDays(x){if(!x||!x.membershipEnd)return null;var t=todayISO().split('-').map(Number),e=x.membershipEnd.split('-').map(Number);if(e.length!==3)return null;var td=Date.UTC(t[0],t[1]-1,t[2]),ed=Date.UTC(e[0],e[1]-1,e[2]);return Math.round((ed-td)/86400000)}
function remainingText(x){var d=remainingDays(x);if(d===null)return'DATES NOT SET';if(d<0)return'⚠️ EXPIRED '+Math.abs(d)+'D';if(d===0)return'⚠️ ENDS TODAY';if(d===1)return'⏳ 1 DAY LEFT';return'⏳ '+d+' DAYS LEFT'}
function remainingClass(x){var d=remainingDays(x);if(d===null)return'neutralbadge';if(d<0)return'remainingexpired';if(d<=3)return'remainingurgent';if(d<=7)return'remainingsoon';return'remainingnormal'}
function sortByRenewalUrgency(a,b){var da=remainingDays(a),db=remainingDays(b);if(da===null&&db===null)return String(a.name||'').localeCompare(String(b.name||''));if(da===null)return 1;if(db===null)return-1;if(da<0&&db<0)return db-da;if(da<0)return-1;if(db<0)return 1;if(da!==db)return da-db;return String(a.name||'').localeCompare(String(b.name||''))}
function statusClass(s){return s==='ACTIVE'?'activebadge':s==='EXPIRED'?'expiredbadge':s==='UPCOMING'?'upcomingbadge':'neutralbadge'}
function normalizePhone(p){var d=String(p||'').replace(/\D/g,'');if(d.indexOf('00')===0)d=d.slice(2);if(d.length===8)d='968'+d;return d}
function showPage(id){document.querySelectorAll('.page').forEach(function(x){x.classList.remove('on')});var p=el(id);if(p)p.classList.add('on');document.querySelectorAll('.nav button').forEach(function(x){x.classList.toggle('on',x.dataset.page===id)});renderAll();window.scrollTo(0,0)}
function openModal(html){el('modalContent').innerHTML=html;el('modal').classList.add('on')}
function closeModal(){el('modal').classList.remove('on')}

