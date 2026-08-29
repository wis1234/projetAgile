import{j as e,D as le,r,L as U,F as de,$ as R,a0 as fe,a1 as me,a2 as K,a3 as V,i as q,a4 as pe,q as J,a5 as xe,a6 as ue,a7 as be,a8 as he,a9 as ge,Q as je}from"./app-DihdQjEV.js";import{A as ke}from"./AdminLayout-Ix8ImJ2Q.js";import"./GlobalFooter-BqzKkX_x.js";import"./LiveKitCallModal-b_2PIWf0.js";import"./useTranslation-DDocgIiL.js";import"./PushNotificationManager-3nkuwVmM.js";function ve(){var s;return((s=document.querySelector('meta[name="csrf-token"]'))==null?void 0:s.getAttribute("content"))??""}async function Ne(){const t=(await(await fetch(window.location.pathname+window.location.search,{method:"GET",credentials:"same-origin",headers:{"X-Requested-With":"XMLHttpRequest"},cache:"no-store"})).text()).match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);if(!t||!t[1])throw new Error("Impossible de renouveler le jeton de sécurité. Veuillez rafraîchir la page.");const n=document.querySelector('meta[name="csrf-token"]');return n&&n.setAttribute("content",t[1]),t[1]}function we(s,c,{onProgress:t,onStatusChange:n}={}){const d=(g=!1)=>new Promise((y,p)=>{const o=new XMLHttpRequest;o.open("POST",s,!0),o.setRequestHeader("Accept","application/json"),o.setRequestHeader("X-Requested-With","XMLHttpRequest"),o.setRequestHeader("X-CSRF-TOKEN",ve()),o.timeout=9e4,o.upload.onprogress=l=>{if(l.lengthComputable&&t){const f=Math.min(90,Math.round(l.loaded/l.total*90));t(f)}},o.onload=async()=>{if(o.status===419&&!g){try{n==null||n("security"),await Ne(),y(await d(!0))}catch(f){p(f)}return}let l;try{l=JSON.parse(o.responseText)}catch{p(new Error("Réponse serveur invalide."));return}o.status>=200&&o.status<300&&l.success?y(l):p(new Error(l.message||`Erreur HTTP ${o.status}`))},o.onerror=()=>p(new Error("Erreur réseau. Vérifiez votre connexion.")),o.ontimeout=()=>p(new Error("La requête a expiré. Réessayez avec un fichier plus petit.")),o.send(c)});return d(!1)}function ye({fileName:s,size:c="h-14 w-14"}){var n;const t=(n=s==null?void 0:s.split(".").pop())==null?void 0:n.toLowerCase();return t==="pdf"?e.jsx(V,{className:`${c} text-rose-400`}):["doc","docx"].includes(t)?e.jsx(ue,{className:`${c} text-sky-400`}):["xls","xlsx"].includes(t)?e.jsx(be,{className:`${c} text-emerald-400`}):["jpg","jpeg","png","gif","webp","svg"].includes(t)?e.jsx(he,{className:`${c} text-violet-400`}):["txt","md","csv"].includes(t)?e.jsx(K,{className:`${c} text-amber-400`}):e.jsx(ge,{className:`${c} text-slate-400`})}function Fe({type:s,message:c,onClose:t}){if(!c)return null;const n=s==="success";return e.jsxs("div",{className:`flex items-start gap-3 p-4 rounded-2xl border mb-6 transition-all
      ${n?"bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300":"bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"}`,children:[n?e.jsx(q,{className:"mt-0.5 shrink-0 text-emerald-500"}):e.jsx(xe,{className:"mt-0.5 shrink-0 text-rose-500"}),e.jsx("p",{className:"text-sm font-medium flex-1",children:c}),e.jsx("button",{onClick:t,className:"opacity-60 hover:opacity-100 transition",children:e.jsx(J,{className:"h-3.5 w-3.5"})})]})}function Se({visible:s,fileName:c,progress:t,stage:n}){if(!s)return null;const d={uploading:"Envoi du fichier en cours…",security:"Renouvellement de la session de sécurité…",finalizing:"Finalisation de l'import…",done:"Import terminé avec succès"}[n]||"Préparation de l'envoi…";return e.jsx("div",{className:"cf-modal-backdrop",role:"dialog","aria-modal":"true","aria-busy":n!=="done",children:e.jsxs("div",{className:"cf-modal-card cf-fade-up",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-4",children:[e.jsx("div",{className:"cf-modal-icon",children:n==="done"?e.jsx(q,{className:"h-5 w-5 text-emerald-500"}):e.jsx(R,{className:"h-5 w-5 text-indigo-500"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("p",{className:"text-sm font-semibold text-slate-700 dark:text-slate-200 truncate",children:c||"Votre fichier"}),e.jsx("p",{className:"text-xs text-slate-400",children:d})]})]}),e.jsx("div",{className:"cf-progress-track",children:e.jsx("div",{className:"cf-progress-fill",style:{width:`${t}%`}})}),e.jsxs("div",{className:"flex justify-between items-center mt-2",children:[e.jsxs("span",{className:"text-[11px] text-slate-400 cf-mono",children:[t,"%"]}),n==="security"&&e.jsxs("span",{className:"text-[11px] text-amber-500 flex items-center gap-1",children:[e.jsx(je,{className:"h-3 w-3"})," Nouvelle tentative automatique"]})]})]})})}function Ce({projects:s,users:c,tasks:t=[],kanbans:n=[]}){var B;const{errors:d={},flash:g={},auth:y}=le().props,p=new URLSearchParams(window.location.search),o=p.get("task_id"),l=p.get("project_id"),[f,I]=r.useState("import"),[x,F]=r.useState(""),[u,D]=r.useState(null),[S,L]=r.useState(l||((B=s[0])==null?void 0:B.id)||""),[b,A]=r.useState(o||""),[C,T]=r.useState(""),[w,M]=r.useState(null),[$,Y]=r.useState(""),[j,G]=r.useState(""),[Q,k]=r.useState(g.success||g.error||""),[Z,z]=r.useState(g.success?"success":"error"),[E,H]=r.useState(!1),[ee,P]=r.useState(!1),[ae,v]=r.useState(0),[re,N]=r.useState("idle"),[se,te]=r.useState(""),X=r.useRef(null),_=r.useRef(null);r.useEffect(()=>{const a=_.current;a&&(a.style.height="auto",a.style.height=`${Math.min(a.scrollHeight,600)}px`)},[j]),r.useEffect(()=>{if(!b){M(null);return}fetch(`/api/tasks/${b}/details`).then(a=>a.ok?a.json():null).then(a=>{a!=null&&a.success&&a.task&&(M(a.task),a.task.sprint_id&&T(a.task.sprint_id))}).catch(()=>{})},[b]),r.useEffect(()=>{l&&L(l),o&&A(o)},[l,o]);const oe=async a=>{if(a.preventDefault(),k(""),!S){k("Veuillez sélectionner un projet."),z("error");return}try{const i=new FormData;i.append("name",x),i.append("project_id",S);let h=x;if(u)i.append("file",u),h=u.name;else if(j){h=x.endsWith(".txt")?x:`${x}.txt`;const m=new Blob([j],{type:"text/plain;charset=utf-8"});i.append("file",m,h)}else throw new Error("Aucun contenu fourni.");b&&i.append("task_id",b),C&&i.append("kanban_id",C),$&&i.append("description",$),H(!0),te(h),N("uploading"),v(2);const O=await we("/files",i,{onProgress:m=>v(m),onStatusChange:m=>N(m)});N("finalizing"),v(97),await new Promise(m=>setTimeout(m,300)),N("done"),v(100),k("Fichier créé avec succès — redirection…"),z("success"),setTimeout(()=>{var W;const m=b?`/tasks/${b}`:(W=O.data)!=null&&W.id?`/files/${O.data.id}`:"/files";window.location.href=m},600)}catch(i){H(!1),N("idle"),v(0);const h=i.message||"Une erreur est survenue.";k(h),z("error")}},ne=a=>{const i=a.target.files[0];i&&(D(i),x||F(i.name.replace(/\.[^/.]+$/,"")))},ie=a=>{a.preventDefault(),P(!1);const i=a.dataTransfer.files[0];i&&(D(i),x||F(i.name.replace(/\.[^/.]+$/,"")))},ce=a=>a<1024?`${a} B`:a<1024**2?`${(a/1024).toFixed(1)} KB`:`${(a/1024**2).toFixed(1)} MB`;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .cf-root { font-family: 'Sora', sans-serif; }
        .cf-mono { font-family: 'JetBrains Mono', monospace; }

        .cf-glass {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.8);
        }
        .dark .cf-glass {
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .cf-card {
          background: #fff;
          border: 1px solid #e8edf5;
          box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06);
        }
        .dark .cf-card {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 1px 3px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3);
        }

        .cf-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          border: 1.5px solid #dde3ee;
          background: #f8fafc;
          font-size: 0.875rem;
          color: #0f172a;
          transition: border-color .15s, box-shadow .15s;
          outline: none;
          font-family: 'Sora', sans-serif;
        }
        .cf-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
          background: #fff;
        }
        .dark .cf-input {
          background: #1e293b;
          border-color: rgba(255,255,255,.1);
          color: #f1f5f9;
        }
        .dark .cf-input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 3px rgba(129,140,248,.15);
          background: #1e293b;
        }

        .cf-label {
          display: block;
          font-size: .75rem;
          font-weight: 600;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: .4rem;
        }
        .dark .cf-label { color: #94a3b8; }

        .cf-tab {
          position: relative;
          padding: .625rem 1.25rem;
          font-size: .875rem;
          font-weight: 500;
          border-radius: .75rem;
          transition: all .2s;
          cursor: pointer;
          border: none;
          background: transparent;
        }
        .cf-tab.active {
          background: #1d4ed8;
          color: #fff;
          box-shadow: 0 4px 14px rgba(29,78,216,.35);
        }
        .cf-tab:not(.active) { color: #64748b; }
        .cf-tab:not(.active):hover { background: #f1f5f9; color: #334155; }
        .dark .cf-tab:not(.active) { color: #94a3b8; }
        .dark .cf-tab:not(.active):hover { background: #1e293b; color: #cbd5e1; }

        .cf-btn-primary {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .75rem 1.75rem;
          background: #1d4ed8;
          color: #fff;
          font-weight: 600;
          font-size: .9rem;
          border-radius: .875rem;
          border: none;
          cursor: pointer;
          transition: opacity .15s, transform .15s, box-shadow .15s;
          box-shadow: 0 4px 16px rgba(29,78,216,.35);
          font-family: 'Sora', sans-serif;
        }
        .cf-btn-primary:hover:not(:disabled) {
          opacity: .92; transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,.45);
        }
        .cf-btn-primary:disabled { opacity: .55; cursor: not-allowed; }

        .cf-btn-ghost {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .75rem 1.5rem;
          background: transparent;
          color: #64748b;
          font-weight: 500;
          font-size: .9rem;
          border-radius: .875rem;
          border: 1.5px solid #dde3ee;
          cursor: pointer;
          transition: all .15s;
          text-decoration: none;
          font-family: 'Sora', sans-serif;
        }
        .cf-btn-ghost:hover { background: #f8fafc; border-color: #c7d0e0; color: #334155; }
        .dark .cf-btn-ghost {
          border-color: rgba(255,255,255,.1); color: #94a3b8;
        }
        .dark .cf-btn-ghost:hover { background: #1e293b; color: #cbd5e1; }

        .cf-drop-zone {
          border: 2px dashed #c7d2fe;
          border-radius: 1rem;
          background: #f5f3ff;
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all .2s;
        }
        .cf-drop-zone:hover, .cf-drop-zone.over {
          border-color: #6366f1;
          background: #ede9fe;
        }
        .dark .cf-drop-zone {
          border-color: rgba(99,102,241,.3);
          background: rgba(99,102,241,.05);
        }
        .dark .cf-drop-zone:hover, .dark .cf-drop-zone.over {
          border-color: #818cf8;
          background: rgba(99,102,241,.1);
        }

        .cf-info-box {
          background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
          border: 1px solid #bfdbfe;
          border-radius: 1rem;
          padding: 1rem 1.25rem;
        }
        .dark .cf-info-box {
          background: linear-gradient(135deg, rgba(30,58,138,.2) 0%, rgba(20,83,45,.2) 100%);
          border-color: rgba(96,165,250,.2);
        }

        .cf-badge {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .2rem .6rem;
          border-radius: 999px;
          font-size: .7rem;
          font-weight: 600;
          letter-spacing: .03em;
        }
        .cf-badge-green { background: #dcfce7; color: #166534; }
        .cf-badge-amber { background: #fef3c7; color: #92400e; }
        .dark .cf-badge-green { background: rgba(22,163,74,.2); color: #86efac; }
        .dark .cf-badge-amber { background: rgba(217,119,6,.2); color: #fcd34d; }

        .cf-back-btn {
          display: inline-flex; align-items: center; gap: .5rem;
          padding: .5rem 1rem;
          border-radius: .75rem;
          font-size: .875rem;
          font-weight: 500;
          color: #6366f1;
          background: #eef2ff;
          border: none; cursor: pointer; text-decoration: none;
          transition: all .15s;
        }
        .cf-back-btn:hover { background: #e0e7ff; color: #4f46e5; }
        .dark .cf-back-btn { background: rgba(99,102,241,.15); color: #a5b4fc; }
        .dark .cf-back-btn:hover { background: rgba(99,102,241,.25); }

        .cf-section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -.02em;
        }
        .dark .cf-section-title { color: #f1f5f9; }

        .cf-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; }

        @keyframes cf-spin {
          to { transform: rotate(360deg); }
        }
        .cf-spin { animation: cf-spin .8s linear infinite; }

        @keyframes cf-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cf-fade-up { animation: cf-fade-up .35s ease both; }
        .cf-delay-1 { animation-delay: .05s; }
        .cf-delay-2 { animation-delay: .1s; }
        .cf-delay-3 { animation-delay: .15s; }

        /* ── Modal de progression d'import ─────────────────────────────── */
        .cf-modal-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(15,23,42,0.35);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .cf-modal-card {
          width: 100%; max-width: 380px;
          background: #fff;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 20px 60px rgba(0,0,0,.25);
          border: 1px solid #e8edf5;
        }
        .dark .cf-modal-card {
          background: #0f172a;
          border-color: rgba(255,255,255,.08);
        }
        .cf-modal-icon {
          width: 2.5rem; height: 2.5rem; border-radius: .75rem;
          background: #eef2ff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dark .cf-modal-icon { background: rgba(99,102,241,.15); }

        .cf-progress-track {
          width: 100%; height: 6px; border-radius: 999px;
          background: #eef1f7; overflow: hidden;
        }
        .dark .cf-progress-track { background: rgba(255,255,255,.08); }
        .cf-progress-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #6366f1, #3b82f6);
          transition: width .25s ease;
        }
      `}),e.jsx("div",{className:"cf-root min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8",children:e.jsxs("div",{className:"max-w-3xl mx-auto",children:[e.jsx("div",{className:"cf-fade-up flex items-center justify-between mb-8",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs(U,{href:"/files",className:"cf-back-btn",children:[e.jsx(de,{className:"h-3.5 w-3.5"}),"Retour"]}),e.jsxs("div",{className:"flex items-center gap-2.5 ",children:[e.jsx("div",{className:"cf-dot"}),e.jsx("h1",{className:"cf-section-title",children:f==="import"?"Importer un fichier":"Créer un fichier texte"})]})]})}),e.jsx("div",{className:"cf-fade-up cf-delay-1",children:e.jsx(Fe,{type:Z,message:Q,onClose:()=>k("")})}),e.jsxs("div",{className:"cf-fade-up cf-delay-1 cf-glass rounded-2xl p-1.5 inline-flex gap-1 mb-6 shadow-sm",children:[e.jsx("button",{type:"button",onClick:()=>I("import"),className:`cf-tab ${f==="import"?"active":""}`,children:e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(R,{className:"h-4 w-4"}),"Importer un fichier"]})}),e.jsx("button",{type:"button",onClick:()=>I("create"),className:`cf-tab ${f==="create"?"active":""}`,children:e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(fe,{className:"h-3.5 w-3.5"}),"Créer un fichier texte"]})})]}),e.jsx("div",{className:"cf-fade-up cf-delay-2 cf-info-box mb-6",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(me,{className:"mt-0.5 text-blue-400 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1",children:"Formats éditables en ligne"}),e.jsxs("div",{className:"flex flex-wrap gap-2 mt-2",children:[e.jsxs("span",{className:"cf-badge cf-badge-green",children:[e.jsx(K,{className:"h-3 w-3"})," .txt — éditable"]}),e.jsxs("span",{className:"cf-badge cf-badge-amber",children:[e.jsx(V,{className:"h-3 w-3"})," .pdf .docx .xlsx — télécharger pour modifier"]})]})]})]})}),e.jsx("div",{className:"cf-fade-up cf-delay-3 cf-card rounded-2xl overflow-hidden",children:e.jsxs("form",{onSubmit:oe,className:"p-7 space-y-6",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"cf-label",htmlFor:"name",children:["Nom du fichier ",e.jsx("span",{className:"text-rose-400 normal-case font-normal",children:"*"})]}),e.jsx("input",{id:"name",type:"text",value:x,onChange:a=>F(a.target.value),className:"cf-input",placeholder:"ex: rapport-q3-2024",required:!0}),f==="create"&&e.jsx("p",{className:"mt-1.5 text-xs text-slate-400 cf-mono",children:".txt ajouté automatiquement si absent"}),d.name&&e.jsx("p",{className:"mt-1 text-xs text-rose-500",children:d.name})]}),f==="import"?e.jsxs("div",{children:[e.jsxs("label",{className:"cf-label",children:["Fichier à importer ",e.jsx("span",{className:"text-rose-400 normal-case font-normal",children:"*"})]}),e.jsxs("div",{className:`cf-drop-zone ${ee?"over":""}`,onDragOver:a=>{a.preventDefault(),P(!0)},onDragLeave:()=>P(!1),onDrop:ie,onClick:()=>{var a;return(a=X.current)==null?void 0:a.click()},children:[e.jsx("input",{ref:X,type:"file",className:"sr-only",onChange:ne}),u?e.jsxs("div",{className:"flex flex-col items-center gap-2",children:[e.jsx(ye,{fileName:u.name}),e.jsx("p",{className:"font-semibold text-slate-700 dark:text-slate-200 text-sm mt-1",children:u.name}),e.jsxs("p",{className:"text-xs text-slate-400 cf-mono",children:[ce(u.size),"  ·  ",u.type||"type inconnu"]}),e.jsxs("span",{className:"cf-badge cf-badge-green mt-1",children:[e.jsx(q,{className:"h-3 w-3"})," Prêt à l'envoi"]})]}):e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[e.jsx("div",{className:"h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center",children:e.jsx(R,{className:"h-7 w-7 text-indigo-500"})}),e.jsxs("div",{children:[e.jsxs("p",{className:"font-semibold text-slate-600 dark:text-slate-300 text-sm",children:["Glissez un fichier ici ",e.jsx("span",{className:"text-slate-400",children:"ou"})," ",e.jsx("span",{className:"text-indigo-500 underline underline-offset-2",children:"parcourir"})]}),e.jsx("p",{className:"text-xs text-slate-400 mt-1",children:"PDF, DOCX, XLSX, images, TXT — max 100 Mo"})]})]})]}),d.file&&e.jsx("p",{className:"mt-1 text-xs text-rose-500",children:d.file})]}):e.jsxs("div",{children:[e.jsx("label",{className:"cf-label",htmlFor:"fileContent",children:"Contenu du fichier"}),e.jsxs("div",{className:"relative",children:[e.jsx("textarea",{id:"fileContent",ref:_,value:j,onChange:a=>G(a.target.value),className:"cf-input cf-mono resize-none leading-relaxed",style:{minHeight:260,maxHeight:560},placeholder:"Saisissez le contenu de votre fichier texte…"}),e.jsxs("div",{className:"absolute bottom-3 right-3 text-xs text-slate-400 cf-mono bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-md",children:[j.length," car."]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"cf-label",htmlFor:"project",children:["Projet ",e.jsx("span",{className:"text-rose-400 normal-case font-normal",children:"*"})]}),e.jsx("select",{id:"project",value:S,onChange:a=>L(a.target.value),className:"cf-input",required:!0,disabled:!!l,children:s.map(a=>e.jsx("option",{value:a.id,children:a.name},a.id))}),d.project_id&&e.jsx("p",{className:"mt-1 text-xs text-rose-500",children:d.project_id})]}),e.jsxs("div",{children:[e.jsx("label",{className:"cf-label",htmlFor:"task",children:"Tâche liée"}),e.jsxs("select",{id:"task",value:b,onChange:a=>{A(a.target.value),a.target.value||T("")},className:"cf-input",children:[e.jsx("option",{value:"",children:"Aucune tâche (optionnel)"}),t.map(a=>e.jsx("option",{value:a.id,children:a.title||`Tâche #${a.id}`},a.id))]})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"cf-label",htmlFor:"kanban",children:["Tableau Kanban",(w==null?void 0:w.sprint)&&e.jsxs("span",{className:"ml-2 text-indigo-400 normal-case font-normal text-xs",children:["· sprint auto-sélectionné : ",w.sprint.name]})]}),e.jsxs("select",{id:"kanban",value:C,onChange:a=>T(a.target.value),className:"cf-input",children:[e.jsx("option",{value:"",children:"Aucun tableau (optionnel)"}),n.map(a=>e.jsx("option",{value:a.id,children:a.name},a.id))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"cf-label",htmlFor:"description",children:"Description"}),e.jsx("textarea",{id:"description",value:$,onChange:a=>Y(a.target.value),rows:3,className:"cf-input resize-none",placeholder:"Décrivez brièvement ce fichier…"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800",children:[e.jsx("button",{type:"submit",disabled:E,className:"cf-btn-primary",children:E?e.jsxs(e.Fragment,{children:[e.jsxs("svg",{className:"cf-spin h-4 w-4",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"3",strokeOpacity:".25"}),e.jsx("path",{d:"M22 12a10 10 0 0 1-10 10",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round"})]}),"Envoi en cours…"]}):e.jsxs(e.Fragment,{children:[e.jsx(pe,{className:"h-4 w-4"}),f==="import"?"Importer le fichier":"Créer le fichier"]})}),e.jsxs(U,{href:"/files",className:"cf-btn-ghost",children:[e.jsx(J,{className:"h-4 w-4"}),"Annuler"]})]})]})})]})}),e.jsx(Se,{visible:E,fileName:se,progress:ae,stage:re})]})}const Te=s=>e.jsx(Ce,{...s});Te.layout=s=>e.jsx(ke,{children:s});export{Te as default};
