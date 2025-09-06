import React, { useEffect, useState } from "react";
import {
  buildActivity, simulateToilet, calcDaily,
  waterTargetMl, mealsPerDay
} from "./lib/logic.js";

// Simple storage helpers
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function load(k, fb){ try{ const s = localStorage.getItem(k); return s? JSON.parse(s) : fb; }catch(e){ return fb; } }

// Theme tokens
const THEME = {
  bgGrad: "linear-gradient(180deg,#FFF5F8,#FFF9FB)",
  headerGrad: "linear-gradient(90deg,#FFE6EE,#FFF5F8)",
  primaryGrad: "linear-gradient(90deg,#FF5C8A,#FF8FB1)",
  softPink: "#FFD6E2",
  softBorder: "#F7E1EA",
  textMain: "#3B3B3B",
  textSub: "#6B7280"
};

// Inject component styles (template literal avoids JSX parsing issues)
const CSS_ID = "pawpal-warm-css";
if (typeof document !== "undefined" && !document.getElementById(CSS_ID)){
  const tag = document.createElement("style");
  tag.id = CSS_ID;
  tag.innerHTML = `
  .btn-primary{padding:10px 16px;border-radius:16px;background:linear-gradient(90deg,#FF5C8A,#FF8FB1);color:#fff;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(255,92,138,.25)}
  .btn-primary.disabled{opacity:.5;cursor:not-allowed}
  .btn-secondary{padding:10px 16px;border-radius:16px;background:#fff;border:1px solid #F2D7E0;color:#3B3B3B;cursor:pointer;box-shadow:0 4px 14px rgba(255,92,138,.08)}
  .link-btn{background:none;border:none;cursor:pointer;color:#C1507B;text-decoration:underline}
  .card{background:rgba(255,255,255,.96);border:1px solid #F7E1EA;border-radius:28px;padding:18px;box-shadow:0 12px 40px rgba(255,92,138,.06)}
  .chip{padding:2px 10px;border:1px solid #F7CAD8;border-radius:999px;font-size:12px;text-transform:uppercase;color:#C1507B;background:#FFF1F5}
  .input{width:100%;padding:12px;border:1px solid #F2D7E0;border-radius:16px;box-shadow:0 2px 8px rgba(255,92,138,.04)}
  `;
  document.head.appendChild(tag);
}

// Small UI atoms
function Field({label, children}){ return (
  <label style={{display:"block"}}>
    <div style={{color:"#8E98A5", fontSize:14}}>{label}</div>
    <div style={{marginTop:6}}>{children}</div>
  </label>
)}
function Info({label, value, extra}){ return (
  <div>
    <div style={{color:"#8E98A5", fontSize:14}}>{label}</div>
    <div style={{marginTop:4, fontSize:18, fontWeight:700, display:"flex", alignItems:"center", gap:8, color:THEME.textMain}}>{value}{extra}</div>
  </div>
)}
function Mini({label, value}){ return (
  <div>
    <div style={{color:"#8E98A5", fontSize:14}}>{label}</div>
    <div style={{marginTop:4, fontSize:20, fontWeight:800, color:THEME.textMain}}>{value}</div>
  </div>
)}
function Card({title, actionText, onAction, children}){ return (
  <div className="card">
    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6}}>
      <div style={{fontWeight:700, color:THEME.textMain}}>{title}</div>
      <button className="btn-secondary" onClick={onAction} aria-label={title + " action"}>{actionText}</button>
    </div>
    <div style={{color:"#4B5563"}}>{children}</div>
  </div>
)}

