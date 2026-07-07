import{j as e,u as ce,r as s,L as W,i as ie,B as K,C as le,D as de,E as J,G as U,I as Y,J as fe,K as G,M as me,N as xe,O as pe,P as ue,Q as be}from"./app-1q6E6en4.js";import{A as he}from"./AdminLayout-mIDKrDL7.js";import"./useTranslation-C2tSa4K_.js";function I(){var t;return((t=document.querySelector('meta[name="csrf-token"]'))==null?void 0:t.getAttribute("content"))??""}async function ge(){try{const t=await fetch(window.location.href,{method:"HEAD",credentials:"same-origin"});return I()}catch{return I()}}function je({fileName:t,size:n="h-14 w-14"}){var i;const o=(i=t==null?void 0:t.split(".").pop())==null?void 0:i.toLowerCase();return o==="pdf"?e.jsx(U,{className:`${n} text-rose-400`}):["doc","docx"].includes(o)?e.jsx(xe,{className:`${n} text-sky-400`}):["xls","xlsx"].includes(o)?e.jsx(pe,{className:`${n} text-emerald-400`}):["jpg","jpeg","png","gif","webp","svg"].includes(o)?e.jsx(ue,{className:`${n} text-violet-400`}):["txt","md","csv"].includes(o)?e.jsx(J,{className:`${n} text-amber-400`}):e.jsx(be,{className:`${n} text-slate-400`})}function ke({type:t,message:n,onClose:o}){if(!n)return null;const i=t==="success";return e.jsxs("div",{className:`flex items-start gap-3 p-4 rounded-2xl border mb-6 transition-all
      ${i?"bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300":"bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"}`,children:[i?e.jsx(Y,{className:"mt-0.5 shrink-0 text-emerald-500"}):e.jsx(me,{className:"mt-0.5 shrink-0 text-rose-500"}),e.jsx("p",{className:"text-sm font-medium flex-1",children:n}),e.jsx("button",{onClick:o,className:"opacity-60 hover:opacity-100 transition",children:e.jsx(G,{className:"h-3.5 w-3.5"})})]})}function ve({projects:t,users:n,tasks:o=[],kanbans:i=[]}){var X;const{errors:f={},flash:v={},auth:ye}=ce().props,D=new URLSearchParams(window.location.search),g=D.get("task_id"),p=D.get("project_id"),[m,A]=s.useState("import"),[l,N]=s.useState(""),[d,L]=s.useState(null),[y,P]=s.useState(p||((X=t[0])==null?void 0:X.id)||""),[c,R]=s.useState(g||""),[w,F]=s.useState(""),[j,B]=s.useState(null),[C,V]=s.useState(""),[u,Q]=s.useState(""),[Z,b]=s.useState(v.success||v.error||""),[ee,S]=s.useState(v.success?"success":"error"),[_,T]=s.useState(!1),[ae,$]=s.useState(!1),q=s.useRef(null),O=s.useRef(null);s.useEffect(()=>{const a=O.current;a&&(a.style.height="auto",a.style.height=`${Math.min(a.scrollHeight,600)}px`)},[u]),s.useEffect(()=>{if(!c){B(null);return}fetch(`/api/tasks/${c}/details`).then(a=>a.ok?a.json():null).then(a=>{a!=null&&a.success&&a.task&&(B(a.task),a.task.sprint_id&&F(a.task.sprint_id))}).catch(()=>{})},[c]),s.useEffect(()=>{p&&P(p),g&&R(g)},[p,g]);const M=s.useCallback(async(a,r=!1)=>{const h=I(),k=await fetch("/files",{method:"POST",credentials:"same-origin",headers:{Accept:"application/json","X-Requested-With":"XMLHttpRequest","X-CSRF-TOKEN":h},body:a});return k.status===419&&!r?(await ge(),M(a,!0)):k},[]),re=async a=>{if(a.preventDefault(),T(!0),b(""),!y){b("Veuillez sélectionner un projet."),S("error"),T(!1);return}try{const r=new FormData;if(r.append("name",l),r.append("project_id",y),d)r.append("file",d);else if(u){const E=new Blob([u],{type:"text/plain;charset=utf-8"});r.append("file",E,l.endsWith(".txt")?l:`${l}.txt`)}else throw new Error("Aucun contenu fourni.");c&&r.append("task_id",c),w&&r.append("kanban_id",w),C&&r.append("description",C);const h=new AbortController,k=setTimeout(()=>h.abort(),6e4),z=await M(r);clearTimeout(k);const oe=await z.text();let x;try{x=JSON.parse(oe)}catch{throw new Error("Réponse serveur invalide.")}if(!z.ok)throw new Error(x.message||`Erreur HTTP ${z.status}`);if(!x.success)throw new Error(x.message||"Échec de la création.");b("Fichier créé avec succès — redirection…"),S("success"),setTimeout(()=>{var H;const E=c?`/tasks/${c}`:(H=x.data)!=null&&H.id?`/files/${x.data.id}`:"/files";window.location.href=E},1200)}catch(r){const h=r.name==="AbortError"?"La requête a expiré. Vérifiez votre connexion ou réessayez avec un fichier plus petit.":r.message||"Une erreur est survenue.";b(h),S("error")}finally{T(!1)}},se=a=>{const r=a.target.files[0];r&&(L(r),l||N(r.name.replace(/\.[^/.]+$/,"")))},te=a=>{a.preventDefault(),$(!1);const r=a.dataTransfer.files[0];r&&(L(r),l||N(r.name.replace(/\.[^/.]+$/,"")))},ne=a=>a<1024?`${a} B`:a<1024**2?`${(a/1024).toFixed(1)} KB`:`${(a/1024**2).toFixed(1)} MB`;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
      `}),e.jsx("div",{className:"cf-root min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-8",children:e.jsxs("div",{className:"max-w-3xl mx-auto",children:[e.jsx("div",{className:"cf-fade-up flex items-center justify-between mb-8",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs(W,{href:"/files",className:"cf-back-btn",children:[e.jsx(ie,{className:"h-3.5 w-3.5"}),"Retour"]}),e.jsxs("div",{className:"flex items-center gap-2.5 ",children:[e.jsx("div",{className:"cf-dot"}),e.jsx("h1",{className:"cf-section-title",children:m==="import"?"Importer un fichier":"Créer un fichier texte"})]})]})}),e.jsx("div",{className:"cf-fade-up cf-delay-1",children:e.jsx(ke,{type:ee,message:Z,onClose:()=>b("")})}),e.jsxs("div",{className:"cf-fade-up cf-delay-1 cf-glass rounded-2xl p-1.5 inline-flex gap-1 mb-6 shadow-sm",children:[e.jsx("button",{type:"button",onClick:()=>A("import"),className:`cf-tab ${m==="import"?"active":""}`,children:e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(K,{className:"h-4 w-4"}),"Importer un fichier"]})}),e.jsx("button",{type:"button",onClick:()=>A("create"),className:`cf-tab ${m==="create"?"active":""}`,children:e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(le,{className:"h-3.5 w-3.5"}),"Créer un fichier texte"]})})]}),e.jsx("div",{className:"cf-fade-up cf-delay-2 cf-info-box mb-6",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(de,{className:"mt-0.5 text-blue-400 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1",children:"Formats éditables en ligne"}),e.jsxs("div",{className:"flex flex-wrap gap-2 mt-2",children:[e.jsxs("span",{className:"cf-badge cf-badge-green",children:[e.jsx(J,{className:"h-3 w-3"})," .txt — éditable"]}),e.jsxs("span",{className:"cf-badge cf-badge-amber",children:[e.jsx(U,{className:"h-3 w-3"})," .pdf .docx .xlsx — télécharger pour modifier"]})]})]})]})}),e.jsx("div",{className:"cf-fade-up cf-delay-3 cf-card rounded-2xl overflow-hidden",children:e.jsxs("form",{onSubmit:re,className:"p-7 space-y-6",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"cf-label",htmlFor:"name",children:["Nom du fichier ",e.jsx("span",{className:"text-rose-400 normal-case font-normal",children:"*"})]}),e.jsx("input",{id:"name",type:"text",value:l,onChange:a=>N(a.target.value),className:"cf-input",placeholder:"ex: rapport-q3-2024",required:!0}),m==="create"&&e.jsx("p",{className:"mt-1.5 text-xs text-slate-400 cf-mono",children:".txt ajouté automatiquement si absent"}),f.name&&e.jsx("p",{className:"mt-1 text-xs text-rose-500",children:f.name})]}),m==="import"?e.jsxs("div",{children:[e.jsxs("label",{className:"cf-label",children:["Fichier à importer ",e.jsx("span",{className:"text-rose-400 normal-case font-normal",children:"*"})]}),e.jsxs("div",{className:`cf-drop-zone ${ae?"over":""}`,onDragOver:a=>{a.preventDefault(),$(!0)},onDragLeave:()=>$(!1),onDrop:te,onClick:()=>{var a;return(a=q.current)==null?void 0:a.click()},children:[e.jsx("input",{ref:q,type:"file",className:"sr-only",onChange:se}),d?e.jsxs("div",{className:"flex flex-col items-center gap-2",children:[e.jsx(je,{fileName:d.name}),e.jsx("p",{className:"font-semibold text-slate-700 dark:text-slate-200 text-sm mt-1",children:d.name}),e.jsxs("p",{className:"text-xs text-slate-400 cf-mono",children:[ne(d.size),"  ·  ",d.type||"type inconnu"]}),e.jsxs("span",{className:"cf-badge cf-badge-green mt-1",children:[e.jsx(Y,{className:"h-3 w-3"})," Prêt à l'envoi"]})]}):e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[e.jsx("div",{className:"h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center",children:e.jsx(K,{className:"h-7 w-7 text-indigo-500"})}),e.jsxs("div",{children:[e.jsxs("p",{className:"font-semibold text-slate-600 dark:text-slate-300 text-sm",children:["Glissez un fichier ici ",e.jsx("span",{className:"text-slate-400",children:"ou"})," ",e.jsx("span",{className:"text-indigo-500 underline underline-offset-2",children:"parcourir"})]}),e.jsx("p",{className:"text-xs text-slate-400 mt-1",children:"PDF, DOCX, XLSX, images, TXT — max 100 Mo"})]})]})]}),f.file&&e.jsx("p",{className:"mt-1 text-xs text-rose-500",children:f.file})]}):e.jsxs("div",{children:[e.jsx("label",{className:"cf-label",htmlFor:"fileContent",children:"Contenu du fichier"}),e.jsxs("div",{className:"relative",children:[e.jsx("textarea",{id:"fileContent",ref:O,value:u,onChange:a=>Q(a.target.value),className:"cf-input cf-mono resize-none leading-relaxed",style:{minHeight:260,maxHeight:560},placeholder:"Saisissez le contenu de votre fichier texte…"}),e.jsxs("div",{className:"absolute bottom-3 right-3 text-xs text-slate-400 cf-mono bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-md",children:[u.length," car."]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-5",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"cf-label",htmlFor:"project",children:["Projet ",e.jsx("span",{className:"text-rose-400 normal-case font-normal",children:"*"})]}),e.jsx("select",{id:"project",value:y,onChange:a=>P(a.target.value),className:"cf-input",required:!0,disabled:!!p,children:t.map(a=>e.jsx("option",{value:a.id,children:a.name},a.id))}),f.project_id&&e.jsx("p",{className:"mt-1 text-xs text-rose-500",children:f.project_id})]}),e.jsxs("div",{children:[e.jsx("label",{className:"cf-label",htmlFor:"task",children:"Tâche liée"}),e.jsxs("select",{id:"task",value:c,onChange:a=>{R(a.target.value),a.target.value||F("")},className:"cf-input",children:[e.jsx("option",{value:"",children:"Aucune tâche (optionnel)"}),o.map(a=>e.jsx("option",{value:a.id,children:a.title||`Tâche #${a.id}`},a.id))]})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"cf-label",htmlFor:"kanban",children:["Tableau Kanban",(j==null?void 0:j.sprint)&&e.jsxs("span",{className:"ml-2 text-indigo-400 normal-case font-normal text-xs",children:["· sprint auto-sélectionné : ",j.sprint.name]})]}),e.jsxs("select",{id:"kanban",value:w,onChange:a=>F(a.target.value),className:"cf-input",children:[e.jsx("option",{value:"",children:"Aucun tableau (optionnel)"}),i.map(a=>e.jsx("option",{value:a.id,children:a.name},a.id))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"cf-label",htmlFor:"description",children:"Description"}),e.jsx("textarea",{id:"description",value:C,onChange:a=>V(a.target.value),rows:3,className:"cf-input resize-none",placeholder:"Décrivez brièvement ce fichier…"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800",children:[e.jsx("button",{type:"submit",disabled:_,className:"cf-btn-primary",children:_?e.jsxs(e.Fragment,{children:[e.jsxs("svg",{className:"cf-spin h-4 w-4",viewBox:"0 0 24 24",fill:"none",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"3",strokeOpacity:".25"}),e.jsx("path",{d:"M22 12a10 10 0 0 1-10 10",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round"})]}),"Envoi en cours…"]}):e.jsxs(e.Fragment,{children:[e.jsx(fe,{className:"h-4 w-4"}),m==="import"?"Importer le fichier":"Créer le fichier"]})}),e.jsxs(W,{href:"/files",className:"cf-btn-ghost",children:[e.jsx(G,{className:"h-4 w-4"}),"Annuler"]})]})]})})]})})]})}const Ne=t=>e.jsx(ve,{...t});Ne.layout=t=>e.jsx(he,{children:t});export{Ne as default};
