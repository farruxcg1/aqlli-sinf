// =====================================================================
//  Aqlli sinf — ma'lumot qatlami (sinflar reytingi, F9)
//  Ikki rejim:
//    demo  — config.js bo'sh: hammasi shu brauzerda (localStorage), namunaviy ma'lumot bilan
//    cloud — config.js to'ldirilgan: Supabase; internet uzilsa ballar navbatda kutadi
//  Hamma sahifalar faqat window.AqlliStore orqali ishlaydi.
// =====================================================================
(function(){
  const CFG = window.AQLLI_CONFIG || {};
  const CLOUD = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const LS = {
    get(k,d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
    set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() :
    "10000000-1000-4000-8000-100000000000".replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));

  // ---------- Sana yordamchilari (hafta dushanbadan) ----------
  function dayStr(d){ const x=new Date(d); return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0"); }
  function weekStart(d=new Date()){ const x=new Date(d); x.setHours(0,0,0,0); const wd=(x.getDay()+6)%7; x.setDate(x.getDate()-wd); return x; }
  function weekStr(d){ return dayStr(weekStart(d)); }

  // ---------- Darajalar va nishonlar ----------
  const LEVELS=[[0,"🌱","Kurtak"],[15,"🌿","Nihol"],[40,"🌳","Daraxt"],[80,"🍎","Mevali daraxt"],[150,"🏞️","Bog'"]];
  function level(stars){
    let i=0; while(i+1<LEVELS.length && stars>=LEVELS[i+1][0]) i++;
    const cur=LEVELS[i], next=LEVELS[i+1];
    return { icon:cur[1], name:cur[2], index:i, next: next?{at:next[0],icon:next[1],name:next[2]}:null,
             progress: next ? (stars-cur[0])/(next[0]-cur[0]) : 1 };
  }
  function maxStreak(days){
    // yakshanbalarni hisobga olmaymiz
    const set=new Set(days); let best=0, run=0;
    const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-30);
    for(let i=0;i<=30;i++){
      if(d.getDay()!==0){ if(set.has(dayStr(d))){ run++; best=Math.max(best,run); } else run=0; }
      d.setDate(d.getDate()+1);
    }
    return best;
  }
  function badges(t){
    const b=[];
    if(t.wheel_stars>=10)   b.push(["🌍","Geografiya bilimdoni"]);
    if(t.board_stars>=10)   b.push(["🎯","Doska ustasi"]);
    if(t.help_stars>=5)     b.push(["🤝","Yaxshi yordamchi"]);
    if(t.homework_stars>=10)b.push(["📚","Uy vazifasi a'lochisi"]);
    if(t.streak>=5)         b.push(["🔥","5 kun ketma-ket faol"]);
    return b;
  }
  const AVATARS="🐱 🐶 🦊 🐼 🐨 🐯 🦁 🐸 🐵 🐰 🐻 🐮 🐷 🐔 🐧 🦉 🐢 🐬 🐳 🦄 🐝 🦋 🐞 🦒 🐘 🦓 🦔 🐿️ 🦜 🐙".split(" ");
  const REASONS=[["✅","To'g'ri javob"],["🙋","Faollik"],["🤝","Yordam"],["📚","Uy vazifasi"],["🧹","Tartib"]];

  // ---------- Hodisalar (sahifalarni yangilash uchun) ----------
  const listeners=new Set();
  function emit(){ listeners.forEach(f=>{ try{ f(); }catch(e){ console.error(e); } }); }
  addEventListener("storage",e=>{ if(e.key && e.key.startsWith("aqlli-")) emit(); });

  // =====================================================================
  //  DEMO rejim
  // =====================================================================
  const DEMO_KEY="aqlli-demo-db";
  function demoSeed(){
    const school={id:uuid(),name:"Demo maktab"};
    const names=["Ali","Laylo","Bobur","Madina","Sardor","Zarina","Jasur","Malika","Aziz","Nilufar","Diyor","Sevinch","Temur","Mohira","Otabek","Shahzoda","Islom","Gulnoza","Behruz","Dilnoza","Umid","Sabina","Javohir","Kamola"];
    const classes=[],students=[],events=[];
    [[3,"A"],[3,"B"],[3,"V"],[4,"A"],[4,"B"]].forEach(([g,l],ci)=>{
      const c={id:uuid(),grade:g,letter:l}; classes.push(c);
      const n=6+(ci%3);
      for(let i=0;i<n;i++){
        students.push({id:uuid(),class_id:c.id,first_name:names[(ci*7+i)%names.length],last_initial:"ABDGKMNORST"[(ci+i)%11],avatar:AVATARS[(ci*5+i*3)%AVATARS.length],active:true});
      }
    });
    // o'tgan va shu hafta uchun namunaviy ballar
    const now=new Date();
    classes.forEach((c,ci)=>{
      const st=students.filter(s=>s.class_id===c.id);
      for(let day=12; day>=1; day--){
        const d=new Date(now); d.setDate(d.getDate()-day); if(d.getDay()===0) continue;
        const k=2+((ci*3+day)%4);
        for(let j=0;j<k;j++){
          const s=st[(day*j+ci)%st.length], r=REASONS[(j+day)%REASONS.length][1];
          d.setHours(9+j%6, (j*7)%60);
          events.push({client_id:uuid(),class_id:c.id,student_id:s.id,stars:1,points:1,source:"manual",reason:r,created_at:d.toISOString(),revoked_at:null});
        }
        if((day+ci)%3===0){ d.setHours(14); events.push({client_id:uuid(),class_id:c.id,student_id:null,stars:0,points:6+((ci+day)%9),source:"math",reason:"Qiziqarli matematika",created_at:d.toISOString(),revoked_at:null}); }
        if((day+ci)%4===1){ d.setHours(11); const s=st[day%st.length]; events.push({client_id:uuid(),class_id:c.id,student_id:s.id,stars:1,points:2,source:"wheel",reason:"Savollar barabani",created_at:d.toISOString(),revoked_at:null}); }
        if((day+ci)%5===2){ d.setHours(8); events.push({client_id:uuid(),class_id:c.id,student_id:null,stars:0,points:5,source:"attendance",reason:"Davomat",created_at:d.toISOString(),revoked_at:null}); }
      }
    });
    return {school,classes,students,events};
  }
  function db(){ let d=LS.get(DEMO_KEY,null); if(!d){ d=demoSeed(); LS.set(DEMO_KEY,d); } return d; }
  function dbSave(d){ LS.set(DEMO_KEY,d); emit(); }

  function computeTotals(events, studentIds){
    const ws=weekStr(new Date()), lw=weekStr(new Date(weekStart().getTime()-86400000));
    const m={}; studentIds.forEach(id=>m[id]={stars:0,wheel_stars:0,board_stars:0,help_stars:0,homework_stars:0,week_stars:0,last_week_stars:0,days:[]});
    events.forEach(e=>{
      if(e.revoked_at||!e.student_id||!m[e.student_id]) return;
      const t=m[e.student_id], w=weekStr(new Date(e.created_at));
      t.stars+=e.stars;
      if(e.source==="wheel") t.wheel_stars+=e.stars;
      if(e.source==="board") t.board_stars+=e.stars;
      if(e.reason==="Yordam") t.help_stars+=e.stars;
      if(e.reason==="Uy vazifasi") t.homework_stars+=e.stars;
      if(w===ws) t.week_stars+=e.stars;
      if(w===lw) t.last_week_stars+=e.stars;
      if(e.stars>0) t.days.push(dayStr(e.created_at));
    });
    Object.values(m).forEach(t=>{ t.streak=maxStreak(t.days); delete t.days; });
    return m;
  }
  function checkRules(d, ev){
    const today=dayStr(new Date());
    if(ev.source==="manual"){
      const n=Math.max(1,d.students.filter(s=>s.class_id===ev.class_id&&s.active).length);
      const used=d.events.filter(e=>e.class_id===ev.class_id&&e.source==="manual"&&!e.revoked_at&&dayStr(e.created_at)===today).reduce((a,e)=>a+e.stars,0);
      if(used+ev.stars>n*3) throw new Error(`Bugungi yulduzlar chegarasiga yetildi (${n*3})`);
    }
    if(ev.source==="attendance" && d.events.some(e=>e.class_id===ev.class_id&&e.source==="attendance"&&!e.revoked_at&&dayStr(e.created_at)===today))
      throw new Error("Bugungi davomat bali allaqachon berilgan");
  }

  const demo={
    async ready(){ db(); return {mode:"demo", needLogin:false, role:"school_admin", name:"Demo"}; },
    async school(){ return db().school; },
    async classes(){
      const d=db();
      return d.classes.map(c=>({id:c.id,grade:c.grade,letter:c.letter,students:d.students.filter(s=>s.class_id===c.id&&s.active).length}))
        .sort((a,b)=>a.grade-b.grade||a.letter.localeCompare(b.letter));
    },
    async students(classId){ return db().students.filter(s=>s.class_id===classId&&s.active).sort((a,b)=>a.first_name.localeCompare(b.first_name,"uz")); },
    async totals(classId){ const d=db(); return computeTotals(d.events, d.students.filter(s=>s.class_id===classId).map(s=>s.id)); },
    async give(ev){
      const d=db(); checkRules(d,ev);
      const row={client_id:uuid(),revoked_at:null,created_at:new Date().toISOString(),student_id:null,stars:0,points:0,reason:"",...ev};
      d.events.push(row); dbSave(d); return {client_id:row.client_id, queued:false};
    },
    async revoke(cid){ const d=db(); const e=d.events.find(x=>x.client_id===cid); if(e&&!e.revoked_at){ e.revoked_at=new Date().toISOString(); dbSave(d); } },
    async saveStudent(s){
      const d=db();
      if(s.id){ Object.assign(d.students.find(x=>x.id===s.id)||{}, s); }
      else d.students.push({id:uuid(),active:true,avatar:"🐱",last_initial:"",...s});
      dbSave(d);
    },
    async archiveStudent(id){ const d=db(); const s=d.students.find(x=>x.id===id); if(s){ s.active=false; dbSave(d); } },
    async addClass(grade,letter){
      const d=db(); letter=letter.trim().toUpperCase();
      if(d.classes.some(c=>c.grade===grade&&c.letter===letter)) throw new Error("Bunday sinf bor");
      const c={id:uuid(),grade,letter}; d.classes.push(c); dbSave(d); return c;
    },
    async weekScores(){
      const d=db(); const ws=weekStr(new Date()), lw=weekStr(new Date(weekStart().getTime()-86400000));
      const rows={};
      d.events.forEach(e=>{
        if(e.revoked_at) return; const w=weekStr(new Date(e.created_at)); if(w!==ws&&w!==lw) return;
        const key=e.class_id+"|"+w; const r=rows[key]||(rows[key]={class_id:e.class_id,week:w,points:0,math_points:0,wheel_points:0,attendance_points:0,stars:0});
        r.points+=e.points; r.stars+=e.stars;
        if(e.source==="math") r.math_points+=e.points; if(e.source==="wheel") r.wheel_points+=e.points; if(e.source==="attendance") r.attendance_points+=e.points;
      });
      return Object.values(rows);
    },
    resetDemo(){ localStorage.removeItem(DEMO_KEY); emit(); }
  };

  // =====================================================================
  //  CLOUD rejim (Supabase)
  // =====================================================================
  let sb=null, profile=null;
  const QKEY="aqlli-queue", CKEY="aqlli-cache";
  const cache={ get(k){ return (LS.get(CKEY,{})||{})[k]; }, set(k,v){ const c=LS.get(CKEY,{})||{}; c[k]=v; LS.set(CKEY,c); } };
  function isNetErr(e){ return !e || /fetch|network|Failed|timeout|offline/i.test(String(e.message||e)) || e.status===0; }
  async function q(promise, cacheKey){
    try{
      const {data,error}=await promise;
      if(error) throw error;
      if(cacheKey) cache.set(cacheKey,data);
      return data;
    }catch(e){
      if(cacheKey && isNetErr(e) && cache.get(cacheKey)!==undefined) return cache.get(cacheKey);
      throw e;
    }
  }
  async function flush(){
    if(!sb||!profile) return;
    let queue=LS.get(QKEY,[]); if(!queue.length) return;
    const left=[];
    for(const row of queue){
      try{
        const {error}=await sb.from("events").insert(row);
        if(error && error.code!=="23505"){ if(isNetErr(error)) left.push(row); else console.warn("Ball rad etildi:",error.message); }
      }catch(e){ left.push(row); }
    }
    LS.set(QKEY,left); emit();
  }
  addEventListener("online",()=>flush());
  setInterval(()=>flush(),15000);

  const cloud={
    async ready(){
      if(!window.supabase) return {mode:"cloud", offline:true, needLogin:false, role:LS.get("aqlli-role",null)};
      sb=sb||window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true}});
      const {data:{session}}=await sb.auth.getSession();
      if(!session) return {mode:"cloud", needLogin:true};
      try{
        profile=await q(sb.from("profiles").select("id,school_id,full_name,role").eq("id",session.user.id).single(),"profile");
      }catch(e){ return {mode:"cloud", needLogin:true, error:"Bu foydalanuvchi uchun profil yaratilmagan (SUPABASE.md, 4-qadam)"}; }
      LS.set("aqlli-role",profile.role);
      flush();
      sb.channel("aqlli-events").on("postgres_changes",{event:"*",schema:"public",table:"events"},()=>emit()).subscribe();
      return {mode:"cloud", needLogin:false, role:profile.role, name:profile.full_name};
    },
    async login(email,password){
      sb=sb||window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true}});
      const {error}=await sb.auth.signInWithPassword({email,password});
      if(error) throw new Error(error.message==="Invalid login credentials"?"Email yoki parol noto'g'ri":error.message);
      return cloud.ready();
    },
    async logout(){ if(sb) await sb.auth.signOut(); profile=null; LS.set(CKEY,{}); },
    async school(){ return q(sb.from("schools").select("id,name").single(),"school"); },
    async classes(){
      const rows=await q(sb.from("class_sizes").select("class_id,grade,letter,students").order("grade").order("letter"),"classes");
      return rows.map(r=>({id:r.class_id,grade:r.grade,letter:r.letter,students:r.students}));
    },
    async students(classId){
      return q(sb.from("students").select("id,class_id,first_name,last_initial,avatar,active").eq("class_id",classId).eq("active",true).order("first_name"),"students:"+classId);
    },
    async totals(classId){
      const rows=await q(sb.from("student_totals").select("*").eq("class_id",classId),"totals:"+classId);
      const ids=rows.map(r=>r.student_id);
      const days=ids.length?await q(sb.from("student_days").select("student_id,day").in("student_id",ids),"days:"+classId):[];
      const m={};
      rows.forEach(r=>{ m[r.student_id]={...r, streak:maxStreak(days.filter(d=>d.student_id===r.student_id).map(d=>d.day))}; });
      // navbatda turgan (hali yuborilmagan) yulduzlarni ham qo'shamiz
      LS.get(QKEY,[]).forEach(e=>{ if(e.class_id===classId&&e.student_id&&m[e.student_id]){ m[e.student_id].stars+=e.stars; m[e.student_id].week_stars+=e.stars; } });
      return m;
    },
    async give(ev){
      const row={client_id:uuid(),school_id:profile?profile.school_id:LS.get(CKEY,{}).profile?.school_id,student_id:null,stars:0,points:0,reason:"",...ev};
      if(!sb||!navigator.onLine){ const qq=LS.get(QKEY,[]); qq.push(row); LS.set(QKEY,qq); emit(); return {client_id:row.client_id, queued:true}; }
      try{
        const {error}=await sb.from("events").insert(row);
        if(error){ if(isNetErr(error)) throw error; throw new Error(error.message); }
        emit(); return {client_id:row.client_id, queued:false};
      }catch(e){
        if(!isNetErr(e)) throw e;
        const qq=LS.get(QKEY,[]); qq.push(row); LS.set(QKEY,qq); emit(); return {client_id:row.client_id, queued:true};
      }
    },
    async revoke(cid){
      const qq=LS.get(QKEY,[]); const i=qq.findIndex(r=>r.client_id===cid);
      if(i>=0){ qq.splice(i,1); LS.set(QKEY,qq); emit(); return; }
      const {error}=await sb.from("events").update({revoked_at:new Date().toISOString()}).eq("client_id",cid);
      if(error) throw new Error(error.message); emit();
    },
    async saveStudent(s){
      const row={class_id:s.class_id,first_name:s.first_name,last_initial:s.last_initial||"",avatar:s.avatar||"🐱"};
      const {error}= s.id ? await sb.from("students").update(row).eq("id",s.id) : await sb.from("students").insert(row);
      if(error) throw new Error(error.message); emit();
    },
    async archiveStudent(id){ const {error}=await sb.from("students").update({active:false}).eq("id",id); if(error) throw new Error(error.message); emit(); },
    async addClass(grade,letter){
      const {data,error}=await sb.from("classes").insert({school_id:profile.school_id,grade,letter:letter.trim().toUpperCase()}).select().single();
      if(error) throw new Error(error.code==="23505"?"Bunday sinf bor":error.message); emit(); return data;
    },
    async weekScores(){
      const lw=weekStr(new Date(weekStart().getTime()-86400000));
      return q(sb.from("class_week_scores").select("class_id,week,points,math_points,wheel_points,attendance_points,stars").gte("week",lw),"weekScores");
    }
  };

  const impl = CLOUD ? cloud : demo;

  // ---------- Reyting hisoblash (ikkala rejim uchun umumiy) ----------
  async function ranking(){
    const [classes, rows] = await Promise.all([impl.classes(), impl.weekScores()]);
    const ws=weekStr(new Date()), lw=weekStr(new Date(weekStart().getTime()-86400000));
    const zero={points:0,math_points:0,wheel_points:0,attendance_points:0,stars:0};
    const list=classes.map(c=>{
      const cur={...zero,...(rows.find(r=>r.class_id===c.id&&String(r.week).slice(0,10)===ws)||{})};
      const prev={...zero,...(rows.find(r=>r.class_id===c.id&&String(r.week).slice(0,10)===lw)||{})};
      const n=Math.max(1,c.students);
      const avg=v=>Math.round((Number(v)||0)/n*10)/10;
      return {...c, name:`${c.grade}-${c.letter}`,
        avg:avg(cur.points), prevAvg:avg(prev.points), growth:Math.round((avg(cur.points)-avg(prev.points))*10)/10,
        math:avg(cur.math_points), wheel:avg(cur.wheel_points), attendance:Number(cur.attendance_points)||0,
        points:Number(cur.points)||0, stars:Number(cur.stars)||0};
    });
    const grades=[...new Set(list.map(c=>c.grade))].sort((a,b)=>a-b).map(g=>({grade:g, classes:list.filter(c=>c.grade===g).sort((a,b)=>b.avg-a.avg)}));
    return {weekStart:weekStart(), list, grades};
  }

  window.AqlliStore={
    mode: CLOUD?"cloud":"demo",
    ready: impl.ready, login: impl.login||(async()=>{}), logout: impl.logout||(async()=>{}),
    school: impl.school, classes: impl.classes, students: impl.students, totals: impl.totals,
    give: impl.give, revoke: impl.revoke, saveStudent: impl.saveStudent, archiveStudent: impl.archiveStudent,
    addClass: impl.addClass, ranking, resetDemo: demo.resetDemo,
    pending: ()=>LS.get(QKEY,[]).length,
    onChange(f){ listeners.add(f); return ()=>listeners.delete(f); },
    level, badges, AVATARS, REASONS, weekStart, LEVELS
  };
})();
