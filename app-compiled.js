const { useState, useRef, useEffect, useCallback } = React;


// ─── OFFLINE / SERVICE WORKER REGISTRATION ───────────────────────────────────
// Registers an inline SW via blob URL so the app caches itself for offline use.
// On first load, the SW pre-caches the page. On subsequent loads it serves from cache.
if (typeof window !== "undefined" && "serviceWorker" in navigator && location.hostname !== "www.claudeusercontent.com") {
    window.addEventListener("load", () => {
        // We can't register a blob SW from a cross-origin context (e.g. claude.ai preview),
        // but when served as a real file:// or http://localhost the block below runs.
        try {
            const swCode = `
const CACHE = "kanji-v1";
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([self.location.href.replace(/\\/[^\\/]*$/, "/")|| "/"]))
  );
  self.skipWaiting();
});
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});`;
            const blob = new Blob([swCode], { type: "application/javascript" });
            const url = URL.createObjectURL(blob);
            navigator.serviceWorker.register(url).catch(() => { });
        }
        catch (_) { }
    });
}
// ─── LOCAL STORAGE HELPERS ───────────────────────────────────────────────────
const LS = {
    get: (k, fallback = null) => {
        try {
            const v = localStorage.getItem(k);
            return v !== null ? JSON.parse(v) : fallback;
        }
        catch (_a) {
            return fallback;
        }
    },
    set: (k, v) => { try {
        localStorage.setItem(k, JSON.stringify(v));
    }
    catch (_a) { } },
};
// ─── BUILT-IN DATA ────────────────────────────────────────────────────────────
// ─── COMBINED LIBRARY LIST ───────────────────────────────────────────────────
// All data loaded from external JS files
const BUILTIN_LIBRARIES = [
    ...window.THEMATIC_LIBRARIES,
    ...window.GRAMMAR_LIBRARIES,
    ...window.SPICY_LIBRARIES,
    ...window.GRADE_LIBRARIES
];
const GROUPS = window.GROUPS;
function App() {
    var _a, _b;
    // ── persistent state (loaded from localStorage) ──
    const [extraLibraries, setExtraLibraries] = useState(() => LS.get("kanji_extra_libs", []));
    const [reviewKanji, setReviewKanji] = useState(() => new Set(LS.get("kanji_review", [])));
    const [studied, setStudied] = useState(() => LS.get("kanji_studied", {}));
    const [scores, setScores] = useState(() => LS.get("kanji_scores", {}));
    // ── session state ──
    const [libId, setLibId] = useState(BUILTIN_LIBRARIES[0].id);
    const [mode, setMode] = useState("flash");
    // ── READ mode state ──
    const [readScope, setReadScope] = useState("library"); // "card" | "library"
    const [readType, setReadType] = useState("sentences"); // "sentences" | "story"
    const [readLevel, setReadLevel] = useState("N5"); // "N5" | "N4" | "N3"
    const [readCount, setReadCount] = useState(5); // 5 | 10 | 15
    const [readLength, setReadLength] = useState("medium"); // "short" | "medium" | "long"
    const [cyoaTheme, setCyoaTheme] = useState("fantasy"); // "fantasy" | "mystery" | "slice" | "historical"
    const [readContent, setReadContent] = useState(null); // parsed content array
    const [readLoading, setReadLoading] = useState(false);
    const [readError, setReadError] = useState(null);
    const [pinnedWords, setPinnedWords] = useState(new Set()); // mobile tap-to-show furigana
    const [hoveredWord, setHoveredWord] = useState(null); // desktop hover furigana
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
        if (reviewKanji.size === 0)
            return [];
        const all = [...BUILTIN_LIBRARIES, ...extraLibraries].flatMap(l => l.cards);
        const seen = new Set();
        return all.filter(c => {
            if (!reviewKanji.has(c.kanji) || seen.has(c.kanji))
                return false;
            seen.add(c.kanji);
            return true;
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
    const cards = (lib === null || lib === void 0 ? void 0 : lib.cards) || [];
    const card = cards[idx];
    const libStudied = new Set(studied[libId] || []);
    const libScore = scores[libId] || 0;
    // ── persist to localStorage whenever state changes ──
    useEffect(() => { LS.set("kanji_extra_libs", extraLibraries); }, [extraLibraries]);
    useEffect(() => { LS.set("kanji_review", [...reviewKanji]); }, [reviewKanji]);
    useEffect(() => { LS.set("kanji_studied", studied); }, [studied]);
    useEffect(() => { LS.set("kanji_scores", scores); }, [scores]);
    useEffect(() => { setIdx(0); setLayer(0); setRevealed(false); }, [libId]);
    useEffect(() => { setLayer(0); setRevealed(false); }, [idx]);
    useEffect(() => { if (mode === "write")
        setTimeout(initCanvas, 60); }, [mode, idx]);
    useEffect(() => { if (mode === "quiz") {
        setQuizSetup(true);
        setQuizDone(false);
        setQuizScore(0);
        setQuizBonusTotal(0);
    } }, [mode, libId]);
    // ── timer ──
    const handleTimerExpire = useCallback(() => {
        if (quizAnswered)
            return;
        setQuizAnswered("__expired__");
        setStreak(0);
        showToast("時間切れ！ Time's up!", "bad");
    }, [quizAnswered]);
    const { timeLeft, reset: resetTimer, stop: stopTimer } = useCountdown(QUIZ_TIMER_SECONDS, timerActive, handleTimerExpire);
    // ── review toggle ──
    function toggleReview(kanji) {
        setReviewKanji(prev => {
            const next = new Set(prev);
            if (next.has(kanji))
                next.delete(kanji);
            else
                next.add(kanji);
            return next;
        });
    }
    function markStudied(i = idx) {
        setStudied(prev => {
            const s = new Set(prev[libId] || []);
            s.add(i);
            return Object.assign(Object.assign({}, prev), { [libId]: [...s] });
        });
    }
    function showToast(msg, type) {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 1800);
    }
    // ── CYOA — build prompt and open in Claude.ai ──
    function buildCYOAPrompt() {
        const cyoaThemeMap = {
            fantasy: "a fantasy adventure with magic, warriors, and mysterious lands",
            mystery: "a detective mystery in modern Japan",
            slice: "a warm slice-of-life story set in everyday Japan",
            historical: "a story set in feudal Japan (samurai era)",
        };
        const vocabCards = readScope === "card" ? [card] : cards;
        const vocabList = vocabCards
            .flatMap(c => (c.compounds || []).map(cp => `${cp.jp}(${cp.reading}, ${cp.meaning})`))
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
        var _a, _b;
        setReadLoading(true);
        setReadError(null);
        setReadContent(null);
        setPinnedWords(new Set());
        setHoveredWord(null);
        setRevealedTranslations(new Set());
        setSpeakingIdx(null);
        (_a = window.speechSynthesis) === null || _a === void 0 ? void 0 : _a.cancel();
        // Build vocab list for prompt
        const vocabCards = readScope === "card" ? [card] : cards;
        const vocabList = vocabCards
            .flatMap(c => (c.compounds || []).map(cp => `${cp.jp}(${cp.reading}, ${cp.meaning})`))
            .slice(0, 60)
            .join("、");
        const lengthMap = { short: "~200 Japanese characters", medium: "~500 Japanese characters", long: "~800 Japanese characters" };
        const countLabel = readType === "sentences" ? `exactly ${readCount} sentences` : lengthMap[readLength];
        // Tokens: sentences need ~150 tokens each with furigana markup; stories need more
        const maxTok = readType === "sentences"
            ? Math.max(1500, readCount * 200)
            : (readLength === "long" ? 4000 : readLength === "medium" ? 2500 : 1500);
        const prompt = readType === "sentences"
            ? `Generate ${countLabel} in Japanese at JLPT ${readLevel} level using vocabulary from this list where natural: ${vocabList}.

Return ONLY a JSON array with no markdown fences, no explanation, no text before or after:
[{"jp":"sentence with [漢字|かんじ] furigana markup on each kanji word","en":"English translation"},...]`
            : `Write a story in Japanese at JLPT ${readLevel} level, ${countLabel}, naturally using vocabulary from: ${vocabList}.

Return ONLY a JSON object with no markdown fences, no explanation, no text before or after:
{"title":"title with [漢字|かんじ] furigana","paragraphs":[{"jp":"paragraph with [漢字|かんじ] furigana on kanji words","en":"English translation"},...]}`;
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
                throw new Error(`API error ${res.status}: ${((_b = err.error) === null || _b === void 0 ? void 0 : _b.message) || res.statusText}`);
            }
            const data = await res.json();
            if (data.error)
                throw new Error(data.error.message);
            // Robust JSON extraction — find first [ or { and last ] or }
            const raw = (data.content || []).map(b => b.text || "").join("").trim();
            const isArr = readType === "sentences";
            const start = raw.indexOf(isArr ? "[" : "{");
            const end = isArr ? raw.lastIndexOf("]") : raw.lastIndexOf("}");
            if (start === -1 || end === -1)
                throw new Error(`No JSON found in response`);
            const parsed = JSON.parse(raw.slice(start, end + 1));
            setReadContent(parsed);
        }
        catch (e) {
            setReadError(`Generation failed: ${e.message}. Please try again.`);
        }
        setReadLoading(false);
    }
    // Parse [漢字|かんじ] markup into segments for ruby rendering
    function parseRuby(text) {
        const parts = [];
        const re = /\[([^\|]+)\|([^\]]+)\]/g;
        let last = 0, m;
        while ((m = re.exec(text)) !== null) {
            if (m.index > last)
                parts.push({ type: "text", val: text.slice(last, m.index) });
            parts.push({ type: "ruby", kanji: m[1], reading: m[2] });
            last = re.lastIndex;
        }
        if (last < text.length)
            parts.push({ type: "text", val: text.slice(last) });
        return parts;
    }
    // Strip [漢字|かんじ] markup down to plain Japanese for speech
    function stripRuby(text) {
        return text.replace(/\[([^\|]+)\|([^\]]+)\]/g, '$1');
    }
    function speakText(text, idx) {
        if (!window.speechSynthesis)
            return;
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
        if (!window.speechSynthesis)
            return;
        window.speechSynthesis.cancel();
        setSpeakingIdx("all");
        const texts = items.map(item => stripRuby(item.jp));
        let i = 0;
        function next() {
            if (i >= texts.length) {
                setSpeakingIdx(null);
                return;
            }
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
        var _a;
        (_a = window.speechSynthesis) === null || _a === void 0 ? void 0 : _a.cancel();
        setSpeakingIdx(null);
    }
    // ── quiz ──
    function startQuiz() {
        const isCompound = quizType === "compounds" || quizType === "compounds_reverse";
        const pool = isCompound
            ? cards.filter(c => c.compounds && c.compounds.length > 0)
            : cards;
        const sh = shuffle(pool).slice(0, Math.min(quizCount, pool.length));
        setQuizCards(sh);
        setQuizIdx(0);
        setQuizScore(0);
        setQuizBonusTotal(0);
        setQuizAnswered(null);
        setQuizDone(false);
        setQuizSetup(false);
        buildOpts(sh, 0);
        if (quizTimerEnabled) {
            resetTimer(QUIZ_TIMER_SECONDS);
            setTimerActive(true);
        }
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
                .flatMap(c => c.compounds.map(cpd => (Object.assign(Object.assign({}, cpd), { _cardKanji: c.kanji, _isCorrect: false }))))
                .filter(cpd => cpd.jp && cpd.reading);
            // Split into "related" (shares a char) and "unrelated"
            const related = shuffle(allWrongCandidates.filter(cpd => [...cpd.jp].some(ch => compChars.has(ch))));
            const unrelated = shuffle(allWrongCandidates.filter(cpd => ![...cpd.jp].some(ch => compChars.has(ch))));
            // Dedupe by reading to avoid near-identical options
            const seen = new Set([comp.reading]);
            const wrongs = [];
            for (const pool of [related, unrelated]) {
                for (const opt of pool) {
                    if (wrongs.length >= 3)
                        break;
                    if (!seen.has(opt.reading)) {
                        seen.add(opt.reading);
                        wrongs.push(opt);
                    }
                }
                if (wrongs.length >= 3)
                    break;
            }
            setQuizOpts(shuffle([Object.assign(Object.assign({}, comp), { _cardKanji: correct.kanji, _isCorrect: true }), ...wrongs]));
        }
        else {
            const wrongs = shuffle(cards.filter(c => c.kanji !== correct.kanji)).slice(0, 3);
            setQuizOpts(shuffle([correct, ...wrongs]));
        }
    }
    function calcBonus(tLeft) {
        if (!quizTimerEnabled)
            return 0;
        return Math.round((tLeft / QUIZ_TIMER_SECONDS) * 5);
    }
    function handleQuiz(opt) {
        if (quizAnswered)
            return;
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
            setScores(prev => (Object.assign(Object.assign({}, prev), { [libId]: (prev[libId] || 0) + 1 })));
        }
        else {
            setStreak(0);
        }
    }
    function nextQ() {
        const n = quizIdx + 1;
        if (n >= quizCards.length) {
            setQuizDone(true);
            setTimerActive(false);
            return;
        }
        setQuizIdx(n);
        setQuizAnswered(null);
        setCompoundQuestion(null);
        buildOpts(quizCards, n);
        if (quizTimerEnabled) {
            resetTimer(QUIZ_TIMER_SECONDS);
            setTimerActive(true);
        }
    }
    // ── canvas ──
    function initCanvas() {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        const sz = canvas.width;
        ctx.clearRect(0, 0, sz, sz);
        ctx.fillStyle = "#faf6ee";
        ctx.fillRect(0, 0, sz, sz);
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        [[sz / 2, 0, sz / 2, sz], [0, sz / 2, sz, sz / 2], [0, 0, sz, sz], [sz, 0, 0, sz]].forEach(([x1, y1, x2, y2]) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.strokeStyle = "#1a1008";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }
    function getPos(e, canvas) {
        const r = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: (src.clientX - r.left) * (canvas.width / r.width), y: (src.clientY - r.top) * (canvas.height / r.height) };
    }
    function onDown(e) { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); }
    function onMove(e) {
        e.preventDefault();
        if (!drawing.current)
            return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const p = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
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
        root: { display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "16px 13px 60px", background: "#f5efe3", fontFamily: "monospace", maxWidth: mode === "browse" ? 900 : wideFlash ? 960 : 480, margin: "0 auto", transition: "max-width 0.3s ease" },
        card: { width: "100%", border: "1px solid #ddd", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 16px rgba(0,0,0,0.07)", marginBottom: 10 },
        ci: { display: "flex", flexDirection: "column", alignItems: "center", padding: 18, width: "100%" },
        kL: { fontFamily: "serif", fontSize: bigFont ? (isMobile ? "clamp(9rem,36vw,15rem)" : "clamp(6.75rem,27vw,11.25rem)") : (isMobile ? "clamp(4.5rem,18vw,7.5rem)" : "clamp(3.375rem,13.5vw,5.625rem)"), lineHeight: 1, color: "#1a1008" },
        hint: { fontSize: "0.58rem", color: "#ccc", letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 9 },
        rd: { fontFamily: "serif", fontSize: "1rem", color: "#c0392b", marginBottom: 2 },
        mn: { fontSize: "0.86rem", color: "#555", marginBottom: 6 },
        rg: { fontSize: "0.56rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#ccc", borderTop: "1px solid #e8dcc8", paddingTop: 5, marginTop: 4, width: "100%", textAlign: "center" },
        yomiBox: { display: "flex", gap: 12, marginTop: 6, marginBottom: 2, fontSize: "0.72rem" },
        yomiLabel: { fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: 1 },
        btn: { padding: "8px 20px", background: "#1a1008", color: "#f5efe3", border: "1px solid #1a1008", borderRadius: 3, fontSize: "0.7rem", letterSpacing: "0.12em", cursor: "pointer", fontFamily: "monospace" },
        ghost: { padding: "8px 20px", background: "transparent", color: "#1a1008", border: "1px solid #1a1008", borderRadius: 3, fontSize: "0.7rem", letterSpacing: "0.12em", cursor: "pointer", fontFamily: "monospace" },
        navBtn: { width: 38, height: 38, borderRadius: "50%", border: "1px solid #ddd", background: "#faf6ee", cursor: "pointer", fontSize: "1rem" },
        qb: { padding: "11px 7px", border: "1px solid #ddd", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer", fontFamily: "monospace", minHeight: 72 },
        libBtn: { width: "100%", padding: "8px 12px", background: "#faf6ee", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "monospace", fontSize: "0.78rem" },
        libDrop: { position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0, background: "white", border: "1px solid #ddd", borderRadius: 6, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden" },
        libOpt: { display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid #f0f0f0" },
        cb: { padding: "7px 14px", border: "1px solid", borderRadius: 4, fontSize: "0.78rem", cursor: "pointer", fontFamily: "monospace", minWidth: 46 },
        toggle: (on) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: on ? "#1a1008" : "#faf6ee", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontFamily: "monospace", fontSize: "0.73rem", color: on ? "#f5efe3" : "#555", width: "100%", marginBottom: 8 }),
        reviewBtn: (on) => ({ padding: "4px 10px", borderRadius: 20, border: on ? "2px solid #c0392b" : "2px solid #bbb", background: on ? "#c0392b" : "white", cursor: "pointer", fontSize: "0.85rem", fontFamily: "serif", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: on ? "white" : "#888", boxShadow: on ? "0 2px 8px rgba(192,57,43,0.35)" : "none", letterSpacing: "0.05em" }),
    };
    const totalQuizPoints = quizScore + quizBonusTotal;
    // Max possible: 1 base pt + 5 speed bonus pts per question
    const maxQuizPoints = quizTimerEnabled ? quizCards.length * 6 : quizCards.length;
    return (React.createElement("div", { style: S.root },
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, width: "100%" } },
            React.createElement("button", { onClick: () => { setShowSpicyPrompt(p => !p); setSpicyInput(""); setSpicyError(false); }, style: { width: 36, height: 36, background: "transparent", border: "none", cursor: "default", flexShrink: 0 } }, "　"),
            React.createElement("div", { style: { textAlign: "center", flex: 1 } },
                React.createElement("div", { style: { fontFamily: "serif", fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em" } }, "J Kanji Tool"),
                React.createElement("div", { style: { fontSize: "0.6rem", letterSpacing: "0.2em", color: "#aaa", textTransform: "uppercase" } }, "Japanese Kanji Study \u00B7 \u6F22\u5B57\u5B66\u7FD2")),
                React.createElement("button", { onClick: () => {
                    if ('serviceWorker' in navigator) {
                        caches.keys().then(function(keys) {
                            Promise.all(keys.map(function(k) { return caches.delete(k); }))
                            .then(function() { window.location.reload(); });
                    });
                    } else { window.location.reload();}
                    }, title: "Check for updates", style: { width: 36, height: 36, background: "transparent", border: "none", cursor: "pointer",
                    fontSize: "1.1rem", color: "#bbb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" } }, "\u21BB")),ct.createElement("button", { onClick: () => window.location.reload(true), title: "Check for updates", style: { width: 36, height: 36, background: "transparent", border: "none", cursor: "pointer",
                    fontSize: "1.1rem", color: "#bbb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" } }, "\u21BB")),
        React.createElement("div", { style: { width: "100%", marginBottom: 10, position: "relative" } },
            React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "stretch", width: "100%" } },
                React.createElement("button", { onClick: () => { setShowLib(p => !p); setActiveGroup(null); }, style: Object.assign(Object.assign({}, S.libBtn), { flex: 1 }) },
                    React.createElement("span", { style: { fontWeight: 600 } }, lib.id === REVIEW_LIB_ID
                        ? "🔖 Kanji for Review"
                        : (() => {
                            const g = GROUPS.find(g => g.id === lib.group);
                            return `${lib.emoji} ${g ? g.label + " · " : ""}${lib.label}`;
                        })()),
                    React.createElement("span", { style: { fontSize: "0.65rem", color: "#aaa" } }, showLib ? "▴ close" : "▾ change library"))),
            showSpicyPrompt && (React.createElement("div", { style: { background: "#faf6ee", border: "1px solid #e8dcc8", borderRadius: 6, padding: "10px 12px", marginTop: 4 } },
                spicyUnlocked ? (React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                    React.createElement("span", { style: { fontSize: "0.72rem", color: "#888" } }, "Unlocked"),
                    React.createElement("button", { onClick: () => {
                            setSpicyUnlocked(false);
                            LS.set("spicy_unlocked", false);
                            setShowSpicyPrompt(false);
                        }, style: { fontSize: "0.62rem", color: "#aaa", background: "none", border: "none", cursor: "pointer" } }, "lock"))) : (React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center" } },
                    React.createElement("input", { type: "password", value: spicyInput, onChange: e => { setSpicyInput(e.target.value); setSpicyError(false); }, onKeyDown: e => {
                            if (e.key === "Enter") {
                                if (spicyInput.toLowerCase() === "spicy") {
                                    setSpicyUnlocked(true);
                                    LS.set("spicy_unlocked", true);
                                    setShowSpicyPrompt(false);
                                }
                                else {
                                    setSpicyError(true);
                                    setSpicyInput("");
                                }
                            }
                        }, placeholder: "enter password", style: { flex: 1, padding: "5px 8px", borderRadius: 4, border: `1px solid ${spicyError ? "#c0392b" : "#e8dcc8"}`,
                            fontSize: "0.75rem", fontFamily: "monospace" }, autoFocus: true }),
                    React.createElement("button", { onClick: () => {
                            if (spicyInput.toLowerCase() === "spicy") {
                                setSpicyUnlocked(true);
                                LS.set("spicy_unlocked", true);
                                setShowSpicyPrompt(false);
                            }
                            else {
                                setSpicyError(true);
                                setSpicyInput("");
                            }
                        }, style: { padding: "5px 10px", borderRadius: 4, border: "none", background: "#c0392b",
                            color: "white", fontSize: "0.72rem", cursor: "pointer" } }, "unlock"))),
                spicyError && React.createElement("div", { style: { fontSize: "0.62rem", color: "#c0392b", marginTop: 4 } }, "incorrect password"))),
            showLib && (React.createElement("div", { style: S.libDrop },
                !activeGroup && (React.createElement(React.Fragment, null,
                    ALL_LIBRARIES.find(l => l.id === REVIEW_LIB_ID) && (React.createElement("div", { onClick: () => { setLibId(REVIEW_LIB_ID); setShowLib(false); }, style: Object.assign(Object.assign({}, S.libOpt), { cursor: "pointer", background: libId === REVIEW_LIB_ID ? "#f0ece0" : "white" }) },
                        React.createElement("span", { style: { fontSize: "1.3rem" } }, "\uD83D\uDD16"),
                        React.createElement("div", { style: { flex: 1 } },
                            React.createElement("div", { style: { fontSize: "0.82rem", fontWeight: 600 } }, "Kanji for Review"),
                            React.createElement("div", { style: { fontSize: "0.62rem", color: "#c0392b" } },
                                reviewKanji.size,
                                " marked")),
                        libId === REVIEW_LIB_ID && React.createElement("span", { style: { color: "#27ae60" } }, "\u2713"))),
                    GROUPS.filter(g => ALL_LIBRARIES.some(l => l.group === g.id) && (g.id !== "spicy" || spicyUnlocked)).map(g => {
                        const groupLibs = ALL_LIBRARIES.filter(l => l.group === g.id);
                        return (React.createElement("div", { key: g.id, onClick: () => {
                                if (groupLibs.length === 1) {
                                    setLibId(groupLibs[0].id);
                                    setShowLib(false);
                                }
                                else
                                    setActiveGroup(g.id);
                            }, style: Object.assign(Object.assign({}, S.libOpt), { cursor: "pointer", justifyContent: "space-between" }) },
                            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                                React.createElement("span", { style: { fontFamily: "serif", fontSize: "1.4rem", minWidth: 28, textAlign: "center" } }, g.emoji),
                                React.createElement("div", null,
                                    React.createElement("div", { style: { fontSize: "0.85rem", fontWeight: 700 } }, g.label),
                                    React.createElement("div", { style: { fontSize: "0.62rem", color: "#aaa" } },
                                        g.desc,
                                        " \u00B7 ",
                                        groupLibs.length,
                                        " ",
                                        groupLibs.length === 1 ? "set" : "sets"))),
                            React.createElement("span", { style: { fontSize: "0.7rem", color: "#aaa" } }, "\u25B6")));
                    }),
                    ALL_LIBRARIES.filter(l => !l.group && l.id !== REVIEW_LIB_ID).map(l => (React.createElement("div", { key: l.id, onClick: () => { setLibId(l.id); setShowLib(false); }, style: Object.assign(Object.assign({}, S.libOpt), { cursor: "pointer", background: l.id === libId ? "#f0ece0" : "white" }) },
                        React.createElement("span", { style: { fontSize: "1.3rem" } }, l.emoji),
                        React.createElement("div", { style: { flex: 1 } },
                            React.createElement("div", { style: { fontSize: "0.82rem", fontWeight: 600 } }, l.label),
                            React.createElement("div", { style: { fontSize: "0.62rem", color: "#aaa" } }, l.sublabel)),
                        l.id === libId && React.createElement("span", { style: { color: "#27ae60" } }, "\u2713")))))),
                activeGroup && (React.createElement(React.Fragment, null,
                    React.createElement("div", { onClick: () => setActiveGroup(null), style: Object.assign(Object.assign({}, S.libOpt), { cursor: "pointer", borderBottom: "2px solid #e8dcc8", color: "#888", fontSize: "0.72rem" }) },
                        React.createElement("span", null, "\u25C0 back"),
                        React.createElement("span", { style: { fontFamily: "serif", fontSize: "1.1rem", marginLeft: 8 } }, (_a = GROUPS.find(g => g.id === activeGroup)) === null || _a === void 0 ? void 0 : _a.emoji),
                        React.createElement("span", { style: { fontWeight: 700, fontSize: "0.85rem", flex: 1, marginLeft: 6 } }, (_b = GROUPS.find(g => g.id === activeGroup)) === null || _b === void 0 ? void 0 : _b.label)),
                    ALL_LIBRARIES.filter(l => l.group === activeGroup).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })).map(l => (React.createElement("div", { key: l.id, onClick: () => { setLibId(l.id); setShowLib(false); setActiveGroup(null); }, style: Object.assign(Object.assign({}, S.libOpt), { cursor: "pointer", background: l.id === libId ? "#f0ece0" : "white", paddingLeft: 20 }) },
                        React.createElement("div", { style: { flex: 1 } },
                            React.createElement("div", { style: { fontSize: "0.85rem", fontWeight: 600 } }, l.label),
                            React.createElement("div", { style: { fontSize: "0.62rem", color: "#aaa" } }, l.sublabel)),
                        l.id === libId && React.createElement("span", { style: { color: "#27ae60" } }, "\u2713"))))))))),
        React.createElement("div", { style: { display: "flex", gap: 14, fontSize: "0.67rem", color: "#888", marginBottom: 7 } },
            React.createElement("span", null,
                "\u2705 ",
                React.createElement("b", { style: { color: "#1a1008" } }, libScore),
                " correct"),
            React.createElement("span", null,
                "\uD83D\uDCD6 ",
                React.createElement("b", { style: { color: "#1a1008" } }, libStudied.size),
                "/",
                cards.length,
                " studied"),
            React.createElement("span", null,
                "\uD83D\uDD25 ",
                React.createElement("b", { style: { color: "#c0392b" } }, streak),
                " streak"),
            reviewKanji.size > 0 && React.createElement("span", null,
                "\uD83D\uDD16 ",
                React.createElement("b", { style: { color: "#c0392b" } }, reviewKanji.size))),
        React.createElement("div", { style: { width: "100%", height: 4, background: "#e8dcc8", borderRadius: 3, marginBottom: 12 } },
            React.createElement("div", { style: { height: "100%", borderRadius: 3, background: "linear-gradient(to right,#b8860b,#c0392b)", width: cards.length ? `${libStudied.size / cards.length * 100}%` : "0%", transition: "width 0.4s" } })),
        React.createElement("div", { style: { display: "flex", border: "1px solid #ddd", borderRadius: 4, overflow: "hidden", marginBottom: 12, width: "100%" } }, ["flash", "quiz", "write", "browse", "read"].map((t, i) => (React.createElement("button", { key: t, onClick: () => setMode(t), style: { flex: 1, padding: "7px 2px", border: "none", borderRight: i < 4 ? "1px solid #ddd" : "none", background: mode === t ? "#1a1008" : "transparent", color: mode === t ? "#f5efe3" : "#888", fontSize: "0.64rem", cursor: "pointer", textTransform: "uppercase", fontFamily: "monospace" } }, ["Flashcard", "Quiz", "Trace", "Browse", "Read"][i])))),
        mode === "flash" && card && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "flex-end", width: "100%", marginBottom: 5 } },
                React.createElement("button", { onClick: () => setWideFlash(p => !p), style: { background: "none", border: "1px solid #ddd", borderRadius: 4, padding: "3px 10px", fontSize: "0.62rem", color: wideFlash ? "#b8860b" : "#aaa", cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.08em", display: "none" }, className: "wide-flash-btn" }, wideFlash ? "▣ single view" : "⊟ wide view")),
            React.createElement("style", null, `
          @media (min-width: 700px) { .wide-flash-btn { display: inline-block !important; } }
        `),
            !wideFlash && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", gap: 5, width: "100%", marginBottom: 7 } }, [0, 1, 2].map(l => React.createElement("div", { key: l, style: { height: 3, flex: 1, borderRadius: 2, background: layer >= l ? "#b8860b" : "#e8dcc8", transition: "background 0.3s" } }))),
                React.createElement("div", { onClick: () => { const n = (layer + 1) % 3; setLayer(n); if (n > 0)
                        markStudied(); }, style: Object.assign(Object.assign({}, S.card), { background: regionColors[card.region] || "#faf6ee", cursor: "pointer", minHeight: 210 }) },
                    layer === 0 && (React.createElement("div", { style: S.ci },
                        React.createElement("div", { style: S.kL }, card.kanji),
                        React.createElement("div", { style: S.hint }, "tap for reading \u2192"))),
                    layer === 1 && (React.createElement("div", { style: S.ci },
                        React.createElement("div", { style: { fontFamily: "serif", fontSize: bigFont ? "4.4rem" : "2.2rem", marginBottom: 3 } }, card.kanji),
                        React.createElement("div", { style: Object.assign(Object.assign({}, S.rd), { fontSize: "1.2rem" }) },
                            card.reading,
                            " \u00B7 ",
                            card.romaji),
                        React.createElement("div", { style: Object.assign(Object.assign({}, S.mn), { fontSize: "1rem" }) }, card.meaning),
                        React.createElement("div", { style: S.yomiBox },
                            React.createElement("div", { style: { textAlign: "center" } },
                                React.createElement("div", { style: S.yomiLabel }, "\u8A13\u8AAD\u307F kun"),
                                React.createElement("div", { style: { color: "#2471a3", fontSize: "1.2rem" } }, card.kunYomi.join("、"))),
                            React.createElement("div", { style: { width: 1, background: "#e8dcc8" } }),
                            React.createElement("div", { style: { textAlign: "center" } },
                                React.createElement("div", { style: S.yomiLabel }, "\u97F3\u8AAD\u307F on"),
                                React.createElement("div", { style: { color: "#c0392b", fontSize: "1.2rem" } }, card.onYomi.join("、")))),
                        React.createElement("div", { style: S.rg }, card.region),
                        React.createElement("div", { style: S.hint }, "tap for compounds \u2192"))),
                    layer === 2 && (React.createElement("div", { style: Object.assign(Object.assign({}, S.ci), { alignItems: "flex-start", padding: "14px 16px", gap: 9 }) },
                        React.createElement("div", { style: { fontFamily: "serif", fontSize: bigFont ? "2.4rem" : "1.2rem", color: "#b8860b", marginBottom: 4, alignSelf: "center" } },
                            card.kanji,
                            " \u2014 \u7528\u4F8B"),
                        (card.compounds || []).map((c, i) => (React.createElement("div", { key: i, style: { display: "flex", alignItems: "baseline", gap: 8, borderLeft: "3px solid #e8dcc8", paddingLeft: 9, width: "100%" } },
                            React.createElement("span", { style: { fontSize: "0.62rem", color: "#ccc", minWidth: 12 } },
                                i + 1,
                                "."),
                            React.createElement("span", { style: { fontFamily: "serif", fontSize: bigFont ? "2.4rem" : "1.2rem", color: "#1a1008" } }, c.jp),
                            React.createElement("span", { style: { fontSize: bigFont ? "2.4rem" : "1.2rem", color: "#2471a3" } }, c.reading),
                            React.createElement("span", { style: { fontSize: bigFont ? "2rem" : "1rem", color: "#888", marginLeft: "auto", textAlign: "right" } }, c.meaning)))),
                        React.createElement("div", { style: Object.assign(Object.assign({}, S.hint), { alignSelf: "center" }) }, "tap to reset \u21BA")))),
                React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginTop: 6, width: "100%" } },
                    React.createElement("button", { style: S.navBtn, onClick: () => changeIdx(-1) }, "\u2190"),
                    React.createElement("span", { style: { fontSize: "0.72rem", color: "#aaa", flex: 1, textAlign: "center" } },
                        idx + 1,
                        " / ",
                        cards.length),
                    React.createElement("button", { title: reviewKanji.has(card.kanji) ? "Remove from review" : "Mark for review", onClick: () => { toggleReview(card.kanji); showToast(reviewKanji.has(card.kanji) ? "Removed from review" : "🔖 Added to review", reviewKanji.has(card.kanji) ? "bad" : "good"); }, style: Object.assign(Object.assign({}, S.reviewBtn(reviewKanji.has(card.kanji))), { marginRight: 0 }) }, "\u5FA9\u7FD2"),
                    React.createElement("button", { style: S.navBtn, onClick: () => changeIdx(1) }, "\u2192")),
                reviewKanji.has(card.kanji) && (React.createElement("div", { style: { fontSize: "0.6rem", color: "#c0392b", marginTop: 4, letterSpacing: "0.1em" } }, "Click red pill to remove from Review List")))),
            wideFlash && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", gap: 10, width: "100%", alignItems: "stretch" } },
                    React.createElement("div", { style: Object.assign(Object.assign({}, S.card), { flex: 1, minWidth: 0, background: regionColors[card.region] || "#faf6ee", minHeight: 320, cursor: "default" }) },
                        React.createElement("div", { style: S.ci },
                            React.createElement("div", { style: { fontFamily: "serif", fontSize: "2.8rem", marginBottom: 4 } }, card.kanji),
                            React.createElement("div", { style: Object.assign(Object.assign({}, S.rd), { fontSize: "1.4rem" }) },
                                card.reading,
                                " \u00B7 ",
                                card.romaji),
                            React.createElement("div", { style: Object.assign(Object.assign({}, S.mn), { fontSize: "1.1rem" }) }, card.meaning),
                            React.createElement("div", { style: S.yomiBox },
                                React.createElement("div", { style: { textAlign: "center" } },
                                    React.createElement("div", { style: S.yomiLabel }, "\u8A13\u8AAD\u307F kun"),
                                    React.createElement("div", { style: { color: "#2471a3", fontSize: "1.2rem" } }, card.kunYomi.join("、"))),
                                React.createElement("div", { style: { width: 1, background: "#e8dcc8" } }),
                                React.createElement("div", { style: { textAlign: "center" } },
                                    React.createElement("div", { style: S.yomiLabel }, "\u97F3\u8AAD\u307F on"),
                                    React.createElement("div", { style: { color: "#c0392b", fontSize: "1.2rem" } }, card.onYomi.join("、")))),
                            React.createElement("div", { style: S.rg }, card.region))),
                    React.createElement("div", { style: Object.assign(Object.assign({}, S.card), { flex: 1, minWidth: 0, background: regionColors[card.region] || "#faf6ee", minHeight: 320, cursor: "default" }) },
                        React.createElement("div", { style: Object.assign(Object.assign({}, S.ci), { alignItems: "flex-start", padding: "18px 20px", gap: 11 }) },
                            React.createElement("div", { style: { fontFamily: "serif", fontSize: "1.3rem", color: "#b8860b", marginBottom: 4, alignSelf: "center" } },
                                card.kanji,
                                " \u2014 \u7528\u4F8B"),
                            (card.compounds || []).map((c, i) => (React.createElement("div", { key: i, style: { display: "flex", alignItems: "baseline", gap: 10, borderLeft: "3px solid #e8dcc8", paddingLeft: 11, width: "100%" } },
                                React.createElement("span", { style: { fontSize: "0.65rem", color: "#ccc", minWidth: 14 } },
                                    i + 1,
                                    "."),
                                React.createElement("span", { style: { fontFamily: "serif", fontSize: "1.3rem", color: "#1a1008" } }, c.jp),
                                React.createElement("span", { style: { fontSize: "1.1rem", color: "#2471a3" } }, c.reading),
                                React.createElement("span", { style: { fontSize: "1rem", color: "#888", marginLeft: "auto", textAlign: "right" } }, c.meaning))))))),
                React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginTop: 8, width: "100%" } },
                    React.createElement("button", { style: S.navBtn, onClick: () => { changeIdx(-1); markStudied(); } }, "\u2190"),
                    React.createElement("span", { style: { fontSize: "0.72rem", color: "#aaa", flex: 1, textAlign: "center" } },
                        idx + 1,
                        " / ",
                        cards.length),
                    React.createElement("button", { title: reviewKanji.has(card.kanji) ? "Remove from review" : "Mark for review", onClick: () => { toggleReview(card.kanji); showToast(reviewKanji.has(card.kanji) ? "Removed from review" : "🔖 Added to review", reviewKanji.has(card.kanji) ? "bad" : "good"); }, style: Object.assign(Object.assign({}, S.reviewBtn(reviewKanji.has(card.kanji))), { marginRight: 0 }) }, "\u5FA9\u7FD2"),
                    React.createElement("button", { style: S.navBtn, onClick: () => { changeIdx(1); markStudied(); } }, "\u2192")),
                reviewKanji.has(card.kanji) && (React.createElement("div", { style: { fontSize: "0.6rem", color: "#c0392b", marginTop: 4, letterSpacing: "0.1em" } }, "Click red pill to remove from Review List")))))),
        mode === "quiz" && (React.createElement(React.Fragment, null,
            quizSetup && (React.createElement("div", { style: { width: "100%", padding: "4px 0" } },
                React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 18 } }, [
                    { key: "kanji", label: "漢字", sub: "Kanji → Reading" },
                    { key: "compounds", label: "熟語", sub: "Compound → Reading" },
                    { key: "compounds_reverse", label: "英語", sub: "English → Compound" },
                ].map(({ key, label, sub }) => (React.createElement("button", { key: key, onClick: () => setQuizType(key), style: { flex: 1, padding: "10px 6px", borderRadius: 8, border: `2px solid ${quizType === key ? "#1a1008" : "#ddd"}`,
                        background: quizType === key ? "#1a1008" : "#faf6ee",
                        color: quizType === key ? "#f5efe3" : "#1a1008",
                        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 } },
                    React.createElement("span", { style: { fontFamily: "serif", fontSize: "1.3rem" } }, label),
                    React.createElement("span", { style: { fontSize: "0.58rem", opacity: 0.7, letterSpacing: "0.04em", textAlign: "center" } }, sub))))),
                React.createElement("div", { style: { textAlign: "center", fontSize: "0.75rem", color: "#888", marginBottom: 18 } }, "How many questions?"),
                React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 } }, [5, 10, 15, 20, cards.length].map(n => (React.createElement("button", { key: n, onClick: () => setQuizCount(n), style: Object.assign(Object.assign({}, S.cb), { background: quizCount === n ? "#1a1008" : "#faf6ee", color: quizCount === n ? "#f5efe3" : "#1a1008", borderColor: quizCount === n ? "#1a1008" : "#ddd" }) }, n === cards.length ? `All (${n})` : n)))),
                React.createElement("div", { style: { marginBottom: 16 } },
                    React.createElement("button", { style: S.toggle(quizTimerEnabled), onClick: () => setQuizTimerEnabled(p => !p) },
                        React.createElement("span", null,
                            "\u23F1 Timed Mode ",
                            quizTimerEnabled ? "— ON" : "— Off"),
                        React.createElement("span", { style: { fontSize: "0.62rem", opacity: 0.7 } }, quizTimerEnabled ? "10s per question · faster = bonus pts" : "tap to enable"))),
                quizType === "compounds" && (React.createElement("div", { style: { marginBottom: 16 } },
                    React.createElement("div", { style: { fontSize: "0.68rem", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, textAlign: "center" } }, "Answer format"),
                    React.createElement("div", { style: { display: "flex", gap: 6 } }, [
                        { key: "traditional", label: "Japanese / English" },
                        { key: "japanese", label: "Japanese" },
                        { key: "english", label: "English" },
                    ].map(({ key, label }) => (React.createElement("button", { key: key, onClick: () => setAnswerStyle(key), style: { flex: 1, padding: "10px 4px", borderRadius: 8,
                            border: `2px solid ${answerStyle === key ? "#1a1008" : "#ddd"}`,
                            background: answerStyle === key ? "#1a1008" : "#faf6ee",
                            color: answerStyle === key ? "#f5efe3" : "#1a1008",
                            cursor: "pointer", alignItems: "center", justifyContent: "center" } },
                        React.createElement("span", { style: { fontSize: "0.75rem", fontWeight: 600 } }, label))))))),
                quizType === "compounds_reverse" && (React.createElement("div", { style: { marginBottom: 16 } },
                    React.createElement("button", { style: S.toggle(quizDifficulty === "hard"), onClick: () => setQuizDifficulty(d => d === "easy" ? "hard" : "easy") },
                        React.createElement("span", null, quizDifficulty === "hard" ? "💀 Hard Mode" : "🌸 Easy Mode"),
                        React.createElement("span", { style: { fontSize: "0.62rem", opacity: 0.7 } }, quizDifficulty === "hard" ? "Furigana hidden · revealed after answering" : "Furigana always visible in red")))),
                React.createElement("button", { style: Object.assign(Object.assign({}, S.btn), { width: "100%", padding: "11px" }), onClick: startQuiz }, "Start Quiz \u2192"))),
            !quizSetup && !quizDone && quizCards[quizIdx] && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 7 } },
                    React.createElement("span", { style: { fontSize: "0.67rem", color: "#aaa" } },
                        "Question ",
                        quizIdx + 1,
                        " of ",
                        quizCards.length),
                    React.createElement("span", { style: { fontSize: "0.67rem", color: "#888" } }, quizTimerEnabled ? (React.createElement(React.Fragment, null,
                        React.createElement("b", { style: { color: "#1a1008" } }, totalQuizPoints),
                        React.createElement("span", { style: { color: "#ccc" } },
                            " / ",
                            (quizIdx + 1) * 6),
                        quizBonusTotal > 0 && React.createElement("span", { style: { color: "#b8860b" } }, " \u26A1"))) : (React.createElement(React.Fragment, null,
                        React.createElement("b", { style: { color: "#1a1008" } }, quizScore),
                        React.createElement("span", { style: { color: "#ccc" } },
                            " / ",
                            quizIdx + 1))))),
                quizTimerEnabled && (React.createElement("div", { style: { display: "flex", justifyContent: "center", marginBottom: 8 } },
                    React.createElement("svg", { width: 44, height: 44, style: { transform: "rotate(-90deg)" } },
                        React.createElement("circle", { cx: 22, cy: 22, r: 18, fill: "none", stroke: "#e8dcc8", strokeWidth: 4 }),
                        React.createElement("circle", { cx: 22, cy: 22, r: 18, fill: "none", stroke: timerColor, strokeWidth: 4, strokeDasharray: circumference, strokeDashoffset: circumference * (1 - timerPct), style: { transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" } }),
                        React.createElement("text", { x: 22, y: 22, textAnchor: "middle", dominantBaseline: "central", style: { transform: "rotate(90deg)", transformOrigin: "22px 22px", fontFamily: "monospace", fontSize: 13, fill: timerColor, fontWeight: 600 } }, timeLeft)))),
                React.createElement("div", { style: Object.assign(Object.assign({}, S.card), { background: "#faf6ee", cursor: "default", minHeight: quizType === "compounds_reverse" ? 70 : 150, marginBottom: 10 }) },
                    React.createElement("div", { style: S.ci },
                        quizType === "kanji" && (React.createElement("div", { style: S.kL }, quizCards[quizIdx].kanji)),
                        quizType === "compounds" && compoundQuestion && (React.createElement("div", { style: { fontFamily: "serif", fontSize: "clamp(2rem,10vw,3.2rem)", color: "#1a1008", lineHeight: 1.1 } }, compoundQuestion.jp)),
                        quizType === "compounds_reverse" && compoundQuestion && (React.createElement("div", { style: { fontSize: "clamp(1rem,4vw,1.3rem)", color: "#1a1008", textAlign: "center", lineHeight: 1.4, padding: "0 8px" } }, compoundQuestion.meaning)))),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", marginBottom: 10 } }, quizOpts.map((opt, i) => {
                    const isCompound = quizType === "compounds" || quizType === "compounds_reverse";
                    const optKey = isCompound ? opt._cardKanji : opt.kanji;
                    const correctKanji = quizCards[quizIdx].kanji;
                    const isCorrectOpt = isCompound ? opt._isCorrect : optKey === correctKanji;
                    const isWrongPicked = quizAnswered && optKey === quizAnswered && !isCorrectOpt;
                    let bg = "#faf6ee", border = "#ddd", col = "#1a1008";
                    if (quizAnswered) {
                        if (isCorrectOpt) {
                            bg = "#eafaf1";
                            border = "#27ae60";
                            col = "#1e8449";
                        }
                        else if (isWrongPicked) {
                            bg = "#fdf0ed";
                            border = "#c0392b";
                            col = "#c0392b";
                        }
                    }
                    return (React.createElement("button", { key: i, onClick: () => handleQuiz(opt), disabled: !!quizAnswered, style: Object.assign(Object.assign(Object.assign({}, S.qb), { background: bg, borderColor: border, color: col }), (quizType === "compounds" || quizType === "compounds_reverse" ? { minHeight: isMobile ? 110 : 90, padding: isMobile ? "14px 8px" : "14px 10px" } : {})) },
                        quizType === "kanji" && (React.createElement(React.Fragment, null,
                            React.createElement("span", { style: { fontFamily: "serif", fontSize: bigFont ? "2.2rem" : "1.1rem", fontWeight: 600 } }, opt.reading),
                            React.createElement("span", { style: { fontSize: bigFont ? "1.44rem" : "0.72rem", marginTop: 2, lineHeight: 1.3, textAlign: "center" } }, opt.meaning))),
                        quizType === "compounds" && (React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: "100%", justifyContent: "center" } }, quizAnswered ? (
                        /* Post-answer: mobile=3 rows, desktop=kanji || reading + english */
                        isMobile ? (React.createElement(React.Fragment, null,
                            React.createElement("span", { style: { fontFamily: "serif", fontSize: bigFont ? "3.2rem" : "1.6rem", fontWeight: 600 } }, opt.jp),
                            React.createElement("span", { style: { fontSize: bigFont ? "2rem" : "1rem", color: "#c0392b", fontWeight: 600 } }, opt.reading),
                            React.createElement("span", { style: { fontSize: bigFont ? "1.5rem" : "0.75rem", lineHeight: 1.3, textAlign: "center", color: col } }, opt.meaning))) : (React.createElement(React.Fragment, null,
                            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontFamily: "serif" } },
                                React.createElement("span", { style: { fontSize: bigFont ? "3rem" : "1.5rem", fontWeight: 600 } }, opt.jp),
                                React.createElement("span", { style: { color: "#ccc", fontSize: bigFont ? "2rem" : "1rem", fontWeight: 400 } }, "||"),
                                React.createElement("span", { style: { fontSize: bigFont ? "1.8rem" : "0.9rem", color: "#c0392b", fontWeight: 600 } }, opt.reading)),
                            React.createElement("span", { style: { fontSize: bigFont ? "1.44rem" : "0.72rem", lineHeight: 1.3, textAlign: "center", color: col } }, opt.meaning)))) : (
                        /* Pre-answer: based on answerStyle */
                        React.createElement(React.Fragment, null,
                            (answerStyle === "traditional" || answerStyle === "japanese") && (React.createElement("span", { style: { fontFamily: "serif", fontSize: bigFont ? "2.2rem" : "1.1rem", fontWeight: 600 } }, opt.reading)),
                            (answerStyle === "traditional" || answerStyle === "english") && (React.createElement("span", { style: { fontSize: answerStyle === "english" ? (bigFont ? "2.16rem" : "1.08rem") : (bigFont ? "1.44rem" : "0.72rem"), lineHeight: 1.3, textAlign: "center", fontWeight: answerStyle === "english" ? 600 : 400 } }, opt.meaning)))))),
                        quizType === "compounds_reverse" && (React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, width: "100%", justifyContent: "center" } }, quizDifficulty === "hard" && !quizAnswered ? (React.createElement("span", { style: { fontFamily: "serif", fontSize: bigFont ? "4rem" : "2rem", fontWeight: 600 } }, opt.jp)) : isMobile ? (
                        /* Mobile: three rows */
                        React.createElement(React.Fragment, null,
                            React.createElement("span", { style: { fontFamily: "serif", fontSize: bigFont ? "3.2rem" : "1.6rem", fontWeight: 600 } }, opt.jp),
                            React.createElement("span", { style: { fontSize: bigFont ? "2rem" : "1rem", color: "#c0392b", fontWeight: 600 } }, opt.reading),
                            React.createElement("span", { style: { fontSize: bigFont ? "1.5rem" : "0.75rem", lineHeight: 1.3, textAlign: "center", color: quizAnswered ? col : "#888",
                                    visibility: quizAnswered ? "visible" : "hidden" } }, opt.meaning))) : (
                        /* Desktop: kanji || reading row + english */
                        React.createElement(React.Fragment, null,
                            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontFamily: "serif" } },
                                React.createElement("span", { style: { fontSize: bigFont ? "3rem" : "1.5rem", fontWeight: 600 } }, opt.jp),
                                React.createElement("span", { style: { color: "#ccc", fontSize: bigFont ? "2rem" : "1rem", fontWeight: 400 } }, "||"),
                                React.createElement("span", { style: { fontSize: bigFont ? "1.8rem" : "0.9rem", color: "#c0392b", fontWeight: 600 } }, opt.reading)),
                            React.createElement("span", { style: { fontSize: bigFont ? "1.44rem" : "0.72rem", lineHeight: 1.3, textAlign: "center", color: quizAnswered ? col : "#888",
                                    visibility: quizAnswered ? "visible" : "hidden" } }, opt.meaning)))))));
                })),
                quizAnswered && React.createElement("button", { style: S.btn, onClick: nextQ }, quizIdx + 1 >= quizCards.length ? "See Results →" : "Next →"))),
            quizDone && (() => {
                const pct = quizScore / quizCards.length;
                const accuracyLabel = pct === 1 ? "完璧！" : pct >= 0.8 ? "素晴らしい！" : pct >= 0.6 ? "よく頑張った！" : "もっと練習！";
                const accuracyColor = pct === 1 ? "#b8860b" : pct >= 0.8 ? "#27ae60" : pct >= 0.6 ? "#555" : "#888";
                // platinum=avg≥4.5, gold=avg≥4, silver=avg≥3, bronze=avg≥2
                const q = quizCards.length;
                const speedMedal = !quizTimerEnabled ? null
                    : quizBonusTotal >= q * 4.5 ? { rank: 1, kanji: "白金", color: "#a0a0b8", shine: "#e8e8f0", border: "#c0c0d8", bg: "#f5f3ff" }
                        : quizBonusTotal >= q * 4 ? { rank: 2, kanji: "金", color: "#c9960c", shine: "#f5d96a", border: "#e0aa20", bg: "#fdf8e1" }
                            : quizBonusTotal >= q * 3 ? { rank: 3, kanji: "銀", color: "#7f8c8d", shine: "#c8d0d0", border: "#a0aaa8", bg: "#f4f6f7" }
                                : quizBonusTotal >= q * 2 ? { rank: 4, kanji: "銅", color: "#a04000", shine: "#d4845a", border: "#c05020", bg: "#fdf2e9" }
                                    : null;
                return (React.createElement("div", { style: { textAlign: "center", padding: "16px 0", width: "100%" } },
                    React.createElement("div", { style: { marginBottom: quizTimerEnabled ? 20 : 24 } },
                        React.createElement("div", { style: { fontSize: "4rem", fontFamily: "serif", color: "#c0392b", fontWeight: 700, lineHeight: 1 } },
                            quizScore,
                            "/",
                            quizCards.length),
                        React.createElement("div", { style: { fontSize: "1rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa", marginTop: 5, fontFamily: "monospace" } }, "Correct"),
                        React.createElement("div", { style: { fontSize: "1.4rem", color: accuracyColor, marginTop: 8, fontFamily: "serif" } }, accuracyLabel)),
                    quizTimerEnabled && (React.createElement("div", { style: { margin: "0 auto 24px", maxWidth: 260, padding: "14px 18px", background: speedMedal ? speedMedal.bg : "#fafafa", border: `1px solid ${speedMedal ? speedMedal.color + "55" : "#eee"}`, borderRadius: 8 } },
                        React.createElement("div", { style: { fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa", marginBottom: 10, fontFamily: "monospace" } }, "Speed Score"),
                        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12 } },
                            speedMedal ? (React.createElement("svg", { width: 48, height: 56, viewBox: "0 0 48 56" },
                                React.createElement("polygon", { points: "14,0 24,0 24,20 10,32", fill: speedMedal.border, opacity: "0.85" }),
                                React.createElement("polygon", { points: "34,0 24,0 24,20 38,32", fill: speedMedal.color, opacity: "0.85" }),
                                React.createElement("circle", { cx: "24", cy: "38", r: "16", fill: "rgba(0,0,0,0.12)" }),
                                React.createElement("circle", { cx: "24", cy: "37", r: "16", fill: speedMedal.color }),
                                React.createElement("circle", { cx: "24", cy: "37", r: "16", fill: speedMedal.shine, opacity: "0.35", clipPath: "url(#top)" }),
                                React.createElement("clipPath", { id: "top" },
                                    React.createElement("rect", { x: "8", y: "21", width: "32", height: "10" })),
                                React.createElement("circle", { cx: "24", cy: "37", r: "16", fill: "none", stroke: speedMedal.border, strokeWidth: "1.5" }),
                                React.createElement("text", { x: "24", y: "43", textAnchor: "middle", fontFamily: "serif", fontSize: "18", fontWeight: "bold", fill: "white", opacity: "0.95" }, speedMedal.rank === 1 ? "1" : speedMedal.rank === 2 ? "1" : speedMedal.rank === 3 ? "2" : "3"))) : (React.createElement("span", { style: { fontSize: "1.6rem", opacity: 0.25 } }, "\u23F1")),
                            React.createElement("div", { style: { textAlign: "left" } },
                                React.createElement("div", { style: { fontSize: "2.2rem", fontFamily: "serif", color: speedMedal ? speedMedal.color : "#bbb", fontWeight: 700, lineHeight: 1 } },
                                    quizBonusTotal,
                                    "/",
                                    quizCards.length * 5,
                                    speedMedal && React.createElement("span", { style: { fontSize: "1.4rem", marginLeft: 6 } }, speedMedal.kanji)),
                                !speedMedal && React.createElement("div", { style: { fontSize: "0.7rem", color: "#bbb", marginTop: 2 } }, "\u3082\u3063\u3068\u7DF4\u7FD2\uFF01"))))),
                    React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center" } },
                        React.createElement("button", { style: S.ghost, onClick: () => setQuizSetup(true) }, "Change Settings"),
                        React.createElement("button", { style: S.btn, onClick: startQuiz }, "Try Again"))));
            })())),
        mode === "write" && card && (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { textAlign: "center", marginBottom: 8 } },
                React.createElement("div", { style: { fontSize: "0.95rem", color: "#888" } }, card.meaning),
                React.createElement("div", { style: { fontFamily: "serif", fontSize: "0.95rem", color: "#c0392b" } },
                    card.reading,
                    " \u00B7 ",
                    card.romaji)),
            React.createElement("canvas", { ref: canvasRef, width: 250, height: 250, style: { border: "1px solid #ddd", borderRadius: 6, touchAction: "none", display: "block", margin: "0 auto 10px" }, onMouseDown: onDown, onMouseMove: onMove, onMouseUp: onUp, onMouseLeave: onUp, onTouchStart: onDown, onTouchMove: onMove, onTouchEnd: onUp }),
            React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center", marginBottom: 10 } },
                React.createElement("button", { style: S.ghost, onClick: initCanvas }, "Clear"),
                React.createElement("button", { style: S.btn, onClick: () => { setRevealed(true); markStudied(); } }, "Reveal \u7B54\u3048")),
            revealed && React.createElement("div", { style: { textAlign: "center", fontFamily: "serif", fontSize: "4rem" } }, card.kanji),
            React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginTop: 10 } },
                React.createElement("button", { style: S.navBtn, onClick: () => changeIdx(-1) }, "\u2190"),
                React.createElement("span", { style: { fontSize: "0.72rem", color: "#aaa" } },
                    idx + 1,
                    " / ",
                    cards.length),
                React.createElement("button", { style: S.navBtn, onClick: () => changeIdx(1) }, "\u2192")))),
        mode === "browse" && (React.createElement("div", { style: { display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${window.innerWidth < 500 ? "78px" : "110px"},1fr))`, gap: window.innerWidth < 500 ? 7 : 10, width: "100%", maxHeight: "58vh", overflowY: "auto", padding: 3 } }, cards.map((c, i) => (React.createElement("div", { key: i, style: { border: `1px solid ${reviewKanji.has(c.kanji) ? "#e8c0b8" : "#ddd"}`, borderRadius: 5, background: libStudied.has(i) ? "#f0f8f0" : "#faf6ee", padding: "8px 6px", textAlign: "center", cursor: "pointer", position: "relative", minWidth: 0 } },
            React.createElement("div", { onClick: () => { setIdx(i); setMode("flash"); setLayer(0); }, style: { fontFamily: "serif", fontSize: "1.7rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, c.kanji),
            React.createElement("div", { style: { fontSize: "1.2rem", color: "#c0392b", marginTop: 2, wordBreak: "break-word" } }, c.reading),
            React.createElement("div", { style: { fontSize: "1rem", color: "#888", wordBreak: "break-word" } }, c.meaning),
            React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 4, marginTop: 2 } },
                libStudied.has(i) && React.createElement("span", { style: { fontSize: "0.6rem", color: "#27ae60" } }, "\u2713"),
                React.createElement("button", { onClick: (e) => { e.stopPropagation(); toggleReview(c.kanji); }, style: { background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", padding: 0, opacity: reviewKanji.has(c.kanji) ? 1 : 0.3 } }, "\uD83D\uDD16"))))))),
        mode === "read" && (React.createElement("div", { style: { width: "100%", padding: "4px 0" } },
            !readContent && !readLoading && (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { marginBottom: 14 } },
                    React.createElement("div", { style: { fontSize: "0.68rem", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 } }, "Source"),
                    React.createElement("div", { style: { display: "flex", gap: 6 } }, [["library", "This Library"], ["card", "This Card"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setReadScope(k), style: { flex: 1, padding: "8px 6px", borderRadius: 8, border: `2px solid ${readScope === k ? "#1a1008" : "#ddd"}`, background: readScope === k ? "#1a1008" : "#faf6ee", color: readScope === k ? "#f5efe3" : "#1a1008", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 } }, l))))),
                React.createElement("div", { style: { marginBottom: 14 } },
                    React.createElement("div", { style: { fontSize: "0.68rem", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 } }, "Format"),
                    React.createElement("div", { style: { display: "flex", gap: 6 } }, [["sentences", "Sentences"], ["story", "Story"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setReadType(k), style: { flex: 1, padding: "8px 6px", borderRadius: 8, border: `2px solid ${readType === k ? "#1a1008" : "#ddd"}`, background: readType === k ? "#1a1008" : "#faf6ee", color: readType === k ? "#f5efe3" : "#1a1008", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 } }, l))))),
                React.createElement("div", { style: { marginBottom: 14 } },
                    React.createElement("div", { style: { fontSize: "0.68rem", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 } }, "JLPT Level"),
                    React.createElement("div", { style: { display: "flex", gap: 6 } }, ["N5", "N4", "N3"].map(l => (React.createElement("button", { key: l, onClick: () => setReadLevel(l), style: { flex: 1, padding: "8px 6px", borderRadius: 8, border: `2px solid ${readLevel === l ? "#1a1008" : "#ddd"}`, background: readLevel === l ? "#1a1008" : "#faf6ee", color: readLevel === l ? "#f5efe3" : "#1a1008", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 } }, l))))),
                readType === "sentences" ? (React.createElement("div", { style: { marginBottom: 20 } },
                    React.createElement("div", { style: { fontSize: "0.68rem", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 } }, "Number of Sentences"),
                    React.createElement("div", { style: { display: "flex", gap: 6 } }, [5, 10, 15].map(n => (React.createElement("button", { key: n, onClick: () => setReadCount(n), style: { flex: 1, padding: "8px 6px", borderRadius: 8, border: `2px solid ${readCount === n ? "#1a1008" : "#ddd"}`, background: readCount === n ? "#1a1008" : "#faf6ee", color: readCount === n ? "#f5efe3" : "#1a1008", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 } }, n)))))) : (React.createElement("div", { style: { marginBottom: 20 } },
                    React.createElement("div", { style: { fontSize: "0.68rem", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 } }, "Story Length"),
                    React.createElement("div", { style: { display: "flex", gap: 6 } }, [["short", "Short (~200)"], ["medium", "Medium (~500)"], ["long", "Long (~800)"]].map(([k, l]) => (React.createElement("button", { key: k, onClick: () => setReadLength(k), style: { flex: 1, padding: "8px 6px", borderRadius: 8, border: `2px solid ${readLength === k ? "#1a1008" : "#ddd"}`, background: readLength === k ? "#1a1008" : "#faf6ee", color: readLength === k ? "#f5efe3" : "#1a1008", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 } }, l)))))),
                React.createElement("button", { style: Object.assign(Object.assign({}, S.btn), { width: "100%", padding: "12px" }), onClick: generateRead }, "Generate \u2726"),
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, margin: "18px 0 14px" } },
                    React.createElement("div", { style: { flex: 1, height: 1, background: "#e8dcc8" } }),
                    React.createElement("span", { style: { fontSize: "0.62rem", color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase" } }, "or"),
                    React.createElement("div", { style: { flex: 1, height: 1, background: "#e8dcc8" } })),
                React.createElement("div", { style: { marginBottom: 12 } },
                    React.createElement("div", { style: { fontSize: "0.68rem", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 } }, "Adventure Theme"),
                    React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } }, [
                        { key: "fantasy", label: "⚔️ Fantasy" },
                        { key: "mystery", label: "🔍 Mystery" },
                        { key: "slice", label: "🌸 Slice of Life" },
                        { key: "historical", label: "🏯 Historical" },
                    ].map(({ key, label }) => (React.createElement("button", { key: key, onClick: () => setCyoaTheme(key), style: { flex: 1, minWidth: "45%", padding: "8px 6px", borderRadius: 8,
                            border: `2px solid ${cyoaTheme === key ? "#1a1008" : "#ddd"}`,
                            background: cyoaTheme === key ? "#1a1008" : "#faf6ee",
                            color: cyoaTheme === key ? "#f5efe3" : "#1a1008",
                            cursor: "pointer", fontSize: "0.72rem", fontWeight: 600 } }, label))))),
                (() => {
                    const prompt = buildCYOAPrompt();
                    const encoded = encodeURIComponent(prompt);
                    return (React.createElement(React.Fragment, null,
                        React.createElement("a", { href: `https://claude.ai/new?q=${encoded}`, target: "_blank", rel: "noopener noreferrer", style: { display: "block", width: "100%", padding: "12px", borderRadius: 3, border: "1px solid #1a1008",
                                background: "transparent", color: "#1a1008", fontSize: "0.7rem", fontFamily: "monospace",
                                letterSpacing: "0.12em", cursor: "pointer", textAlign: "center", textDecoration: "none",
                                boxSizing: "border-box" } }, "\uD83D\uDCD6 Open Adventure in Claude \u2197"),
                        React.createElement("a", { href: `https://x.com/i/grok?text=${encoded}`, target: "_blank", rel: "noopener noreferrer", style: { display: "block", width: "100%", padding: "12px", marginTop: 8, borderRadius: 3,
                                border: "1px solid #1a1008", background: "transparent", color: "#1a1008",
                                fontSize: "0.7rem", fontFamily: "monospace", letterSpacing: "0.12em",
                                cursor: "pointer", textAlign: "center", textDecoration: "none", boxSizing: "border-box" } }, "\uD83D\uDCD6 Open Adventure in Grok \u2197")));
                })(),
                React.createElement("div", { style: { fontSize: "0.6rem", color: "#bbb", textAlign: "center", marginTop: 5 } }, "Opens with your vocabulary \u2014 branching story, you choose what happens next"))),
            readLoading && (React.createElement("div", { style: { textAlign: "center", padding: "40px 0", color: "#aaa", fontFamily: "serif", fontSize: "1.1rem" } },
                React.createElement("div", { style: { fontSize: "2rem", marginBottom: 12 } }, "\u2726"),
                "Generating\u2026")),
            readError && (React.createElement("div", { style: { textAlign: "center", padding: "20px 0" } },
                React.createElement("div", { style: { color: "#c0392b", marginBottom: 12, fontSize: "0.8rem" } }, readError),
                React.createElement("button", { style: S.btn, onClick: generateRead }, "Try Again"))),
            readContent && !readLoading && (() => {
                // Ruby renderer — only wraps in <ruby> when furigana should show
                // Desktop: hover state tracked per-word; Mobile: tap toggles
                const RubyText = ({ text, id }) => {
                    const segments = parseRuby(text);
                    return (React.createElement("span", null, segments.map((seg, si) => {
                        if (seg.type === "text")
                            return React.createElement("span", { key: si }, seg.val);
                        const wordId = `${id}-${si}`;
                        const tapped = pinnedWords.has(wordId);
                        const hovered = hoveredWord === wordId;
                        const showFuri = tapped || (!isMobile && hovered);
                        if (showFuri) {
                            return (React.createElement("ruby", { key: si, onMouseLeave: () => !isMobile && setHoveredWord(null), onClick: () => isMobile && setPinnedWords(prev => {
                                    const n = new Set(prev);
                                    n.has(wordId) ? n.delete(wordId) : n.add(wordId);
                                    return n;
                                }), style: { cursor: isMobile ? "pointer" : "default" } },
                                seg.kanji,
                                React.createElement("rt", null, seg.reading)));
                        }
                        return (React.createElement("span", { key: si, onMouseEnter: () => !isMobile && setHoveredWord(wordId), onClick: () => isMobile && setPinnedWords(prev => {
                                const n = new Set(prev);
                                n.has(wordId) ? n.delete(wordId) : n.add(wordId);
                                return n;
                            }), style: { cursor: isMobile ? "pointer" : "default", borderBottom: isMobile ? "1px dotted #bbb" : "none" } }, seg.kanji));
                    })));
                };
                const isStory = !Array.isArray(readContent);
                const items = isStory ? readContent.paragraphs : readContent;
                return (React.createElement("div", { style: { width: "100%" } },
                    React.createElement("style", null, `
                  ruby { ruby-align: center; }
                  ruby rt { font-size: 0.6em; display: block; text-align: center; line-height: 1.2; }
                `),
                    isMobile && pinnedWords.size > 0 && (React.createElement("div", { style: { textAlign: "right", marginBottom: 8 } },
                        React.createElement("button", { onClick: () => setPinnedWords(new Set()), style: Object.assign(Object.assign({}, S.ghost), { fontSize: "0.65rem", padding: "4px 10px" }) }, "Clear furigana"))),
                    isStory && readContent.title && (React.createElement("div", { style: { fontFamily: "serif", fontSize: "1.2rem", fontWeight: 700, color: "#1a1008", marginBottom: 16, textAlign: "center" } },
                        React.createElement(RubyText, { text: readContent.title, id: "title" }))),
                    React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginBottom: 10 } }, speakingIdx === "all" ? (React.createElement("button", { onClick: stopSpeaking, style: Object.assign(Object.assign({}, S.ghost), { fontSize: "0.7rem", padding: "5px 12px" }) }, "\u23F9 Stop")) : (React.createElement("button", { onClick: () => speakAll(items), style: Object.assign(Object.assign({}, S.ghost), { fontSize: "0.7rem", padding: "5px 12px" }) }, "\u25B6 Play All"))),
                    items.map((item, i) => {
                        const revealed = revealedTranslations.has(i);
                        const isSpeaking = speakingIdx === i;
                        return (React.createElement("div", { key: i, style: { marginBottom: 18, padding: "12px 14px", background: "#faf6ee", border: `1px solid ${isSpeaking ? "#27ae60" : "#e8dcc8"}`, borderRadius: 8 } },
                            React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 8 } },
                                React.createElement("div", { style: { fontFamily: "serif", fontSize: "1.575rem", lineHeight: 2, color: "#1a1008", flex: 1 } },
                                    !isStory && React.createElement("span", { style: { fontSize: "0.62rem", color: "#ccc", marginRight: 6 } },
                                        i + 1,
                                        "."),
                                    React.createElement(RubyText, { text: item.jp, id: `item-${i}` })),
                                React.createElement("button", { onClick: () => isSpeaking ? stopSpeaking() : speakText(item.jp, i), style: { flexShrink: 0, marginTop: 6, background: "none", border: "none", cursor: "pointer",
                                        fontSize: "1.1rem", color: isSpeaking ? "#27ae60" : "#bbb",
                                        transition: "color 0.2s" } }, isSpeaking ? "⏹" : "🔊")),
                            React.createElement("div", { onClick: () => setRevealedTranslations(prev => {
                                    const n = new Set(prev);
                                    n.has(i) ? n.delete(i) : n.add(i);
                                    return n;
                                }), style: { cursor: "pointer", fontSize: revealed ? "1.44rem" : "0.72rem", color: revealed ? "#555" : "#bbb", fontStyle: "italic", borderTop: "1px solid #e8dcc8", paddingTop: 6, marginTop: 4 } }, revealed ? item.en : "tap to reveal translation")));
                    }),
                    React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                        React.createElement("button", { style: Object.assign(Object.assign({}, S.ghost), { flex: 1 }), onClick: () => { setReadContent(null); setReadError(null); } }, "\u2190 Settings"),
                        React.createElement("button", { style: Object.assign(Object.assign({}, S.btn), { flex: 1 }), onClick: generateRead }, "Regenerate \u2726"))));
            })())),
        React.createElement("button", { onClick: () => setBigFont(f => !f), title: bigFont ? "Tap to shrink" : "Tap to enlarge kanji", style: { position: "fixed", bottom: 18, right: 18, width: 44, height: 44, borderRadius: "50%",
                background: bigFont ? "#1a1008" : "#faf6ee",
                border: "2px solid #1a1008",
                color: bigFont ? "#f5efe3" : "#1a1008",
                fontSize: bigFont ? "1rem" : "1.3rem", cursor: "pointer", zIndex: 998,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexDirection: "column", gap: 0 } }, bigFont ? React.createElement(React.Fragment, null,
            "\uD83D\uDD0D",
            React.createElement("span", { style: { fontSize: "0.45rem", letterSpacing: "0em", marginTop: 1 } }, "shrink")) : "🔍"),
        toast && (React.createElement("div", { style: { position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", background: toast.type === "good" ? "#27ae60" : "#c0392b", color: "white", padding: "8px 18px", borderRadius: 4, fontSize: "0.78rem", zIndex: 999, whiteSpace: "nowrap" } }, toast.msg))));
}
const REVIEW_LIB_ID = "__review__";
const regionColors = {
    Action: "#f0f8e8", Movement: "#e8f8f0", Perception: "#f8f0ff", Communication: "#fff8e8",
    Emotion: "#ffe8f8", Cognition: "#f0e8ff", Decision: "#e8f0f8", Transformation: "#fff0e0",
    Life: "#eafaf1", State: "#f8f0e8", Duration: "#e8f4ff", Placement: "#f5f0e8",
    Assembly: "#f0ffe8", Division: "#fff5e8", Comparison: "#e8f8f8", Contact: "#ffe8e8",
    Transaction: "#f8ffe8", Verb: "#f0f8e8", Consumption: "#fff8e8", Dressing: "#f8f0ff",
    Music: "#fce8f8", Creation: "#e8f8ff", Posture: "#f8f8e0", Expression: "#ffe8f0",
    Quantity: "#fff8e0", "Body Parts": "#fdf0e8", "い-Adjective": "#f0fff8",
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
        if (!active) {
            clearInterval(ref.current);
            return;
        }
        ref.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(ref.current);
                    onExpire();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(ref.current);
    }, [active, onExpire]);
    const reset = useCallback((s) => setTimeLeft(s !== null && s !== void 0 ? s : seconds), [seconds]);
    const stop = useCallback(() => clearInterval(ref.current), []);
    return { timeLeft, reset, stop };
}
