const { useState, useRef, useEffect, useCallback } = React;

// ─── LOCAL STORAGE HELPERS ───────────────────────────────────────────────────
const LS = {
  get: (k, fallback = null) => {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── COMBINED LIBRARY LIST ───────────────────────────────────────────────────
// All data loaded via fetch in index.html and set as window globals before this
// script is injected. Spicy libraries are included here; visibility is gated by
// the spicyUnlocked password check in the UI.
const BUILTIN_LIBRARIES = [
  ...window.THEMATIC_LIBRARIES,
  ...window.GRAMMAR_LIBRARIES,
  ...window.SPICY_LIBRARIES,
  ...window.GRADE_LIBRARIES,
];

// ─── PURE HELPERS ────────────────────────────────────────────────────────────

// Parse [漢字|かんじ] markup into segments for ruby rendering
function parseRuby(text) {
  const parts = [];
  const re = /\[([^\|]+)\|([^\]]+)\]/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type:"text", val: text.slice(last, m.index) });
    parts.push({ type:"ruby", kanji: m[1], reading: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({ type:"text", val: text.slice(last) });
  return parts;
}

// Strip [漢字|かんじ] markup to plain Japanese for speech synthesis
function stripRuby(text) {
  return text.replace(/\[([^\|]+)\|([^\]]+)\]/g, '$1');
}

// Ruby text renderer — shows furigana on hover (desktop) or tap (mobile)
function RubyText({ text, id, pinnedWords, hoveredWord, isMobile, setHoveredWord, setPinnedWords }) {
  const segments = parseRuby(text);
  const toggle = (wordId) => setPinnedWords(prev => {
    const n = new Set(prev);
    n.has(wordId) ? n.delete(wordId) : n.add(wordId);
    return n;
  });
  return (
    <span>
      {segments.map((seg, si) => {
        if (seg.type === "text") return <span key={si}>{seg.val}</span>;
        const wordId = `${id}-${si}`;
        const showFuri = pinnedWords.has(wordId) || (!isMobile && hoveredWord === wordId);
        if (showFuri) {
          return (
            <ruby key={si}
              onMouseLeave={() => !isMobile && setHoveredWord(null)}
              onClick={() => isMobile && toggle(wordId)}
              style={{ cursor: isMobile ? "pointer" : "default" }}>
              {seg.kanji}<rt>{seg.reading}</rt>
            </ruby>
          );
        }
        return (
          <span key={si}
            onMouseEnter={() => !isMobile && setHoveredWord(wordId)}
            onClick={() => isMobile && toggle(wordId)}
            style={{ cursor: isMobile ? "pointer" : "default", borderBottom: isMobile ? "1px dotted #bbb" : "none" }}>
            {seg.kanji}
          </span>
        );
      })}
    </span>
  );
}


function getMedalForSession(s) {
  if (!s.timed || s.total === 0) return null;
  const q = s.total;
  const b = s.points - s.score;
  if (b >= q * 4.5) return { kanji:"白金", color:"#a0a0b8", rank:1 };
  if (b >= q * 4)   return { kanji:"金",   color:"#c9960c", rank:2 };
  if (b >= q * 3)   return { kanji:"銀",   color:"#7f8c8d", rank:3 };
  if (b >= q * 2)   return { kanji:"銅",   color:"#a04000", rank:4 };
  return null;
}

