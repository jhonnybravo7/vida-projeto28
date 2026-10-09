const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync(__dirname+'/../vida-v21.js','utf8');
let now=Date.parse('2026-10-08T23:59:59-03:00'),scheduled,refreshes=0;
class Clock extends Date {constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
const events={},modal={dataset:{},open:false,classList:{contains:()=>modal.open}},root={classList:{contains:()=>false}};
const ctx={Date:Clock,Intl,console,Promise,supabase:{createClient:()=>({})},setTimeout:(fn,ms)=>{scheduled={fn,ms};return 1},clearTimeout:()=>{},document:{querySelector:s=>s==='#modal'?modal:s==='#root'?root:null,addEventListener:(n,f)=>events[n]=f,visibilityState:'visible'},addEventListener:(n,f)=>events[n]=f};ctx.window=ctx;
vm.createContext(ctx);vm.runInContext(app.slice(0,app.indexOf('async function login()')),ctx);
vm.runInContext("user={id:'test'};S.feature.base_access=true;S.onboarding={completed_at:'ok'};S.enrollment={start_date:'2026-10-01'};S.checkins=[{checkin_date:'2026-10-08',water_ml:3500,sleep_minutes:450,daily_checkin_completed:true}];S.progress=[{completed_at:'2026-10-09T01:00:00Z'}]",ctx);
const read=js=>vm.runInContext(js,ctx);
for(const instant of ['2026-10-08T20:59:59-03:00','2026-10-08T21:00:00-03:00','2026-10-08T23:59:59-03:00']){now=Date.parse(instant);assert.equal(read('iso()'),'2026-10-08');assert.equal(read('day()'),8);assert.equal(read('todayCheck().water_ml'),3500);assert.equal(read('todayContent()'),true)}
ctx.go=()=>{};ctx.modal=()=>{modal.open=true};ctx.closeModal=()=>{modal.open=false};ctx.toast=()=>{};ctx.hydrate=async()=>{refreshes++};
const writes=[];ctx.upCheck=async p=>writes.push({date:read('iso()'),...p});
vm.runInContext(fs.readFileSync(__dirname+'/../daily-rollover-v38.js','utf8'),ctx);
ctx.modal('water form');assert.equal(modal.dataset.recordDate,'2026-10-08');assert(scheduled.ms>=1000&&scheduled.ms<=1100);
now=Date.parse('2026-10-09T00:00:00-03:00');
(async()=>{
 await ctx.upCheck({water_ml:4000});assert.equal(writes.length,0,'stale form must not carry yesterday into today');assert.equal(modal.open,false);
 assert.equal(read('iso()'),'2026-10-09');assert.equal(read('day()'),9);assert.equal(read('todayCheck().water_ml'),0);assert.equal(read('todayContent()'),false);assert.equal(read('S.checkins[0].water_ml'),3500);
 await ctx.upCheck({water_ml:250});assert.equal(writes[0].date,'2026-10-09');assert.equal(writes[0].water_ml,250);
 assert.equal(refreshes,1);events.focus();assert.equal(refreshes,1,'no repeat refresh within same date');
 now=Date.parse('2026-10-10T08:00:00-03:00');events.pageshow();assert.equal(refreshes,2,'resume detects skipped midnight');
 assert.equal(read("brasiliaDate('2027-01-01T02:59:59Z')"),'2026-12-31');assert.equal(read("brasiliaDate('2027-01-01T03:00:00Z')"),'2027-01-01');
 console.log('PASS: Brasilia midnight, 21h writes, 28-day progression, retained history, daily content, stale forms, resume and year boundary. Host TZ='+process.env.TZ);
})();