// App
export default function App(){
  const [page, setPage] = useState("landing");
  const [profile, setProfile] = useState(load("pp_profile_en", { name:"", species:"", breed:"", age:"", gender:"", weight:"", diet:"", living:"" }));
  const [history, setHistory] = useState(load("pp_history_en", []));
  const [forum, setForum] = useState(load("pp_forum_en", []));

  const [videoFile, setVideoFile] = useState(null);
  const [videoRes, setVideoRes] = useState(null);
  const [speciesPick, setSpeciesPick] = useState("Cat");

  const [toiletFile, setToiletFile] = useState(null);
  const [toiletRes, setToiletRes] = useState(null);

  // Drag states
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [toiletDragOver, setToiletDragOver] = useState(false);

  // Knowledge/Forum state (top-level hooks)
  const [knowledgeTab, setKnowledgeTab] = useState("guides");
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [forumTitle, setForumTitle] = useState("");
  const [forumBody, setForumBody] = useState("");

  useEffect(() => { save("pp_profile_en", profile); }, [profile]);
  useEffect(() => { save("pp_history_en", history.slice(-50)); }, [history]);
  useEffect(() => { save("pp_forum_en", forum.slice(-100)); }, [forum]);

  const Header = (
    <div style={{position:"sticky", top:0, zIndex:10, background:THEME.headerGrad, borderBottom:"1px solid rgba(255,255,255,0.7)", boxShadow:"0 4px 24px rgba(255,92,138,0.06)"}}>
      <div style={{maxWidth:1200, margin:"0 auto", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <div style={{display:"flex", alignItems:"center"}}>
          <div style={{width:42, height:42, borderRadius:14, background:THEME.primaryGrad, color:"#fff", display:"grid", placeItems:"center", fontSize:20, marginRight:10}} aria-hidden>🐾</div>
          <div style={{fontWeight:700, color:THEME.textMain}}>PawPal AI</div>
        </div>
        <nav style={{display:"flex", gap:10, fontSize:14, alignItems:"center"}}>
          <button onClick={()=>setPage("dashboard")} className="link-btn" aria-label="Open Dashboard">Dashboard</button>
          <button onClick={()=>setPage("knowledge")} className="link-btn" aria-label="Open Knowledge and Forum">Knowledge/Forum</button>
          <button onClick={()=>setPage("profile")} className="link-btn" aria-label="Open Profile">Profile</button>
        </nav>
      </div>
    </div>
  );

  // Landing
  if(page === "landing"){
    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:1200, margin:"0 auto", padding:"48px 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:36, alignItems:"center"}}>
          <div>
            <h1 style={{fontSize:36, fontWeight:800, lineHeight:1.2, color:THEME.textMain, margin:0}}>Gentle and elegant pet care</h1>
            <p style={{color:THEME.textSub, fontSize:18, marginTop:12}}>
              Upload short videos and toilet photos, add a simple profile, and receive personalized daily guidance. Demo only, not medical advice.
            </p>
            <div style={{display:"flex", gap:12, marginTop:18}}>
              <button onClick={()=>setPage("profile")} className="btn-primary">Start</button>
              <button onClick={()=>setPage("dashboard")} className="btn-secondary">Open Dashboard</button>
            </div>
          </div>
          <div style={{borderRadius:28, background:"#fff", border:"1px solid "+THEME.softBorder, display:"grid", placeItems:"center", boxShadow:"0 12px 40px rgba(255,92,138,0.08)", width:"100%"}}>
            <div style={{textAlign:"center", padding:24}}>
              <div style={{fontSize:64}} aria-hidden>🐱 🐶</div>
              <div style={{color:THEME.textSub, marginTop:8}}>Soft • Cozy • Caring</div>
            </div>
          </div>
        </div>
        <div style={{maxWidth:1200, margin:"0 auto", padding:"0 16px 24px", color:"#9CA3AF", fontSize:12}}>
          Privacy: demo processes files in your browser only.
        </div>
      </div>
    );
  }

  // Profile
  if(page === "profile"){
    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:900, margin:"0 auto", padding:16}}>
          <div style={{fontSize:24, fontWeight:700, margin:"16px 0", color:THEME.textMain}}>Pet Profile</div>
          <div className="card">
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
              <Field label="Name"><input aria-label="Pet name" value={profile.name} onChange={(e)=> setProfile({...profile, name:e.target.value})} className="input" placeholder="e.g., Coco"/></Field>
              <Field label="Species">
                <select aria-label="Species" value={profile.species} onChange={(e)=> setProfile({...profile, species:e.target.value})} className="input">
                  <option value="">Select</option>
                  <option>Cat</option>
                  <option>Dog</option>
                </select>
              </Field>
              <Field label="Breed"><input aria-label="Breed" value={profile.breed} onChange={(e)=> setProfile({...profile, breed:e.target.value})} className="input" placeholder="British Shorthair / Shiba"/></Field>
              <Field label="Age (years)"><input aria-label="Age" type="number" min="0" step="0.1" value={profile.age} onChange={(e)=> setProfile({...profile, age:e.target.value})} className="input"/></Field>
              <Field label="Gender">
                <select aria-label="Gender" value={profile.gender} onChange={(e)=> setProfile({...profile, gender:e.target.value})} className="input">
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </Field>
              <Field label="Weight (kg)"><input aria-label="Weight" type="number" min="0" step="0.1" value={profile.weight} onChange={(e)=> setProfile({...profile, weight:e.target.value})} className="input"/></Field>
              <Field label="Diet">
                <select aria-label="Diet" value={profile.diet} onChange={(e)=> setProfile({...profile, diet:e.target.value})} className="input">
                  <option value="">Select</option>
                  <option>Dry</option>
                  <option>Wet</option>
                  <option>Mixed</option>
                  <option>Home-cooked</option>
                </select>
              </Field>
              <Field label="Living">
                <select aria-label="Living" value={profile.living} onChange={(e)=> setProfile({...profile, living:e.target.value})} className="input">
                  <option value="">Select</option>
                  <option>Indoor</option>
                  <option>Outdoor</option>
                  <option>Mixed</option>
                </select>
              </Field>
            </div>
            <div style={{marginTop:16, display:"flex", gap:12}}>
              <button onClick={()=> setPage("dashboard")} className="btn-primary">Save & Continue</button>
              <button onClick={()=> setPage("landing")} className="btn-secondary">Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  if(page === "dashboard"){
    const last = history.length? history[history.length-1] : null;
    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:1200, margin:"0 auto", padding:16}}>
          <div style={{fontSize:24, fontWeight:700, margin:"16px 0", color:THEME.textMain}}>Dashboard</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
            <Card title="Activity Video" actionText="Analyze" onAction={()=> setPage("uploadVideo")}>Upload a 10–20s clip to estimate activity level.</Card>
            <Card title="Toilet Photo" actionText="Analyze" onAction={()=> setPage("uploadToilet")}>Quick hints from color & consistency.</Card>
            <Card title="Knowledge & Forum" actionText="Open" onAction={()=> setPage("knowledge")}>Care guides + local demo forum.</Card>
            <Card title="Today's Advice" actionText="Open" onAction={()=> setPage("advice")}>Feeding amount / playtime / watchpoints.</Card>
          </div>

          {last ? (
            <div style={{marginTop:16}}>
              <div className="card">
                <div style={{fontWeight:600, marginBottom:8}}>Latest Snapshot</div>
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, fontSize:14}}>
                  <div>
                    <div style={{color:THEME.textSub}}>Activity</div>
                    {last.activity? (<div><b>{last.activity.activityIndex}</b> <span className="chip">{last.activity.label}</span></div>) : (<div style={{color:"#C9CED6"}}>—</div>)}
                  </div>
                  <div>
                    <div style={{color:THEME.textSub}}>Toilet</div>
                    {last.toilet? (<div>Score <b>{last.toilet.score}/5</b></div>) : (<div style={{color:"#C9CED6"}}>—</div>)}
                  </div>
                  <div>
                    <div style={{color:THEME.textSub}}>Pet</div>
                    <div>{(profile.name || "Unnamed") + (profile.species? (" • "+profile.species) : "")}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Upload Video
  if(page === "uploadVideo"){
    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:1200, margin:"0 auto", padding:16}}>
          <div style={{fontSize:24, fontWeight:700, margin:"16px 0", color:THEME.textMain}}>Activity Video Analysis</div>
          <div
            style={{minHeight:"70vh", display:"grid", placeItems:"center", padding:24, background:"#fff", border:"2px dashed "+THEME.softPink, borderRadius:28, boxShadow:"0 16px 48px rgba(255,92,138,0.08)"}}
            onDragOver={(e)=>{e.preventDefault(); setVideoDragOver(true);}}
            onDragLeave={()=> setVideoDragOver(false)}
            onDrop={(e)=>{ e.preventDefault(); setVideoDragOver(false); if(e.dataTransfer?.files?.[0]) setVideoFile(e.dataTransfer.files[0]); }}
            aria-label="Video upload zone"
          >
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:56}} aria-hidden>🎥</div>
              <div style={{fontSize:18, fontWeight:600, marginTop:8, color:THEME.textMain}}>
                { videoFile? videoFile.name : (videoDragOver? "Release to upload" : "Drag & drop a video here") }
              </div>
              <div style={{color:THEME.textSub, marginTop:8}}>or</div>
              <label style={{display:"inline-block", marginTop:8}}>
                <span className="btn-primary">Choose a file</span>
                <input type="file" accept="video/*" style={{display:"none"}} onChange={(e)=> setVideoFile(e.target.files?.[0] || null)} />
              </label>
              <div style={{marginTop:12, fontSize:14, color:THEME.textMain}}>Species:
                <div style={{marginTop:8, display:"flex", gap:8, justifyContent:"center"}}>
                  <button className={speciesPick==="Cat"? "btn-primary" : "btn-secondary"} onClick={()=> setSpeciesPick("Cat")}>Cat</button>
                  <button className={speciesPick==="Dog"? "btn-primary" : "btn-secondary"} onClick={()=> setSpeciesPick("Dog")}>Dog</button>
                </div>
              </div>
              <div style={{marginTop:16, display:"flex", gap:12, justifyContent:"center"}}>
                <button disabled={!videoFile} className={!videoFile? "btn-primary disabled" : "btn-primary"}
                        onClick={()=>{
                          const res = buildActivity(videoFile, profile.species || speciesPick);
                          setVideoRes(res);
                          const next = history.slice();
                          next.push({ ts: Date.now(), activity: res });
                          setHistory(next);
                          setPage("videoResult");
                        }}>
                  Analyze
                </button>
                <button className="btn-secondary" onClick={()=> setPage("dashboard")}>Back</button>
              </div>
              <div style={{marginTop:8, color:"#B0B6BD", fontSize:12}}>Demo only — local simulation, no upload.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video Result
  if(page === "videoResult" && videoRes){
    const act = calcDaily(profile.species || speciesPick, profile.weight, videoRes.label);
    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:1000, margin:"0 auto", padding:16}}>
          <div style={{fontSize:24, fontWeight:700, margin:"16px 0", color:THEME.textMain}}>Activity Result</div>
          <div className="card">
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <Info label="Species" value={(profile.species || speciesPick)} />
              <Info label="Activity Index" value={String(videoRes.activityIndex)} extra={<span className="chip">{videoRes.label}</span>} />
              <Info label="Duration" value={(videoRes.durationSec? videoRes.durationSec : "-") + " s"} />
              <Info label="Notes" value={videoRes.notes} />
            </div>
          </div>

          <div className="card" style={{marginTop:16}}>
            <div style={{fontWeight:600, marginBottom:8, color:THEME.textMain}}>Personalized Feeding</div>
            {act.kcal ? (
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, textAlign:"center"}}>
                <Mini label="Daily kcal" value={String(act.kcal)} />
                <Mini label="Dry food (g)" value={String(act.grams)} />
                <Mini label="Based on" value={videoRes.label} />
              </div>
            ) : (
              <div style={{color:THEME.textSub}}>Add species & weight in Profile to see numbers.</div>
            )}
            <div style={{color:"#B0B6BD", fontSize:12, marginTop:8}}>General guidance only. Not medical advice.</div>
          </div>

          <div style={{display:"flex", gap:12, marginTop:16}}>
            <button className="btn-primary" onClick={()=> setPage("dashboard")}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // Upload Toilet Photo
  if(page === "uploadToilet"){
    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:1200, margin:"0 auto", padding:16}}>
          <div style={{fontSize:24, fontWeight:700, margin:"16px 0", color:THEME.textMain}}>Toilet Photo Analysis</div>
          <div
            style={{minHeight:"70vh", display:"grid", placeItems:"center", padding:24, background:"#fff", border:"2px dashed "+THEME.softPink, borderRadius:28, boxShadow:"0 16px 48px rgba(255,92,138,0.08)"}}
            onDragOver={(e)=>{e.preventDefault(); setToiletDragOver(true);}}
            onDragLeave={()=> setToiletDragOver(false)}
            onDrop={(e)=>{ e.preventDefault(); setToiletDragOver(false); if(e.dataTransfer?.files?.[0]) setToiletFile(e.dataTransfer.files[0]); }}
            aria-label="Photo upload zone"
          >
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:56}} aria-hidden>🧻</div>
              <div style={{fontSize:18, fontWeight:600, marginTop:8, color:THEME.textMain}}>
                { toiletFile? toiletFile.name : (toiletDragOver? "Release to upload" : "Drag & drop a photo here") }
              </div>
              <div style={{color:THEME.textSub, marginTop:8}}>or</div>
              <label style={{display:"inline-block", marginTop:8}}>
                <span className="btn-primary">Choose a file</span>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={(e)=> setToiletFile(e.target.files?.[0] || null)} />
              </label>
              <div style={{marginTop:16, display:"flex", gap:12, justifyContent:"center"}}>
                <button disabled={!toiletFile} className={!toiletFile? "btn-primary disabled" : "btn-primary"}
                        onClick={()=>{
                          const r = simulateToilet(toiletFile);
                          setToiletRes(r);
                          const next = history.slice();
                          next.push({ ts: Date.now(), toilet: r });
                          setHistory(next);
                          setPage("toiletResult");
                        }}>
                  Analyze
                </button>
                <button className="btn-secondary" onClick={()=> setPage("dashboard")}>Back</button>
              </div>
              <div style={{marginTop:8, color:"#B0B6BD", fontSize:12}}>Demo only — local simulation, no upload.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Toilet Result
  if(page === "toiletResult" && toiletRes){
    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:1000, margin:"0 auto", padding:16}}>
          <div style={{fontSize:24, fontWeight:700, margin:"16px 0", color:THEME.textMain}}>Toilet Result</div>
          <div className="card">
            <div style={{display:"grid", gridTemplateColumns:"1fr 2fr", gap:12}}>
              <Info label="Health score" value={String(toiletRes.score)+"/5"} />
              <div>
                <div style={{color:THEME.textSub, fontSize:14}}>Issues</div>
                <div style={{marginTop:4, fontSize:14, color:THEME.textMain}}>{ toiletRes.issues.length? toiletRes.issues.join(", ") : "None detected" }</div>
              </div>
            </div>
          </div>
          <div className="card" style={{marginTop:16}}>
            <div style={{fontWeight:600, marginBottom:8, color:THEME.textMain}}>Advice</div>
            <div style={{fontSize:14, color:THEME.textMain}}>{toiletRes.advice}</div>
            <div style={{color:"#B0B6BD", fontSize:12, marginTop:8}}>General guidance only. Not medical advice.</div>
          </div>
          <div style={{display:"flex", gap:12, marginTop:16}}>
            <button className="btn-primary" onClick={()=> setPage("knowledge")}>Open Knowledge</button>
            <button className="btn-secondary" onClick={()=> setPage("dashboard")}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // Knowledge + Forum
  if(page === "knowledge"){
    const guides = [
      { id:1, title:"Daily hydration for cats & dogs", tag:"Hydration", summary:"Water bowls, fountains, wet food, heat tips." },
      { id:2, title:"Safe food transition (7–10 days)", tag:"Nutrition", summary:"25/50/75% gradual mix. Watch stool & appetite." },
      { id:3, title:"Enrichment for indoor cats", tag:"Enrichment", summary:"Teaser toys, puzzle feeders, climb/scratch." },
      { id:4, title:"Reading stool color & shape", tag:"Health", summary:"Hard/black/tarry — see a vet promptly." },
      { id:5, title:"Puppy socialization basics", tag:"Behavior", summary:"Positive reinforcement, short sessions." }
    ];
    const s = knowledgeSearch.toLowerCase();
    const filtered = guides.filter(g =>
      g.title.toLowerCase().includes(s) || g.tag.toLowerCase().includes(s)
    );

    function addPost(){
      if(!forumTitle.trim() || !forumBody.trim()) return;
      const post = { id: Date.now(), title: forumTitle.trim(), body: forumBody.trim(), ts: new Date().toISOString() };
      const next = forum.slice(); next.push(post);
      setForum(next);
      setForumTitle(""); setForumBody("");
    }

    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:1200, margin:"0 auto", padding:16}}>
          <div style={{fontSize:24, fontWeight:700, margin:"16px 0", color:THEME.textMain}}>Knowledge & Community</div>
          <div style={{display:"flex", gap:8}}>
            <button onClick={()=> setKnowledgeTab("guides")} className={knowledgeTab==="guides"? "btn-primary" : "btn-secondary"}>Care Guides</button>
            <button onClick={()=> setKnowledgeTab("forum")} className={knowledgeTab==="forum"? "btn-primary" : "btn-secondary"}>Forum</button>
          </div>

          {knowledgeTab === "guides" ? (
            <div>
              <input value={knowledgeSearch} onChange={(e)=> setKnowledgeSearch(e.target.value)} placeholder="Search guides (hydration, stool, puppy...)" className="input" style={{marginTop:12}}/>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:12}}>
                {filtered.map(g => (
                  <div key={g.id} className="card">
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                      <div style={{fontWeight:700, color:THEME.textMain}}>{g.title}</div>
                      <span className="chip">{g.tag}</span>
                    </div>
                    <div style={{marginTop:8, color:THEME.textMain}}>{g.summary}</div>
                    <ul style={{marginTop:8, paddingLeft:18, color:THEME.textMain, fontSize:14}}>
                      {g.tag === "Hydration" && <li>Fresh water at all times; clean bowls daily; fountains can help cats drink more.</li>}
                      {g.tag === "Nutrition" && <li>Mix old:new at 25/50/75% over 7–10 days; slow down if upset.</li>}
                      {g.tag === "Enrichment" && <li>Two 15–20 min play sessions daily; rotate toys; offer climbing/scratching.</li>}
                      {g.tag === "Health" && <li>Black/tarry stool may indicate bleeding; see a vet promptly; persistent changes &gt;48h: consult a vet.</li>}
                      {g.tag === "Behavior" && <li>Positive reinforcement; very short frequent sessions; avoid punishment.</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginTop:12}}>
              <div>
                {forum.length===0 ? (<div className="card" style={{color:THEME.textSub}}>No posts yet. Be the first to share!</div>) : null}
                {forum.map(p => (
                  <div key={p.id} className="card">
                    <div style={{fontWeight:700, color:THEME.textMain}}>{p.title}</div>
                    <div style={{marginTop:6, whiteSpace:"pre-wrap", color:THEME.textMain}}>{p.body}</div>
                    <div style={{marginTop:6, color:"#C9CED6", fontSize:12}}>{new Date(p.ts).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{fontWeight:700, marginBottom:8, color:THEME.textMain}}>New Post</div>
                <input value={forumTitle} onChange={(e)=> setForumTitle(e.target.value)} placeholder="Title" className="input" aria-label="Post title"/>
                <textarea value={forumBody} onChange={(e)=> setForumBody(e.target.value)} placeholder="Share a tip or question (no personal data)" className="input" style={{height:160, marginTop:8}} aria-label="Post content"/>
                <div style={{display:"flex", gap:8, marginTop:8}}>
                  <button className="btn-primary" onClick={addPost}>Post</button>
                  <button className="btn-secondary" onClick={()=>{ setForumTitle(""); setForumBody(""); }}>Clear</button>
                </div>
                <div style={{color:"#C9CED6", fontSize:12, marginTop:6}}>Local demo forum: stored in your browser only.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Advice
  if(page === "advice"){
    const last = history.length? history[history.length-1] : null;
    const actLabel = last && last.activity ? last.activity.label : "Normal";
    const feed = calcDaily(profile.species, profile.weight, actLabel);
    const waterMl = waterTargetMl(profile.species, profile.weight);
    const meals = mealsPerDay(profile.species, profile.age);

    return (
      <div style={{minHeight:"100vh", background:THEME.bgGrad}}>
        {Header}
        <div style={{maxWidth:1000, margin:"0 auto", padding:16}}>
          <div style={{fontSize:24, fontWeight:700, margin:"16px 0", color:THEME.textMain}}>Today's Advice</div>

          <div className="card">
            <div style={{fontWeight:600, marginBottom:8}}>Feeding</div>
            {feed.kcal ? (
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, textAlign:"center"}}>
                <Mini label="Daily kcal" value={String(feed.kcal)} />
                <Mini label="Dry food (g)" value={String(feed.grams)} />
                <Mini label="Based on" value={actLabel} />
              </div>
            ) : (<div style={{color:THEME.textSub}}>Add species & weight in Profile.</div>)}
            <ul style={{marginTop:8, paddingLeft:18, color:THEME.textMain, fontSize:14}}>
              <li>Meals per day: <b>{meals}</b> (adjust if appetite or stool changes).</li>
              <li>If using wet food, reduce dry grams accordingly.</li>
            </ul>
          </div>

          <div className="card" style={{marginTop:16}}>
            <div style={{fontWeight:600, marginBottom:8}}>Hydration</div>
            {waterMl ? (<div style={{color:THEME.textMain}}>Target: <b>{waterMl} ml/day</b> (estimate).</div>)
                     : (<div style={{color:THEME.textSub}}>Add weight in Profile to see target.</div>)}
            <ul style={{marginTop:8, paddingLeft:18, color:THEME.textMain, fontSize:14}}>
              <li>Provide fresh water at all times; clean bowls daily.</li>
              <li>Cats often drink more with fountains; consider some wet food.</li>
            </ul>
          </div>

          <div className="card" style={{marginTop:16}}>
            <div style={{fontWeight:600, marginBottom:8}}>Play & Activity</div>
            <ul style={{paddingLeft:18, color:THEME.textMain, fontSize:14}}>
              {actLabel==="Low" && <li>Two gentle sessions (15 min each); short walks or teaser toys.</li>}
              {actLabel==="Normal" && <li>Two sessions (20 min each); add enrichment like puzzle feeders.</li>}
              {actLabel==="High" && <li>Provide calm breaks; ensure hydration and rest after bursts.</li>}
            </ul>
          </div>

          <div className="card" style={{marginTop:16}}>
            <div style={{fontWeight:600, marginBottom:8}}>Stool & Litter Check</div>
            <ul style={{paddingLeft:18, color:THEME.textMain, fontSize:14}}>
              <li>Aim for consistent shape & easy pass. Sudden changes &gt;48h: consult a vet.</li>
              <li>Watch for black/tarry stool, blood, or mucus.</li>
            </ul>
          </div>

          <div className="card" style={{marginTop:16}}>
            <div style={{fontWeight:600, marginBottom:8}}>Rest & Comfort</div>
            <ul style={{paddingLeft:18, color:THEME.textMain, fontSize:14}}>
              <li>Quiet nap spots; avoid over-stimulation after play.</li>
              <li>Keep a stable routine (feed/play/sleep windows).</li>
            </ul>
            <div style={{color:"#B0B6BD", fontSize:12, marginTop:8}}>General guidance only. Not medical advice.</div>
          </div>

          <div style={{display:"flex", gap:12, marginTop:16}}>
            <button className="btn-secondary" onClick={()=> setPage("dashboard")}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