function StatsModal({ sessions, initialTab, onClose, onReset }) {
  const QUIZ_TABS = [
    { key:"kanji",             label:"漢字", sub:"Kanji → Reading" },
    { key:"compounds",         label:"熟語", sub:"Compound → Reading" },
    { key:"compounds_reverse", label:"英語", sub:"English → Compound" },
  ];
  const [tab, setTab] = useState(initialTab || "kanji");
  const [confirmReset, setConfirmReset] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");

  const groups = ["all", ...Array.from(new Set(
    sessions.map(s => s.libraryLabel.includes(" · ") ? s.libraryLabel.split(" · ")[0] : null).filter(Boolean)
  )).sort()];

  const filteredSessions = groupFilter === "all"
    ? sessions
    : sessions.filter(s => s.libraryLabel.startsWith(groupFilter + " · ") || s.libraryLabel === groupFilter);

  // ── per-library breakdown for the active quiz type tab ──
  function buildRows(quizType) {
    const map = {};
    filteredSessions.filter(s => s.quizType === quizType).forEach(s => {
      if (!map[s.library]) map[s.library] = {
        label: s.libraryLabel, sessions: 0, correct: 0, total: 0,
        bestPct: 0, bestPoints: 0, bestMaxPoints: 0, bestMedal: null,
      };
      const e = map[s.library];
      e.sessions++;
      e.correct += s.score;
      e.total   += s.total;
      const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
      if (pct > e.bestPct) e.bestPct = pct;
      if (s.timed && s.points > e.bestPoints) {
        e.bestPoints    = s.points;
        e.bestMaxPoints = s.maxPoints;
        e.bestMedal     = getMedalForSession(s);
      }
    });
    return Object.values(map).sort((a, b) => b.sessions - a.sessions);
  }

  const rows = buildRows(tab);

  // ── medal totals for this tab ──
  const medalCounts = { 1:0, 2:0, 3:0, 4:0 };
  filteredSessions.filter(s => s.quizType === tab).forEach(s => {
    const m = getMedalForSession(s);
    if (m) medalCounts[m.rank]++;
  });
  const anyMedals = Object.values(medalCounts).some(v => v > 0);

  const medalDefs = [
    { rank:1, kanji:"白金", color:"#a0a0b8" },
    { rank:2, kanji:"金",   color:"#c9960c" },
    { rank:3, kanji:"銀",   color:"#7f8c8d" },
    { rank:4, kanji:"銅",   color:"#a04000" },
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"20px 16px 0", flexShrink:0 }}>

        {/* Header */}
        <div style={modalHeaderStyle}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"serif", fontSize:"1.1rem" }}>📊 Study Stats</span>
            {groups.length > 2 && (
              <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
                style={{ fontSize:"0.68rem", fontFamily:"monospace", border:"1px solid #e8dcc8",
                  borderRadius:4, padding:"3px 6px", background:"#faf6ee", color:"#1a1008",
                  cursor:"pointer", maxWidth:130 }}>
                {groups.map(g => (
                  <option key={g} value={g}>{g === "all" ? "All Libraries" : g}</option>
                ))}
              </select>
            )}
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Quiz type tabs */}
        <div style={{ display:"flex", border:"1px solid #e8dcc8", borderRadius:6, overflow:"hidden", marginBottom:18 }}>
          {QUIZ_TABS.map(({ key, label, sub }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ flex:1, padding:"8px 4px", border:"none",
                background: tab===key ? "#1a1008" : "transparent",
                color: tab===key ? "#f5efe3" : "#888",
                cursor:"pointer", fontFamily:"monospace",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <span style={{ fontFamily:"serif", fontSize:"1.1rem" }}>{label}</span>
              <span style={{ fontSize:"0.52rem", letterSpacing:"0.04em", opacity:0.7 }}>{sub}</span>
            </button>
          ))}
        </div>
        </div>{/* end fixed header */}
        <div style={{ overflowY:"auto", flex:1, padding:"0 16px 24px" }}>

        {filteredSessions.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#aaa", fontSize:"0.85rem" }}>
            {groupFilter === "all" ? "No sessions yet — complete a quiz to start tracking!" : `No sessions for ${groupFilter} yet.`}
          </div>
        )}

        {/* Medal row — only for quiz type tabs */}
        {tab !== "highscores" && anyMedals && (
          <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:16 }}>
            {medalDefs.map(({ rank, kanji, color }) => medalCounts[rank] > 0 && (
              <div key={rank} style={{ display:"flex", flexDirection:"column", alignItems:"center",
                background:"#faf6ee", border:`1px solid ${color}44`, borderRadius:6, padding:"7px 12px", minWidth:52 }}>
                <span style={{ fontFamily:"serif", fontSize:"1.3rem", color, fontWeight:700 }}>{kanji}</span>
                <span style={{ fontSize:"0.6rem", color:"#aaa", marginTop:2 }}>×{medalCounts[rank]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Library rows — only for quiz type tabs */}
        {tab !== "highscores" && (rows.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0", color:"#aaa", fontSize:"0.82rem" }}>
            No {QUIZ_TABS.find(t => t.key === tab)?.label} sessions yet.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {rows.map(row => {
              const acc = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
              const accColor = acc >= 80 ? "#27ae60" : acc >= 60 ? "#b8860b" : "#c0392b";
              return (
                <div key={row.label} style={{ background:"#faf6ee", border:"1px solid #e8dcc8", borderRadius:6, padding:"9px 12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                    <span style={{ fontSize:"0.8rem", fontWeight:600, color:"#1a1008" }}>{row.label}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      {row.bestMedal && (
                        <span style={{ fontFamily:"serif", fontSize:"1rem", color:row.bestMedal.color, fontWeight:700 }}>{row.bestMedal.kanji}</span>
                      )}
                      <span style={{ fontSize:"0.7rem", color:accColor, fontWeight:700 }}>{acc}%</span>
                    </div>
                  </div>
                  {/* Accuracy bar */}
                  <div style={{ height:4, background:"#e8dcc8", borderRadius:3, marginBottom:6 }}>
                    <div style={{ height:"100%", borderRadius:3, background:accColor, width:`${acc}%`, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ display:"flex", gap:10, fontSize:"0.62rem", color:"#aaa", flexWrap:"wrap" }}>
                    <span><b style={{ color:"#1a1008" }}>{row.sessions}</b> session{row.sessions !== 1 ? "s" : ""}</span>
                    <span><b style={{ color:"#1a1008" }}>{row.correct}</b>/{row.total} correct</span>
                    <span>best <b style={{ color:accColor }}>{row.bestPct}%</b></span>
                    {row.bestPoints > 0 && (
                      <span>⚡ <b style={{ color: row.bestMedal ? row.bestMedal.color : "#b8860b" }}>{row.bestPoints}/{row.bestMaxPoints} pts</b></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}


        {/* High Scores tab */}
        {tab === "highscores" && (() => {
          const hsMap = {};
          filteredSessions.filter(s => s.timed).forEach(s => {
            const key = s.library + '|' + s.quizType;
            if (!hsMap[key] || s.points > hsMap[key].points) {
              hsMap[key] = { ...s };
            }
          });
          const hsRows = Object.values(hsMap).sort((a, b) => {
            const rA = a.maxPoints > 0 ? a.points / a.maxPoints : 0;
            const rB = b.maxPoints > 0 ? b.points / b.maxPoints : 0;
            return rB - rA || b.points - a.points;
          });
          const qLabel = { kanji:"漢字", compounds:"熟語", compounds_reverse:"英語" };
          if (hsRows.length === 0) return (
            <div style={{ textAlign:"center", padding:"32px 0", color:"#aaa", fontSize:"0.82rem" }}>
              No timed sessions yet — enable Timed Mode to earn speed scores!
            </div>
          );
          return (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {hsRows.map((s, i) => {
                const medal = getMedalForSession(s);
                const pct = s.maxPoints > 0 ? Math.round((s.points / s.maxPoints) * 100) : 0;
                const barColor = medal ? medal.color : "#aaa";
                const date = new Date(s.date).toLocaleDateString(undefined, { month:"short", day:"numeric" });
                return (
                  <div key={s.library + s.quizType} style={{ background:"#faf6ee", border:`1px solid ${medal ? medal.color + "55" : "#e8dcc8"}`, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:"1.1rem", color:"#aaa", fontWeight:700, minWidth:18 }}>#{i+1}</span>
                        <div>
                          <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#1a1008" }}>{s.libraryLabel}</div>
                          <div style={{ fontSize:"0.6rem", color:"#aaa", marginTop:1 }}>{qLabel[s.quizType]} · {s.total}q · {date}</div>
                        </div>
                      </div>
                      {medal && <span style={{ fontFamily:"serif", fontSize:"1.4rem", color:medal.color, fontWeight:700 }}>{medal.kanji}</span>}
                    </div>
                    <div style={{ height:5, background:"#e8dcc8", borderRadius:3, marginBottom:5 }}>
                      <div style={{ height:"100%", borderRadius:3, background:barColor, width:`${pct}%`, transition:"width 0.4s" }} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.65rem", color:"#aaa" }}>
                      <span>⚡ <b style={{ color: medal ? medal.color : "#1a1008", fontSize:"0.78rem" }}>{s.points}</b>/{s.maxPoints} pts</span>
                      <span><b style={{ color:"#27ae60" }}>{s.score}</b>/{s.total} correct</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* High Scores for this quiz type */}
        {(() => {
          const hsMap = {};
          filteredSessions.filter(s => s.timed && s.quizType === tab).forEach(s => {
            if (!hsMap[s.library] || s.points > hsMap[s.library].points) {
              hsMap[s.library] = { ...s };
            }
          });
          const hsRows = Object.values(hsMap).sort((a, b) => {
            const rA = a.maxPoints > 0 ? a.points / a.maxPoints : 0;
            const rB = b.maxPoints > 0 ? b.points / b.maxPoints : 0;
            return rB - rA || b.points - a.points;
          });
          if (hsRows.length === 0) return null;
          return (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:"0.65rem", color:"#aaa", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:8 }}>⚡ High Scores</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {hsRows.map((s, i) => {
                  const medal = getMedalForSession(s);
                  const pct = s.maxPoints > 0 ? Math.round((s.points / s.maxPoints) * 100) : 0;
                  const barColor = medal ? medal.color : "#aaa";
                  const date = new Date(s.date).toLocaleDateString(undefined, { month:"short", day:"numeric" });
                  return (
                    <div key={s.library + i} style={{ background:"#faf6ee", border:`1px solid ${medal ? medal.color + "55" : "#e8dcc8"}`, borderRadius:6, padding:"9px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:"0.78rem", color:"#bbb", fontWeight:700, minWidth:18 }}>#{i+1}</span>
                          <div>
                            <div style={{ fontSize:"0.78rem", fontWeight:600, color:"#1a1008" }}>{s.libraryLabel}</div>
                            <div style={{ fontSize:"0.58rem", color:"#aaa", marginTop:1 }}>{s.total}q · {date}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          {medal && <span style={{ fontFamily:"serif", fontSize:"1rem", color:medal.color, fontWeight:700 }}>{medal.kanji}</span>}
                          <span style={{ fontSize:"0.78rem", color: medal ? medal.color : "#b8860b", fontWeight:700 }}>
                            {s.points}/{s.maxPoints} pts
                          </span>
                        </div>
                      </div>
                      <div style={{ height:4, background:"#e8dcc8", borderRadius:3 }}>
                        <div style={{ height:"100%", borderRadius:3, background:barColor, width:`${pct}%`, transition:"width 0.4s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Reset */}
        <div style={{ borderTop:"1px solid #e8dcc8", paddingTop:14 }}>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)}
              style={{ background:"none", border:"1px solid #ddd", borderRadius:4, padding:"7px 16px",
                fontSize:"0.68rem", color:"#bbb", cursor:"pointer", fontFamily:"monospace", width:"100%" }}>
              Reset all stats
            </button>
          ) : (
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:"0.72rem", color:"#c0392b", flex:1 }}>Delete all session history?</span>
              <button onClick={() => setConfirmReset(false)}
                style={{ padding:"6px 14px", borderRadius:4, border:"1px solid #ddd", background:"#faf6ee",
                  fontSize:"0.68rem", cursor:"pointer", fontFamily:"monospace" }}>
                Cancel
              </button>
              <button onClick={() => { onReset(); onClose(); }}
                style={{ padding:"6px 14px", borderRadius:4, border:"none", background:"#c0392b",
                  color:"white", fontSize:"0.68rem", cursor:"pointer", fontFamily:"monospace" }}>
                Delete
              </button>
            </div>
          )}
        </div>

        </div>{/* end scroll body */}
      </div>
    </div>
  );
}

const overlayStyle = {
  position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000,
  display:"flex", alignItems:"flex-start", justifyContent:"center",
  paddingTop:75,
};
const modalStyle = {
  background:"white", borderRadius:"12px", width:"calc(100% - 32px)", maxWidth:480,
  maxHeight:"calc(100vh - 95px)", display:"flex", flexDirection:"column",
  boxShadow:"0 8px 40px rgba(0,0,0,0.22)",
};
const modalHeaderStyle = {
  display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18,
};
const closeBtnStyle = {
  background:"none", border:"none", fontSize:"1.1rem", cursor:"pointer", color:"#aaa", padding:"2px 6px",
};

function App() {
  // ── persistent state (loaded from localStorage) ──
  const [extraLibraries, setExtraLibraries] = useState(() => LS.get("kanji_extra_libs", []));
  const [reviewKanji, setReviewKanji] = useState(() => new Set(LS.get("kanji_review", [])));
  const [studied, setStudied] = useState(() => LS.get("kanji_studied", {}));
  const [scores, setScores] = useState(() => LS.get("kanji_scores", {}));
  const [sessions, setSessions] = useState(() => LS.get("kanji_sessions", []));

  const sessionStart = useRef(null);
  const [showStats, setShowStats] = useState(false);

  // ── session state ──
  const [libId, setLibId] = useState(BUILTIN_LIBRARIES[0].id);
  const [mode, setMode] = useState("flash");

  // ── READ mode state ──
  const [readScope, setReadScope] = useState("library"); // "card" | "library"
  const [readType, setReadType] = useState("sentences");  // "sentences" | "story"
  const [readLevel, setReadLevel] = useState("N5");       // "N5" | "N4" | "N3"
  const [readCount, setReadCount] = useState(5);          // 5 | 10 | 15
  const [readLength, setReadLength] = useState("medium"); // "short" | "medium" | "long"
  const [readIncludeGroup, setReadIncludeGroup] = useState(false);
  const [readAiInput, setReadAiInput] = useState("");
  const [cyoaTheme, setCyoaTheme] = useState("fantasy");  // "fantasy" | "mystery" | "slice" | "historical"
  const [readContent, setReadContent] = useState(null);   // parsed content array
  const [readLoading, setReadLoading] = useState(false);
  const [readError, setReadError] = useState(null);
  const [pinnedWords, setPinnedWords] = useState(new Set()); // mobile tap-to-show furigana
  const [hoveredWord, setHoveredWord] = useState(null);      // desktop hover furigana
  const [revealedTranslations, setRevealedTranslations] = useState(new Set());
  const [speakingIdx, setSpeakingIdx] = useState(null); // index of currently speaking item, or "all"
  const [showLib, setShowLib] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [spicyUnlocked, setSpicyUnlocked] = useState(() => LS.get("spicy_unlocked", false));
  const [showSpicyPrompt, setShowSpicyPrompt] = useState(false);
  const [spicyInput, setSpicyInput] = useState("");
  const [spicyError, setSpicyError] = useState(false);
  const [idx, setIdx] = useState(0);
  const [layer, setLayer] = useState(0);
  const [wideFlash, setWideFlash] = useState(false);
  const [bigFont, setBigFont] = useState(false);
  const [streak, setStreak] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [toast, setToast] = useState(null);

  // quiz
  const [quizSetup, setQuizSetup] = useState(true);
  const [quizCount, setQuizCount] = useState(10);
  const [quizTimerEnabled, setQuizTimerEnabled] = useState(false);
  const [quizType, setQuizType] = useState("kanji"); // "kanji" | "compounds" | "compounds_reverse"
  const [answerStyle, setAnswerStyle] = useState("traditional"); // "traditional" | "japanese" | "english"
  const [quizDifficulty, setQuizDifficulty] = useState("easy"); // "easy" | "hard" — compounds_reverse only
  const QUIZ_TIMER_SECONDS = 10;
  const [quizCards, setQuizCards] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizOpts, setQuizOpts] = useState([]);
  const [quizAnswered, setQuizAnswered] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizBonusTotal, setQuizBonusTotal] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [compoundQuestion, setCompoundQuestion] = useState(null); // { compound, cardIdx }

  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // ── derive all libraries including review ──
  const reviewCards = (() => {
    if (reviewKanji.size === 0) return [];
    const all = [...BUILTIN_LIBRARIES, ...extraLibraries].flatMap(l => l.cards);
    const seen = new Set();
    return all.filter(c => {
      if (!reviewKanji.has(c.kanji) || seen.has(c.kanji)) return false;
      seen.add(c.kanji); return true;
    });
  })();

  const ALL_LIBRARIES = [
    ...(reviewCards.length > 0 ? [{
      id: REVIEW_LIB_ID,
      label: "Kanji for Review",
      sublabel: `${reviewCards.length} marked · Personal`,
      emoji: "🔖",
      mode: "review",
      category_key: "review",
      cards: reviewCards,
    }] : []),
    ...BUILTIN_LIBRARIES,
    ...extraLibraries,
  ];

  const lib = ALL_LIBRARIES.find(l => l.id === libId) || ALL_LIBRARIES[0];
  const cards = lib?.cards || [];
  const card = cards[idx];
  const libStudied = new Set(studied[libId] || []);
  const libScore = scores[libId] || 0;

  // ── persist to localStorage whenever state changes ──
  useEffect(() => { LS.set("kanji_extra_libs", extraLibraries); }, [extraLibraries]);
  useEffect(() => { LS.set("kanji_review", [...reviewKanji]); }, [reviewKanji]);
  useEffect(() => { LS.set("kanji_studied", studied); }, [studied]);
  useEffect(() => { LS.set("kanji_scores", scores); }, [scores]);
  useEffect(() => { LS.set("kanji_sessions", sessions); }, [sessions]);
  // Restore readIncludeGroup per library when lib changes
  useEffect(() => {
    setReadIncludeGroup(LS.get("read_include_group_" + lib.id, false));
  }, [lib.id]);
  // Persist readIncludeGroup whenever it changes
  useEffect(() => {
    LS.set("read_include_group_" + lib.id, readIncludeGroup);
  }, [readIncludeGroup, lib.id]);

  // Record a session entry whenever a quiz finishes
  useEffect(() => {
    if (!quizDone || quizCards.length === 0) return;
    const durationSec = sessionStart.current
      ? Math.round((Date.now() - sessionStart.current) / 1000)
      : null;
    const entry = {
      date: new Date().toISOString(),
      library: libId,
      libraryLabel: (() => { const g = GROUPS.find(g => g.id === lib.group); return g ? g.label + ' · ' + lib.label : lib.label; })(),
      quizType,
      score: quizScore,
      total: quizCards.length,
      points: totalQuizPoints,
      maxPoints: maxQuizPoints,
      timed: quizTimerEnabled,
      durationSec,
    };
    setSessions(prev => [...prev, entry]);
    sessionStart.current = null;
  }, [quizDone]);

  useEffect(() => { setIdx(0); setLayer(0); setRevealed(false); }, [libId]);
  useEffect(() => { setLayer(0); setRevealed(false); }, [idx]);
  useEffect(() => { if (mode === "write") setTimeout(initCanvas, 60); }, [mode, idx]);
  useEffect(() => { if (mode === "quiz") { setQuizSetup(true); setQuizDone(false); setQuizScore(0); setQuizBonusTotal(0); } }, [mode, libId]);

  // ── timer ──
  const handleTimerExpire = useCallback(() => {
    if (quizAnswered) return;
    setQuizAnswered("__expired__");
    setStreak(0);
    showToast("時間切れ！ Time's up!", "bad");
  }, [quizAnswered]);

  const { timeLeft, reset: resetTimer, stop: stopTimer } = useCountdown(
    QUIZ_TIMER_SECONDS, timerActive, handleTimerExpire
  );

  // ── review toggle ──
  function toggleReview(kanji) {
    setReviewKanji(prev => {
      const next = new Set(prev);
      if (next.has(kanji)) next.delete(kanji); else next.add(kanji);
      return next;
    });
  }

  function markStudied(i = idx) {
    setStudied(prev => {
      const s = new Set(prev[libId] || []);
      s.add(i);
      return { ...prev, [libId]: [...s] };
    });
  }

  function showToast(msg, type) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 1800);
  }

  // ── CYOA — build prompt and open in Claude.ai ──
  function buildCYOAPrompt() {
    const cyoaThemeMap = {
      fantasy:    "a fantasy adventure with magic, warriors, and mysterious lands",
      mystery:    "a detective mystery in modern Japan",
      slice:      "a warm slice-of-life story set in everyday Japan",
      historical: "a story set in feudal Japan (samurai era)",
    };
    const rndShuffleCyoa = arr => { for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; };
    const vocabCards = readScope === "card" ? [card] : cards;
    const vocabList = rndShuffleCyoa(vocabCards
      .flatMap(c => (c.compounds || []).map(cp => `${cp.jp}(${cp.reading}, ${cp.meaning})`)))
      .slice(0, 40).join("、");
    const theme = cyoaThemeMap[cyoaTheme] || cyoaThemeMap.fantasy;
    return `You are a Japanese language teacher running a choose-your-own-adventure story for a student studying Japanese at JLPT ${readLevel} level. Write it at a PG13-rated level in the style of a light novel with an emphasis on character growth, building a party and a grand adventure.

Theme: ${theme}
Vocabulary to weave in naturally: ${vocabList}

Rules:
- Write each section in Japanese (3-5 sentences)
- After each section add an English translation in italics
- End each section with exactly 4 choices: A, B, C, and D: Write your own
- Wait for the reader to choose before continuing

Begin the story now with the opening scene.`;
  }

  function openCYOA() {
    window.open(`https://claude.ai/new?q=${encodeURIComponent(buildCYOAPrompt())}`, '_blank');
  }

  function openCYOAGrok() {
    window.open(`https://x.com/i/grok?text=${encodeURIComponent(buildCYOAPrompt())}`, '_blank');
  }

  // ── READ mode generation ──
  async function generateRead() {
    setReadLoading(true); setReadError(null); setReadContent(null);
    setPinnedWords(new Set()); setHoveredWord(null); setRevealedTranslations(new Set()); setSpeakingIdx(null);
    window.speechSynthesis?.cancel();

    // Build vocab list for prompt
    // Helper: shuffle an array in place (Fisher-Yates)
    const rndShuffle = arr => { for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; };
    // Interleave compounds round-robin across shuffled cards — prevents first-kanji dominance
    const interleave = (cardArr) => {
      const sc = rndShuffle([...cardArr]);
      const buckets = sc.map(c => rndShuffle((c.compounds||[]).map(cp => `${cp.jp}(${cp.reading}, ${cp.meaning})`)));
      const out = [];
      const maxLen = Math.max(...buckets.map(b => b.length), 0);
      for (let i = 0; i < maxLen; i++) { for (const b of buckets) { if (b[i] !== undefined) out.push(b[i]); } }
      return out;
    };

    let vocabItems;
    if (readScope === "card") {
      vocabItems = rndShuffle((card.compounds || []).map(cp => `${cp.jp}(${cp.reading}, ${cp.meaning})`));
    } else if (readIncludeGroup && lib.group) {
      // Pool vocab from current library (50%) + rest of group split equally (50%)
      const groupLibs = ALL_LIBRARIES.filter(l => l.group === lib.group && l.id !== lib.id);
      const currentItems = interleave(cards);
      const currentSlots = 30; // 50% of 60
      const otherSlots = groupLibs.length > 0 ? Math.floor(30 / groupLibs.length) : 0;
      const otherItems = rndShuffle(groupLibs.flatMap(gl => interleave(gl.cards).slice(0, otherSlots)));
      vocabItems = [...currentItems.slice(0, currentSlots), ...otherItems];
    } else {
      vocabItems = interleave(cards);
    }
    const vocabList = vocabItems.slice(0, 60).join("、");

    const lengthMap = { short: "~200 Japanese characters", medium: "~500 Japanese characters", long: "~800 Japanese characters" };
    const countLabel = readType === "sentences" ? `exactly ${readCount} sentences` : lengthMap[readLength];

    // Tokens: sentences need ~150 tokens each with furigana markup; stories need more
    const maxTok = readType === "sentences"
      ? Math.max(1500, readCount * 200)
      : (readLength === "long" ? 4000 : readLength === "medium" ? 2500 : 1500);

    const isSpicy = lib.group === "spicy";
    const spicyMod = isSpicy ? " Give it an edgy, adult tone — dark humor, suggestive situations, mature themes are welcome." : "";
    const aiMod = readAiInput.trim() ? ` Additional instruction: ${readAiInput.trim()}` : "";

    const prompt = readType === "sentences"
      ? `Generate ${countLabel} in Japanese at JLPT ${readLevel} level using vocabulary from this list where natural: ${vocabList}.${spicyMod}${aiMod}

Return ONLY a JSON array with no markdown fences, no explanation, no text before or after:
[{"jp":"sentence with [漢字|かんじ] furigana markup on each kanji word","en":"English translation"},...]`
      : `Write a story in Japanese at JLPT ${readLevel} level, ${countLabel}, naturally using vocabulary from: ${vocabList}.${spicyMod}${aiMod}

Return ONLY a JSON object with no markdown fences, no explanation, no text before or after:
{"title":"title with [漢字|かんじ] furigana","paragraphs":[{"jp":"paragraph with [漢字|かんじ] furigana on kanji words","en":"English translation"},...]}`

    try {
      const res = await fetch("https://j-kanji-proxy.jay-snipe.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: maxTok,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`API error ${res.status}: ${err.error?.message || res.statusText}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      // Robust JSON extraction — find first [ or { and last ] or }
      const raw = (data.content || []).map(b => b.text || "").join("").trim();
      const isArr = readType === "sentences";
      const start = raw.indexOf(isArr ? "[" : "{");
      const end   = isArr ? raw.lastIndexOf("]") : raw.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error(`No JSON found in response`);
      const parsed = JSON.parse(raw.slice(start, end + 1));
      setReadContent(parsed);
    } catch(e) {
      setReadError(`Generation failed: ${e.message}. Please try again.`);
    }
    setReadLoading(false);
  }

  function speakText(text, idx) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(stripRuby(text));
    utt.lang = "ja-JP";
    utt.rate = 0.9;
    utt.onend = () => setSpeakingIdx(null);
    utt.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utt);
  }

  function speakAll(items) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeakingIdx("all");
    const texts = items.map(item => stripRuby(item.jp));
    let i = 0;
    function next() {
      if (i >= texts.length) { setSpeakingIdx(null); return; }
      const utt = new SpeechSynthesisUtterance(texts[i++]);
      utt.lang = "ja-JP";
      utt.rate = 0.9;
      utt.onend = next;
      utt.onerror = next;
      window.speechSynthesis.speak(utt);
    }
    next();
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
  }

  // ── quiz ──
  function startQuiz() {
    const isCompound = quizType === "compounds" || quizType === "compounds_reverse";
    const pool = isCompound
      ? cards.filter(c => c.compounds && c.compounds.length > 0)
      : cards;
    const sh = shuffle(pool).slice(0, Math.min(quizCount, pool.length));
    setQuizCards(sh); setQuizIdx(0); setQuizScore(0); setQuizBonusTotal(0);
    setQuizAnswered(null); setQuizDone(false); setQuizSetup(false);
    sessionStart.current = Date.now();
    buildOpts(sh, 0);
    if (quizTimerEnabled) { resetTimer(QUIZ_TIMER_SECONDS); setTimerActive(true); }
  }

  function buildOpts(qc, qi) {
    const correct = qc[qi];
    if (quizType === "compounds" || quizType === "compounds_reverse") {
      // Pick a random compound from the correct card
      const compPool = correct.compounds.filter(c => c.reading && c.jp);
      const comp = compPool[Math.floor(Math.random() * compPool.length)];
      setCompoundQuestion(comp);

      // Build wrong options: prefer compounds that SHARE a kanji character with the question
      // compound, so the distractors feel plausibly related rather than random
      const compChars = new Set([...comp.jp]); // individual kanji chars in the compound
      const allWrongCandidates = cards
        .filter(c => c.kanji !== correct.kanji && c.compounds && c.compounds.length > 0)
        .flatMap(c => c.compounds.map(cpd => ({ ...cpd, _cardKanji: c.kanji, _isCorrect: false })))
        .filter(cpd => cpd.jp && cpd.reading);

      // Split into "related" (shares a char) and "unrelated"
      const related = shuffle(allWrongCandidates.filter(cpd =>
        [...cpd.jp].some(ch => compChars.has(ch))
      ));
      const unrelated = shuffle(allWrongCandidates.filter(cpd =>
        ![...cpd.jp].some(ch => compChars.has(ch))
      ));

      // Dedupe by reading to avoid near-identical options
      const seen = new Set([comp.reading]);
      const wrongs = [];
      for (const pool of [related, unrelated]) {
        for (const opt of pool) {
          if (wrongs.length >= 3) break;
          if (!seen.has(opt.reading)) { seen.add(opt.reading); wrongs.push(opt); }
        }
        if (wrongs.length >= 3) break;
      }

      setQuizOpts(shuffle([{ ...comp, _cardKanji: correct.kanji, _isCorrect: true }, ...wrongs]));
    } else {
      const wrongs = shuffle(cards.filter(c => c.kanji !== correct.kanji)).slice(0, 3);
      setQuizOpts(shuffle([correct, ...wrongs]));
    }
  }

  function calcBonus(tLeft) {
    if (!quizTimerEnabled) return 0;
    return Math.round((tLeft / QUIZ_TIMER_SECONDS) * 5);
  }

  function handleQuiz(opt) {
    if (quizAnswered) return;
    stopTimer();
    setTimerActive(false);
    const isCompound = quizType === "compounds" || quizType === "compounds_reverse";
    const correctKanji = quizCards[quizIdx].kanji;
    const ok = isCompound ? opt._isCorrect : opt.kanji === correctKanji;
    const answeredKey = isCompound ? opt._cardKanji : opt.kanji;
    setQuizAnswered(answeredKey);
    markStudied(cards.indexOf(quizCards[quizIdx]));
    if (ok) {
      const bonus = calcBonus(timeLeft);
      setQuizScore(s => s + 1);
      setQuizBonusTotal(b => b + bonus);
      setStreak(s => s + 1);
      setScores(prev => ({ ...prev, [libId]: (prev[libId] || 0) + 1 }));
    } else {
      setStreak(0);
    }
  }

  function nextQ() {
    const n = quizIdx + 1;
    if (n >= quizCards.length) { setQuizDone(true); setTimerActive(false); return; }
    setQuizIdx(n); setQuizAnswered(null); setCompoundQuestion(null); buildOpts(quizCards, n);
    if (quizTimerEnabled) { resetTimer(QUIZ_TIMER_SECONDS); setTimerActive(true); }
  }

  // ── canvas ──
  function initCanvas() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); const sz = canvas.width;
    ctx.clearRect(0, 0, sz, sz); ctx.fillStyle = "#faf6ee"; ctx.fillRect(0, 0, sz, sz);
    ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    [[sz/2,0,sz/2,sz],[0,sz/2,sz,sz/2],[0,0,sz,sz],[sz,0,0,sz]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    ctx.setLineDash([]); ctx.strokeStyle = "#1a1008"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
  }
  function getPos(e, canvas) {
    const r = canvas.getBoundingClientRect(); const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * (canvas.width / r.width), y: (src.clientY - r.top) * (canvas.height / r.height) };
  }
  function onDown(e) { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); }
  function onMove(e) {
    e.preventDefault(); if (!drawing.current) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
    const p = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    lastPos.current = p;
  }
  function onUp() { drawing.current = false; }
  const changeIdx = dir => setIdx(i => (i + dir + cards.length) % cards.length);

  // ── timer ring ──
  const timerPct = QUIZ_TIMER_SECONDS > 0 ? timeLeft / QUIZ_TIMER_SECONDS : 1;
  const timerColor = timerPct > 0.5 ? "#27ae60" : timerPct > 0.25 ? "#f39c12" : "#c0392b";
  const circumference = 2 * Math.PI * 18;

  // ── styles ──
  const isMobile = window.innerWidth < 500;
  const S = {
    root: { display:"flex", flexDirection:"column", alignItems:"center", minHeight:"100vh", padding:"16px 13px 60px", background:"#f5efe3", fontFamily:"monospace", maxWidth: mode === "browse" ? 900 : wideFlash ? 960 : 480, margin:"0 auto", transition:"max-width 0.3s ease" },
    card: { width:"100%", border:"1px solid #ddd", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 3px 16px rgba(0,0,0,0.07)", marginBottom:10 },
    ci: { display:"flex", flexDirection:"column", alignItems:"center", padding:18, width:"100%" },
    kL: { fontFamily:"serif", fontSize: bigFont ? (isMobile ? "clamp(9rem,36vw,15rem)" : "clamp(6.75rem,27vw,11.25rem)") : (isMobile ? "clamp(4.5rem,18vw,7.5rem)" : "clamp(3.375rem,13.5vw,5.625rem)"), lineHeight:1, color:"#1a1008" },
    hint: { fontSize:"0.58rem", color:"#ccc", letterSpacing:"0.16em", textTransform:"uppercase", marginTop:9 },
    rd: { fontFamily:"serif", fontSize:"1rem", color:"#c0392b", marginBottom:2 },
    mn: { fontSize:"0.86rem", color:"#555", marginBottom:6 },
    rg: { fontSize:"0.56rem", letterSpacing:"0.16em", textTransform:"uppercase", color:"#ccc", borderTop:"1px solid #e8dcc8", paddingTop:5, marginTop:4, width:"100%", textAlign:"center" },
    yomiBox: { display:"flex", gap:12, marginTop:6, marginBottom:2, fontSize:"0.72rem" },
    yomiLabel: { fontSize:"0.58rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"#aaa", marginBottom:1 },
    btn: { padding:"8px 20px", background:"#1a1008", color:"#f5efe3", border:"1px solid #1a1008", borderRadius:3, fontSize:"0.7rem", letterSpacing:"0.12em", cursor:"pointer", fontFamily:"monospace" },
    ghost: { padding:"8px 20px", background:"transparent", color:"#1a1008", border:"1px solid #1a1008", borderRadius:3, fontSize:"0.7rem", letterSpacing:"0.12em", cursor:"pointer", fontFamily:"monospace" },
    navBtn: { width:38, height:38, borderRadius:"50%", border:"1px solid #ddd", background:"#faf6ee", cursor:"pointer", fontSize:"1rem" },
    qb: { padding:"11px 7px", border:"1px solid #ddd", borderRadius:6, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, cursor:"pointer", fontFamily:"monospace", minHeight:72 },
    libBtn: { width:"100%", padding:"8px 12px", background:"#faf6ee", border:"1px solid #ddd", borderRadius:6, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"monospace", fontSize:"0.78rem" },
    libDrop: { position:"absolute", top:"calc(100% + 3px)", left:0, right:0, background:"white", border:"1px solid #ddd", borderRadius:6, zIndex:100, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", overflow:"hidden" },
    libOpt: { display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderBottom:"1px solid #f0f0f0" },
    cb: { padding:"7px 14px", border:"1px solid", borderRadius:4, fontSize:"0.78rem", cursor:"pointer", fontFamily:"monospace", minWidth:46 },
    toggle: (on) => ({ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background: on ? "#1a1008" : "#faf6ee", border:"1px solid #ddd", borderRadius:6, cursor:"pointer", fontFamily:"monospace", fontSize:"0.73rem", color: on ? "#f5efe3" : "#555", width:"100%", marginBottom:8 }),
    optBtn: (active, extra) => ({ flex:1, padding:"8px 6px", borderRadius:8, border:`2px solid ${active?"#1a1008":"#ddd"}`, background:active?"#1a1008":"#faf6ee", color:active?"#f5efe3":"#1a1008", cursor:"pointer", fontWeight:600, ...extra }),
    sectionLabel: (extra) => ({ fontSize:"0.68rem", color:"#888", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6, ...extra }),
    reviewBtn: (on) => ({ padding:"4px 10px", borderRadius:20, border: on ? "2px solid #c0392b" : "2px solid #bbb", background: on ? "#c0392b" : "white", cursor:"pointer", fontSize:"0.85rem", fontFamily:"serif", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color: on ? "white" : "#888", boxShadow: on ? "0 2px 8px rgba(192,57,43,0.35)" : "none", letterSpacing:"0.05em" }),
  };

  // ── Shared compound card layout: mobile=3 rows, desktop=kanji||reading + meaning ──
  // meaningColor: text color for the meaning span
  // meaningVisible: false = visibility:hidden (layout preserved, text hidden)
  function renderCompoundFull(opt, meaningColor, _col, meaningVisible) {
    return isMobile ? (
      <>
        <span style={{ fontFamily:"serif", fontSize: bigFont ? "3.2rem" : "1.6rem", fontWeight:600 }}>{opt.jp}</span>
        <span style={{ fontSize: bigFont ? "2rem" : "1rem", color:"#c0392b", fontWeight:600 }}>{opt.reading}</span>
        <span style={{ fontSize: bigFont ? "1.5rem" : "0.75rem", lineHeight:1.3, textAlign:"center", color:meaningColor,
          visibility: meaningVisible ? "visible" : "hidden" }}>{opt.meaning}</span>
      </>
    ) : (
      <>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"serif" }}>
          <span style={{ fontSize: bigFont ? "3rem" : "1.5rem", fontWeight:600 }}>{opt.jp}</span>
          <span style={{ color:"#ccc", fontSize: bigFont ? "2rem" : "1rem", fontWeight:400 }}>||</span>
          <span style={{ fontSize: bigFont ? "1.8rem" : "0.9rem", color:"#c0392b", fontWeight:600 }}>{opt.reading}</span>
        </div>
        <span style={{ fontSize: bigFont ? "1.44rem" : "0.72rem", lineHeight:1.3, textAlign:"center", color:meaningColor,
          visibility: meaningVisible ? "visible" : "hidden" }}>{opt.meaning}</span>
      </>
    );
  }

  const totalQuizPoints = quizScore + quizBonusTotal;
  // Max possible: 1 base pt + 5 speed bonus pts per question
  const maxQuizPoints = quizTimerEnabled ? quizCards.length * 6 : quizCards.length;

  return (
    <div style={S.root}>
      {/* HEADER */}
      <div style={{ textAlign:"center", marginBottom:10, position:"relative", width:"100%" }}>
        <div style={{ fontFamily:"serif", fontSize:"2rem", fontWeight:700, letterSpacing:"0.05em" }}>J Kanji Tool</div>
        <div style={{ fontSize:"0.6rem", letterSpacing:"0.2em", color:"#aaa", textTransform:"uppercase" }}>Japanese Kanji Study · 漢字学習</div>
        <button
          title="Clear cache and reload"
          onClick={() => {
            if ('serviceWorker' in navigator) {
              caches.keys().then(function(keys) {
                Promise.all(keys.map(function(k) { return caches.delete(k); }))
                  .then(function() { window.location.reload(); });
              });
            } else {
              window.location.reload();
            }
          }}
          style={{ position:"absolute", top:0, right:0, background:"none", border:"none", cursor:"pointer", fontSize:"0.85rem", color:"#ccc", padding:"4px 6px" }}>
          ↺
        </button>
      </div>

      {/* LIBRARY PICKER */}
      <div style={{ width:"100%", marginBottom:10, position:"relative" }}>

        {/* Current selection button */}
        <div style={{ display:"flex", gap:6, alignItems:"stretch", width:"100%" }}>
          <button onClick={() => { setShowLib(p => !p); setActiveGroup(null); }} style={{ ...S.libBtn, flex:1 }}>
            <span style={{ fontWeight:600 }}>
              {lib.id === REVIEW_LIB_ID
                ? "🔖 Kanji for Review"
                : (() => {
                    const g = GROUPS.find(g => g.id === lib.group);
                    return `${lib.emoji} ${g ? g.label + " · " : ""}${lib.label}`;
                  })()
              }
            </span>
            <span style={{ fontSize:"0.65rem", color:"#aaa" }}>{showLib ? "▴ close" : "▾ change library"}</span>
          </button>
          <button
            onClick={() => { setShowSpicyPrompt(p => !p); setSpicyInput(""); setSpicyError(false); }}
            style={{ padding:"0 10px", borderRadius:3, border:"none",
              background:"transparent", cursor:"default", color:"transparent", userSelect:"none" }}>
            {"　"}
          </button>
        </div>

        {/* Spicy password prompt */}
        {showSpicyPrompt && (
          <div style={{ background:"#faf6ee", border:"1px solid #e8dcc8", borderRadius:6, padding:"10px 12px", marginTop:4 }}>
            {spicyUnlocked ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:"0.72rem", color:"#888" }}>Unlocked</span>
                <button onClick={() => {
                  setSpicyUnlocked(false); LS.set("spicy_unlocked", false);
                  setShowSpicyPrompt(false);
                }} style={{ fontSize:"0.62rem", color:"#aaa", background:"none", border:"none", cursor:"pointer" }}>
                  lock
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input
                  type="password"
                  value={spicyInput}
                  onChange={e => { setSpicyInput(e.target.value); setSpicyError(false); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      if (spicyInput.toLowerCase() === "spicy") {
                        setSpicyUnlocked(true); LS.set("spicy_unlocked", true);
                        setShowSpicyPrompt(false);
                      } else { setSpicyError(true); setSpicyInput(""); }
                    }
                  }}
                  placeholder="enter password"
                  style={{ flex:1, padding:"5px 8px", borderRadius:4, border:`1px solid ${spicyError?"#c0392b":"#e8dcc8"}`,
                    fontSize:"0.75rem", fontFamily:"monospace" }}
                  autoFocus
                />
                <button onClick={() => {
                  if (spicyInput.toLowerCase() === "spicy") {
                    setSpicyUnlocked(true); LS.set("spicy_unlocked", true);
                    setShowSpicyPrompt(false);
                  } else { setSpicyError(true); setSpicyInput(""); }
                }} style={{ padding:"5px 10px", borderRadius:4, border:"none", background:"#c0392b",
                  color:"white", fontSize:"0.72rem", cursor:"pointer" }}>
                  unlock
                </button>
              </div>
            )}
            {spicyError && <div style={{ fontSize:"0.62rem", color:"#c0392b", marginTop:4 }}>incorrect password</div>}
          </div>
        )}

        {/* Dropdown */}
        {showLib && (
          <div style={S.libDrop}>

            {/* Group row */}
            {!activeGroup && (<>
              {/* Review — always first */}
              {ALL_LIBRARIES.find(l => l.id === REVIEW_LIB_ID) && (
                <div onClick={() => { setLibId(REVIEW_LIB_ID); setShowLib(false); }}
                  style={{ ...S.libOpt, cursor:"pointer", background:libId===REVIEW_LIB_ID?"#f0ece0":"white" }}>
                  <span style={{ fontSize:"1.3rem" }}>🔖</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.82rem", fontWeight:600 }}>Kanji for Review</div>
                    <div style={{ fontSize:"0.62rem", color:"#c0392b" }}>{reviewKanji.size} marked</div>
                  </div>
                  {libId === REVIEW_LIB_ID && <span style={{ color:"#27ae60" }}>✓</span>}
                </div>
              )}
              {/* Built-in groups — only show if they have libraries */}
              {GROUPS.filter(g => ALL_LIBRARIES.some(l => l.group === g.id) && (g.id !== "spicy" || spicyUnlocked)).map(g => {
                const groupLibs = ALL_LIBRARIES.filter(l => l.group === g.id);
                return (
                  <div key={g.id} onClick={() => {
                    if (groupLibs.length === 1) { setLibId(groupLibs[0].id); setShowLib(false); }
                    else setActiveGroup(g.id);
                  }}
                    style={{ ...S.libOpt, cursor:"pointer", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontFamily:"serif", fontSize:"1.4rem", minWidth:28, textAlign:"center" }}>{g.emoji}</span>
                      <div>
                        <div style={{ fontSize:"0.85rem", fontWeight:700 }}>{g.label}</div>
                        <div style={{ fontSize:"0.62rem", color:"#aaa" }}>{g.desc} · {groupLibs.length} {groupLibs.length === 1 ? "set" : "sets"}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:"0.7rem", color:"#aaa" }}>▶</span>
                  </div>
                );
              })}
              {/* User-uploaded libraries without a group */}
              {ALL_LIBRARIES.filter(l => !l.group && l.id !== REVIEW_LIB_ID).map(l => (
                <div key={l.id} onClick={() => { setLibId(l.id); setShowLib(false); }}
                  style={{ ...S.libOpt, cursor:"pointer", background:l.id===libId?"#f0ece0":"white" }}>
                  <span style={{ fontSize:"1.3rem" }}>{l.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.82rem", fontWeight:600 }}>{l.label}</div>
                    <div style={{ fontSize:"0.62rem", color:"#aaa" }}>{l.sublabel}</div>
                  </div>
                  {l.id === libId && <span style={{ color:"#27ae60" }}>✓</span>}
                </div>
              ))}
            </>)}

            {/* Level list for selected group */}
            {activeGroup && (<>
              <div onClick={() => setActiveGroup(null)}
                style={{ ...S.libOpt, cursor:"pointer", borderBottom:"2px solid #e8dcc8", color:"#888", fontSize:"0.72rem" }}>
                <span>◀ back</span>
                <span style={{ fontFamily:"serif", fontSize:"1.1rem", marginLeft:8 }}>
                  {GROUPS.find(g => g.id === activeGroup)?.emoji}
                </span>
                <span style={{ fontWeight:700, fontSize:"0.85rem", flex:1, marginLeft:6 }}>
                  {GROUPS.find(g => g.id === activeGroup)?.label}
                </span>
              </div>
              {ALL_LIBRARIES.filter(l => l.group === activeGroup).sort((a,b) => a.label.localeCompare(b.label, undefined, {numeric:true})).map(l => (
                <div key={l.id} onClick={() => { setLibId(l.id); setShowLib(false); setActiveGroup(null); }}
                  style={{ ...S.libOpt, cursor:"pointer", background:l.id===libId?"#f0ece0":"white", paddingLeft:20 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.85rem", fontWeight:600 }}>{l.label}</div>
                    <div style={{ fontSize:"0.62rem", color:"#aaa" }}>{l.sublabel}</div>
                  </div>
                  {l.id === libId && <span style={{ color:"#27ae60" }}>✓</span>}
                </div>
              ))}
            </>)}

          </div>
        )}
      </div>

      {/* STATS */}
      <div style={{ display:"flex", gap:14, fontSize:"0.67rem", color:"#888", marginBottom:7 }}>
        <span>✅ <b style={{color:"#1a1008"}}>{libScore}</b> correct</span>
        <span>📖 <b style={{color:"#1a1008"}}>{libStudied.size}</b>/{cards.length} studied</span>
        <span>🔥 <b style={{color:"#c0392b"}}>{streak}</b> streak</span>
        {reviewKanji.size > 0 && <span>🔖 <b style={{color:"#c0392b"}}>{reviewKanji.size}</b></span>}
      </div>

      {/* PROGRESS */}
      <div style={{ width:"100%", height:4, background:"#e8dcc8", borderRadius:3, marginBottom:12 }}>
        <div style={{ height:"100%", borderRadius:3, background:"linear-gradient(to right,#b8860b,#c0392b)", width:cards.length ? `${libStudied.size/cards.length*100}%` : "0%", transition:"width 0.4s" }} />
      </div>

      {/* MODE TABS */}
      <div style={{ display:"flex", border:"1px solid #ddd", borderRadius:4, overflow:"hidden", marginBottom:12, width:"100%" }}>
        {["flash","quiz","write","browse","read"].map((t, i) => (
          <button key={t} onClick={() => setMode(t)} style={{ flex:1, padding:"7px 2px", border:"none", borderRight:i<4?"1px solid #ddd":"none", background:mode===t?"#1a1008":"transparent", color:mode===t?"#f5efe3":"#888", fontSize:"0.64rem", cursor:"pointer", textTransform:"uppercase", fontFamily:"monospace" }}>
            {["Flashcard","Quiz","Trace","Browse","Read"][i]}
          </button>
        ))}
      </div>

      {/* ── FLASHCARD ── */}
      {mode === "flash" && card && (<>
        {/* Wide mode toggle — hidden on small screens */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", width:"100%", marginBottom:5 }}>
          <button
            onClick={() => setWideFlash(p => !p)}
            style={{ background:"none", border:"1px solid #ddd", borderRadius:4, padding:"3px 10px", fontSize:"0.62rem", color: wideFlash ? "#b8860b" : "#aaa", cursor:"pointer", fontFamily:"monospace", letterSpacing:"0.08em", display:"none" }}
            className="wide-flash-btn"
          >
            {wideFlash ? "▣ single view" : "⊟ wide view"}
          </button>
        </div>
        <style>{`
          @media (min-width: 700px) { .wide-flash-btn { display: inline-block !important; } }
        `}</style>

        {/* SINGLE CARD MODE */}
        {!wideFlash && (<>
          <div style={{ display:"flex", gap:5, width:"100%", marginBottom:7 }}>
            {[0,1,2].map(l => <div key={l} style={{ height:3, flex:1, borderRadius:2, background:layer>=l?"#b8860b":"#e8dcc8", transition:"background 0.3s" }} />)}
          </div>
          <div onClick={() => { const n=(layer+1)%3; setLayer(n); if(n>0) markStudied(); }}
            style={{ ...S.card, background:regionColors[card.region]||"#faf6ee", cursor:"pointer", minHeight:210 }}>

            {layer === 0 && (
              <div style={S.ci}>
                <div style={S.kL}>{card.kanji}</div>
                <div style={S.hint}>tap for reading →</div>
              </div>
            )}

            {layer === 1 && (
              <div style={S.ci}>
                <div style={{ fontFamily:"serif", fontSize: bigFont ? "4.4rem" : "2.2rem", marginBottom:3 }}>{card.kanji}</div>
                <div style={{ ...S.rd, fontSize:"1.2rem" }}>{card.reading} · {card.romaji}</div>
                <div style={{ ...S.mn, fontSize:"1rem" }}>{card.meaning}</div>
                <div style={S.yomiBox}>
                  <div style={{ textAlign:"center" }}>
                    <div style={S.yomiLabel}>訓読み kun</div>
                    <div style={{ color:"#2471a3", fontSize:"1.2rem" }}>{card.kunYomi.join("、")}</div>
                  </div>
                  <div style={{ width:1, background:"#e8dcc8" }} />
                  <div style={{ textAlign:"center" }}>
                    <div style={S.yomiLabel}>音読み on</div>
                    <div style={{ color:"#c0392b", fontSize:"1.2rem" }}>{card.onYomi.join("、")}</div>
                  </div>
                </div>
                <div style={S.rg}>{card.region}</div>
                <div style={S.hint}>tap for compounds →</div>
              </div>
            )}

            {layer === 2 && (
              <div style={{ ...S.ci, alignItems:"flex-start", padding:"14px 16px", gap:9 }}>
                <div style={{ fontFamily:"serif", fontSize: bigFont ? "2.4rem" : "1.2rem", color:"#b8860b", marginBottom:4, alignSelf:"center" }}>{card.kanji} — 用例</div>
                {(card.compounds||[]).map((c, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"baseline", gap:8, borderLeft:"3px solid #e8dcc8", paddingLeft:9, width:"100%" }}>
                    <span style={{ fontSize:"0.62rem", color:"#ccc", minWidth:12 }}>{i+1}.</span>
                    <span style={{ fontFamily:"serif", fontSize: bigFont ? "2.4rem" : "1.2rem", color:"#1a1008" }}>{c.jp}</span>
                    <span style={{ fontSize: bigFont ? "2.4rem" : "1.2rem", color:"#2471a3" }}>{c.reading}</span>
                    <span style={{ fontSize: bigFont ? "2rem" : "1rem", color:"#888", marginLeft:"auto", textAlign:"right" }}>{c.meaning}</span>
                  </div>
                ))}
                <div style={{ ...S.hint, alignSelf:"center" }}>tap to reset ↺</div>
              </div>
            )}
          </div>

          {/* Review button + nav */}
          <div style={{ display:"flex", gap:12, alignItems:"center", marginTop:6, width:"100%" }}>
            <button style={S.navBtn} onClick={() => changeIdx(-1)}>←</button>
            <span style={{ fontSize:"0.72rem", color:"#aaa", flex:1, textAlign:"center" }}>{idx+1} / {cards.length}</span>
            <button
              title={reviewKanji.has(card.kanji) ? "Remove from review" : "Mark for review"}
              onClick={() => { toggleReview(card.kanji); showToast(reviewKanji.has(card.kanji) ? "Removed from review" : "🔖 Added to review", reviewKanji.has(card.kanji) ? "bad" : "good"); }}
              style={{ ...S.reviewBtn(reviewKanji.has(card.kanji)), marginRight:0 }}>
              復習
            </button>
            <button style={S.navBtn} onClick={() => changeIdx(1)}>→</button>
          </div>
          {reviewKanji.has(card.kanji) && (
            <div style={{ fontSize:"0.6rem", color:"#c0392b", marginTop:4, letterSpacing:"0.1em" }}>Click red pill to remove from Review List</div>
          )}
        </>)}

        {/* WIDE / TRIPLE VIEW */}
        {wideFlash && (
          <>
            <div style={{ display:"flex", gap:10, width:"100%", alignItems:"stretch" }}>

              {/* Panel 1: Reading */}
              <div style={{ ...S.card, flex:1, minWidth:0, background:regionColors[card.region]||"#faf6ee", minHeight:320, cursor:"default" }}>
                <div style={S.ci}>
                  <div style={{ fontFamily:"serif", fontSize:"2.8rem", marginBottom:4 }}>{card.kanji}</div>
                  <div style={{ ...S.rd, fontSize:"1.4rem" }}>{card.reading} · {card.romaji}</div>
                  <div style={{ ...S.mn, fontSize:"1.1rem" }}>{card.meaning}</div>
                  <div style={S.yomiBox}>
                    <div style={{ textAlign:"center" }}>
                      <div style={S.yomiLabel}>訓読み kun</div>
                      <div style={{ color:"#2471a3", fontSize:"1.2rem" }}>{card.kunYomi.join("、")}</div>
                    </div>
                    <div style={{ width:1, background:"#e8dcc8" }} />
                    <div style={{ textAlign:"center" }}>
                      <div style={S.yomiLabel}>音読み on</div>
                      <div style={{ color:"#c0392b", fontSize:"1.2rem" }}>{card.onYomi.join("、")}</div>
                    </div>
                  </div>
                  <div style={S.rg}>{card.region}</div>
                </div>
              </div>

              {/* Panel 2: Compounds */}
              <div style={{ ...S.card, flex:1, minWidth:0, background:regionColors[card.region]||"#faf6ee", minHeight:320, cursor:"default" }}>
                <div style={{ ...S.ci, alignItems:"flex-start", padding:"18px 20px", gap:11 }}>
                  <div style={{ fontFamily:"serif", fontSize:"1.3rem", color:"#b8860b", marginBottom:4, alignSelf:"center" }}>{card.kanji} — 用例</div>
                  {(card.compounds||[]).map((c, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"baseline", gap:10, borderLeft:"3px solid #e8dcc8", paddingLeft:11, width:"100%" }}>
                      <span style={{ fontSize:"0.65rem", color:"#ccc", minWidth:14 }}>{i+1}.</span>
                      <span style={{ fontFamily:"serif", fontSize:"1.3rem", color:"#1a1008" }}>{c.jp}</span>
                      <span style={{ fontSize:"1.1rem", color:"#2471a3" }}>{c.reading}</span>
                      <span style={{ fontSize:"1rem", color:"#888", marginLeft:"auto", textAlign:"right" }}>{c.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            {/* nav */}
            <div style={{ display:"flex", gap:12, alignItems:"center", marginTop:8, width:"100%" }}>
              <button style={S.navBtn} onClick={() => { changeIdx(-1); markStudied(); }}>←</button>
              <span style={{ fontSize:"0.72rem", color:"#aaa", flex:1, textAlign:"center" }}>{idx+1} / {cards.length}</span>
              <button
                title={reviewKanji.has(card.kanji) ? "Remove from review" : "Mark for review"}
                onClick={() => { toggleReview(card.kanji); showToast(reviewKanji.has(card.kanji) ? "Removed from review" : "🔖 Added to review", reviewKanji.has(card.kanji) ? "bad" : "good"); }}
                style={{ ...S.reviewBtn(reviewKanji.has(card.kanji)), marginRight:0 }}>
                復習
              </button>
              <button style={S.navBtn} onClick={() => { changeIdx(1); markStudied(); }}>→</button>
            </div>
            {reviewKanji.has(card.kanji) && (
              <div style={{ fontSize:"0.6rem", color:"#c0392b", marginTop:4, letterSpacing:"0.1em" }}>Click red pill to remove from Review List</div>
            )}
          </>
        )}
      </>)}

      {/* ── QUIZ ── */}
      {mode === "quiz" && (<>
        {quizSetup && (
          <div style={{ width:"100%", padding:"4px 0" }}>

            {/* Mode selector */}
            <div style={{ display:"flex", gap:8, marginBottom:18 }}>
              {[
                { key:"kanji",            label:"漢字",  sub:"Kanji → Reading" },
                { key:"compounds",        label:"熟語",  sub:"Compound → Reading" },
                { key:"compounds_reverse",label:"英語",  sub:"English → Compound" },
              ].map(({ key, label, sub }) => (
                <button key={key} onClick={() => setQuizType(key)}
                  style={S.optBtn(quizType===key, {padding:"10px 6px", display:"flex", flexDirection:"column", alignItems:"center", gap:3})}>
                  <span style={{ fontFamily:"serif", fontSize:"1.3rem" }}>{label}</span>
                  <span style={{ fontSize:"0.58rem", opacity:0.7, letterSpacing:"0.04em", textAlign:"center" }}>{sub}</span>
                </button>
              ))}
            </div>
            <div style={{ textAlign:"center", fontSize:"0.75rem", color:"#888", marginBottom:18 }}>How many questions?</div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:22 }}>
              {[5,10,15,20,cards.length].map(n => (
                <button key={n} onClick={() => setQuizCount(n)}
                  style={{ ...S.cb, background:quizCount===n?"#1a1008":"#faf6ee", color:quizCount===n?"#f5efe3":"#1a1008", borderColor:quizCount===n?"#1a1008":"#ddd" }}>
                  {n === cards.length ? `All (${n})` : n}
                </button>
              ))}
            </div>

            {/* Timer toggle */}
            <div style={{ marginBottom:16 }}>
              <button style={S.toggle(quizTimerEnabled)} onClick={() => setQuizTimerEnabled(p => !p)}>
                <span>⏱ Timed Mode {quizTimerEnabled ? "— ON" : "— Off"}</span>
                <span style={{ fontSize:"0.62rem", opacity:0.7 }}>{quizTimerEnabled ? "10s per question · faster = bonus pts" : "tap to enable"}</span>
              </button>
            </div>

            {/* Answer style — only for compounds mode */}
            {quizType === "compounds" && (
              <div style={{ marginBottom:16 }}>
                <div style={S.sectionLabel({marginBottom:8, textAlign:"center"})}>Answer format</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[
                    { key:"traditional", label:"Japanese / English" },
                    { key:"japanese",    label:"Japanese" },
                    { key:"english",     label:"English" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setAnswerStyle(key)}
                      style={S.optBtn(answerStyle===key, {padding:"10px 4px", alignItems:"center", justifyContent:"center"})}>
                      <span style={{ fontSize:"0.75rem", fontWeight:600 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty — only for compounds_reverse */}
            {quizType === "compounds_reverse" && (
              <div style={{ marginBottom:16 }}>
                <button style={S.toggle(quizDifficulty === "hard")} onClick={() => setQuizDifficulty(d => d === "easy" ? "hard" : "easy")}>
                  <span>{quizDifficulty === "hard" ? "💀 Hard Mode" : "🌸 Easy Mode"}</span>
                  <span style={{ fontSize:"0.62rem", opacity:0.7 }}>{quizDifficulty === "hard" ? "Furigana hidden · revealed after answering" : "Furigana always visible in red"}</span>
                </button>
              </div>
            )}

            <button style={{ ...S.btn, width:"100%", padding:"11px" }} onClick={startQuiz}>Start Quiz →</button>
            {sessions.length > 0 && (
              <button style={{ ...S.ghost, width:"100%", padding:"9px", marginTop:8 }} onClick={() => setShowStats(true)}>
                📊 Stats ({sessions.length} session{sessions.length !== 1 ? "s" : ""})
              </button>
            )}
          </div>
        )}

        {!quizSetup && !quizDone && quizCards[quizIdx] && (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", marginBottom:7 }}>
            <span style={{ fontSize:"0.67rem", color:"#aaa" }}>
              Question {quizIdx+1} of {quizCards.length}
            </span>
            <span style={{ fontSize:"0.67rem", color:"#888" }}>
              {quizTimerEnabled ? (
                <>
                  <b style={{ color:"#1a1008" }}>{totalQuizPoints}</b>
                  <span style={{ color:"#ccc" }}> / {(quizIdx + 1) * 6}</span>
                  {quizBonusTotal > 0 && <span style={{ color:"#b8860b" }}> ⚡</span>}
                </>
              ) : (
                <><b style={{ color:"#1a1008" }}>{quizScore}</b><span style={{ color:"#ccc" }}> / {quizIdx + 1}</span></>
              )}
            </span>
          </div>

          {/* Timer ring */}
          {quizTimerEnabled && (
            <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
              <svg width={44} height={44} style={{ transform:"rotate(-90deg)" }}>
                <circle cx={22} cy={22} r={18} fill="none" stroke="#e8dcc8" strokeWidth={4} />
                <circle cx={22} cy={22} r={18} fill="none" stroke={timerColor} strokeWidth={4}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - timerPct)}
                  style={{ transition:"stroke-dashoffset 0.9s linear, stroke 0.3s" }} />
                <text x={22} y={22} textAnchor="middle" dominantBaseline="central"
                  style={{ transform:"rotate(90deg)", transformOrigin:"22px 22px", fontFamily:"monospace", fontSize:13, fill:timerColor, fontWeight:600 }}>
                  {timeLeft}
                </text>
              </svg>
            </div>
          )}

          <div style={{ ...S.card, background:"#faf6ee", cursor:"default",
            minHeight: quizType === "compounds_reverse" ? 70 : 150, marginBottom:10 }}>
            <div style={S.ci}>
              {quizType === "kanji" && (
                <div style={S.kL}>{quizCards[quizIdx].kanji}</div>
              )}
              {quizType === "compounds" && compoundQuestion && (
                <div style={{ fontFamily:"serif", fontSize:"clamp(2rem,10vw,3.2rem)", color:"#1a1008", lineHeight:1.1 }}>{compoundQuestion.jp}</div>
              )}
              {quizType === "compounds_reverse" && compoundQuestion && (
                <div style={{ fontSize:"clamp(1rem,4vw,1.3rem)", color:"#1a1008", textAlign:"center", lineHeight:1.4, padding:"0 8px" }}>{compoundQuestion.meaning}</div>
              )}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, width:"100%", marginBottom:10 }}>
            {quizOpts.map((opt, i) => {
              const isCompound = quizType === "compounds" || quizType === "compounds_reverse";
              const optKey = isCompound ? opt._cardKanji : opt.kanji;
              const correctKanji = quizCards[quizIdx].kanji;
              const isCorrectOpt = isCompound ? opt._isCorrect : optKey === correctKanji;
              const isWrongPicked = quizAnswered && optKey === quizAnswered && !isCorrectOpt;
              let bg="#faf6ee", border="#ddd", col="#1a1008";
              if (quizAnswered) {
                if (isCorrectOpt)       { bg="#eafaf1"; border="#27ae60"; col="#1e8449"; }
                else if (isWrongPicked) { bg="#fdf0ed"; border="#c0392b"; col="#c0392b"; }
              }
              return (
                <button key={i} onClick={() => handleQuiz(opt)} disabled={!!quizAnswered}
                  style={{ ...S.qb, background:bg, borderColor:border, color:col,
                    ...(quizType === "compounds" || quizType === "compounds_reverse" ? { minHeight: isMobile ? 110 : 90, padding: isMobile ? "14px 8px" : "14px 10px" } : {}) }}>

                  {/* ── KANJI MODE ── */}
                  {quizType === "kanji" && (<>
                    <span style={{ fontFamily:"serif", fontSize: bigFont ? "2.2rem" : "1.1rem", fontWeight:600 }}>{opt.reading}</span>
                    <span style={{ fontSize: bigFont ? "1.44rem" : "0.72rem", marginTop:2, lineHeight:1.3, textAlign:"center" }}>{opt.meaning}</span>
                  </>)}

                  {/* ── COMPOUNDS MODE ── */}
                  {quizType === "compounds" && (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, width:"100%", justifyContent:"center" }}>
                      {quizAnswered ? renderCompoundFull(opt, col, col, true) : (
                        /* Pre-answer: based on answerStyle */
                        <>
                          {(answerStyle === "traditional" || answerStyle === "japanese") && (
                            <span style={{ fontFamily:"serif", fontSize: bigFont ? "2.2rem" : "1.1rem", fontWeight:600 }}>{opt.reading}</span>
                          )}
                          {(answerStyle === "traditional" || answerStyle === "english") && (
                            <span style={{ fontSize: answerStyle === "english" ? (bigFont ? "2.16rem" : "1.08rem") : (bigFont ? "1.44rem" : "0.72rem"), lineHeight:1.3, textAlign:"center", fontWeight: answerStyle === "english" ? 600 : 400 }}>{opt.meaning}</span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── REVERSE MODE: big kanji, red furigana easy=always/hard=after answer, english after answer ── */}
                  {quizType === "compounds_reverse" && (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, width:"100%", justifyContent:"center" }}>
                      {quizDifficulty === "hard" && !quizAnswered
                        ? <span style={{ fontFamily:"serif", fontSize: bigFont ? "4rem" : "2rem", fontWeight:600 }}>{opt.jp}</span>
                        : renderCompoundFull(opt, quizAnswered ? col : "#888", quizAnswered ? col : "#888", !!quizAnswered)
                      }
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {quizAnswered && <button style={S.btn} onClick={nextQ}>{quizIdx+1 >= quizCards.length ? "See Results →" : "Next →"}</button>}
        </>)}

        {quizDone && (() => {
          const pct = quizScore / quizCards.length;
          const accuracyLabel = pct === 1 ? "完璧！" : pct >= 0.8 ? "素晴らしい！" : pct >= 0.6 ? "よく頑張った！" : "もっと練習！";
          const accuracyColor = pct === 1 ? "#b8860b" : pct >= 0.8 ? "#27ae60" : pct >= 0.6 ? "#555" : "#888";
          // platinum=avg≥4.5, gold=avg≥4, silver=avg≥3, bronze=avg≥2
          const q = quizCards.length;
          const speedMedal = !quizTimerEnabled ? null
            : quizBonusTotal >= q * 4.5 ? { rank:1, kanji:"白金", color:"#a0a0b8", shine:"#e8e8f0", border:"#c0c0d8", bg:"#f5f3ff" }
            : quizBonusTotal >= q * 4   ? { rank:2, kanji:"金",  color:"#c9960c", shine:"#f5d96a", border:"#e0aa20", bg:"#fdf8e1" }
            : quizBonusTotal >= q * 3   ? { rank:3, kanji:"銀",  color:"#7f8c8d", shine:"#c8d0d0", border:"#a0aaa8", bg:"#f4f6f7" }
            : quizBonusTotal >= q * 2   ? { rank:4, kanji:"銅",  color:"#a04000", shine:"#d4845a", border:"#c05020", bg:"#fdf2e9" }
            : null;
          return (
          <div style={{ textAlign:"center", padding:"16px 0", width:"100%" }}>
            {/* Accuracy block */}
            <div style={{ marginBottom: quizTimerEnabled ? 20 : 24 }}>
              <div style={{ fontSize:"4rem", fontFamily:"serif", color:"#c0392b", fontWeight:700, lineHeight:1 }}>
                {quizScore}/{quizCards.length}
              </div>
              <div style={{ fontSize:"1.4rem", color: accuracyColor, marginTop:8, fontFamily:"serif" }}>
                {accuracyLabel}
              </div>
            </div>

            {/* Speed block — only shown in timed mode */}
            {quizTimerEnabled && (
              <div style={{ margin:"0 auto 24px", maxWidth:260, padding:"14px 18px", background: speedMedal ? speedMedal.bg : "#fafafa", border:`1px solid ${speedMedal ? speedMedal.color + "55" : "#eee"}`, borderRadius:8 }}>
                <div style={{ fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#aaa", marginBottom:10, fontFamily:"monospace" }}>Speed Score</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
                  {speedMedal ? (
                    <svg width={48} height={56} viewBox="0 0 48 56">
                      {/* ribbon left */}
                      <polygon points="14,0 24,0 24,20 10,32" fill={speedMedal.border} opacity="0.85"/>
                      {/* ribbon right */}
                      <polygon points="34,0 24,0 24,20 38,32" fill={speedMedal.color} opacity="0.85"/>
                      {/* medal circle shadow */}
                      <circle cx="24" cy="38" r="16" fill="rgba(0,0,0,0.12)"/>
                      {/* medal circle */}
                      <circle cx="24" cy="37" r="16" fill={speedMedal.color}/>
                      {/* shine arc */}
                      <circle cx="24" cy="37" r="16" fill={speedMedal.shine} opacity="0.35" clipPath="url(#top)"/>
                      <clipPath id="top"><rect x="8" y="21" width="32" height="10"/></clipPath>
                      {/* border ring */}
                      <circle cx="24" cy="37" r="16" fill="none" stroke={speedMedal.border} strokeWidth="1.5"/>
                      {/* number */}
                      <text x="24" y="43" textAnchor="middle" fontFamily="serif" fontSize="18" fontWeight="bold" fill="white" opacity="0.95">
                        {speedMedal.rank === 1 ? "1" : speedMedal.rank === 2 ? "1" : speedMedal.rank === 3 ? "2" : "3"}
                      </text>
                    </svg>
                  ) : (
                    <span style={{ fontSize:"1.6rem", opacity:0.25 }}>⏱</span>
                  )}
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:"2.2rem", fontFamily:"serif", color: speedMedal ? speedMedal.color : "#bbb", fontWeight:700, lineHeight:1 }}>
                      {quizBonusTotal}/{quizCards.length * 5}
                      {speedMedal && <span style={{ fontSize:"1.4rem", marginLeft:6 }}>{speedMedal.kanji}</span>}
                    </div>
                    {!speedMedal && <div style={{ fontSize:"0.7rem", color:"#bbb", marginTop:2 }}>もっと練習！</div>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
              <button style={S.ghost} onClick={() => setQuizSetup(true)}>Change Settings</button>
              <button style={S.btn} onClick={startQuiz}>Try Again</button>
              {sessions.length > 0 && (
                <button style={{ ...S.ghost, width:"100%", marginTop:4 }} onClick={() => setShowStats(true)}>📊 Stats ({sessions.length} session{sessions.length !== 1 ? "s" : ""})</button>
              )}
            </div>
          </div>
          );
        })()}
      </>)}

      {/* ── TRACE ── */}
      {mode === "write" && card && (<>
        <div style={{ textAlign:"center", marginBottom:8 }}>
          <div style={{ fontSize:"0.95rem", color:"#888" }}>{card.meaning}</div>
          <div style={{ fontFamily:"serif", fontSize:"0.95rem", color:"#c0392b" }}>{card.reading} · {card.romaji}</div>
        </div>
        <canvas ref={canvasRef} width={250} height={250}
          style={{ border:"1px solid #ddd", borderRadius:6, touchAction:"none", display:"block", margin:"0 auto 10px" }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
        <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:10 }}>
          <button style={S.ghost} onClick={initCanvas}>Clear</button>
          <button style={S.btn} onClick={() => { setRevealed(true); markStudied(); }}>Reveal 答え</button>
        </div>
        {revealed && <div style={{ textAlign:"center", fontFamily:"serif", fontSize:"4rem" }}>{card.kanji}</div>}
        <div style={{ display:"flex", gap:12, alignItems:"center", marginTop:10 }}>
          <button style={S.navBtn} onClick={() => changeIdx(-1)}>←</button>
          <span style={{ fontSize:"0.72rem", color:"#aaa" }}>{idx+1} / {cards.length}</span>
          <button style={S.navBtn} onClick={() => changeIdx(1)}>→</button>
        </div>
      </>)}

      {/* ── BROWSE ── */}
      {mode === "browse" && (
        <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill,minmax(${window.innerWidth < 500 ? "78px" : "110px"},1fr))`, gap:window.innerWidth < 500 ? 7 : 10, width:"100%", maxHeight:"58vh", overflowY:"auto", padding:3 }}>
          {cards.map((c, i) => (
            <div key={i}
              style={{ border:`1px solid ${reviewKanji.has(c.kanji)?"#e8c0b8":"#ddd"}`, borderRadius:5, background:libStudied.has(i)?"#f0f8f0":"#faf6ee", padding:"8px 6px", textAlign:"center", cursor:"pointer", position:"relative", minWidth:0 }}>
              <div onClick={() => { setIdx(i); setMode("flash"); setLayer(0); }} style={{ fontFamily:"serif", fontSize:"1.7rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.kanji}</div>
              <div style={{ fontSize:"1.2rem", color:"#c0392b", marginTop:2, wordBreak:"break-word" }}>{c.reading}</div>
              <div style={{ fontSize:"1rem", color:"#888", wordBreak:"break-word" }}>{c.meaning}</div>
              <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:2 }}>
                {libStudied.has(i) && <span style={{ fontSize:"0.6rem", color:"#27ae60" }}>✓</span>}
                <button onClick={(e) => { e.stopPropagation(); toggleReview(c.kanji); }}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.7rem", padding:0, opacity:reviewKanji.has(c.kanji)?1:0.3 }}>
                  🔖
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── READ ── */}
      {mode === "read" && (
        <div style={{ width:"100%", padding:"4px 0" }}>

          {/* ── Controls ── */}
          {!readContent && !readLoading && (
            <>
              {/* Scope */}
              <div style={{ marginBottom:14 }}>
                <div style={S.sectionLabel()}>Source</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[["library","This Library"],["card","This Card"]].map(([k,l]) => (
                    <button key={k} onClick={() => setReadScope(k)}
                      style={S.optBtn(readScope===k, {fontSize:"0.75rem"})}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div style={{ marginBottom:14 }}>
                <div style={S.sectionLabel()}>Format</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[["sentences","Sentences"],["story","Story"]].map(([k,l]) => (
                    <button key={k} onClick={() => setReadType(k)}
                      style={S.optBtn(readType===k, {fontSize:"0.75rem"})}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div style={{ marginBottom:14 }}>
                <div style={S.sectionLabel()}>JLPT Level</div>
                <div style={{ display:"flex", gap:6 }}>
                  {["N5","N4","N3"].map(l => (
                    <button key={l} onClick={() => setReadLevel(l)}
                      style={S.optBtn(readLevel===l, {fontSize:"0.75rem"})}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count / Length */}
              {readType === "sentences" ? (
                <div style={{ marginBottom:20 }}>
                  <div style={S.sectionLabel()}>Number of Sentences</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {[5,10,15].map(n => (
                      <button key={n} onClick={() => setReadCount(n)}
                        style={S.optBtn(readCount===n, {fontSize:"0.75rem"})}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom:20 }}>
                  <div style={S.sectionLabel()}>Story Length</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {[["short","Short (~200)"],["medium","Medium (~500)"],["long","Long (~800)"]].map(([k,l]) => (
                      <button key={k} onClick={() => setReadLength(k)}
                        style={S.optBtn(readLength===k, {fontSize:"0.72rem"})}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Include full group toggle — only when scope=library and library has group siblings */}
              {readScope === "library" && lib.group && ALL_LIBRARIES.filter(l => l.group === lib.group && l.id !== lib.id).length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <button style={S.toggle(readIncludeGroup)} onClick={() => setReadIncludeGroup(p => !p)}>
                    <span>📚 Include full group {readIncludeGroup ? "— ON" : "— Off"}</span>
                    <span style={{ fontSize:"0.62rem", opacity:0.7 }}>
                      {readIncludeGroup
                        ? `Mixing vocab from all ${GROUPS.find(g => g.id === lib.group)?.label || "group"} libraries`
                        : "tap to add vocab from other libraries in this group"}
                    </span>
                  </button>
                </div>
              )}

              {/* AI Input */}
              <div style={{ marginBottom:14 }}>
                <div style={S.sectionLabel()}>✨ AI Input <span style={{ fontWeight:400, opacity:0.6 }}>(optional)</span></div>
                <textarea
                  value={readAiInput}
                  onChange={e => setReadAiInput(e.target.value)}
                  placeholder="e.g. set the story in a ramen shop, include a talking cat..."
                  rows={2}
                  style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:6, border:"1px solid #e8dcc8", background:"#fffdf8", fontSize:"0.75rem", fontFamily:"inherit", color:"#3a2a1a", resize:"vertical", outline:"none" }}
                />
              </div>

              <button style={{ ...S.btn, width:"100%", padding:"12px" }} onClick={generateRead}>
                Generate ✦
              </button>

              {/* ── CYOA divider ── */}
              <div style={{ display:"flex", alignItems:"center", gap:8, margin:"18px 0 14px" }}>
                <div style={{ flex:1, height:1, background:"#e8dcc8" }} />
                <span style={{ fontSize:"0.62rem", color:"#bbb", letterSpacing:"0.12em", textTransform:"uppercase" }}>or</span>
                <div style={{ flex:1, height:1, background:"#e8dcc8" }} />
              </div>

              {/* ── CYOA theme picker ── */}
              <div style={{ marginBottom:12 }}>
                <div style={S.sectionLabel()}>Adventure Theme</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {[
                    { key:"fantasy",    label:"⚔️ Fantasy" },
                    { key:"mystery",    label:"🔍 Mystery" },
                    { key:"slice",      label:"🌸 Slice of Life" },
                    { key:"historical", label:"🏯 Historical" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setCyoaTheme(key)}
                      style={S.optBtn(cyoaTheme===key, {minWidth:"45%", fontSize:"0.72rem"})}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const prompt = buildCYOAPrompt();
                const encoded = encodeURIComponent(prompt);
                return (
                  <>
                    <a href={`https://claude.ai/new?q=${encoded}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"block", width:"100%", padding:"12px", borderRadius:3, border:"1px solid #1a1008",
                        background:"transparent", color:"#1a1008", fontSize:"0.7rem", fontFamily:"monospace",
                        letterSpacing:"0.12em", cursor:"pointer", textAlign:"center", textDecoration:"none",
                        boxSizing:"border-box" }}>
                      📖 Open Adventure in Claude ↗
                    </a>
                    <a href={`https://x.com/i/grok?text=${encoded}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"block", width:"100%", padding:"12px", marginTop:8, borderRadius:3,
                        border:"1px solid #1a1008", background:"transparent", color:"#1a1008",
                        fontSize:"0.7rem", fontFamily:"monospace", letterSpacing:"0.12em",
                        cursor:"pointer", textAlign:"center", textDecoration:"none", boxSizing:"border-box" }}>
                      📖 Open Adventure in Grok ↗
                    </a>
                  </>
                );
              })()}
              <div style={{ fontSize:"0.6rem", color:"#bbb", textAlign:"center", marginTop:5 }}>
                Opens with your vocabulary — branching story, you choose what happens next
              </div>
            </>
          )}

          {/* ── Loading ── */}
          {readLoading && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#aaa", fontFamily:"serif", fontSize:"1.1rem" }}>
              <div style={{ fontSize:"2rem", marginBottom:12 }}>✦</div>
              Generating…
            </div>
          )}

          {/* ── Error ── */}
          {readError && (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ color:"#c0392b", marginBottom:12, fontSize:"0.8rem" }}>{readError}</div>
              <button style={S.btn} onClick={generateRead}>Try Again</button>
            </div>
          )}

          {/* ── Content ── */}
          {readContent && !readLoading && (() => {
            const isStory = !Array.isArray(readContent);
            const items = isStory ? readContent.paragraphs : readContent;

            return (
              <div style={{ width:"100%" }}>
                {/* CSS for furigana */}
                <style>{`
                  ruby { ruby-align: center; }
                  ruby rt { font-size: 0.6em; display: block; text-align: center; line-height: 1.2; }
                `}</style>

                {/* Mobile clear all — only shown if any words are tapped */}
                {isMobile && pinnedWords.size > 0 && (
                  <div style={{ textAlign:"right", marginBottom:8 }}>
                    <button onClick={() => setPinnedWords(new Set())}
                      style={{ ...S.ghost, fontSize:"0.65rem", padding:"4px 10px" }}>
                      Clear furigana
                    </button>
                  </div>
                )}

                {/* Story title */}
                {isStory && readContent.title && (
                  <div style={{ fontFamily:"serif", fontSize:"1.2rem", fontWeight:700, color:"#1a1008", marginBottom:16, textAlign:"center" }}>
                    <RubyText text={readContent.title} id="title" pinnedWords={pinnedWords} hoveredWord={hoveredWord} isMobile={isMobile} setHoveredWord={setHoveredWord} setPinnedWords={setPinnedWords} />
                  </div>
                )}

                {/* Play all button */}
                <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
                  {speakingIdx === "all" ? (
                    <button onClick={stopSpeaking} style={{ ...S.ghost, fontSize:"0.7rem", padding:"5px 12px" }}>⏹ Stop</button>
                  ) : (
                    <button onClick={() => speakAll(items)} style={{ ...S.ghost, fontSize:"0.7rem", padding:"5px 12px" }}>▶ Play All</button>
                  )}
                </div>

                {/* Items */}
                {items.map((item, i) => {
                  const revealed = revealedTranslations.has(i);
                  const isSpeaking = speakingIdx === i;
                  return (
                    <div key={i} style={{ marginBottom:18, padding:"12px 14px", background:"#faf6ee", border:`1px solid ${isSpeaking ? "#27ae60" : "#e8dcc8"}`, borderRadius:8 }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                        <div style={{ fontFamily:"serif", fontSize:"1.575rem", lineHeight:2, color:"#1a1008", flex:1 }}>
                          {!isStory && <span style={{ fontSize:"0.62rem", color:"#ccc", marginRight:6 }}>{i+1}.</span>}
                          <RubyText text={item.jp} id={`item-${i}`} pinnedWords={pinnedWords} hoveredWord={hoveredWord} isMobile={isMobile} setHoveredWord={setHoveredWord} setPinnedWords={setPinnedWords} />
                        </div>
                        <button
                          onClick={() => isSpeaking ? stopSpeaking() : speakText(item.jp, i)}
                          style={{ flexShrink:0, marginTop:6, background:"none", border:"none", cursor:"pointer",
                            fontSize:"1.1rem", color: isSpeaking ? "#27ae60" : "#bbb",
                            transition:"color 0.2s" }}>
                          {isSpeaking ? "⏹" : "🔊"}
                        </button>
                      </div>
                      <div onClick={() => setRevealedTranslations(prev => {
                        const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n;
                      })} style={{ cursor:"pointer", fontSize: revealed ? "1.44rem" : "0.72rem", color: revealed ? "#555" : "#bbb", fontStyle:"italic", borderTop:"1px solid #e8dcc8", paddingTop:6, marginTop:4 }}>
                        {revealed ? item.en : "tap to reveal translation"}
                      </div>
                    </div>
                  );
                })}

                {/* Regenerate + Back */}
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <button style={{ ...S.ghost, flex:1 }} onClick={() => { setReadContent(null); setReadError(null); }}>← Settings</button>
                  <button style={{ ...S.btn, flex:1 }} onClick={generateRead}>Regenerate ✦</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── FONT SIZE TOGGLE (testing: visible for all, production: isMobile only) ── */}
      <button
        onClick={() => setBigFont(f => !f)}
        title={bigFont ? "Tap to shrink" : "Tap to enlarge kanji"}
        style={{ position:"fixed", bottom:18, right:18, width:44, height:44, borderRadius:"50%",
          background: bigFont ? "#1a1008" : "#faf6ee",
          border:"2px solid #1a1008",
          color: bigFont ? "#f5efe3" : "#1a1008",
          fontSize: bigFont ? "1rem" : "1.3rem", cursor:"pointer", zIndex:998,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 2px 8px rgba(0,0,0,0.15)", flexDirection:"column", gap:0 }}>
        {bigFont ? <>🔍<span style={{ fontSize:"0.45rem", letterSpacing:"0em", marginTop:1 }}>shrink</span></> : "🔍"}
      </button>

      {toast && (
        <div style={{ position:"fixed", top:14, left:"50%", transform:"translateX(-50%)", background:toast.type==="good"?"#27ae60":"#c0392b", color:"white", padding:"8px 18px", borderRadius:4, fontSize:"0.78rem", zIndex:999, whiteSpace:"nowrap" }}>
          {toast.msg}
        </div>
      )}

      {showStats && (
        <StatsModal
          sessions={sessions}
          initialTab={quizType}
          onClose={() => setShowStats(false)}
          onReset={() => setSessions([])}
        />
      )}
    </div>
  );
}

const REVIEW_LIB_ID = "__review__";

const regionColors = {
  Action:"#f0f8e8", Movement:"#e8f8f0", Perception:"#f8f0ff", Communication:"#fff8e8",
  Emotion:"#ffe8f8", Cognition:"#f0e8ff", Decision:"#e8f0f8", Transformation:"#fff0e0",
  Life:"#eafaf1", State:"#f8f0e8", Duration:"#e8f4ff", Placement:"#f5f0e8",
  Assembly:"#f0ffe8", Division:"#fff5e8", Comparison:"#e8f8f8", Contact:"#ffe8e8",
  Transaction:"#f8ffe8", Verb:"#f0f8e8", Consumption:"#fff8e8", Dressing:"#f8f0ff",
  Music:"#fce8f8", Creation:"#e8f8ff", Posture:"#f8f8e0", Expression:"#ffe8f0",
  Quantity:"#fff8e0", "Body Parts":"#fdf0e8", "い-Adjective":"#f0fff8",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── TIMER HOOK ──────────────────────────────────────────────────────────────
function useCountdown(seconds, active, onExpire) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const ref = useRef(null);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!active) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [active, onExpire]);

  const reset = useCallback((s) => setTimeLeft(s ?? seconds), [seconds]);
  const stop = useCallback(() => clearInterval(ref.current), []);
  return { timeLeft, reset, stop };
}
