// =====================================================================
//  Aqlli sinf — umumiy oynalar: o'quvchi/sinf tanlash, login, xabar (toast)
//  Ishlatish: await AqlliUI.pickStudent({title}) → {cls, student} | null
//             await AqlliUI.pickClass({title})   → cls | null
//             await AqlliUI.ensureReady()        → login kerak bo'lsa so'raydi
//             AqlliUI.toast("Matn", {undo: fn})
// =====================================================================
(function(){
  const css=`
  .aui-ov{position:fixed;inset:0;z-index:50;background:rgba(8,13,28,.82);display:grid;place-items:center;padding:16px;font-family:Nunito,system-ui,sans-serif;color:#f4f6ff}
  .aui-box{background:#1a2747;border:3px solid #33467a;border-radius:28px;padding:clamp(16px,2vw,28px);width:min(1100px,96vw);max-height:92vh;display:flex;flex-direction:column;gap:14px;animation:auipop .3s ease-out}
  @keyframes auipop{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}
  .aui-head{display:flex;align-items:center;gap:12px}
  .aui-head h3{flex:1;font-size:clamp(22px,2.4vw,36px);font-weight:900}
  .aui-x{width:56px;height:56px;border-radius:16px;background:#24345c;border:2px solid #33467a;font-size:26px;color:inherit;cursor:pointer}
  .aui-chips{display:flex;gap:8px;flex-wrap:wrap}
  .aui-chip{min-width:72px;height:56px;padding:0 16px;border-radius:14px;background:#101a33;border:2px solid #33467a;color:#a9b4d6;font:900 22px Nunito,system-ui,sans-serif;cursor:pointer}
  .aui-chip.on{background:#ffc53d;border-color:#e0a920;color:#1b1b1b}
  .aui-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;overflow:auto;padding:2px}
  .aui-kid{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;border-radius:20px;background:#24345c;border:2px solid #33467a;color:inherit;cursor:pointer;font:800 18px Nunito,system-ui,sans-serif}
  .aui-kid b{font-size:48px;line-height:1.1}
  .aui-kid:active{transform:scale(.96)}
  .aui-empty{color:#a9b4d6;font-weight:800;font-size:20px;text-align:center;padding:30px}
  .aui-form{display:flex;flex-direction:column;gap:12px;width:min(460px,92vw)}
  .aui-form input{font:800 20px Nunito,system-ui,sans-serif;padding:14px 16px;border-radius:14px;border:2px solid #33467a;background:#101a33;color:#f4f6ff;outline:none}
  .aui-btn{min-height:60px;border-radius:18px;border:0;background:#ffc53d;color:#1b1b1b;font:900 22px Nunito,system-ui,sans-serif;cursor:pointer}
  .aui-err{color:#ff8a80;font-weight:800;min-height:22px}
  .aui-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);opacity:0;transition:.25s;z-index:60;display:flex;align-items:center;gap:16px;background:#24345c;border:2px solid #33467a;color:#f4f6ff;padding:12px 14px 12px 22px;border-radius:18px;font:800 clamp(17px,1.6vw,24px) Nunito,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:92vw}
  .aui-toast.show{opacity:1;transform:translateX(-50%)}
  .aui-toast.err{background:#7a1f1f;border-color:#ff6b5e}
  .aui-toast button{border:0;border-radius:12px;padding:10px 16px;background:#ffc53d;color:#1b1b1b;font:900 18px Nunito,system-ui,sans-serif;cursor:pointer}
  .aui-badge{position:fixed;left:12px;bottom:12px;z-index:40;background:rgba(255,197,61,.95);color:#1b1b1b;font:900 14px Nunito,system-ui,sans-serif;padding:6px 12px;border-radius:999px;pointer-events:none}`;
  const st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);
  const S=()=>window.AqlliStore;
  const LAST="aqlli-last-class";
  const lastClass={ get(){ try{ return localStorage.getItem(LAST); }catch(e){ return null; } }, set(v){ try{ localStorage.setItem(LAST,v); }catch(e){} } };
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function overlay(inner){
    const ov=document.createElement("div"); ov.className="aui-ov"; ov.innerHTML=inner; document.body.appendChild(ov); return ov;
  }

  // ---------- Toast ----------
  let toastEl=null, toastT=null;
  function toast(text,{undo=null,error=false,ms=undo?10000:3000}={}){
    if(!toastEl){ toastEl=document.createElement("div"); toastEl.className="aui-toast"; document.body.appendChild(toastEl); }
    toastEl.className="aui-toast"+(error?" err":"");
    toastEl.innerHTML=`<span>${esc(text)}</span>${undo?'<button>↩ Bekor qilish</button>':""}`;
    if(undo) toastEl.querySelector("button").onclick=()=>{ toastEl.classList.remove("show"); undo(); };
    requestAnimationFrame(()=>toastEl.classList.add("show"));
    clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove("show"),ms);
  }

  // ---------- Login ----------
  function loginDialog(msg){
    return new Promise(resolve=>{
      const ov=overlay(`<div class="aui-box" style="width:auto;align-items:center">
        <div class="aui-head"><h3>🔐 Kirish</h3></div>
        <form class="aui-form">
          <input name="e" type="email" placeholder="Email" autocomplete="username" required>
          <input name="p" type="password" placeholder="Parol" autocomplete="current-password" required>
          <div class="aui-err">${esc(msg||"")}</div>
          <button class="aui-btn" type="submit">Kirish</button>
        </form></div>`);
      const f=ov.querySelector("form");
      f.onsubmit=async e=>{
        e.preventDefault(); const err=ov.querySelector(".aui-err"); err.textContent="Tekshirilmoqda…";
        try{ const r=await S().login(f.e.value.trim(),f.p.value); if(r.needLogin){ err.textContent=r.error||"Kirib bo'lmadi"; return; } ov.remove(); resolve(r); }
        catch(x){ err.textContent=x.message; }
      };
    });
  }
  async function ensureReady(){
    let r=await S().ready();
    if(r.needLogin) r=await loginDialog(r.error);
    if(S().mode==="demo" && !document.querySelector(".aui-badge")){
      const b=document.createElement("div"); b.className="aui-badge"; b.textContent="DEMO rejim · ma'lumot shu qurilmada"; document.body.appendChild(b);
    }
    if(r.offline) toast("Internet yo'q: ballar navbatda saqlanadi va keyin yuboriladi");
    return r;
  }

  // ---------- Sinf tanlash ----------
  async function pickClass({title="Qaysi sinf?"}={}){
    await ensureReady();
    const classes=await S().classes();
    return new Promise(resolve=>{
      const ov=overlay(`<div class="aui-box" style="width:min(760px,96vw)">
        <div class="aui-head"><h3>🏫 ${esc(title)}</h3><button class="aui-x">✕</button></div>
        <div class="aui-chips">${classes.map(c=>`<button class="aui-chip" data-id="${c.id}">${c.grade}-${esc(c.letter)}</button>`).join("")||'<div class="aui-empty">Sinflar yo\'q. Avval "Sinf daftari"da sinf qo\'shing.</div>'}</div></div>`);
      ov.querySelector(".aui-x").onclick=()=>{ ov.remove(); resolve(null); };
      ov.querySelectorAll(".aui-chip").forEach(b=>b.onclick=()=>{ lastClass.set(b.dataset.id); ov.remove(); resolve(classes.find(c=>c.id===b.dataset.id)); });
    });
  }

  // ---------- O'quvchi tanlash ----------
  async function pickStudent({title="Kim javob berdi?"}={}){
    await ensureReady();
    const classes=await S().classes();
    if(!classes.length){ toast("Sinflar yo'q. Avval \"Sinf daftari\"da sinf qo'shing.",{error:true}); return null; }
    let cur=classes.find(c=>c.id===lastClass.get())||classes[0];
    return new Promise(resolve=>{
      const ov=overlay(`<div class="aui-box">
        <div class="aui-head"><h3>⭐ ${esc(title)}</h3><button class="aui-x">✕</button></div>
        <div class="aui-chips"></div><div class="aui-grid"></div></div>`);
      const chips=ov.querySelector(".aui-chips"), grid=ov.querySelector(".aui-grid");
      async function draw(){
        chips.innerHTML=classes.map(c=>`<button class="aui-chip ${c.id===cur.id?"on":""}" data-id="${c.id}">${c.grade}-${esc(c.letter)}</button>`).join("");
        chips.querySelectorAll(".aui-chip").forEach(b=>b.onclick=()=>{ cur=classes.find(c=>c.id===b.dataset.id); lastClass.set(cur.id); draw(); });
        const list=await S().students(cur.id);
        grid.innerHTML=list.map(s=>`<button class="aui-kid" data-id="${s.id}"><b>${s.avatar}</b>${esc(s.first_name)} ${esc(s.last_initial)}</button>`).join("")||'<div class="aui-empty">Bu sinfda o\'quvchilar yo\'q</div>';
        grid.querySelectorAll(".aui-kid").forEach(b=>b.onclick=()=>{ ov.remove(); resolve({cls:cur, student:list.find(s=>s.id===b.dataset.id)}); });
      }
      ov.querySelector(".aui-x").onclick=()=>{ ov.remove(); resolve(null); };
      draw();
    });
  }

  // Ball berish + toast + bekor qilish (o'yinlardan chaqiriladi)
  async function award({cls,student=null,stars=0,points=0,source,reason,label}){
    try{
      const r=await S().give({class_id:cls.id,student_id:student?student.id:null,stars,points,source,reason});
      const who=student?`${student.avatar} ${student.first_name}`:`${cls.grade}-${cls.letter}`;
      toast(`${label||"⭐"} ${who}${r.queued?" (navbatda)":""}`,{undo:async()=>{ try{ await S().revoke(r.client_id); toast("Bekor qilindi"); }catch(e){ toast(e.message,{error:true}); } }});
      return true;
    }catch(e){ toast(e.message,{error:true}); return false; }
  }

  window.AqlliUI={toast, ensureReady, pickClass, pickStudent, award, loginDialog, esc, lastClass};
})();
