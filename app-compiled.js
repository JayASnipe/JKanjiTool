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
// THEMATIC_LIBRARIES loaded from data-thematic.js
// GRADE_LIBRARIES loaded from data-grades.js
// Grades 2-5 remain inline until migrated to data-grades.js
const REMAINING_GRADE_LIBRARIES = [
    { id: "grade_2_kanji_level_1", label: "Level 1", sublabel: "Elementary Grade 2 · 54 cards", emoji: "🌿", group: "grade_2", mode: "formal", category_key: "formal_grade_grade_2", cards: [
            { kanji: "引", reading: "ひく", romaji: "hiku", meaning: "Pull, Draw", region: "Verb", kunYomi: ["ひ"], onYomi: ["いん"], compounds: [{ jp: "引く", reading: "ひく", meaning: "to pull" }, { jp: "引力", reading: "いんりょく", meaning: "gravity" }, { jp: "引退", reading: "いんたい", meaning: "retirement" }, { jp: "引用", reading: "いんよう", meaning: "quotation" }] },
            { kanji: "羽", reading: "はね", romaji: "hane", meaning: "Feather, Wing", region: "Noun", kunYomi: ["は", "はね"], onYomi: ["う"], compounds: [{ jp: "羽", reading: "はね", meaning: "feather, wing" }, { jp: "羽根", reading: "はね", meaning: "feather" }, { jp: "白羽", reading: "しらは", meaning: "white feather" }, { jp: "羽毛", reading: "うもう", meaning: "down feather" }] },
            { kanji: "雲", reading: "くも", romaji: "kumo", meaning: "Cloud", region: "Noun", kunYomi: ["くも"], onYomi: ["うん"], compounds: [{ jp: "雲", reading: "くも", meaning: "cloud" }, { jp: "雲海", reading: "うんかい", meaning: "sea of clouds" }, { jp: "入道雲", reading: "にゅうどうぐも", meaning: "cumulonimbus" }, { jp: "雲行き", reading: "くもゆき", meaning: "look of the sky" }] },
            { kanji: "園", reading: "えん", romaji: "en", meaning: "Garden, Park", region: "Noun", kunYomi: ["その"], onYomi: ["えん"], compounds: [{ jp: "公園", reading: "こうえん", meaning: "park" }, { jp: "幼稚園", reading: "ようちえん", meaning: "kindergarten" }, { jp: "動物園", reading: "どうぶつえん", meaning: "zoo" }, { jp: "庭園", reading: "ていえん", meaning: "garden" }] },
            { kanji: "遠", reading: "とおい", romaji: "tooi", meaning: "Far, Distant", region: "Adjective", kunYomi: ["とお"], onYomi: ["えん", "おん"], compounds: [{ jp: "遠い", reading: "とおい", meaning: "far" }, { jp: "遠足", reading: "えんそく", meaning: "excursion" }, { jp: "遠慮", reading: "えんりょ", meaning: "restraint, reserve" }, { jp: "永遠", reading: "えいえん", meaning: "eternity" }] },
            { kanji: "何", reading: "なに", romaji: "nani", meaning: "What", region: "Noun", kunYomi: ["なに", "なん"], onYomi: ["か"], compounds: [{ jp: "何", reading: "なに", meaning: "what" }, { jp: "何故", reading: "なぜ", meaning: "why" }, { jp: "何時", reading: "いつ", meaning: "when" }, { jp: "如何", reading: "いかが", meaning: "how about" }] },
            { kanji: "科", reading: "か", romaji: "ka", meaning: "Subject, Department", region: "Noun", kunYomi: ["—"], onYomi: ["か"], compounds: [{ jp: "科学", reading: "かがく", meaning: "science" }, { jp: "教科", reading: "きょうか", meaning: "subject" }, { jp: "外科", reading: "げか", meaning: "surgery" }, { jp: "内科", reading: "ないか", meaning: "internal medicine" }] },
            { kanji: "夏", reading: "なつ", romaji: "natsu", meaning: "Summer", region: "Noun", kunYomi: ["なつ"], onYomi: ["か", "げ"], compounds: [{ jp: "夏", reading: "なつ", meaning: "summer" }, { jp: "夏休み", reading: "なつやすみ", meaning: "summer vacation" }, { jp: "夏至", reading: "げし", meaning: "summer solstice" }, { jp: "真夏", reading: "まなつ", meaning: "midsummer" }] },
            { kanji: "家", reading: "いえ", romaji: "ie", meaning: "House, Family", region: "Noun", kunYomi: ["いえ", "や"], onYomi: ["か", "け"], compounds: [{ jp: "家", reading: "いえ", meaning: "house, home" }, { jp: "家族", reading: "かぞく", meaning: "family" }, { jp: "家庭", reading: "かてい", meaning: "home, household" }, { jp: "作家", reading: "さっか", meaning: "author, writer" }] },
            { kanji: "歌", reading: "うた", romaji: "uta", meaning: "Song, Sing", region: "Noun", kunYomi: ["うた", "うた"], onYomi: ["か"], compounds: [{ jp: "歌", reading: "うた", meaning: "song" }, { jp: "歌手", reading: "かしゅ", meaning: "singer" }, { jp: "国歌", reading: "こっか", meaning: "national anthem" }, { jp: "歌詞", reading: "かし", meaning: "lyrics" }] },
            { kanji: "画", reading: "え", romaji: "e", meaning: "Picture, Draw", region: "Noun", kunYomi: ["え", "かく"], onYomi: ["が", "かく"], compounds: [{ jp: "絵画", reading: "かいが", meaning: "painting" }, { jp: "画家", reading: "がか", meaning: "painter, artist" }, { jp: "映画", reading: "えいが", meaning: "movie" }, { jp: "計画", reading: "けいかく", meaning: "plan" }] },
            { kanji: "回", reading: "まわる", romaji: "mawaru", meaning: "Turn, Time", region: "Verb", kunYomi: ["まわ", "まわ"], onYomi: ["かい", "え"], compounds: [{ jp: "回る", reading: "まわる", meaning: "to turn, go around" }, { jp: "回数", reading: "かいすう", meaning: "number of times" }, { jp: "回復", reading: "かいふく", meaning: "recovery" }, { jp: "今回", reading: "こんかい", meaning: "this time" }] },
            { kanji: "会", reading: "あう", romaji: "au", meaning: "Meet, Society", region: "Verb", kunYomi: ["あ"], onYomi: ["かい", "え"], compounds: [{ jp: "会う", reading: "あう", meaning: "to meet" }, { jp: "会社", reading: "かいしゃ", meaning: "company" }, { jp: "会議", reading: "かいぎ", meaning: "meeting" }, { jp: "社会", reading: "しゃかい", meaning: "society" }] },
            { kanji: "海", reading: "うみ", romaji: "umi", meaning: "Sea, Ocean", region: "Noun", kunYomi: ["うみ"], onYomi: ["かい"], compounds: [{ jp: "海", reading: "うみ", meaning: "sea, ocean" }, { jp: "海外", reading: "かいがい", meaning: "overseas" }, { jp: "海岸", reading: "かいがん", meaning: "coast" }, { jp: "日本海", reading: "にほんかい", meaning: "Sea of Japan" }] },
            { kanji: "絵", reading: "え", romaji: "e", meaning: "Picture, Painting", region: "Noun", kunYomi: ["え"], onYomi: ["かい", "え"], compounds: [{ jp: "絵", reading: "え", meaning: "picture, painting" }, { jp: "絵本", reading: "えほん", meaning: "picture book" }, { jp: "絵画", reading: "かいが", meaning: "painting" }, { jp: "絵具", reading: "えのぐ", meaning: "paint, colors" }] },
            { kanji: "外", reading: "そと", romaji: "soto", meaning: "Outside, Foreign", region: "Noun", kunYomi: ["そと", "ほか", "はず"], onYomi: ["がい", "げ"], compounds: [{ jp: "外", reading: "そと", meaning: "outside" }, { jp: "海外", reading: "かいがい", meaning: "overseas" }, { jp: "外国", reading: "がいこく", meaning: "foreign country" }, { jp: "意外", reading: "いがい", meaning: "unexpected" }] },
            { kanji: "角", reading: "かど", romaji: "kado", meaning: "Corner, Angle", region: "Noun", kunYomi: ["かど", "つの"], onYomi: ["かく"], compounds: [{ jp: "角", reading: "かど", meaning: "corner, angle" }, { jp: "三角", reading: "さんかく", meaning: "triangle" }, { jp: "四角", reading: "しかく", meaning: "square" }, { jp: "角度", reading: "かくど", meaning: "angle" }] },
            { kanji: "活", reading: "かつ", romaji: "katsu", meaning: "Lively, Activity", region: "Verb", kunYomi: ["い"], onYomi: ["かつ"], compounds: [{ jp: "活動", reading: "かつどう", meaning: "activity" }, { jp: "生活", reading: "せいかつ", meaning: "life, living" }, { jp: "活気", reading: "かっき", meaning: "liveliness" }, { jp: "活発", reading: "かっぱつ", meaning: "active, lively" }] },
            { kanji: "間", reading: "あいだ", romaji: "aida", meaning: "Between, Interval", region: "Noun", kunYomi: ["あいだ", "ま"], onYomi: ["かん", "けん"], compounds: [{ jp: "間", reading: "あいだ", meaning: "between, interval" }, { jp: "時間", reading: "じかん", meaning: "time" }, { jp: "人間", reading: "にんげん", meaning: "human being" }, { jp: "空間", reading: "くうかん", meaning: "space" }] },
            { kanji: "丸", reading: "まる", romaji: "maru", meaning: "Circle, Round", region: "Noun", kunYomi: ["まる", "まる"], onYomi: ["がん"], compounds: [{ jp: "丸", reading: "まる", meaning: "circle, round" }, { jp: "丸い", reading: "まるい", meaning: "round" }, { jp: "丸暗記", reading: "まるあんき", meaning: "rote memorization" }, { jp: "丸ごと", reading: "まるごと", meaning: "whole, entirely" }] },
            { kanji: "岩", reading: "いわ", romaji: "iwa", meaning: "Rock, Boulder", region: "Noun", kunYomi: ["いわ"], onYomi: ["がん"], compounds: [{ jp: "岩", reading: "いわ", meaning: "rock, boulder" }, { jp: "岩石", reading: "がんせき", meaning: "rock" }, { jp: "火山岩", reading: "かざんがん", meaning: "volcanic rock" }, { jp: "岩場", reading: "いわば", meaning: "rocky area" }] },
            { kanji: "顔", reading: "かお", romaji: "kao", meaning: "Face", region: "Noun", kunYomi: ["かお"], onYomi: ["がん"], compounds: [{ jp: "顔", reading: "かお", meaning: "face" }, { jp: "顔色", reading: "かおいろ", meaning: "complexion" }, { jp: "笑顔", reading: "えがお", meaning: "smiling face" }, { jp: "洗顔", reading: "せんがん", meaning: "face washing" }] },
            { kanji: "汽", reading: "き", romaji: "ki", meaning: "Steam", region: "Noun", kunYomi: ["—"], onYomi: ["き"], compounds: [{ jp: "汽車", reading: "きしゃ", meaning: "steam train" }, { jp: "汽船", reading: "きせん", meaning: "steamship" }, { jp: "汽笛", reading: "きてき", meaning: "steam whistle" }] },
            { kanji: "記", reading: "きろく", romaji: "kiroku", meaning: "Record, Write", region: "Verb", kunYomi: ["しる"], onYomi: ["き"], compounds: [{ jp: "記録", reading: "きろく", meaning: "record" }, { jp: "日記", reading: "にっき", meaning: "diary" }, { jp: "記念", reading: "きねん", meaning: "commemoration" }, { jp: "記事", reading: "きじ", meaning: "article, news" }] },
            { kanji: "帰", reading: "かえる", romaji: "kaeru", meaning: "Return, Go home", region: "Verb", kunYomi: ["かえ"], onYomi: ["き"], compounds: [{ jp: "帰る", reading: "かえる", meaning: "to return, go home" }, { jp: "帰国", reading: "きこく", meaning: "return to one's country" }, { jp: "帰宅", reading: "きたく", meaning: "returning home" }, { jp: "帰省", reading: "きせい", meaning: "homecoming" }] },
            { kanji: "弓", reading: "ゆみ", romaji: "yumi", meaning: "Bow (weapon)", region: "Noun", kunYomi: ["ゆみ"], onYomi: ["きゅう"], compounds: [{ jp: "弓", reading: "ゆみ", meaning: "bow (weapon)" }, { jp: "弓道", reading: "きゅうどう", meaning: "Japanese archery" }, { jp: "弓矢", reading: "ゆみや", meaning: "bow and arrow" }, { jp: "弓形", reading: "ゆみなり", meaning: "arc, bow shape" }] },
            { kanji: "牛", reading: "うし", romaji: "ushi", meaning: "Cow, Cattle", region: "Noun", kunYomi: ["うし"], onYomi: ["ぎゅう"], compounds: [{ jp: "牛", reading: "うし", meaning: "cow, cattle" }, { jp: "牛乳", reading: "ぎゅうにゅう", meaning: "milk" }, { jp: "牛肉", reading: "ぎゅうにく", meaning: "beef" }, { jp: "牛丼", reading: "ぎゅうどん", meaning: "beef bowl" }] },
            { kanji: "魚", reading: "さかな", romaji: "sakana", meaning: "Fish", region: "Noun", kunYomi: ["さかな", "うお"], onYomi: ["ぎょ"], compounds: [{ jp: "魚", reading: "さかな", meaning: "fish" }, { jp: "金魚", reading: "きんぎょ", meaning: "goldfish" }, { jp: "魚介", reading: "ぎょかい", meaning: "seafood" }, { jp: "熱帯魚", reading: "ねったいぎょ", meaning: "tropical fish" }] },
            { kanji: "京", reading: "きょう", romaji: "kyou", meaning: "Capital City", region: "Noun", kunYomi: ["みやこ"], onYomi: ["きょう", "けい"], compounds: [{ jp: "東京", reading: "とうきょう", meaning: "Tokyo" }, { jp: "京都", reading: "きょうと", meaning: "Kyoto" }, { jp: "上京", reading: "じょうきょう", meaning: "going to Tokyo" }, { jp: "京阪", reading: "けいはん", meaning: "Kyoto-Osaka area" }] },
            { kanji: "強", reading: "つよい", romaji: "tsuyoi", meaning: "Strong", region: "Adjective", kunYomi: ["つよ", "し"], onYomi: ["きょう", "ごう"], compounds: [{ jp: "強い", reading: "つよい", meaning: "strong" }, { jp: "強調", reading: "きょうちょう", meaning: "emphasis" }, { jp: "強化", reading: "きょうか", meaning: "strengthening" }, { jp: "勉強", reading: "べんきょう", meaning: "study" }] },
            { kanji: "教", reading: "おしえる", romaji: "oshieru", meaning: "Teach, Religion", region: "Verb", kunYomi: ["おし", "おそ"], onYomi: ["きょう"], compounds: [{ jp: "教える", reading: "おしえる", meaning: "to teach" }, { jp: "教育", reading: "きょういく", meaning: "education" }, { jp: "教師", reading: "きょうし", meaning: "teacher" }, { jp: "宗教", reading: "しゅうきょう", meaning: "religion" }] },
            { kanji: "近", reading: "ちかい", romaji: "chikai", meaning: "Near, Close", region: "Adjective", kunYomi: ["ちか"], onYomi: ["きん"], compounds: [{ jp: "近い", reading: "ちかい", meaning: "near, close" }, { jp: "近所", reading: "きんじょ", meaning: "neighborhood" }, { jp: "近代", reading: "きんだい", meaning: "modern times" }, { jp: "最近", reading: "さいきん", meaning: "recently" }] },
            { kanji: "兄", reading: "あに", romaji: "ani", meaning: "Older brother", region: "Noun", kunYomi: ["あに"], onYomi: ["けい", "きょう"], compounds: [{ jp: "兄", reading: "あに", meaning: "older brother" }, { jp: "兄弟", reading: "きょうだい", meaning: "siblings" }, { jp: "義兄", reading: "ぎけい", meaning: "brother-in-law" }, { jp: "お兄さん", reading: "おにいさん", meaning: "older brother (polite)" }] },
            { kanji: "形", reading: "かたち", romaji: "katachi", meaning: "Shape, Form", region: "Noun", kunYomi: ["かたち", "かた"], onYomi: ["けい", "ぎょう"], compounds: [{ jp: "形", reading: "かたち", meaning: "shape, form" }, { jp: "形式", reading: "けいしき", meaning: "form, style" }, { jp: "人形", reading: "にんぎょう", meaning: "doll" }, { jp: "変形", reading: "へんけい", meaning: "transformation" }] },
            { kanji: "計", reading: "はかる", romaji: "hakaru", meaning: "Measure, Plan", region: "Verb", kunYomi: ["はか"], onYomi: ["けい"], compounds: [{ jp: "計る", reading: "はかる", meaning: "to measure" }, { jp: "計画", reading: "けいかく", meaning: "plan" }, { jp: "時計", reading: "とけい", meaning: "clock, watch" }, { jp: "合計", reading: "ごうけい", meaning: "total, sum" }] },
            { kanji: "元", reading: "もと", romaji: "moto", meaning: "Origin, Former", region: "Noun", kunYomi: ["もと"], onYomi: ["げん", "がん"], compounds: [{ jp: "元気", reading: "げんき", meaning: "healthy, energetic" }, { jp: "元々", reading: "もともと", meaning: "originally" }, { jp: "元日", reading: "がんじつ", meaning: "New Year's Day" }, { jp: "復元", reading: "ふくげん", meaning: "restoration" }] },
            { kanji: "言", reading: "いう", romaji: "iu", meaning: "Say, Speak", region: "Verb", kunYomi: ["い", "こと"], onYomi: ["げん", "ごん"], compounds: [{ jp: "言う", reading: "いう", meaning: "to say" }, { jp: "言葉", reading: "ことば", meaning: "word, language" }, { jp: "言語", reading: "げんご", meaning: "language" }, { jp: "宣言", reading: "せんげん", meaning: "declaration" }] },
            { kanji: "原", reading: "はら", romaji: "hara", meaning: "Field, Origin", region: "Noun", kunYomi: ["はら"], onYomi: ["げん"], compounds: [{ jp: "原", reading: "はら", meaning: "field, plain" }, { jp: "原因", reading: "げんいん", meaning: "cause, reason" }, { jp: "原料", reading: "げんりょう", meaning: "raw material" }, { jp: "草原", reading: "そうげん", meaning: "grassland" }] },
            { kanji: "古", reading: "ふるい", romaji: "furui", meaning: "Old", region: "Adjective", kunYomi: ["ふる"], onYomi: ["こ"], compounds: [{ jp: "古い", reading: "ふるい", meaning: "old" }, { jp: "古代", reading: "こだい", meaning: "ancient times" }, { jp: "中古", reading: "ちゅうこ", meaning: "secondhand" }, { jp: "最古", reading: "さいこ", meaning: "oldest" }] },
            { kanji: "戸", reading: "と", romaji: "to", meaning: "Door, Household", region: "Noun", kunYomi: ["と"], onYomi: ["こ"], compounds: [{ jp: "戸", reading: "と", meaning: "door" }, { jp: "戸棚", reading: "とだな", meaning: "cupboard" }, { jp: "江戸", reading: "えど", meaning: "Edo (old Tokyo)" }, { jp: "戸籍", reading: "こせき", meaning: "family register" }] },
            { kanji: "午", reading: "ご", romaji: "go", meaning: "Noon", region: "Noun", kunYomi: ["—"], onYomi: ["ご"], compounds: [{ jp: "午前", reading: "ごぜん", meaning: "morning, AM" }, { jp: "午後", reading: "ごご", meaning: "afternoon, PM" }, { jp: "正午", reading: "しょうご", meaning: "noon" }, { jp: "午前中", reading: "ごぜんちゅう", meaning: "in the morning" }] },
            { kanji: "後", reading: "あと", romaji: "ato", meaning: "After, Behind", region: "Noun", kunYomi: ["あと", "うし", "おく"], onYomi: ["ご", "こう"], compounds: [{ jp: "後", reading: "あと", meaning: "after, behind" }, { jp: "午後", reading: "ごご", meaning: "afternoon" }, { jp: "最後", reading: "さいご", meaning: "last, final" }, { jp: "後悔", reading: "こうかい", meaning: "regret" }] },
            { kanji: "語", reading: "かたる", romaji: "kataru", meaning: "Language, Talk", region: "Noun", kunYomi: ["かた"], onYomi: ["ご"], compounds: [{ jp: "語る", reading: "かたる", meaning: "to talk, narrate" }, { jp: "日本語", reading: "にほんご", meaning: "Japanese language" }, { jp: "英語", reading: "えいご", meaning: "English" }, { jp: "物語", reading: "ものがたり", meaning: "story, tale" }] },
            { kanji: "工", reading: "こう", romaji: "kou", meaning: "Construction, Work", region: "Noun", kunYomi: ["—"], onYomi: ["こう", "く"], compounds: [{ jp: "工場", reading: "こうじょう", meaning: "factory" }, { jp: "工事", reading: "こうじ", meaning: "construction work" }, { jp: "工業", reading: "こうぎょう", meaning: "industry" }, { jp: "人工", reading: "じんこう", meaning: "artificial" }] },
            { kanji: "公", reading: "おおやけ", romaji: "ooyake", meaning: "Public, Official", region: "Noun", kunYomi: ["おおやけ"], onYomi: ["こう"], compounds: [{ jp: "公園", reading: "こうえん", meaning: "park" }, { jp: "公共", reading: "こうきょう", meaning: "public" }, { jp: "公務員", reading: "こうむいん", meaning: "public servant" }, { jp: "公式", reading: "こうしき", meaning: "official, formula" }] },
            { kanji: "広", reading: "ひろい", romaji: "hiroi", meaning: "Wide, Broad", region: "Adjective", kunYomi: ["ひろ"], onYomi: ["こう"], compounds: [{ jp: "広い", reading: "ひろい", meaning: "wide, broad" }, { jp: "広告", reading: "こうこく", meaning: "advertisement" }, { jp: "広場", reading: "ひろば", meaning: "plaza, square" }, { jp: "広大", reading: "こうだい", meaning: "vast, extensive" }] },
            { kanji: "交", reading: "まじわる", romaji: "majiwaru", meaning: "Intersect, Exchange", region: "Verb", kunYomi: ["まじ", "ま", "こう"], onYomi: ["こう"], compounds: [{ jp: "交通", reading: "こうつう", meaning: "traffic, transportation" }, { jp: "交換", reading: "こうかん", meaning: "exchange" }, { jp: "外交", reading: "がいこう", meaning: "diplomacy" }, { jp: "交差点", reading: "こうさてん", meaning: "intersection" }] },
            { kanji: "光", reading: "ひかり", romaji: "hikari", meaning: "Light", region: "Noun", kunYomi: ["ひかり", "ひか"], onYomi: ["こう"], compounds: [{ jp: "光", reading: "ひかり", meaning: "light" }, { jp: "光線", reading: "こうせん", meaning: "ray of light" }, { jp: "観光", reading: "かんこう", meaning: "sightseeing" }, { jp: "日光", reading: "にっこう", meaning: "sunlight" }] },
            { kanji: "考", reading: "かんがえる", romaji: "kangaeru", meaning: "Think, Consider", region: "Verb", kunYomi: ["かんが"], onYomi: ["こう"], compounds: [{ jp: "考える", reading: "かんがえる", meaning: "to think, consider" }, { jp: "考慮", reading: "こうりょ", meaning: "consideration" }, { jp: "思考", reading: "しこう", meaning: "thinking" }, { jp: "参考", reading: "さんこう", meaning: "reference" }] },
            { kanji: "行", reading: "いく", romaji: "iku", meaning: "Go, Line", region: "Verb", kunYomi: ["い", "ゆ", "おこな"], onYomi: ["こう", "ぎょう"], compounds: [{ jp: "行く", reading: "いく", meaning: "to go" }, { jp: "旅行", reading: "りょこう", meaning: "travel" }, { jp: "銀行", reading: "ぎんこう", meaning: "bank" }, { jp: "行動", reading: "こうどう", meaning: "action, behavior" }] },
            { kanji: "高", reading: "たかい", romaji: "takai", meaning: "High, Expensive", region: "Adjective", kunYomi: ["たか"], onYomi: ["こう"], compounds: [{ jp: "高い", reading: "たかい", meaning: "high, expensive" }, { jp: "高校", reading: "こうこう", meaning: "high school" }, { jp: "最高", reading: "さいこう", meaning: "highest, best" }, { jp: "高速", reading: "こうそく", meaning: "high speed" }] },
            { kanji: "黄", reading: "きいろ", romaji: "kiiro", meaning: "Yellow", region: "Noun", kunYomi: ["き", "こ"], onYomi: ["おう", "こう"], compounds: [{ jp: "黄色", reading: "きいろ", meaning: "yellow" }, { jp: "黄金", reading: "おうごん", meaning: "gold" }, { jp: "黄身", reading: "きみ", meaning: "egg yolk" }, { jp: "卵黄", reading: "らんおう", meaning: "egg yolk" }] },
            { kanji: "合", reading: "あう", romaji: "au", meaning: "Fit, Combine", region: "Verb", kunYomi: ["あ", "あい"], onYomi: ["ごう", "がっ"], compounds: [{ jp: "合う", reading: "あう", meaning: "to fit, match" }, { jp: "合計", reading: "ごうけい", meaning: "total" }, { jp: "場合", reading: "ばあい", meaning: "case, situation" }, { jp: "集合", reading: "しゅうごう", meaning: "gathering" }] },
            { kanji: "谷", reading: "たに", romaji: "tani", meaning: "Valley", region: "Noun", kunYomi: ["たに"], onYomi: ["こく"], compounds: [{ jp: "谷", reading: "たに", meaning: "valley" }, { jp: "谷底", reading: "たにそこ", meaning: "valley floor" }, { jp: "渓谷", reading: "けいこく", meaning: "ravine, gorge" }, { jp: "谷間", reading: "たにま", meaning: "valley, gap" }] },
        ] },
    { id: "grade_2_kanji_level_2", label: "Level 2", sublabel: "Elementary Grade 2 · 53 cards", emoji: "🌿", group: "grade_2", mode: "formal", category_key: "formal_grade_grade_2", cards: [
            { kanji: "国", reading: "くに", romaji: "kuni", meaning: "Country", region: "Noun", kunYomi: ["くに"], onYomi: ["こく"], compounds: [{ jp: "国", reading: "くに", meaning: "country" }, { jp: "外国", reading: "がいこく", meaning: "foreign country" }, { jp: "国語", reading: "こくご", meaning: "Japanese language" }, { jp: "国際", reading: "こくさい", meaning: "international" }] },
            { kanji: "黒", reading: "くろ", romaji: "kuro", meaning: "Black", region: "Noun", kunYomi: ["くろ"], onYomi: ["こく"], compounds: [{ jp: "黒い", reading: "くろい", meaning: "black" }, { jp: "黒板", reading: "こくばん", meaning: "blackboard" }, { jp: "暗黒", reading: "あんこく", meaning: "darkness" }, { jp: "黒字", reading: "くろじ", meaning: "surplus, profit" }] },
            { kanji: "今", reading: "いま", romaji: "ima", meaning: "Now, Present", region: "Noun", kunYomi: ["いま"], onYomi: ["こん", "きん"], compounds: [{ jp: "今", reading: "いま", meaning: "now" }, { jp: "今日", reading: "きょう", meaning: "today" }, { jp: "今年", reading: "ことし", meaning: "this year" }, { jp: "今週", reading: "こんしゅう", meaning: "this week" }] },
            { kanji: "才", reading: "さい", romaji: "sai", meaning: "Talent, Age", region: "Noun", kunYomi: ["—"], onYomi: ["さい"], compounds: [{ jp: "才能", reading: "さいのう", meaning: "talent, ability" }, { jp: "二十才", reading: "はたち", meaning: "twenty years old" }, { jp: "天才", reading: "てんさい", meaning: "genius" }, { jp: "秀才", reading: "しゅうさい", meaning: "brilliant person" }] },
            { kanji: "細", reading: "ほそい", romaji: "hosoi", meaning: "Thin, Fine", region: "Adjective", kunYomi: ["ほそ", "こま"], onYomi: ["さい"], compounds: [{ jp: "細い", reading: "ほそい", meaning: "thin, slender" }, { jp: "細かい", reading: "こまかい", meaning: "fine, detailed" }, { jp: "詳細", reading: "しょうさい", meaning: "details" }, { jp: "細胞", reading: "さいぼう", meaning: "cell (biology)" }] },
            { kanji: "作", reading: "つくる", romaji: "tsukuru", meaning: "Make, Create", region: "Verb", kunYomi: ["つく"], onYomi: ["さく", "さ"], compounds: [{ jp: "作る", reading: "つくる", meaning: "to make, create" }, { jp: "作品", reading: "さくひん", meaning: "work, piece" }, { jp: "工作", reading: "こうさく", meaning: "craft, construction" }, { jp: "操作", reading: "そうさ", meaning: "operation, handling" }] },
            { kanji: "算", reading: "さん", romaji: "san", meaning: "Calculate, Count", region: "Verb", kunYomi: ["—"], onYomi: ["さん"], compounds: [{ jp: "計算", reading: "けいさん", meaning: "calculation" }, { jp: "算数", reading: "さんすう", meaning: "arithmetic" }, { jp: "予算", reading: "よさん", meaning: "budget" }, { jp: "算出", reading: "さんしゅつ", meaning: "calculation, estimation" }] },
            { kanji: "止", reading: "とまる", romaji: "tomaru", meaning: "Stop, Halt", region: "Verb", kunYomi: ["と", "や", "さ"], onYomi: ["し"], compounds: [{ jp: "止まる", reading: "とまる", meaning: "to stop" }, { jp: "中止", reading: "ちゅうし", meaning: "cancellation" }, { jp: "禁止", reading: "きんし", meaning: "prohibition" }, { jp: "停止", reading: "ていし", meaning: "halt, suspension" }] },
            { kanji: "市", reading: "し", romaji: "shi", meaning: "City, Market", region: "Noun", kunYomi: ["いち"], onYomi: ["し"], compounds: [{ jp: "市場", reading: "いちば", meaning: "market" }, { jp: "市民", reading: "しみん", meaning: "citizen" }, { jp: "都市", reading: "とし", meaning: "city" }, { jp: "市長", reading: "しちょう", meaning: "mayor" }] },
            { kanji: "矢", reading: "や", romaji: "ya", meaning: "Arrow", region: "Noun", kunYomi: ["や"], onYomi: ["し"], compounds: [{ jp: "矢", reading: "や", meaning: "arrow" }, { jp: "矢印", reading: "やじるし", meaning: "arrow mark" }, { jp: "弓矢", reading: "ゆみや", meaning: "bow and arrow" }, { jp: "一矢", reading: "いっし", meaning: "one arrow" }] },
            { kanji: "姉", reading: "あね", romaji: "ane", meaning: "Older sister", region: "Noun", kunYomi: ["あね"], onYomi: ["し"], compounds: [{ jp: "姉", reading: "あね", meaning: "older sister" }, { jp: "姉妹", reading: "しまい", meaning: "sisters" }, { jp: "義姉", reading: "ぎし", meaning: "sister-in-law" }, { jp: "お姉さん", reading: "おねえさん", meaning: "older sister (polite)" }] },
            { kanji: "思", reading: "おもう", romaji: "omou", meaning: "Think, Feel", region: "Verb", kunYomi: ["おも"], onYomi: ["し"], compounds: [{ jp: "思う", reading: "おもう", meaning: "to think, feel" }, { jp: "思想", reading: "しそう", meaning: "thought, ideology" }, { jp: "不思議", reading: "ふしぎ", meaning: "mysterious" }, { jp: "回想", reading: "かいそう", meaning: "recollection" }] },
            { kanji: "紙", reading: "かみ", romaji: "kami", meaning: "Paper", region: "Noun", kunYomi: ["かみ"], onYomi: ["し"], compounds: [{ jp: "紙", reading: "かみ", meaning: "paper" }, { jp: "手紙", reading: "てがみ", meaning: "letter" }, { jp: "新聞紙", reading: "しんぶんし", meaning: "newspaper" }, { jp: "紙幣", reading: "しへい", meaning: "paper money" }] },
            { kanji: "寺", reading: "てら", romaji: "tera", meaning: "Temple", region: "Noun", kunYomi: ["てら"], onYomi: ["じ"], compounds: [{ jp: "寺", reading: "てら", meaning: "temple" }, { jp: "お寺", reading: "おてら", meaning: "temple" }, { jp: "寺院", reading: "じいん", meaning: "temple" }, { jp: "古寺", reading: "こじ", meaning: "old temple" }] },
            { kanji: "自", reading: "みずから", romaji: "mizukara", meaning: "Self, Oneself", region: "Noun", kunYomi: ["みずか"], onYomi: ["じ", "し"], compounds: [{ jp: "自分", reading: "じぶん", meaning: "oneself" }, { jp: "自動", reading: "じどう", meaning: "automatic" }, { jp: "自然", reading: "しぜん", meaning: "nature" }, { jp: "自由", reading: "じゆう", meaning: "freedom" }] },
            { kanji: "時", reading: "とき", romaji: "toki", meaning: "Time, Hour", region: "Noun", kunYomi: ["とき"], onYomi: ["じ"], compounds: [{ jp: "時間", reading: "じかん", meaning: "time" }, { jp: "時代", reading: "じだい", meaning: "era, age" }, { jp: "同時", reading: "どうじ", meaning: "simultaneous" }, { jp: "時計", reading: "とけい", meaning: "clock, watch" }] },
            { kanji: "室", reading: "しつ", romaji: "shitsu", meaning: "Room", region: "Noun", kunYomi: ["むろ"], onYomi: ["しつ"], compounds: [{ jp: "教室", reading: "きょうしつ", meaning: "classroom" }, { jp: "寝室", reading: "しんしつ", meaning: "bedroom" }, { jp: "室内", reading: "しつない", meaning: "indoor" }, { jp: "研究室", reading: "けんきゅうしつ", meaning: "laboratory" }] },
            { kanji: "社", reading: "しゃ", romaji: "sha", meaning: "Company, Shrine", region: "Noun", kunYomi: ["やしろ"], onYomi: ["しゃ"], compounds: [{ jp: "会社", reading: "かいしゃ", meaning: "company" }, { jp: "神社", reading: "じんじゃ", meaning: "shrine" }, { jp: "社会", reading: "しゃかい", meaning: "society" }, { jp: "社長", reading: "しゃちょう", meaning: "company president" }] },
            { kanji: "弱", reading: "よわい", romaji: "yowai", meaning: "Weak", region: "Adjective", kunYomi: ["よわ"], onYomi: ["じゃく"], compounds: [{ jp: "弱い", reading: "よわい", meaning: "weak" }, { jp: "弱点", reading: "じゃくてん", meaning: "weakness" }, { jp: "弱体", reading: "じゃくたい", meaning: "weak body" }, { jp: "強弱", reading: "きょうじゃく", meaning: "strength and weakness" }] },
            { kanji: "首", reading: "くび", romaji: "kubi", meaning: "Neck, Head", region: "Noun", kunYomi: ["くび"], onYomi: ["しゅ"], compounds: [{ jp: "首", reading: "くび", meaning: "neck, head" }, { jp: "首相", reading: "しゅしょう", meaning: "prime minister" }, { jp: "手首", reading: "てくび", meaning: "wrist" }, { jp: "首都", reading: "しゅと", meaning: "capital city" }] },
            { kanji: "春", reading: "はる", romaji: "haru", meaning: "Spring", region: "Noun", kunYomi: ["はる"], onYomi: ["しゅん"], compounds: [{ jp: "春", reading: "はる", meaning: "spring" }, { jp: "春休み", reading: "はるやすみ", meaning: "spring vacation" }, { jp: "春分", reading: "しゅんぶん", meaning: "spring equinox" }, { jp: "青春", reading: "せいしゅん", meaning: "youth, springtime of life" }] },
            { kanji: "書", reading: "かく", romaji: "kaku", meaning: "Write", region: "Verb", kunYomi: ["か"], onYomi: ["しょ"], compounds: [{ jp: "書く", reading: "かく", meaning: "to write" }, { jp: "図書館", reading: "としょかん", meaning: "library" }, { jp: "書類", reading: "しょるい", meaning: "documents" }, { jp: "辞書", reading: "じしょ", meaning: "dictionary" }] },
            { kanji: "少", reading: "すくない", romaji: "sukunai", meaning: "Few, Little", region: "Adjective", kunYomi: ["すく", "すこ"], onYomi: ["しょう"], compounds: [{ jp: "少ない", reading: "すくない", meaning: "few, little" }, { jp: "少し", reading: "すこし", meaning: "a little" }, { jp: "少年", reading: "しょうねん", meaning: "boy, youth" }, { jp: "減少", reading: "げんしょう", meaning: "decrease" }] },
            { kanji: "場", reading: "ば", romaji: "ba", meaning: "Place, Field", region: "Noun", kunYomi: ["ば"], onYomi: ["じょう"], compounds: [{ jp: "場所", reading: "ばしょ", meaning: "place, location" }, { jp: "工場", reading: "こうじょう", meaning: "factory" }, { jp: "登場", reading: "とうじょう", meaning: "appearance, entry" }, { jp: "場合", reading: "ばあい", meaning: "case, situation" }] },
            { kanji: "色", reading: "いろ", romaji: "iro", meaning: "Color", region: "Noun", kunYomi: ["いろ"], onYomi: ["しょく", "しき"], compounds: [{ jp: "色", reading: "いろ", meaning: "color" }, { jp: "色彩", reading: "しきさい", meaning: "color, hue" }, { jp: "特色", reading: "とくしょく", meaning: "characteristic, feature" }, { jp: "景色", reading: "けしき", meaning: "scenery" }] },
            { kanji: "食", reading: "たべる", romaji: "taberu", meaning: "Eat, Food", region: "Verb", kunYomi: ["た", "く"], onYomi: ["しょく", "じき"], compounds: [{ jp: "食べる", reading: "たべる", meaning: "to eat" }, { jp: "食事", reading: "しょくじ", meaning: "meal" }, { jp: "食料", reading: "しょくりょう", meaning: "food" }, { jp: "給食", reading: "きゅうしょく", meaning: "school lunch" }] },
            { kanji: "心", reading: "こころ", romaji: "kokoro", meaning: "Heart, Mind", region: "Noun", kunYomi: ["こころ"], onYomi: ["しん"], compounds: [{ jp: "心", reading: "こころ", meaning: "heart, mind" }, { jp: "安心", reading: "あんしん", meaning: "relief, peace of mind" }, { jp: "中心", reading: "ちゅうしん", meaning: "center" }, { jp: "関心", reading: "かんしん", meaning: "interest, concern" }] },
            { kanji: "新", reading: "あたらしい", romaji: "atarashii", meaning: "New", region: "Adjective", kunYomi: ["あたら", "にい"], onYomi: ["しん"], compounds: [{ jp: "新しい", reading: "あたらしい", meaning: "new" }, { jp: "新聞", reading: "しんぶん", meaning: "newspaper" }, { jp: "革新", reading: "かくしん", meaning: "innovation" }, { jp: "新幹線", reading: "しんかんせん", meaning: "bullet train" }] },
            { kanji: "親", reading: "おや", romaji: "oya", meaning: "Parent, Intimate", region: "Noun", kunYomi: ["おや", "した"], onYomi: ["しん"], compounds: [{ jp: "親", reading: "おや", meaning: "parent" }, { jp: "両親", reading: "りょうしん", meaning: "parents" }, { jp: "親切", reading: "しんせつ", meaning: "kind, kindness" }, { jp: "親友", reading: "しんゆう", meaning: "close friend" }] },
            { kanji: "図", reading: "ず", romaji: "zu", meaning: "Map, Diagram", region: "Noun", kunYomi: ["はか"], onYomi: ["ず", "と"], compounds: [{ jp: "地図", reading: "ちず", meaning: "map" }, { jp: "図書館", reading: "としょかん", meaning: "library" }, { jp: "図形", reading: "ずけい", meaning: "figure, shape" }, { jp: "意図", reading: "いと", meaning: "intention" }] },
            { kanji: "数", reading: "かず", romaji: "kazu", meaning: "Number, Count", region: "Noun", kunYomi: ["かず", "かぞ"], onYomi: ["すう", "す"], compounds: [{ jp: "数", reading: "かず", meaning: "number" }, { jp: "数学", reading: "すうがく", meaning: "mathematics" }, { jp: "回数", reading: "かいすう", meaning: "number of times" }, { jp: "多数", reading: "たすう", meaning: "large number" }] },
            { kanji: "西", reading: "にし", romaji: "nishi", meaning: "West", region: "Noun", kunYomi: ["にし"], onYomi: ["せい", "さい"], compounds: [{ jp: "西", reading: "にし", meaning: "west" }, { jp: "西洋", reading: "せいよう", meaning: "the West" }, { jp: "関西", reading: "かんさい", meaning: "Kansai region" }, { jp: "北西", reading: "ほくせい", meaning: "northwest" }] },
            { kanji: "声", reading: "こえ", romaji: "koe", meaning: "Voice", region: "Noun", kunYomi: ["こえ"], onYomi: ["せい", "しょう"], compounds: [{ jp: "声", reading: "こえ", meaning: "voice" }, { jp: "声優", reading: "せいゆう", meaning: "voice actor" }, { jp: "歌声", reading: "うたごえ", meaning: "singing voice" }, { jp: "大声", reading: "おおごえ", meaning: "loud voice" }] },
            { kanji: "星", reading: "ほし", romaji: "hoshi", meaning: "Star", region: "Noun", kunYomi: ["ほし"], onYomi: ["せい", "しょう"], compounds: [{ jp: "星", reading: "ほし", meaning: "star" }, { jp: "星座", reading: "せいざ", meaning: "constellation" }, { jp: "星空", reading: "ほしぞら", meaning: "starry sky" }, { jp: "衛星", reading: "えいせい", meaning: "satellite" }] },
            { kanji: "晴", reading: "はれる", romaji: "hareru", meaning: "Clear (weather)", region: "Verb", kunYomi: ["は"], onYomi: ["せい"], compounds: [{ jp: "晴れる", reading: "はれる", meaning: "to clear up" }, { jp: "晴天", reading: "せいてん", meaning: "fine weather" }, { jp: "快晴", reading: "かいせい", meaning: "clear sky" }, { jp: "晴れ", reading: "はれ", meaning: "clear weather" }] },
            { kanji: "切", reading: "きる", romaji: "kiru", meaning: "Cut", region: "Verb", kunYomi: ["き", "き"], onYomi: ["せつ", "さい"], compounds: [{ jp: "切る", reading: "きる", meaning: "to cut" }, { jp: "大切", reading: "たいせつ", meaning: "important" }, { jp: "親切", reading: "しんせつ", meaning: "kind" }, { jp: "切手", reading: "きって", meaning: "postage stamp" }] },
            { kanji: "雪", reading: "ゆき", romaji: "yuki", meaning: "Snow", region: "Noun", kunYomi: ["ゆき"], onYomi: ["せつ"], compounds: [{ jp: "雪", reading: "ゆき", meaning: "snow" }, { jp: "雪国", reading: "ゆきぐに", meaning: "snowy country" }, { jp: "初雪", reading: "はつゆき", meaning: "first snow" }, { jp: "大雪", reading: "おおゆき", meaning: "heavy snow" }] },
            { kanji: "線", reading: "せん", romaji: "sen", meaning: "Line", region: "Noun", kunYomi: ["—"], onYomi: ["せん"], compounds: [{ jp: "線", reading: "せん", meaning: "line" }, { jp: "新幹線", reading: "しんかんせん", meaning: "bullet train" }, { jp: "路線", reading: "ろせん", meaning: "route, line" }, { jp: "直線", reading: "ちょくせん", meaning: "straight line" }] },
            { kanji: "船", reading: "ふね", romaji: "fune", meaning: "Ship, Boat", region: "Noun", kunYomi: ["ふね", "ふな"], onYomi: ["せん"], compounds: [{ jp: "船", reading: "ふね", meaning: "ship, boat" }, { jp: "汽船", reading: "きせん", meaning: "steamship" }, { jp: "船長", reading: "せんちょう", meaning: "captain" }, { jp: "客船", reading: "きゃくせん", meaning: "passenger ship" }] },
            { kanji: "前", reading: "まえ", romaji: "mae", meaning: "Before, Front", region: "Noun", kunYomi: ["まえ"], onYomi: ["ぜん"], compounds: [{ jp: "前", reading: "まえ", meaning: "before, front" }, { jp: "以前", reading: "いぜん", meaning: "before, formerly" }, { jp: "午前", reading: "ごぜん", meaning: "morning, AM" }, { jp: "前進", reading: "ぜんしん", meaning: "advance, progress" }] },
            { kanji: "組", reading: "くむ", romaji: "kumu", meaning: "Group, Assemble", region: "Verb", kunYomi: ["く"], onYomi: ["そ"], compounds: [{ jp: "組む", reading: "くむ", meaning: "to assemble, pair up" }, { jp: "組合", reading: "くみあい", meaning: "union, association" }, { jp: "番組", reading: "ばんぐみ", meaning: "TV program" }, { jp: "組織", reading: "そしき", meaning: "organization" }] },
            { kanji: "走", reading: "はしる", romaji: "hashiru", meaning: "Run", region: "Verb", kunYomi: ["はし"], onYomi: ["そう"], compounds: [{ jp: "走る", reading: "はしる", meaning: "to run" }, { jp: "競走", reading: "きょうそう", meaning: "race" }, { jp: "走行", reading: "そうこう", meaning: "running, traveling" }, { jp: "暴走", reading: "ぼうそう", meaning: "running wild" }] },
            { kanji: "多", reading: "おおい", romaji: "ooi", meaning: "Many, Much", region: "Adjective", kunYomi: ["おお"], onYomi: ["た"], compounds: [{ jp: "多い", reading: "おおい", meaning: "many, much" }, { jp: "多数", reading: "たすう", meaning: "large number" }, { jp: "多様", reading: "たよう", meaning: "diverse" }, { jp: "多少", reading: "たしょう", meaning: "more or less" }] },
            { kanji: "太", reading: "ふとい", romaji: "futoi", meaning: "Fat, Thick", region: "Adjective", kunYomi: ["ふと"], onYomi: ["た", "たい"], compounds: [{ jp: "太い", reading: "ふとい", meaning: "fat, thick" }, { jp: "太陽", reading: "たいよう", meaning: "sun" }, { jp: "太平洋", reading: "たいへいよう", meaning: "Pacific Ocean" }, { jp: "丸太", reading: "まるた", meaning: "log" }] },
            { kanji: "体", reading: "からだ", romaji: "karada", meaning: "Body", region: "Noun", kunYomi: ["からだ"], onYomi: ["たい", "てい"], compounds: [{ jp: "体", reading: "からだ", meaning: "body" }, { jp: "身体", reading: "しんたい", meaning: "body" }, { jp: "体育", reading: "たいいく", meaning: "physical education" }, { jp: "体験", reading: "たいけん", meaning: "experience" }] },
            { kanji: "台", reading: "だい", romaji: "dai", meaning: "Stand, Counter", region: "Noun", kunYomi: ["だい"], onYomi: ["だい", "たい"], compounds: [{ jp: "台所", reading: "だいどころ", meaning: "kitchen" }, { jp: "舞台", reading: "ぶたい", meaning: "stage" }, { jp: "台風", reading: "たいふう", meaning: "typhoon" }, { jp: "台本", reading: "だいほん", meaning: "script" }] },
            { kanji: "地", reading: "ち", romaji: "chi", meaning: "Ground, Earth", region: "Noun", kunYomi: ["つち"], onYomi: ["ち", "じ"], compounds: [{ jp: "地図", reading: "ちず", meaning: "map" }, { jp: "地球", reading: "ちきゅう", meaning: "earth" }, { jp: "地域", reading: "ちいき", meaning: "area, region" }, { jp: "土地", reading: "とち", meaning: "land" }] },
            { kanji: "池", reading: "いけ", romaji: "ike", meaning: "Pond", region: "Noun", kunYomi: ["いけ"], onYomi: ["ち"], compounds: [{ jp: "池", reading: "いけ", meaning: "pond" }, { jp: "池袋", reading: "いけぶくろ", meaning: "Ikebukuro" }, { jp: "電池", reading: "でんち", meaning: "battery" }, { jp: "用水池", reading: "ようすいち", meaning: "reservoir" }] },
            { kanji: "知", reading: "しる", romaji: "shiru", meaning: "Know", region: "Verb", kunYomi: ["し"], onYomi: ["ち"], compounds: [{ jp: "知る", reading: "しる", meaning: "to know" }, { jp: "知識", reading: "ちしき", meaning: "knowledge" }, { jp: "知能", reading: "ちのう", meaning: "intelligence" }, { jp: "承知", reading: "しょうち", meaning: "understanding, consent" }] },
            { kanji: "茶", reading: "ちゃ", romaji: "cha", meaning: "Tea, Brown", region: "Noun", kunYomi: ["ちゃ"], onYomi: ["さ"], compounds: [{ jp: "お茶", reading: "おちゃ", meaning: "tea" }, { jp: "茶色", reading: "ちゃいろ", meaning: "brown" }, { jp: "茶道", reading: "さどう", meaning: "tea ceremony" }, { jp: "緑茶", reading: "りょくちゃ", meaning: "green tea" }] },
            { kanji: "昼", reading: "ひる", romaji: "hiru", meaning: "Daytime, Noon", region: "Noun", kunYomi: ["ひる"], onYomi: ["ちゅう"], compounds: [{ jp: "昼", reading: "ひる", meaning: "daytime, noon" }, { jp: "昼食", reading: "ちゅうしょく", meaning: "lunch" }, { jp: "昼間", reading: "ひるま", meaning: "daytime" }, { jp: "昼寝", reading: "ひるね", meaning: "nap" }] },
            { kanji: "長", reading: "ながい", romaji: "nagai", meaning: "Long, Chief", region: "Adjective", kunYomi: ["なが"], onYomi: ["ちょう"], compounds: [{ jp: "長い", reading: "ながい", meaning: "long" }, { jp: "社長", reading: "しゃちょう", meaning: "company president" }, { jp: "成長", reading: "せいちょう", meaning: "growth" }, { jp: "長所", reading: "ちょうしょ", meaning: "strong point" }] },
            { kanji: "鳥", reading: "とり", romaji: "tori", meaning: "Bird", region: "Noun", kunYomi: ["とり"], onYomi: ["ちょう"], compounds: [{ jp: "鳥", reading: "とり", meaning: "bird" }, { jp: "小鳥", reading: "ことり", meaning: "small bird" }, { jp: "渡り鳥", reading: "わたりどり", meaning: "migratory bird" }, { jp: "鳥居", reading: "とりい", meaning: "torii gate" }] },
        ] },
    { id: "grade_2_kanji_level_3", label: "Level 3", sublabel: "Elementary Grade 2 · 53 cards", emoji: "🌿", group: "grade_2", mode: "formal", category_key: "formal_grade_grade_2", cards: [
            { kanji: "朝", reading: "あさ", romaji: "asa", meaning: "Morning", region: "Noun", kunYomi: ["あさ"], onYomi: ["ちょう"], compounds: [{ jp: "朝", reading: "あさ", meaning: "morning" }, { jp: "今朝", reading: "けさ", meaning: "this morning" }, { jp: "朝食", reading: "ちょうしょく", meaning: "breakfast" }, { jp: "毎朝", reading: "まいあさ", meaning: "every morning" }] },
            { kanji: "直", reading: "なおす", romaji: "naosu", meaning: "Fix, Direct", region: "Verb", kunYomi: ["なお", "ただ"], onYomi: ["ちょく", "じき"], compounds: [{ jp: "直す", reading: "なおす", meaning: "to fix, correct" }, { jp: "直接", reading: "ちょくせつ", meaning: "direct" }, { jp: "正直", reading: "しょうじき", meaning: "honest" }, { jp: "直線", reading: "ちょくせん", meaning: "straight line" }] },
            { kanji: "通", reading: "とおる", romaji: "tooru", meaning: "Pass Through", region: "Verb", kunYomi: ["とお", "かよ"], onYomi: ["つう", "つ"], compounds: [{ jp: "通る", reading: "とおる", meaning: "to pass through" }, { jp: "交通", reading: "こうつう", meaning: "traffic" }, { jp: "通学", reading: "つうがく", meaning: "commuting to school" }, { jp: "普通", reading: "ふつう", meaning: "normal, ordinary" }] },
            { kanji: "弟", reading: "おとうと", romaji: "otouto", meaning: "Younger brother", region: "Noun", kunYomi: ["おとうと"], onYomi: ["てい", "だい"], compounds: [{ jp: "弟", reading: "おとうと", meaning: "younger brother" }, { jp: "兄弟", reading: "きょうだい", meaning: "siblings" }, { jp: "弟子", reading: "でし", meaning: "apprentice, disciple" }, { jp: "義弟", reading: "ぎてい", meaning: "brother-in-law" }] },
            { kanji: "店", reading: "みせ", romaji: "mise", meaning: "Shop, Store", region: "Noun", kunYomi: ["みせ"], onYomi: ["てん"], compounds: [{ jp: "店", reading: "みせ", meaning: "shop, store" }, { jp: "店員", reading: "てんいん", meaning: "store clerk" }, { jp: "本店", reading: "ほんてん", meaning: "main store" }, { jp: "商店", reading: "しょうてん", meaning: "shop, store" }] },
            { kanji: "点", reading: "てん", romaji: "ten", meaning: "Point, Dot", region: "Noun", kunYomi: ["—"], onYomi: ["てん"], compounds: [{ jp: "点", reading: "てん", meaning: "point, dot" }, { jp: "問題点", reading: "もんだいてん", meaning: "problem point" }, { jp: "満点", reading: "まんてん", meaning: "perfect score" }, { jp: "得点", reading: "とくてん", meaning: "score, points" }] },
            { kanji: "電", reading: "でん", romaji: "den", meaning: "Electricity", region: "Noun", kunYomi: ["—"], onYomi: ["でん"], compounds: [{ jp: "電気", reading: "でんき", meaning: "electricity" }, { jp: "電車", reading: "でんしゃ", meaning: "train" }, { jp: "電話", reading: "でんわ", meaning: "telephone" }, { jp: "電池", reading: "でんち", meaning: "battery" }] },
            { kanji: "刀", reading: "かたな", romaji: "katana", meaning: "Sword, Katana", region: "Noun", kunYomi: ["かたな"], onYomi: ["とう"], compounds: [{ jp: "刀", reading: "かたな", meaning: "sword, katana" }, { jp: "日本刀", reading: "にほんとう", meaning: "Japanese sword" }, { jp: "刀剣", reading: "とうけん", meaning: "sword" }, { jp: "名刀", reading: "めいとう", meaning: "famous sword" }] },
            { kanji: "冬", reading: "ふゆ", romaji: "fuyu", meaning: "Winter", region: "Noun", kunYomi: ["ふゆ"], onYomi: ["とう"], compounds: [{ jp: "冬", reading: "ふゆ", meaning: "winter" }, { jp: "冬休み", reading: "ふゆやすみ", meaning: "winter vacation" }, { jp: "冬至", reading: "とうじ", meaning: "winter solstice" }, { jp: "真冬", reading: "まふゆ", meaning: "midwinter" }] },
            { kanji: "当", reading: "あたる", romaji: "ataru", meaning: "Hit, Correspond", region: "Verb", kunYomi: ["あた", "あ"], onYomi: ["とう"], compounds: [{ jp: "当たる", reading: "あたる", meaning: "to hit, be correct" }, { jp: "当然", reading: "とうぜん", meaning: "naturally, of course" }, { jp: "担当", reading: "たんとう", meaning: "in charge" }, { jp: "本当", reading: "ほんとう", meaning: "really, truly" }] },
            { kanji: "東", reading: "ひがし", romaji: "higashi", meaning: "East", region: "Noun", kunYomi: ["ひがし"], onYomi: ["とう"], compounds: [{ jp: "東", reading: "ひがし", meaning: "east" }, { jp: "東京", reading: "とうきょう", meaning: "Tokyo" }, { jp: "東洋", reading: "とうよう", meaning: "the East, Orient" }, { jp: "関東", reading: "かんとう", meaning: "Kanto region" }] },
            { kanji: "答", reading: "こたえる", romaji: "kotaeru", meaning: "Answer", region: "Verb", kunYomi: ["こた"], onYomi: ["とう"], compounds: [{ jp: "答える", reading: "こたえる", meaning: "to answer" }, { jp: "回答", reading: "かいとう", meaning: "answer, reply" }, { jp: "正答", reading: "せいとう", meaning: "correct answer" }, { jp: "答案", reading: "とうあん", meaning: "answer sheet" }] },
            { kanji: "頭", reading: "あたま", romaji: "atama", meaning: "Head", region: "Noun", kunYomi: ["あたま", "かしら"], onYomi: ["とう", "ず"], compounds: [{ jp: "頭", reading: "あたま", meaning: "head" }, { jp: "頭脳", reading: "ずのう", meaning: "brain, intellect" }, { jp: "先頭", reading: "せんとう", meaning: "head, front" }, { jp: "念頭", reading: "ねんとう", meaning: "in mind" }] },
            { kanji: "同", reading: "おなじ", romaji: "onaji", meaning: "Same", region: "Adjective", kunYomi: ["おな"], onYomi: ["どう"], compounds: [{ jp: "同じ", reading: "おなじ", meaning: "same" }, { jp: "同時", reading: "どうじ", meaning: "simultaneous" }, { jp: "同意", reading: "どうい", meaning: "agreement" }, { jp: "共同", reading: "きょうどう", meaning: "joint, cooperative" }] },
            { kanji: "道", reading: "みち", romaji: "michi", meaning: "Road, Way", region: "Noun", kunYomi: ["みち"], onYomi: ["どう", "とう"], compounds: [{ jp: "道", reading: "みち", meaning: "road, way" }, { jp: "道路", reading: "どうろ", meaning: "road" }, { jp: "武道", reading: "ぶどう", meaning: "martial arts" }, { jp: "北海道", reading: "ほっかいどう", meaning: "Hokkaido" }] },
            { kanji: "読", reading: "よむ", romaji: "yomu", meaning: "Read", region: "Verb", kunYomi: ["よ"], onYomi: ["どく", "とく", "とう"], compounds: [{ jp: "読む", reading: "よむ", meaning: "to read" }, { jp: "読書", reading: "どくしょ", meaning: "reading (books)" }, { jp: "読者", reading: "どくしゃ", meaning: "reader" }, { jp: "音読", reading: "おんどく", meaning: "reading aloud" }] },
            { kanji: "内", reading: "うち", romaji: "uchi", meaning: "Inside, Within", region: "Noun", kunYomi: ["うち"], onYomi: ["ない", "だい"], compounds: [{ jp: "内", reading: "うち", meaning: "inside, within" }, { jp: "国内", reading: "こくない", meaning: "domestic" }, { jp: "室内", reading: "しつない", meaning: "indoor" }, { jp: "以内", reading: "いない", meaning: "within" }] },
            { kanji: "南", reading: "みなみ", romaji: "minami", meaning: "South", region: "Noun", kunYomi: ["みなみ"], onYomi: ["なん", "な"], compounds: [{ jp: "南", reading: "みなみ", meaning: "south" }, { jp: "南極", reading: "なんきょく", meaning: "South Pole" }, { jp: "東南", reading: "とうなん", meaning: "southeast" }, { jp: "南国", reading: "なんごく", meaning: "southern country" }] },
            { kanji: "肉", reading: "にく", romaji: "niku", meaning: "Meat, Flesh", region: "Noun", kunYomi: ["—"], onYomi: ["にく"], compounds: [{ jp: "肉", reading: "にく", meaning: "meat, flesh" }, { jp: "牛肉", reading: "ぎゅうにく", meaning: "beef" }, { jp: "筋肉", reading: "きんにく", meaning: "muscle" }, { jp: "肉体", reading: "にくたい", meaning: "body, flesh" }] },
            { kanji: "馬", reading: "うま", romaji: "uma", meaning: "Horse", region: "Noun", kunYomi: ["うま", "ま"], onYomi: ["ば"], compounds: [{ jp: "馬", reading: "うま", meaning: "horse" }, { jp: "競馬", reading: "けいば", meaning: "horse racing" }, { jp: "馬力", reading: "ばりき", meaning: "horsepower" }, { jp: "木馬", reading: "もくば", meaning: "rocking horse" }] },
            { kanji: "売", reading: "うる", romaji: "uru", meaning: "Sell", region: "Verb", kunYomi: ["う"], onYomi: ["ばい"], compounds: [{ jp: "売る", reading: "うる", meaning: "to sell" }, { jp: "売店", reading: "ばいてん", meaning: "kiosk, stand" }, { jp: "販売", reading: "はんばい", meaning: "sale" }, { jp: "売上", reading: "うりあげ", meaning: "sales revenue" }] },
            { kanji: "買", reading: "かう", romaji: "kau", meaning: "Buy", region: "Verb", kunYomi: ["か"], onYomi: ["ばい"], compounds: [{ jp: "買う", reading: "かう", meaning: "to buy" }, { jp: "購買", reading: "こうばい", meaning: "purchase" }, { jp: "売買", reading: "ばいばい", meaning: "buying and selling" }, { jp: "買い物", reading: "かいもの", meaning: "shopping" }] },
            { kanji: "麦", reading: "むぎ", romaji: "mugi", meaning: "Wheat, Barley", region: "Noun", kunYomi: ["むぎ"], onYomi: ["ばく"], compounds: [{ jp: "麦", reading: "むぎ", meaning: "wheat, barley" }, { jp: "小麦", reading: "こむぎ", meaning: "wheat" }, { jp: "麦茶", reading: "むぎちゃ", meaning: "barley tea" }, { jp: "麦畑", reading: "むぎばたけ", meaning: "wheat field" }] },
            { kanji: "半", reading: "はん", romaji: "han", meaning: "Half", region: "Noun", kunYomi: ["なか"], onYomi: ["はん"], compounds: [{ jp: "半分", reading: "はんぶん", meaning: "half" }, { jp: "半年", reading: "はんとし", meaning: "half a year" }, { jp: "前半", reading: "ぜんはん", meaning: "first half" }, { jp: "半島", reading: "はんとう", meaning: "peninsula" }] },
            { kanji: "番", reading: "ばん", romaji: "ban", meaning: "Number, Turn", region: "Noun", kunYomi: ["—"], onYomi: ["ばん"], compounds: [{ jp: "番号", reading: "ばんごう", meaning: "number" }, { jp: "一番", reading: "いちばん", meaning: "number one, best" }, { jp: "当番", reading: "とうばん", meaning: "one's turn, duty" }, { jp: "番組", reading: "ばんぐみ", meaning: "TV program" }] },
            { kanji: "父", reading: "ちち", romaji: "chichi", meaning: "Father", region: "Noun", kunYomi: ["ちち"], onYomi: ["ふ"], compounds: [{ jp: "父", reading: "ちち", meaning: "father" }, { jp: "父親", reading: "ちちおや", meaning: "father" }, { jp: "祖父", reading: "そふ", meaning: "grandfather" }, { jp: "お父さん", reading: "おとうさん", meaning: "father (polite)" }] },
            { kanji: "風", reading: "かぜ", romaji: "kaze", meaning: "Wind", region: "Noun", kunYomi: ["かぜ", "かざ"], onYomi: ["ふう", "ふ"], compounds: [{ jp: "風", reading: "かぜ", meaning: "wind" }, { jp: "台風", reading: "たいふう", meaning: "typhoon" }, { jp: "風景", reading: "ふうけい", meaning: "landscape, scenery" }, { jp: "風邪", reading: "かぜ", meaning: "cold (illness)" }] },
            { kanji: "分", reading: "わかる", romaji: "wakaru", meaning: "Understand, Minute", region: "Verb", kunYomi: ["わ", "わか"], onYomi: ["ぶん", "ふん", "ぶ"], compounds: [{ jp: "分かる", reading: "わかる", meaning: "to understand" }, { jp: "十分", reading: "じゅうぶん", meaning: "enough, sufficient" }, { jp: "気分", reading: "きぶん", meaning: "feeling, mood" }, { jp: "部分", reading: "ぶぶん", meaning: "part, portion" }] },
            { kanji: "聞", reading: "きく", romaji: "kiku", meaning: "Hear, Listen", region: "Verb", kunYomi: ["き"], onYomi: ["ぶん", "もん"], compounds: [{ jp: "聞く", reading: "きく", meaning: "to hear, listen" }, { jp: "新聞", reading: "しんぶん", meaning: "newspaper" }, { jp: "見聞", reading: "けんぶん", meaning: "experience, knowledge" }, { jp: "聴聞", reading: "ちょうもん", meaning: "hearing, interview" }] },
            { kanji: "米", reading: "こめ", romaji: "kome", meaning: "Rice", region: "Noun", kunYomi: ["こめ", "よね"], onYomi: ["まい", "べい"], compounds: [{ jp: "米", reading: "こめ", meaning: "rice" }, { jp: "米国", reading: "べいこく", meaning: "USA" }, { jp: "玄米", reading: "げんまい", meaning: "brown rice" }, { jp: "米粒", reading: "こめつぶ", meaning: "rice grain" }] },
            { kanji: "歩", reading: "あるく", romaji: "aruku", meaning: "Walk", region: "Verb", kunYomi: ["ある", "あゆ"], onYomi: ["ほ", "ぶ"], compounds: [{ jp: "歩く", reading: "あるく", meaning: "to walk" }, { jp: "散歩", reading: "さんぽ", meaning: "walk, stroll" }, { jp: "歩道", reading: "ほどう", meaning: "sidewalk, walkway" }, { jp: "進歩", reading: "しんぽ", meaning: "progress" }] },
            { kanji: "母", reading: "はは", romaji: "haha", meaning: "Mother", region: "Noun", kunYomi: ["はは"], onYomi: ["ぼ"], compounds: [{ jp: "母", reading: "はは", meaning: "mother" }, { jp: "母親", reading: "ははおや", meaning: "mother" }, { jp: "祖母", reading: "そぼ", meaning: "grandmother" }, { jp: "お母さん", reading: "おかあさん", meaning: "mother (polite)" }] },
            { kanji: "方", reading: "かた", romaji: "kata", meaning: "Direction, Way", region: "Noun", kunYomi: ["かた"], onYomi: ["ほう"], compounds: [{ jp: "方", reading: "かた", meaning: "direction, way" }, { jp: "方法", reading: "ほうほう", meaning: "method, way" }, { jp: "地方", reading: "ちほう", meaning: "region, area" }, { jp: "夕方", reading: "ゆうがた", meaning: "evening" }] },
            { kanji: "北", reading: "きた", romaji: "kita", meaning: "North", region: "Noun", kunYomi: ["きた"], onYomi: ["ほく"], compounds: [{ jp: "北", reading: "きた", meaning: "north" }, { jp: "北海道", reading: "ほっかいどう", meaning: "Hokkaido" }, { jp: "北極", reading: "ほっきょく", meaning: "North Pole" }, { jp: "北東", reading: "ほくとう", meaning: "northeast" }] },
            { kanji: "妹", reading: "いもうと", romaji: "imouto", meaning: "Younger sister", region: "Noun", kunYomi: ["いもうと"], onYomi: ["まい"], compounds: [{ jp: "妹", reading: "いもうと", meaning: "younger sister" }, { jp: "姉妹", reading: "しまい", meaning: "sisters" }, { jp: "義妹", reading: "ぎまい", meaning: "sister-in-law" }, { jp: "お妹さん", reading: "おいもうとさん", meaning: "younger sister (polite)" }] },
            { kanji: "毎", reading: "まい", romaji: "mai", meaning: "Every, Each", region: "Adverb", kunYomi: ["—"], onYomi: ["まい"], compounds: [{ jp: "毎日", reading: "まいにち", meaning: "every day" }, { jp: "毎週", reading: "まいしゅう", meaning: "every week" }, { jp: "毎年", reading: "まいねん", meaning: "every year" }, { jp: "毎朝", reading: "まいあさ", meaning: "every morning" }] },
            { kanji: "万", reading: "まん", romaji: "man", meaning: "Ten thousand", region: "Noun", kunYomi: ["—"], onYomi: ["まん", "ばん"], compounds: [{ jp: "一万", reading: "いちまん", meaning: "ten thousand" }, { jp: "万年", reading: "まんねん", meaning: "ten thousand years" }, { jp: "万国", reading: "ばんこく", meaning: "all nations" }, { jp: "万能", reading: "ばんのう", meaning: "almighty" }] },
            { kanji: "明", reading: "あかるい", romaji: "akarui", meaning: "Bright, Clear", region: "Adjective", kunYomi: ["あか", "あ"], onYomi: ["めい", "みょう"], compounds: [{ jp: "明るい", reading: "あかるい", meaning: "bright" }, { jp: "説明", reading: "せつめい", meaning: "explanation" }, { jp: "発明", reading: "はつめい", meaning: "invention" }, { jp: "明日", reading: "あした", meaning: "tomorrow" }] },
            { kanji: "鳴", reading: "なく", romaji: "naku", meaning: "Cry, Sound", region: "Verb", kunYomi: ["な"], onYomi: ["めい"], compounds: [{ jp: "鳴く", reading: "なく", meaning: "to cry, chirp" }, { jp: "鳴る", reading: "なる", meaning: "to ring, sound" }, { jp: "雷鳴", reading: "らいめい", meaning: "thunder" }, { jp: "共鳴", reading: "きょうめい", meaning: "resonance, sympathy" }] },
            { kanji: "毛", reading: "け", romaji: "ke", meaning: "Hair, Fur", region: "Noun", kunYomi: ["け"], onYomi: ["もう"], compounds: [{ jp: "毛", reading: "け", meaning: "hair, fur" }, { jp: "毛糸", reading: "けいと", meaning: "yarn" }, { jp: "羽毛", reading: "うもう", meaning: "down feather" }, { jp: "毛布", reading: "もうふ", meaning: "blanket" }] },
            { kanji: "門", reading: "もん", romaji: "mon", meaning: "Gate", region: "Noun", kunYomi: ["かど"], onYomi: ["もん"], compounds: [{ jp: "門", reading: "もん", meaning: "gate" }, { jp: "専門", reading: "せんもん", meaning: "specialty, expertise" }, { jp: "校門", reading: "こうもん", meaning: "school gate" }, { jp: "門番", reading: "もんばん", meaning: "gatekeeper" }] },
            { kanji: "夜", reading: "よる", romaji: "yoru", meaning: "Night", region: "Noun", kunYomi: ["よ", "よる"], onYomi: ["や"], compounds: [{ jp: "夜", reading: "よる", meaning: "night" }, { jp: "今夜", reading: "こんや", meaning: "tonight" }, { jp: "夜明け", reading: "よあけ", meaning: "dawn" }, { jp: "深夜", reading: "しんや", meaning: "late night" }] },
            { kanji: "野", reading: "の", romaji: "no", meaning: "Field, Wild", region: "Noun", kunYomi: ["の"], onYomi: ["や"], compounds: [{ jp: "野原", reading: "のはら", meaning: "field, plain" }, { jp: "野球", reading: "やきゅう", meaning: "baseball" }, { jp: "野菜", reading: "やさい", meaning: "vegetable" }, { jp: "分野", reading: "ぶんや", meaning: "field, area" }] },
            { kanji: "友", reading: "とも", romaji: "tomo", meaning: "Friend", region: "Noun", kunYomi: ["とも"], onYomi: ["ゆう"], compounds: [{ jp: "友達", reading: "ともだち", meaning: "friend" }, { jp: "友人", reading: "ゆうじん", meaning: "friend" }, { jp: "親友", reading: "しんゆう", meaning: "close friend" }, { jp: "友好", reading: "ゆうこう", meaning: "friendship" }] },
            { kanji: "用", reading: "もちいる", romaji: "mochiiru", meaning: "Use, Business", region: "Verb", kunYomi: ["もち"], onYomi: ["よう"], compounds: [{ jp: "用いる", reading: "もちいる", meaning: "to use" }, { jp: "使用", reading: "しよう", meaning: "use" }, { jp: "用意", reading: "ようい", meaning: "preparation" }, { jp: "利用", reading: "りよう", meaning: "use, utilization" }] },
            { kanji: "曜", reading: "よう", romaji: "you", meaning: "Day of week", region: "Noun", kunYomi: ["—"], onYomi: ["よう"], compounds: [{ jp: "曜日", reading: "ようび", meaning: "day of the week" }, { jp: "日曜日", reading: "にちようび", meaning: "Sunday" }, { jp: "月曜日", reading: "げつようび", meaning: "Monday" }, { jp: "七曜", reading: "しちよう", meaning: "seven days of the week" }] },
            { kanji: "来", reading: "くる", romaji: "kuru", meaning: "Come", region: "Verb", kunYomi: ["く", "き", "こ"], onYomi: ["らい"], compounds: [{ jp: "来る", reading: "くる", meaning: "to come" }, { jp: "来年", reading: "らいねん", meaning: "next year" }, { jp: "来週", reading: "らいしゅう", meaning: "next week" }, { jp: "将来", reading: "しょうらい", meaning: "future" }] },
            { kanji: "里", reading: "さと", romaji: "sato", meaning: "Village, Home", region: "Noun", kunYomi: ["さと"], onYomi: ["り"], compounds: [{ jp: "里", reading: "さと", meaning: "village, home" }, { jp: "故里", reading: "こきょう", meaning: "hometown" }, { jp: "里帰り", reading: "さとがえり", meaning: "homecoming" }, { jp: "千里", reading: "せんり", meaning: "thousand ri" }] },
            { kanji: "理", reading: "ことわり", romaji: "kotowari", meaning: "Reason, Logic", region: "Noun", kunYomi: ["ことわり"], onYomi: ["り"], compounds: [{ jp: "理由", reading: "りゆう", meaning: "reason" }, { jp: "料理", reading: "りょうり", meaning: "cooking, cuisine" }, { jp: "理解", reading: "りかい", meaning: "understanding" }, { jp: "管理", reading: "かんり", meaning: "management" }] },
            { kanji: "話", reading: "はなす", romaji: "hanasu", meaning: "Speak, Talk", region: "Verb", kunYomi: ["はな"], onYomi: ["わ"], compounds: [{ jp: "話す", reading: "はなす", meaning: "to speak, talk" }, { jp: "電話", reading: "でんわ", meaning: "telephone" }, { jp: "会話", reading: "かいわ", meaning: "conversation" }, { jp: "童話", reading: "どうわ", meaning: "fairy tale" }] },
        ] },
    { id: "grade_3_kanji", label: "Level 1", sublabel: "Elementary Grade 3 · 50 cards", emoji: "📚", group: "grade_3", mode: "formal", category_key: "formal_grade_grade_3", cards: [
            { kanji: "悪", reading: "わるい", romaji: "warui", meaning: "Bad, evil", region: "Adjective", kunYomi: ["わる"], onYomi: ["あく", "お"], compounds: [{ jp: "悪い", reading: "わるい", meaning: "bad" }, { jp: "悪人", reading: "あくにん", meaning: "villain" }, { jp: "最悪", reading: "さいあく", meaning: "worst" }, { jp: "悪化", reading: "あっか", meaning: "deterioration" }] },
            { kanji: "安", reading: "やすい", romaji: "yasui", meaning: "Cheap, peaceful", region: "Adjective", kunYomi: ["やす"], onYomi: ["あん"], compounds: [{ jp: "安い", reading: "やすい", meaning: "cheap" }, { jp: "安全", reading: "あんぜん", meaning: "safety" }, { jp: "不安", reading: "ふあん", meaning: "anxiety" }, { jp: "安心", reading: "あんしん", meaning: "relief" }] },
            { kanji: "暗", reading: "くらい", romaji: "kurai", meaning: "Dark", region: "Adjective", kunYomi: ["くら"], onYomi: ["あん"], compounds: [{ jp: "暗い", reading: "くらい", meaning: "dark" }, { jp: "暗記", reading: "あんき", meaning: "memorization" }, { jp: "明暗", reading: "めいあん", meaning: "light and dark" }] },
            { kanji: "医", reading: "いしゃ", romaji: "isha", meaning: "Doctor, medicine", region: "Noun", kunYomi: ["—"], onYomi: ["い"], compounds: [{ jp: "医者", reading: "いしゃ", meaning: "doctor" }, { jp: "医学", reading: "いがく", meaning: "medical science" }, { jp: "医院", reading: "いいん", meaning: "clinic" }, { jp: "獣医", reading: "じゅうい", meaning: "veterinarian" }] },
            { kanji: "委", reading: "ゆだねる", romaji: "yudaneru", meaning: "Entrust, committee", region: "Verb", kunYomi: ["ゆだ"], onYomi: ["い"], compounds: [{ jp: "委員", reading: "いいん", meaning: "committee member" }, { jp: "委員会", reading: "いいんかい", meaning: "committee" }, { jp: "委託", reading: "いたく", meaning: "consignment" }] },
            { kanji: "意", reading: "いみ", romaji: "imi", meaning: "Meaning, intention", region: "Noun", kunYomi: ["—"], onYomi: ["い"], compounds: [{ jp: "意味", reading: "いみ", meaning: "meaning" }, { jp: "意見", reading: "いけん", meaning: "opinion" }, { jp: "注意", reading: "ちゅうい", meaning: "attention" }, { jp: "意識", reading: "いしき", meaning: "consciousness" }] },
            { kanji: "育", reading: "そだてる", romaji: "sodateru", meaning: "Raise, grow", region: "Verb", kunYomi: ["そだ"], onYomi: ["いく"], compounds: [{ jp: "育てる", reading: "そだてる", meaning: "to raise" }, { jp: "教育", reading: "きょういく", meaning: "education" }, { jp: "体育", reading: "たいいく", meaning: "physical education" }, { jp: "育児", reading: "いくじ", meaning: "childcare" }] },
            { kanji: "員", reading: "いん", romaji: "in", meaning: "Member", region: "Noun", kunYomi: ["—"], onYomi: ["いん"], compounds: [{ jp: "会員", reading: "かいいん", meaning: "member" }, { jp: "店員", reading: "てんいん", meaning: "clerk" }, { jp: "社員", reading: "しゃいん", meaning: "company employee" }, { jp: "委員", reading: "いいん", meaning: "committee member" }] },
            { kanji: "院", reading: "いん", romaji: "in", meaning: "Institution", region: "Noun", kunYomi: ["—"], onYomi: ["いん"], compounds: [{ jp: "病院", reading: "びょういん", meaning: "hospital" }, { jp: "医院", reading: "いいん", meaning: "clinic" }, { jp: "大学院", reading: "だいがくいん", meaning: "graduate school" }, { jp: "美容院", reading: "びよういん", meaning: "beauty salon" }] },
            { kanji: "飲", reading: "のむ", romaji: "nomu", meaning: "Drink", region: "Verb", kunYomi: ["の"], onYomi: ["いん"], compounds: [{ jp: "飲む", reading: "のむ", meaning: "to drink" }, { jp: "飲料", reading: "いんりょう", meaning: "beverage" }, { jp: "飲食", reading: "いんしょく", meaning: "food and drink" }, { jp: "飲酒", reading: "いんしゅ", meaning: "drinking alcohol" }] },
            { kanji: "運", reading: "はこぶ", romaji: "hakobu", meaning: "Carry, luck", region: "Verb", kunYomi: ["はこ"], onYomi: ["うん"], compounds: [{ jp: "運ぶ", reading: "はこぶ", meaning: "to carry" }, { jp: "運動", reading: "うんどう", meaning: "exercise" }, { jp: "運転", reading: "うんてん", meaning: "driving" }, { jp: "幸運", reading: "こううん", meaning: "good luck" }] },
            { kanji: "泳", reading: "およぐ", romaji: "oyogu", meaning: "Swim", region: "Verb", kunYomi: ["およ"], onYomi: ["えい"], compounds: [{ jp: "泳ぐ", reading: "およぐ", meaning: "to swim" }, { jp: "水泳", reading: "すいえい", meaning: "swimming" }, { jp: "競泳", reading: "きょうえい", meaning: "swimming race" }] },
            { kanji: "駅", reading: "えき", romaji: "eki", meaning: "Station", region: "Noun", kunYomi: ["—"], onYomi: ["えき"], compounds: [{ jp: "駅", reading: "えき", meaning: "station" }, { jp: "駅前", reading: "えきまえ", meaning: "in front of station" }, { jp: "駅員", reading: "えきいん", meaning: "station employee" }, { jp: "各駅", reading: "かくえき", meaning: "every station" }] },
            { kanji: "央", reading: "まんなか", romaji: "mannaka", meaning: "Center", region: "Noun", kunYomi: ["—"], onYomi: ["おう"], compounds: [{ jp: "中央", reading: "ちゅうおう", meaning: "center" }, { jp: "中央線", reading: "ちゅうおうせん", meaning: "Chuo Line" }, { jp: "震央", reading: "しんおう", meaning: "epicenter" }] },
            { kanji: "横", reading: "よこ", romaji: "yoko", meaning: "Side, horizontal", region: "Noun", kunYomi: ["よこ"], onYomi: ["おう"], compounds: [{ jp: "横", reading: "よこ", meaning: "side" }, { jp: "横断", reading: "おうだん", meaning: "crossing" }, { jp: "横顔", reading: "よこがお", meaning: "profile" }, { jp: "横浜", reading: "よこはま", meaning: "Yokohama" }] },
            { kanji: "屋", reading: "や", romaji: "ya", meaning: "Shop, roof", region: "Noun", kunYomi: ["や"], onYomi: ["おく"], compounds: [{ jp: "屋根", reading: "やね", meaning: "roof" }, { jp: "本屋", reading: "ほんや", meaning: "bookstore" }, { jp: "屋上", reading: "おくじょう", meaning: "rooftop" }, { jp: "部屋", reading: "へや", meaning: "room" }] },
            { kanji: "温", reading: "あたたかい", romaji: "atatakai", meaning: "Warm", region: "Adjective", kunYomi: ["あたた"], onYomi: ["おん"], compounds: [{ jp: "温かい", reading: "あたたかい", meaning: "warm" }, { jp: "気温", reading: "きおん", meaning: "temperature" }, { jp: "温泉", reading: "おんせん", meaning: "hot spring" }, { jp: "体温", reading: "たいおん", meaning: "body temperature" }] },
            { kanji: "化", reading: "ばける", romaji: "bakeru", meaning: "Change, transform", region: "Verb", kunYomi: ["ば"], onYomi: ["か", "け"], compounds: [{ jp: "化ける", reading: "ばける", meaning: "to transform" }, { jp: "文化", reading: "ぶんか", meaning: "culture" }, { jp: "変化", reading: "へんか", meaning: "change" }, { jp: "化学", reading: "かがく", meaning: "chemistry" }] },
            { kanji: "荷", reading: "に", romaji: "ni", meaning: "Luggage, cargo", region: "Noun", kunYomi: ["に"], onYomi: ["か"], compounds: [{ jp: "荷物", reading: "にもつ", meaning: "luggage" }, { jp: "荷造り", reading: "にづくり", meaning: "packing" }, { jp: "集荷", reading: "しゅうか", meaning: "collection of cargo" }] },
            { kanji: "界", reading: "さかい", romaji: "sakai", meaning: "World, boundary", region: "Noun", kunYomi: ["—"], onYomi: ["かい"], compounds: [{ jp: "世界", reading: "せかい", meaning: "world" }, { jp: "境界", reading: "きょうかい", meaning: "boundary" }, { jp: "業界", reading: "ぎょうかい", meaning: "industry" }, { jp: "自然界", reading: "しぜんかい", meaning: "natural world" }] },
            { kanji: "開", reading: "ひらく", romaji: "hiraku", meaning: "Open", region: "Verb", kunYomi: ["ひら", "あ"], onYomi: ["かい"], compounds: [{ jp: "開く", reading: "ひらく", meaning: "to open" }, { jp: "開ける", reading: "あける", meaning: "to open" }, { jp: "開店", reading: "かいてん", meaning: "opening a store" }, { jp: "公開", reading: "こうかい", meaning: "public opening" }] },
            { kanji: "階", reading: "かい", romaji: "kai", meaning: "Floor, story", region: "Noun", kunYomi: ["—"], onYomi: ["かい"], compounds: [{ jp: "階段", reading: "かいだん", meaning: "stairs" }, { jp: "二階", reading: "にかい", meaning: "second floor" }, { jp: "地階", reading: "ちかい", meaning: "basement" }, { jp: "階級", reading: "かいきゅう", meaning: "class, rank" }] },
            { kanji: "寒", reading: "さむい", romaji: "samui", meaning: "Cold", region: "Adjective", kunYomi: ["さむ"], onYomi: ["かん"], compounds: [{ jp: "寒い", reading: "さむい", meaning: "cold" }, { jp: "寒気", reading: "さむけ", meaning: "chill" }, { jp: "寒波", reading: "かんぱ", meaning: "cold wave" }, { jp: "極寒", reading: "ごっかん", meaning: "severe cold" }] },
            { kanji: "感", reading: "かんじる", romaji: "kanjiru", meaning: "Feel, sense", region: "Verb", kunYomi: ["—"], onYomi: ["かん"], compounds: [{ jp: "感じる", reading: "かんじる", meaning: "to feel" }, { jp: "感動", reading: "かんどう", meaning: "emotion" }, { jp: "感謝", reading: "かんしゃ", meaning: "gratitude" }, { jp: "感覚", reading: "かんかく", meaning: "sense" }] },
            { kanji: "漢", reading: "かん", romaji: "kan", meaning: "China, Chinese character", region: "Noun", kunYomi: ["—"], onYomi: ["かん"], compounds: [{ jp: "漢字", reading: "かんじ", meaning: "kanji" }, { jp: "漢文", reading: "かんぶん", meaning: "Chinese classics" }, { jp: "悪漢", reading: "あっかん", meaning: "villain" }] },
            { kanji: "館", reading: "やかた", romaji: "yakata", meaning: "Building, hall", region: "Noun", kunYomi: ["やかた"], onYomi: ["かん"], compounds: [{ jp: "図書館", reading: "としょかん", meaning: "library" }, { jp: "映画館", reading: "えいがかん", meaning: "cinema" }, { jp: "博物館", reading: "はくぶつかん", meaning: "museum" }, { jp: "旅館", reading: "りょかん", meaning: "inn" }] },
            { kanji: "岸", reading: "きし", romaji: "kishi", meaning: "Shore, bank", region: "Noun", kunYomi: ["きし"], onYomi: ["がん"], compounds: [{ jp: "岸", reading: "きし", meaning: "shore" }, { jp: "海岸", reading: "かいがん", meaning: "coast" }, { jp: "対岸", reading: "たいがん", meaning: "opposite shore" }] },
            { kanji: "起", reading: "おきる", romaji: "okiru", meaning: "Wake up, occur", region: "Verb", kunYomi: ["お"], onYomi: ["き"], compounds: [{ jp: "起きる", reading: "おきる", meaning: "to wake up" }, { jp: "起こす", reading: "おこす", meaning: "to raise" }, { jp: "発起", reading: "ほっき", meaning: "origination" }, { jp: "起動", reading: "きどう", meaning: "startup" }] },
            { kanji: "期", reading: "き", romaji: "ki", meaning: "Period, term", region: "Noun", kunYomi: ["—"], onYomi: ["き", "ご"], compounds: [{ jp: "期間", reading: "きかん", meaning: "period" }, { jp: "時期", reading: "じき", meaning: "time" }, { jp: "期待", reading: "きたい", meaning: "expectation" }, { jp: "学期", reading: "がっき", meaning: "school term" }] },
            { kanji: "客", reading: "きゃく", romaji: "kyaku", meaning: "Guest, customer", region: "Noun", kunYomi: ["—"], onYomi: ["きゃく", "かく"], compounds: [{ jp: "客", reading: "きゃく", meaning: "customer" }, { jp: "乗客", reading: "じょうきゃく", meaning: "passenger" }, { jp: "観光客", reading: "かんこうきゃく", meaning: "tourist" }, { jp: "来客", reading: "らいきゃく", meaning: "visitor" }] },
            { kanji: "究", reading: "きわめる", romaji: "kiwameru", meaning: "Research, investigate", region: "Verb", kunYomi: ["きわ"], onYomi: ["きゅう"], compounds: [{ jp: "研究", reading: "けんきゅう", meaning: "research" }, { jp: "究明", reading: "きゅうめい", meaning: "investigation" }, { jp: "探究", reading: "たんきゅう", meaning: "inquiry" }] },
            { kanji: "急", reading: "いそぐ", romaji: "isogu", meaning: "Hurry, urgent", region: "Verb", kunYomi: ["いそ"], onYomi: ["きゅう"], compounds: [{ jp: "急ぐ", reading: "いそぐ", meaning: "to hurry" }, { jp: "急行", reading: "きゅうこう", meaning: "express train" }, { jp: "緊急", reading: "きんきゅう", meaning: "emergency" }, { jp: "救急車", reading: "きゅうきゅうしゃ", meaning: "ambulance" }] },
            { kanji: "級", reading: "きゅう", romaji: "kyuu", meaning: "Class, grade", region: "Noun", kunYomi: ["—"], onYomi: ["きゅう"], compounds: [{ jp: "級", reading: "きゅう", meaning: "grade" }, { jp: "学級", reading: "がっきゅう", meaning: "class" }, { jp: "階級", reading: "かいきゅう", meaning: "rank" }, { jp: "高級", reading: "こうきゅう", meaning: "high class" }] },
            { kanji: "宮", reading: "みや", romaji: "miya", meaning: "Palace, shrine", region: "Noun", kunYomi: ["みや"], onYomi: ["きゅう", "ぐう"], compounds: [{ jp: "宮殿", reading: "きゅうでん", meaning: "palace" }, { jp: "神宮", reading: "じんぐう", meaning: "shrine" }, { jp: "皇宮", reading: "こうぐう", meaning: "imperial palace" }] },
            { kanji: "球", reading: "たま", romaji: "tama", meaning: "Ball, sphere", region: "Noun", kunYomi: ["たま"], onYomi: ["きゅう"], compounds: [{ jp: "球", reading: "たま", meaning: "ball" }, { jp: "野球", reading: "やきゅう", meaning: "baseball" }, { jp: "地球", reading: "ちきゅう", meaning: "Earth" }, { jp: "電球", reading: "でんきゅう", meaning: "light bulb" }] },
            { kanji: "去", reading: "さる", romaji: "saru", meaning: "Leave, past", region: "Verb", kunYomi: ["さ"], onYomi: ["きょ", "こ"], compounds: [{ jp: "去る", reading: "さる", meaning: "to leave" }, { jp: "過去", reading: "かこ", meaning: "past" }, { jp: "去年", reading: "きょねん", meaning: "last year" }] },
            { kanji: "橋", reading: "はし", romaji: "hashi", meaning: "Bridge", region: "Noun", kunYomi: ["はし"], onYomi: ["きょう"], compounds: [{ jp: "橋", reading: "はし", meaning: "bridge" }, { jp: "鉄橋", reading: "てっきょう", meaning: "railway bridge" }, { jp: "歩道橋", reading: "ほどうきょう", meaning: "pedestrian bridge" }] },
            { kanji: "業", reading: "わざ", romaji: "waza", meaning: "Business, study", region: "Noun", kunYomi: ["わざ"], onYomi: ["ぎょう", "ごう"], compounds: [{ jp: "授業", reading: "じゅぎょう", meaning: "lesson" }, { jp: "卒業", reading: "そつぎょう", meaning: "graduation" }, { jp: "産業", reading: "さんぎょう", meaning: "industry" }, { jp: "仕業", reading: "しわざ", meaning: "deed" }] },
            { kanji: "曲", reading: "まがる", romaji: "magaru", meaning: "Bend, curve", region: "Verb", kunYomi: ["ま"], onYomi: ["きょく"], compounds: [{ jp: "曲がる", reading: "まがる", meaning: "to bend" }, { jp: "曲げる", reading: "まげる", meaning: "to bend (transitive)" }, { jp: "作曲", reading: "さっきょく", meaning: "composition" }, { jp: "名曲", reading: "めいきょく", meaning: "famous song" }] },
            { kanji: "局", reading: "きょく", romaji: "kyoku", meaning: "Bureau, office", region: "Noun", kunYomi: ["—"], onYomi: ["きょく"], compounds: [{ jp: "郵便局", reading: "ゆうびんきょく", meaning: "post office" }, { jp: "放送局", reading: "ほうそうきょく", meaning: "broadcasting station" }, { jp: "結局", reading: "けっきょく", meaning: "after all" }, { jp: "局", reading: "きょく", meaning: "bureau" }] },
            { kanji: "銀", reading: "ぎん", romaji: "gin", meaning: "Silver", region: "Noun", kunYomi: ["—"], onYomi: ["ぎん"], compounds: [{ jp: "銀", reading: "ぎん", meaning: "silver" }, { jp: "銀行", reading: "ぎんこう", meaning: "bank" }, { jp: "銀色", reading: "ぎんいろ", meaning: "silver color" }, { jp: "水銀", reading: "すいぎん", meaning: "mercury" }] },
            { kanji: "区", reading: "く", romaji: "ku", meaning: "Ward, district", region: "Noun", kunYomi: ["—"], onYomi: ["く"], compounds: [{ jp: "区", reading: "く", meaning: "ward" }, { jp: "地区", reading: "ちく", meaning: "district" }, { jp: "区別", reading: "くべつ", meaning: "distinction" }, { jp: "区間", reading: "くかん", meaning: "section" }] },
            { kanji: "苦", reading: "くるしい", romaji: "kurushii", meaning: "Suffer, bitter", region: "Adjective", kunYomi: ["くる", "にが"], onYomi: ["く"], compounds: [{ jp: "苦しい", reading: "くるしい", meaning: "painful" }, { jp: "苦い", reading: "にがい", meaning: "bitter" }, { jp: "苦労", reading: "くろう", meaning: "hardship" }, { jp: "苦手", reading: "にがて", meaning: "weak point" }] },
            { kanji: "具", reading: "ぐ", romaji: "gu", meaning: "Tool, ingredient", region: "Noun", kunYomi: ["—"], onYomi: ["ぐ"], compounds: [{ jp: "道具", reading: "どうぐ", meaning: "tool" }, { jp: "家具", reading: "かぐ", meaning: "furniture" }, { jp: "具体的", reading: "ぐたいてき", meaning: "concrete" }, { jp: "玩具", reading: "がんぐ", meaning: "toy" }] },
            { kanji: "君", reading: "きみ", romaji: "kimi", meaning: "You (informal)", region: "Noun", kunYomi: ["きみ"], onYomi: ["くん"], compounds: [{ jp: "君", reading: "きみ", meaning: "you" }, { jp: "君主", reading: "くんしゅ", meaning: "monarch" }, { jp: "諸君", reading: "しょくん", meaning: "gentlemen" }] },
            { kanji: "係", reading: "かかり", romaji: "kakari", meaning: "Person in charge", region: "Noun", kunYomi: ["かか"], onYomi: ["けい"], compounds: [{ jp: "係", reading: "かかり", meaning: "person in charge" }, { jp: "関係", reading: "かんけい", meaning: "relationship" }, { jp: "係員", reading: "かかりいん", meaning: "attendant" }] },
            { kanji: "軽", reading: "かるい", romaji: "karui", meaning: "Light (weight)", region: "Adjective", kunYomi: ["かる"], onYomi: ["けい"], compounds: [{ jp: "軽い", reading: "かるい", meaning: "light" }, { jp: "軽視", reading: "けいし", meaning: "neglect" }, { jp: "手軽", reading: "てがる", meaning: "simple" }, { jp: "気軽", reading: "きがる", meaning: "casual" }] },
            { kanji: "血", reading: "ち", romaji: "chi", meaning: "Blood", region: "Noun", kunYomi: ["ち"], onYomi: ["けつ"], compounds: [{ jp: "血", reading: "ち", meaning: "blood" }, { jp: "血液", reading: "けつえき", meaning: "blood" }, { jp: "出血", reading: "しゅっけつ", meaning: "bleeding" }, { jp: "貧血", reading: "ひんけつ", meaning: "anemia" }] },
            { kanji: "決", reading: "きめる", romaji: "kimeru", meaning: "Decide", region: "Verb", kunYomi: ["き"], onYomi: ["けつ"], compounds: [{ jp: "決める", reading: "きめる", meaning: "to decide" }, { jp: "決定", reading: "けってい", meaning: "decision" }, { jp: "解決", reading: "かいけつ", meaning: "solution" }, { jp: "決心", reading: "けっしん", meaning: "determination" }] },
            { kanji: "研", reading: "とぐ", romaji: "togu", meaning: "Polish, study", region: "Verb", kunYomi: ["と"], onYomi: ["けん"], compounds: [{ jp: "研究", reading: "けんきゅう", meaning: "research" }, { jp: "研修", reading: "けんしゅう", meaning: "training" }, { jp: "研ぐ", reading: "とぐ", meaning: "to polish" }] },
        ] },
    { id: "grade_3_kanji_level_2", label: "Level 2", sublabel: "Elementary Grade 3 · 46 cards", emoji: "📚", group: "grade_3", mode: "formal", category_key: "formal_grade_grade_3", cards: [
            { kanji: "県", reading: "けん", romaji: "ken", meaning: "Prefecture", region: "Noun", kunYomi: ["—"], onYomi: ["けん"], compounds: [{ jp: "県", reading: "けん", meaning: "prefecture" }, { jp: "県庁", reading: "けんちょう", meaning: "prefectural office" }, { jp: "県立", reading: "けんりつ", meaning: "prefectural" }, { jp: "都道府県", reading: "とどうふけん", meaning: "prefectures of Japan" }] },
            { kanji: "庫", reading: "くら", romaji: "kura", meaning: "Warehouse, Storage", region: "Noun", kunYomi: ["くら"], onYomi: ["こ", "く"], compounds: [{ jp: "倉庫", reading: "そうこ", meaning: "warehouse" }, { jp: "車庫", reading: "しゃこ", meaning: "garage" }, { jp: "文庫", reading: "ぶんこ", meaning: "library, paperback" }, { jp: "金庫", reading: "きんこ", meaning: "safe, vault" }] },
            { kanji: "湖", reading: "みずうみ", romaji: "mizuumi", meaning: "Lake", region: "Noun", kunYomi: ["みずうみ"], onYomi: ["こ"], compounds: [{ jp: "湖", reading: "みずうみ", meaning: "lake" }, { jp: "湖水", reading: "こすい", meaning: "lake water" }, { jp: "湖畔", reading: "こはん", meaning: "lakeside" }, { jp: "琵琶湖", reading: "びわこ", meaning: "Lake Biwa" }] },
            { kanji: "向", reading: "むく", romaji: "muku", meaning: "Face, Direction", region: "Verb", kunYomi: ["む"], onYomi: ["こう"], compounds: [{ jp: "向く", reading: "むく", meaning: "to face" }, { jp: "方向", reading: "ほうこう", meaning: "direction" }, { jp: "向かう", reading: "むかう", meaning: "to head toward" }, { jp: "向上", reading: "こうじょう", meaning: "improvement" }] },
            { kanji: "幸", reading: "しあわせ", romaji: "shiawase", meaning: "Happiness", region: "Noun", kunYomi: ["さち", "しあわ"], onYomi: ["こう"], compounds: [{ jp: "幸せ", reading: "しあわせ", meaning: "happiness" }, { jp: "幸福", reading: "こうふく", meaning: "happiness" }, { jp: "幸運", reading: "こううん", meaning: "good luck" }, { jp: "不幸", reading: "ふこう", meaning: "misfortune" }] },
            { kanji: "港", reading: "みなと", romaji: "minato", meaning: "Harbor, Port", region: "Noun", kunYomi: ["みなと"], onYomi: ["こう"], compounds: [{ jp: "港", reading: "みなと", meaning: "harbor, port" }, { jp: "空港", reading: "くうこう", meaning: "airport" }, { jp: "港町", reading: "みなとまち", meaning: "port town" }, { jp: "入港", reading: "にゅうこう", meaning: "entering port" }] },
            { kanji: "号", reading: "ごう", romaji: "gou", meaning: "Number, Name", region: "Noun", kunYomi: ["—"], onYomi: ["ごう"], compounds: [{ jp: "番号", reading: "ばんごう", meaning: "number" }, { jp: "号", reading: "ごう", meaning: "issue, number" }, { jp: "記号", reading: "きごう", meaning: "symbol, sign" }, { jp: "信号", reading: "しんごう", meaning: "traffic signal" }] },
            { kanji: "根", reading: "ね", romaji: "ne", meaning: "Root", region: "Noun", kunYomi: ["ね"], onYomi: ["こん"], compounds: [{ jp: "根", reading: "ね", meaning: "root" }, { jp: "根本", reading: "こんぽん", meaning: "root, foundation" }, { jp: "屋根", reading: "やね", meaning: "roof" }, { jp: "根拠", reading: "こんきょ", meaning: "basis, ground" }] },
            { kanji: "祭", reading: "まつり", romaji: "matsuri", meaning: "Festival", region: "Noun", kunYomi: ["まつ"], onYomi: ["さい"], compounds: [{ jp: "祭り", reading: "まつり", meaning: "festival" }, { jp: "祭日", reading: "さいじつ", meaning: "holiday, festival day" }, { jp: "文化祭", reading: "ぶんかさい", meaning: "cultural festival" }, { jp: "お祭り", reading: "おまつり", meaning: "festival" }] },
            { kanji: "皿", reading: "さら", romaji: "sara", meaning: "Plate, Dish", region: "Noun", kunYomi: ["さら"], onYomi: ["べい"], compounds: [{ jp: "皿", reading: "さら", meaning: "plate, dish" }, { jp: "皿洗い", reading: "さらあらい", meaning: "dishwashing" }, { jp: "小皿", reading: "こざら", meaning: "small plate" }, { jp: "灰皿", reading: "はいざら", meaning: "ashtray" }] },
            { kanji: "詩", reading: "し", romaji: "shi", meaning: "Poem, Poetry", region: "Noun", kunYomi: ["—"], onYomi: ["し"], compounds: [{ jp: "詩", reading: "し", meaning: "poem, poetry" }, { jp: "詩人", reading: "しじん", meaning: "poet" }, { jp: "詩集", reading: "ししゅう", meaning: "poetry collection" }, { jp: "作詩", reading: "さくし", meaning: "poem writing" }] },
            { kanji: "次", reading: "つぎ", romaji: "tsugi", meaning: "Next", region: "Noun", kunYomi: ["つぎ", "つ"], onYomi: ["じ", "し"], compounds: [{ jp: "次", reading: "つぎ", meaning: "next" }, { jp: "次第", reading: "しだい", meaning: "depending on, order" }, { jp: "目次", reading: "もくじ", meaning: "table of contents" }, { jp: "次回", reading: "じかい", meaning: "next time" }] },
            { kanji: "式", reading: "しき", romaji: "shiki", meaning: "Ceremony, Style", region: "Noun", kunYomi: ["—"], onYomi: ["しき"], compounds: [{ jp: "式", reading: "しき", meaning: "ceremony" }, { jp: "正式", reading: "せいしき", meaning: "formal, official" }, { jp: "卒業式", reading: "そつぎょうしき", meaning: "graduation ceremony" }, { jp: "形式", reading: "けいしき", meaning: "form, style" }] },
            { kanji: "実", reading: "みのる", romaji: "minoru", meaning: "Fruit, Reality", region: "Noun", kunYomi: ["み", "みの"], onYomi: ["じつ"], compounds: [{ jp: "実", reading: "み", meaning: "fruit, reality" }, { jp: "実際", reading: "じっさい", meaning: "reality, actually" }, { jp: "事実", reading: "じじつ", meaning: "fact" }, { jp: "現実", reading: "げんじつ", meaning: "reality" }] },
            { kanji: "写", reading: "うつす", romaji: "utsusu", meaning: "Copy, Photograph", region: "Verb", kunYomi: ["うつ"], onYomi: ["しゃ"], compounds: [{ jp: "写す", reading: "うつす", meaning: "to copy, photograph" }, { jp: "写真", reading: "しゃしん", meaning: "photograph" }, { jp: "複写", reading: "ふくしゃ", meaning: "copy, duplicate" }, { jp: "描写", reading: "びょうしゃ", meaning: "depiction" }] },
            { kanji: "者", reading: "もの", romaji: "mono", meaning: "Person", region: "Noun", kunYomi: ["もの"], onYomi: ["しゃ"], compounds: [{ jp: "者", reading: "もの", meaning: "person" }, { jp: "医者", reading: "いしゃ", meaning: "doctor" }, { jp: "記者", reading: "きしゃ", meaning: "journalist" }, { jp: "学者", reading: "がくしゃ", meaning: "scholar" }] },
            { kanji: "酒", reading: "さけ", romaji: "sake", meaning: "Alcohol, Sake", region: "Noun", kunYomi: ["さけ", "さか"], onYomi: ["しゅ"], compounds: [{ jp: "酒", reading: "さけ", meaning: "alcohol, sake" }, { jp: "日本酒", reading: "にほんしゅ", meaning: "Japanese sake" }, { jp: "酒場", reading: "さかば", meaning: "bar, tavern" }, { jp: "飲酒", reading: "いんしゅ", meaning: "drinking alcohol" }] },
            { kanji: "州", reading: "しゅう", romaji: "shuu", meaning: "State, Province", region: "Noun", kunYomi: ["す"], onYomi: ["しゅう"], compounds: [{ jp: "州", reading: "しゅう", meaning: "state, province" }, { jp: "九州", reading: "きゅうしゅう", meaning: "Kyushu" }, { jp: "本州", reading: "ほんしゅう", meaning: "Honshu" }, { jp: "中州", reading: "なかす", meaning: "sandbar" }] },
            { kanji: "拾", reading: "ひろう", romaji: "hirou", meaning: "Pick up, Ten", region: "Verb", kunYomi: ["ひろ"], onYomi: ["じゅう", "しゅう"], compounds: [{ jp: "拾う", reading: "ひろう", meaning: "to pick up" }, { jp: "拾得", reading: "しゅうとく", meaning: "finding lost item" }, { jp: "収拾", reading: "しゅうしゅう", meaning: "recovery, control" }, { jp: "拾い物", reading: "ひろいもの", meaning: "found item" }] },
            { kanji: "宿", reading: "やど", romaji: "yado", meaning: "Lodge, Inn", region: "Noun", kunYomi: ["やど"], onYomi: ["しゅく"], compounds: [{ jp: "宿", reading: "やど", meaning: "inn, lodging" }, { jp: "宿題", reading: "しゅくだい", meaning: "homework" }, { jp: "宿泊", reading: "しゅくはく", meaning: "lodging, stay" }, { jp: "下宿", reading: "げしゅく", meaning: "boarding house" }] },
            { kanji: "所", reading: "ところ", romaji: "tokoro", meaning: "Place", region: "Noun", kunYomi: ["ところ", "どころ"], onYomi: ["しょ"], compounds: [{ jp: "所", reading: "ところ", meaning: "place" }, { jp: "場所", reading: "ばしょ", meaning: "place, location" }, { jp: "台所", reading: "だいどころ", meaning: "kitchen" }, { jp: "近所", reading: "きんじょ", meaning: "neighborhood" }] },
            { kanji: "助", reading: "たすける", romaji: "tasukeru", meaning: "Help, Rescue", region: "Verb", kunYomi: ["たす", "すけ"], onYomi: ["じょ"], compounds: [{ jp: "助ける", reading: "たすける", meaning: "to help, rescue" }, { jp: "助手", reading: "じょしゅ", meaning: "assistant" }, { jp: "助言", reading: "じょげん", meaning: "advice" }, { jp: "救助", reading: "きゅうじょ", meaning: "rescue" }] },
            { kanji: "昭", reading: "しょう", romaji: "shou", meaning: "Bright, Showa", region: "Noun", kunYomi: ["—"], onYomi: ["しょう"], compounds: [{ jp: "昭和", reading: "しょうわ", meaning: "Showa era" }, { jp: "昭", reading: "しょう", meaning: "bright, luminous" }] },
            { kanji: "章", reading: "しょう", romaji: "shou", meaning: "Chapter, Badge", region: "Noun", kunYomi: ["—"], onYomi: ["しょう"], compounds: [{ jp: "章", reading: "しょう", meaning: "chapter" }, { jp: "文章", reading: "ぶんしょう", meaning: "sentence, writing" }, { jp: "記章", reading: "きしょう", meaning: "badge, medal" }, { jp: "勲章", reading: "くんしょう", meaning: "medal, decoration" }] },
            { kanji: "勝", reading: "かつ", romaji: "katsu", meaning: "Win, Victory", region: "Verb", kunYomi: ["か"], onYomi: ["しょう"], compounds: [{ jp: "勝つ", reading: "かつ", meaning: "to win" }, { jp: "勝利", reading: "しょうり", meaning: "victory" }, { jp: "優勝", reading: "ゆうしょう", meaning: "championship" }, { jp: "勝負", reading: "しょうぶ", meaning: "match, contest" }] },
            { kanji: "植", reading: "うえる", romaji: "ueru", meaning: "Plant", region: "Verb", kunYomi: ["う"], onYomi: ["しょく"], compounds: [{ jp: "植える", reading: "うえる", meaning: "to plant" }, { jp: "植物", reading: "しょくぶつ", meaning: "plant" }, { jp: "植林", reading: "しょくりん", meaning: "afforestation" }, { jp: "移植", reading: "いしょく", meaning: "transplant" }] },
            { kanji: "身", reading: "み", romaji: "mi", meaning: "Body, Oneself", region: "Noun", kunYomi: ["み"], onYomi: ["しん"], compounds: [{ jp: "身", reading: "み", meaning: "body, oneself" }, { jp: "身体", reading: "しんたい", meaning: "body" }, { jp: "出身", reading: "しゅっしん", meaning: "origin, hometown" }, { jp: "自身", reading: "じしん", meaning: "oneself" }] },
            { kanji: "世", reading: "よ", romaji: "yo", meaning: "World, Generation", region: "Noun", kunYomi: ["よ"], onYomi: ["せい", "せ"], compounds: [{ jp: "世界", reading: "せかい", meaning: "world" }, { jp: "世紀", reading: "せいき", meaning: "century" }, { jp: "世代", reading: "せだい", meaning: "generation" }, { jp: "世話", reading: "せわ", meaning: "care, help" }] },
            { kanji: "昔", reading: "むかし", romaji: "mukashi", meaning: "Long ago, Past", region: "Noun", kunYomi: ["むかし"], onYomi: ["せき", "しゃく"], compounds: [{ jp: "昔", reading: "むかし", meaning: "long ago, past" }, { jp: "昔話", reading: "むかしばなし", meaning: "old tale, folklore" }, { jp: "今昔", reading: "こんじゃく", meaning: "past and present" }, { jp: "昔々", reading: "むかしむかし", meaning: "once upon a time" }] },
            { kanji: "全", reading: "すべて", romaji: "subete", meaning: "All, Complete", region: "Noun", kunYomi: ["すべ", "まった"], onYomi: ["ぜん"], compounds: [{ jp: "全て", reading: "すべて", meaning: "all, everything" }, { jp: "全部", reading: "ぜんぶ", meaning: "all, entire" }, { jp: "全国", reading: "ぜんこく", meaning: "nationwide" }, { jp: "安全", reading: "あんぜん", meaning: "safety" }] },
            { kanji: "相", reading: "あい", romaji: "ai", meaning: "Mutual, Appearance", region: "Noun", kunYomi: ["あい"], onYomi: ["そう", "しょう"], compounds: [{ jp: "相手", reading: "あいて", meaning: "partner, opponent" }, { jp: "相談", reading: "そうだん", meaning: "consultation" }, { jp: "首相", reading: "しゅしょう", meaning: "prime minister" }, { jp: "相互", reading: "そうご", meaning: "mutual" }] },
            { kanji: "族", reading: "ぞく", romaji: "zoku", meaning: "Tribe, Family", region: "Noun", kunYomi: ["—"], onYomi: ["ぞく"], compounds: [{ jp: "家族", reading: "かぞく", meaning: "family" }, { jp: "民族", reading: "みんぞく", meaning: "ethnic group" }, { jp: "部族", reading: "ぶぞく", meaning: "tribe" }, { jp: "貴族", reading: "きぞく", meaning: "nobility, aristocrat" }] },
            { kanji: "他", reading: "ほか", romaji: "hoka", meaning: "Other", region: "Noun", kunYomi: ["ほか"], onYomi: ["た"], compounds: [{ jp: "他", reading: "ほか", meaning: "other" }, { jp: "他人", reading: "たにん", meaning: "other person, stranger" }, { jp: "その他", reading: "そのほか", meaning: "and others" }, { jp: "他国", reading: "たこく", meaning: "other country" }] },
            { kanji: "打", reading: "うつ", romaji: "utsu", meaning: "Strike, Hit", region: "Verb", kunYomi: ["う"], onYomi: ["だ"], compounds: [{ jp: "打つ", reading: "うつ", meaning: "to strike, hit" }, { jp: "打撃", reading: "だげき", meaning: "blow, hitting" }, { jp: "打者", reading: "だしゃ", meaning: "batter" }, { jp: "打開", reading: "だかい", meaning: "breakthrough" }] },
            { kanji: "対", reading: "たいする", romaji: "taisuru", meaning: "Versus, Oppose", region: "Noun", kunYomi: ["むか"], onYomi: ["たい", "つい"], compounds: [{ jp: "対する", reading: "たいする", meaning: "to face, oppose" }, { jp: "対話", reading: "たいわ", meaning: "dialogue" }, { jp: "反対", reading: "はんたい", meaning: "opposition" }, { jp: "絶対", reading: "ぜったい", meaning: "absolute" }] },
            { kanji: "代", reading: "かわる", romaji: "kawaru", meaning: "Generation, Replace", region: "Noun", kunYomi: ["か", "しろ"], onYomi: ["だい", "たい"], compounds: [{ jp: "代わる", reading: "かわる", meaning: "to replace" }, { jp: "時代", reading: "じだい", meaning: "era, age" }, { jp: "代表", reading: "だいひょう", meaning: "representative" }, { jp: "代金", reading: "だいきん", meaning: "price, cost" }] },
            { kanji: "第", reading: "だい", romaji: "dai", meaning: "Ordinal Number", region: "Noun", kunYomi: ["—"], onYomi: ["だい"], compounds: [{ jp: "第一", reading: "だいいち", meaning: "first, number one" }, { jp: "第二", reading: "だいに", meaning: "second" }, { jp: "次第", reading: "しだい", meaning: "depending on" }, { jp: "落第", reading: "らくだい", meaning: "failure, flunking" }] },
            { kanji: "題", reading: "だい", romaji: "dai", meaning: "Title, Topic", region: "Noun", kunYomi: ["—"], onYomi: ["だい"], compounds: [{ jp: "題", reading: "だい", meaning: "title, topic" }, { jp: "問題", reading: "もんだい", meaning: "problem, question" }, { jp: "宿題", reading: "しゅくだい", meaning: "homework" }, { jp: "話題", reading: "わだい", meaning: "topic of conversation" }] },
            { kanji: "炭", reading: "すみ", romaji: "sumi", meaning: "Charcoal, Coal", region: "Noun", kunYomi: ["すみ"], onYomi: ["たん"], compounds: [{ jp: "炭", reading: "すみ", meaning: "charcoal" }, { jp: "石炭", reading: "せきたん", meaning: "coal" }, { jp: "炭素", reading: "たんそ", meaning: "carbon" }, { jp: "木炭", reading: "もくたん", meaning: "charcoal" }] },
            { kanji: "短", reading: "みじかい", romaji: "mijikai", meaning: "Short", region: "Adjective", kunYomi: ["みじか"], onYomi: ["たん"], compounds: [{ jp: "短い", reading: "みじかい", meaning: "short" }, { jp: "短所", reading: "たんしょ", meaning: "shortcoming, weakness" }, { jp: "短期", reading: "たんき", meaning: "short-term" }, { jp: "短縮", reading: "たんしゅく", meaning: "shortening" }] },
            { kanji: "談", reading: "だん", romaji: "dan", meaning: "Talk, Discuss", region: "Verb", kunYomi: ["—"], onYomi: ["だん"], compounds: [{ jp: "相談", reading: "そうだん", meaning: "consultation" }, { jp: "談話", reading: "だんわ", meaning: "conversation, talk" }, { jp: "談判", reading: "だんぱん", meaning: "negotiation" }, { jp: "冗談", reading: "じょうだん", meaning: "joke" }] },
            { kanji: "注", reading: "そそぐ", romaji: "sosogu", meaning: "Pour, Attention", region: "Verb", kunYomi: ["そそ"], onYomi: ["ちゅう"], compounds: [{ jp: "注ぐ", reading: "そそぐ", meaning: "to pour" }, { jp: "注意", reading: "ちゅうい", meaning: "attention, caution" }, { jp: "注文", reading: "ちゅうもん", meaning: "order, request" }, { jp: "注目", reading: "ちゅうもく", meaning: "attention, focus" }] },
            { kanji: "柱", reading: "はしら", romaji: "hashira", meaning: "Pillar, Column", region: "Noun", kunYomi: ["はしら"], onYomi: ["ちゅう"], compounds: [{ jp: "柱", reading: "はしら", meaning: "pillar, column" }, { jp: "電柱", reading: "でんちゅう", meaning: "utility pole" }, { jp: "支柱", reading: "しちゅう", meaning: "support pole" }, { jp: "大黒柱", reading: "だいこくばしら", meaning: "main pillar" }] },
            { kanji: "丁", reading: "ちょう", romaji: "chou", meaning: "Block, Polite", region: "Noun", kunYomi: ["—"], onYomi: ["ちょう", "てい"], compounds: [{ jp: "丁寧", reading: "ていねい", meaning: "polite, careful" }, { jp: "丁度", reading: "ちょうど", meaning: "exactly, just" }, { jp: "一丁目", reading: "いっちょうめ", meaning: "first block" }, { jp: "包丁", reading: "ほうちょう", meaning: "kitchen knife" }] },
            { kanji: "帳", reading: "ちょう", romaji: "chou", meaning: "Notebook, Curtain", region: "Noun", kunYomi: ["とばり"], onYomi: ["ちょう"], compounds: [{ jp: "手帳", reading: "てちょう", meaning: "notebook, planner" }, { jp: "帳面", reading: "ちょうめん", meaning: "notebook" }, { jp: "通帳", reading: "つうちょう", meaning: "bankbook" }, { jp: "帳簿", reading: "ちょうぼ", meaning: "account book" }] },
            { kanji: "追", reading: "おう", romaji: "ou", meaning: "Chase, Follow", region: "Verb", kunYomi: ["お"], onYomi: ["つい"], compounds: [{ jp: "追う", reading: "おう", meaning: "to chase, follow" }, { jp: "追加", reading: "ついか", meaning: "addition" }, { jp: "追求", reading: "ついきゅう", meaning: "pursuit" }, { jp: "追放", reading: "ついほう", meaning: "expulsion, banishment" }] },
        ] },
    { id: "grade_3_kanji_level_3", label: "Level 3", sublabel: "Elementary Grade 3 · 46 cards", emoji: "📚", group: "grade_3", mode: "formal", category_key: "formal_grade_grade_3", cards: [
            { kanji: "庭", reading: "にわ", romaji: "niwa", meaning: "Garden, Yard", region: "Noun", kunYomi: ["にわ"], onYomi: ["てい"], compounds: [{ jp: "庭", reading: "にわ", meaning: "garden, yard" }, { jp: "庭園", reading: "ていえん", meaning: "garden" }, { jp: "家庭", reading: "かてい", meaning: "home, family" }, { jp: "校庭", reading: "こうてい", meaning: "schoolyard" }] },
            { kanji: "笛", reading: "ふえ", romaji: "fue", meaning: "Flute, Whistle", region: "Noun", kunYomi: ["ふえ"], onYomi: ["てき"], compounds: [{ jp: "笛", reading: "ふえ", meaning: "flute, whistle" }, { jp: "口笛", reading: "くちぶえ", meaning: "whistling" }, { jp: "汽笛", reading: "きてき", meaning: "steam whistle" }, { jp: "横笛", reading: "よこぶえ", meaning: "transverse flute" }] },
            { kanji: "鉄", reading: "てつ", romaji: "tetsu", meaning: "Iron, Steel", region: "Noun", kunYomi: ["—"], onYomi: ["てつ"], compounds: [{ jp: "鉄", reading: "てつ", meaning: "iron, steel" }, { jp: "鉄道", reading: "てつどう", meaning: "railway" }, { jp: "地下鉄", reading: "ちかてつ", meaning: "subway" }, { jp: "鉄橋", reading: "てっきょう", meaning: "iron bridge" }] },
            { kanji: "都", reading: "みやこ", romaji: "miyako", meaning: "Capital, City", region: "Noun", kunYomi: ["みやこ"], onYomi: ["と", "つ"], compounds: [{ jp: "都", reading: "みやこ", meaning: "capital city" }, { jp: "東京都", reading: "とうきょうと", meaning: "Tokyo Metropolis" }, { jp: "都市", reading: "とし", meaning: "city" }, { jp: "都合", reading: "つごう", meaning: "convenience, circumstances" }] },
            { kanji: "度", reading: "たび", romaji: "tabi", meaning: "Degree, Time", region: "Noun", kunYomi: ["たび"], onYomi: ["ど", "たく"], compounds: [{ jp: "度", reading: "ど", meaning: "degree, time" }, { jp: "温度", reading: "おんど", meaning: "temperature" }, { jp: "今度", reading: "こんど", meaning: "this time, next time" }, { jp: "制度", reading: "せいど", meaning: "system, institution" }] },
            { kanji: "豆", reading: "まめ", romaji: "mame", meaning: "Bean", region: "Noun", kunYomi: ["まめ"], onYomi: ["とう", "ず"], compounds: [{ jp: "豆", reading: "まめ", meaning: "bean" }, { jp: "大豆", reading: "だいず", meaning: "soybean" }, { jp: "豆腐", reading: "とうふ", meaning: "tofu" }, { jp: "枝豆", reading: "えだまめ", meaning: "edamame" }] },
            { kanji: "島", reading: "しま", romaji: "shima", meaning: "Island", region: "Noun", kunYomi: ["しま"], onYomi: ["とう"], compounds: [{ jp: "島", reading: "しま", meaning: "island" }, { jp: "半島", reading: "はんとう", meaning: "peninsula" }, { jp: "島国", reading: "しまぐに", meaning: "island country" }, { jp: "無人島", reading: "むじんとう", meaning: "uninhabited island" }] },
            { kanji: "湯", reading: "ゆ", romaji: "yu", meaning: "Hot water, Bath", region: "Noun", kunYomi: ["ゆ"], onYomi: ["とう"], compounds: [{ jp: "湯", reading: "ゆ", meaning: "hot water" }, { jp: "お湯", reading: "おゆ", meaning: "hot water" }, { jp: "銭湯", reading: "せんとう", meaning: "public bath" }, { jp: "湯気", reading: "ゆげ", meaning: "steam" }] },
            { kanji: "動", reading: "うごく", romaji: "ugoku", meaning: "Move, Motion", region: "Verb", kunYomi: ["うご"], onYomi: ["どう"], compounds: [{ jp: "動く", reading: "うごく", meaning: "to move" }, { jp: "運動", reading: "うんどう", meaning: "exercise, movement" }, { jp: "動物", reading: "どうぶつ", meaning: "animal" }, { jp: "感動", reading: "かんどう", meaning: "being moved, impressed" }] },
            { kanji: "童", reading: "わらべ", romaji: "warabe", meaning: "Child", region: "Noun", kunYomi: ["わらべ"], onYomi: ["どう"], compounds: [{ jp: "童", reading: "わらべ", meaning: "child" }, { jp: "童話", reading: "どうわ", meaning: "fairy tale" }, { jp: "児童", reading: "じどう", meaning: "child, juvenile" }, { jp: "童謡", reading: "どうよう", meaning: "nursery rhyme" }] },
            { kanji: "農", reading: "のう", romaji: "nou", meaning: "Agriculture", region: "Noun", kunYomi: ["—"], onYomi: ["のう"], compounds: [{ jp: "農業", reading: "のうぎょう", meaning: "agriculture" }, { jp: "農家", reading: "のうか", meaning: "farm household" }, { jp: "農村", reading: "のうそん", meaning: "farming village" }, { jp: "農場", reading: "のうじょう", meaning: "farm" }] },
            { kanji: "波", reading: "なみ", romaji: "nami", meaning: "Wave", region: "Noun", kunYomi: ["なみ"], onYomi: ["は"], compounds: [{ jp: "波", reading: "なみ", meaning: "wave" }, { jp: "波長", reading: "はちょう", meaning: "wavelength" }, { jp: "電波", reading: "でんぱ", meaning: "radio wave" }, { jp: "津波", reading: "つなみ", meaning: "tsunami" }] },
            { kanji: "倍", reading: "ばい", romaji: "bai", meaning: "Double, Times", region: "Noun", kunYomi: ["—"], onYomi: ["ばい"], compounds: [{ jp: "倍", reading: "ばい", meaning: "double, times" }, { jp: "二倍", reading: "にばい", meaning: "double, twice" }, { jp: "倍増", reading: "ばいぞう", meaning: "doubling" }, { jp: "倍率", reading: "ばいりつ", meaning: "magnification, ratio" }] },
            { kanji: "箱", reading: "はこ", romaji: "hako", meaning: "Box", region: "Noun", kunYomi: ["はこ"], onYomi: ["そう"], compounds: [{ jp: "箱", reading: "はこ", meaning: "box" }, { jp: "箱根", reading: "はこね", meaning: "Hakone" }, { jp: "お菓子箱", reading: "おかしばこ", meaning: "candy box" }, { jp: "箱庭", reading: "はこにわ", meaning: "miniature garden" }] },
            { kanji: "畑", reading: "はたけ", romaji: "hatake", meaning: "Field, Farm", region: "Noun", kunYomi: ["はたけ", "はた"], onYomi: ["—"], compounds: [{ jp: "畑", reading: "はたけ", meaning: "field, farm" }, { jp: "田畑", reading: "たはた", meaning: "fields" }, { jp: "畑仕事", reading: "はたけしごと", meaning: "farm work" }, { jp: "麦畑", reading: "むぎばたけ", meaning: "wheat field" }] },
            { kanji: "発", reading: "はつ", romaji: "hatsu", meaning: "Depart, Emit", region: "Verb", kunYomi: ["—"], onYomi: ["はつ", "ほつ"], compounds: [{ jp: "発見", reading: "はっけん", meaning: "discovery" }, { jp: "出発", reading: "しゅっぱつ", meaning: "departure" }, { jp: "発展", reading: "はってん", meaning: "development" }, { jp: "発表", reading: "はっぴょう", meaning: "announcement" }] },
            { kanji: "坂", reading: "さか", romaji: "saka", meaning: "Slope, Hill", region: "Noun", kunYomi: ["さか"], onYomi: ["はん"], compounds: [{ jp: "坂", reading: "さか", meaning: "slope, hill" }, { jp: "坂道", reading: "さかみち", meaning: "sloping road" }, { jp: "上り坂", reading: "のぼりざか", meaning: "uphill slope" }, { jp: "大阪", reading: "おおさか", meaning: "Osaka" }] },
            { kanji: "板", reading: "いた", romaji: "ita", meaning: "Board, Plank", region: "Noun", kunYomi: ["いた"], onYomi: ["はん", "ばん"], compounds: [{ jp: "板", reading: "いた", meaning: "board, plank" }, { jp: "黒板", reading: "こくばん", meaning: "blackboard" }, { jp: "看板", reading: "かんばん", meaning: "signboard" }, { jp: "板書", reading: "ばんしょ", meaning: "writing on board" }] },
            { kanji: "悲", reading: "かなしい", romaji: "kanashii", meaning: "Sad, Grief", region: "Adjective", kunYomi: ["かな"], onYomi: ["ひ"], compounds: [{ jp: "悲しい", reading: "かなしい", meaning: "sad" }, { jp: "悲しむ", reading: "かなしむ", meaning: "to grieve" }, { jp: "悲劇", reading: "ひげき", meaning: "tragedy" }, { jp: "悲鳴", reading: "ひめい", meaning: "scream, shriek" }] },
            { kanji: "筆", reading: "ふで", romaji: "fude", meaning: "Brush, Pen", region: "Noun", kunYomi: ["ふで"], onYomi: ["ひつ"], compounds: [{ jp: "筆", reading: "ふで", meaning: "brush, pen" }, { jp: "鉛筆", reading: "えんぴつ", meaning: "pencil" }, { jp: "筆者", reading: "ひっしゃ", meaning: "writer, author" }, { jp: "毛筆", reading: "もうひつ", meaning: "writing brush" }] },
            { kanji: "表", reading: "おもて", romaji: "omote", meaning: "Surface, Express", region: "Noun", kunYomi: ["おもて", "あらわ"], onYomi: ["ひょう"], compounds: [{ jp: "表", reading: "おもて", meaning: "surface, front" }, { jp: "表現", reading: "ひょうげん", meaning: "expression" }, { jp: "発表", reading: "はっぴょう", meaning: "announcement" }, { jp: "表情", reading: "ひょうじょう", meaning: "facial expression" }] },
            { kanji: "秒", reading: "びょう", romaji: "byou", meaning: "Second (time)", region: "Noun", kunYomi: ["—"], onYomi: ["びょう"], compounds: [{ jp: "秒", reading: "びょう", meaning: "second" }, { jp: "一秒", reading: "いちびょう", meaning: "one second" }, { jp: "秒針", reading: "びょうしん", meaning: "second hand" }, { jp: "秒速", reading: "びょうそく", meaning: "per second speed" }] },
            { kanji: "病", reading: "やむ", romaji: "yamu", meaning: "Illness, Disease", region: "Noun", kunYomi: ["や", "やまい"], onYomi: ["びょう", "へい"], compounds: [{ jp: "病気", reading: "びょうき", meaning: "illness, disease" }, { jp: "病院", reading: "びょういん", meaning: "hospital" }, { jp: "病人", reading: "びょうにん", meaning: "sick person" }, { jp: "看病", reading: "かんびょう", meaning: "nursing, caring for sick" }] },
            { kanji: "負", reading: "まける", romaji: "makeru", meaning: "Lose, Bear", region: "Verb", kunYomi: ["ま", "お"], onYomi: ["ふ"], compounds: [{ jp: "負ける", reading: "まける", meaning: "to lose" }, { jp: "負担", reading: "ふたん", meaning: "burden" }, { jp: "勝負", reading: "しょうぶ", meaning: "match, contest" }, { jp: "負傷", reading: "ふしょう", meaning: "injury" }] },
            { kanji: "服", reading: "ふく", romaji: "fuku", meaning: "Clothes, Obey", region: "Noun", kunYomi: ["—"], onYomi: ["ふく"], compounds: [{ jp: "服", reading: "ふく", meaning: "clothes" }, { jp: "洋服", reading: "ようふく", meaning: "Western clothes" }, { jp: "服従", reading: "ふくじゅう", meaning: "obedience" }, { jp: "制服", reading: "せいふく", meaning: "uniform" }] },
            { kanji: "物", reading: "もの", romaji: "mono", meaning: "Thing, Object", region: "Noun", kunYomi: ["もの", "もの"], onYomi: ["ぶつ", "もつ"], compounds: [{ jp: "物", reading: "もの", meaning: "thing, object" }, { jp: "動物", reading: "どうぶつ", meaning: "animal" }, { jp: "食べ物", reading: "たべもの", meaning: "food" }, { jp: "荷物", reading: "にもつ", meaning: "luggage" }] },
            { kanji: "平", reading: "たいら", romaji: "taira", meaning: "Flat, Peace", region: "Adjective", kunYomi: ["たいら", "ひら"], onYomi: ["へい", "びょう"], compounds: [{ jp: "平ら", reading: "たいら", meaning: "flat, level" }, { jp: "平和", reading: "へいわ", meaning: "peace" }, { jp: "平気", reading: "へいき", meaning: "calm, unconcerned" }, { jp: "水平", reading: "すいへい", meaning: "horizontal, level" }] },
            { kanji: "勉", reading: "べんきょう", romaji: "benkyou", meaning: "Study, Diligence", region: "Verb", kunYomi: ["—"], onYomi: ["べん"], compounds: [{ jp: "勉強", reading: "べんきょう", meaning: "study" }, { jp: "勉学", reading: "べんがく", meaning: "studying, learning" }, { jp: "勤勉", reading: "きんべん", meaning: "diligence, industriousness" }] },
            { kanji: "放", reading: "はなす", romaji: "hanasu", meaning: "Release, Broadcast", region: "Verb", kunYomi: ["はな"], onYomi: ["ほう"], compounds: [{ jp: "放す", reading: "はなす", meaning: "to release" }, { jp: "放送", reading: "ほうそう", meaning: "broadcast" }, { jp: "放課後", reading: "ほうかご", meaning: "after school" }, { jp: "解放", reading: "かいほう", meaning: "liberation, release" }] },
            { kanji: "味", reading: "あじ", romaji: "aji", meaning: "Taste, Flavor", region: "Noun", kunYomi: ["あじ"], onYomi: ["み"], compounds: [{ jp: "味", reading: "あじ", meaning: "taste, flavor" }, { jp: "意味", reading: "いみ", meaning: "meaning" }, { jp: "趣味", reading: "しゅみ", meaning: "hobby" }, { jp: "味方", reading: "みかた", meaning: "ally, one's side" }] },
            { kanji: "面", reading: "おもて", romaji: "omote", meaning: "Face, Surface", region: "Noun", kunYomi: ["おも", "おもて", "つら"], onYomi: ["めん", "べん"], compounds: [{ jp: "面", reading: "おもて", meaning: "face, surface" }, { jp: "面白い", reading: "おもしろい", meaning: "interesting, funny" }, { jp: "場面", reading: "ばめん", meaning: "scene" }, { jp: "正面", reading: "しょうめん", meaning: "front, facade" }] },
            { kanji: "問", reading: "とう", romaji: "tou", meaning: "Question, Ask", region: "Verb", kunYomi: ["と", "とい", "とん"], onYomi: ["もん"], compounds: [{ jp: "問う", reading: "とう", meaning: "to ask, inquire" }, { jp: "問題", reading: "もんだい", meaning: "problem, question" }, { jp: "質問", reading: "しつもん", meaning: "question" }, { jp: "訪問", reading: "ほうもん", meaning: "visit" }] },
            { kanji: "役", reading: "やく", romaji: "yaku", meaning: "Role, Service", region: "Noun", kunYomi: ["—"], onYomi: ["やく", "えき"], compounds: [{ jp: "役", reading: "やく", meaning: "role, use" }, { jp: "役立つ", reading: "やくだつ", meaning: "to be useful" }, { jp: "主役", reading: "しゅやく", meaning: "main role" }, { jp: "役所", reading: "やくしょ", meaning: "government office" }] },
            { kanji: "油", reading: "あぶら", romaji: "abura", meaning: "Oil", region: "Noun", kunYomi: ["あぶら"], onYomi: ["ゆ"], compounds: [{ jp: "油", reading: "あぶら", meaning: "oil" }, { jp: "石油", reading: "せきゆ", meaning: "petroleum" }, { jp: "油断", reading: "ゆだん", meaning: "carelessness" }, { jp: "油絵", reading: "あぶらえ", meaning: "oil painting" }] },
            { kanji: "有", reading: "ある", romaji: "aru", meaning: "Exist, Have", region: "Verb", kunYomi: ["あ"], onYomi: ["ゆう", "う"], compounds: [{ jp: "有る", reading: "ある", meaning: "to exist, have" }, { jp: "有名", reading: "ゆうめい", meaning: "famous" }, { jp: "有利", reading: "ゆうり", meaning: "advantageous" }, { jp: "所有", reading: "しょゆう", meaning: "ownership, possession" }] },
            { kanji: "由", reading: "よし", romaji: "yoshi", meaning: "Reason, From", region: "Noun", kunYomi: ["よし"], onYomi: ["ゆ", "ゆう", "ゆい"], compounds: [{ jp: "由来", reading: "ゆらい", meaning: "origin, history" }, { jp: "理由", reading: "りゆう", meaning: "reason" }, { jp: "自由", reading: "じゆう", meaning: "freedom" }, { jp: "経由", reading: "けいゆ", meaning: "via, by way of" }] },
            { kanji: "予", reading: "あらかじめ", romaji: "arakajime", meaning: "Beforehand, Predict", region: "Verb", kunYomi: ["あらかじ"], onYomi: ["よ"], compounds: [{ jp: "予定", reading: "よてい", meaning: "schedule, plan" }, { jp: "予想", reading: "よそう", meaning: "expectation" }, { jp: "予習", reading: "よしゅう", meaning: "preparation for class" }, { jp: "予防", reading: "よぼう", meaning: "prevention" }] },
            { kanji: "羊", reading: "ひつじ", romaji: "hitsuji", meaning: "Sheep", region: "Noun", kunYomi: ["ひつじ"], onYomi: ["よう"], compounds: [{ jp: "羊", reading: "ひつじ", meaning: "sheep" }, { jp: "羊毛", reading: "ようもう", meaning: "wool" }, { jp: "子羊", reading: "こひつじ", meaning: "lamb" }, { jp: "羊飼い", reading: "ひつじかい", meaning: "shepherd" }] },
            { kanji: "洋", reading: "よう", romaji: "you", meaning: "Ocean, Western", region: "Noun", kunYomi: ["—"], onYomi: ["よう"], compounds: [{ jp: "洋服", reading: "ようふく", meaning: "Western clothes" }, { jp: "太平洋", reading: "たいへいよう", meaning: "Pacific Ocean" }, { jp: "洋食", reading: "ようしょく", meaning: "Western food" }, { jp: "西洋", reading: "せいよう", meaning: "the West" }] },
            { kanji: "旅", reading: "たび", romaji: "tabi", meaning: "Travel, Journey", region: "Noun", kunYomi: ["たび"], onYomi: ["りょ"], compounds: [{ jp: "旅", reading: "たび", meaning: "travel, journey" }, { jp: "旅行", reading: "りょこう", meaning: "trip, travel" }, { jp: "旅館", reading: "りょかん", meaning: "Japanese inn" }, { jp: "旅人", reading: "たびびと", meaning: "traveler" }] },
            { kanji: "両", reading: "りょう", romaji: "ryou", meaning: "Both, Two", region: "Noun", kunYomi: ["—"], onYomi: ["りょう"], compounds: [{ jp: "両方", reading: "りょうほう", meaning: "both" }, { jp: "両親", reading: "りょうしん", meaning: "parents" }, { jp: "両手", reading: "りょうて", meaning: "both hands" }, { jp: "両側", reading: "りょうがわ", meaning: "both sides" }] },
            { kanji: "緑", reading: "みどり", romaji: "midori", meaning: "Green", region: "Noun", kunYomi: ["みどり"], onYomi: ["りょく", "ろく"], compounds: [{ jp: "緑", reading: "みどり", meaning: "green" }, { jp: "緑色", reading: "みどりいろ", meaning: "green color" }, { jp: "新緑", reading: "しんりょく", meaning: "fresh green" }, { jp: "緑地", reading: "りょくち", meaning: "green area" }] },
            { kanji: "列", reading: "れつ", romaji: "retsu", meaning: "Row, Line", region: "Noun", kunYomi: ["—"], onYomi: ["れつ"], compounds: [{ jp: "列", reading: "れつ", meaning: "row, line" }, { jp: "列車", reading: "れっしゃ", meaning: "train" }, { jp: "行列", reading: "ぎょうれつ", meaning: "line, procession" }, { jp: "整列", reading: "せいれつ", meaning: "lining up" }] },
            { kanji: "練", reading: "ねる", romaji: "neru", meaning: "Train, Knead", region: "Verb", kunYomi: ["ね"], onYomi: ["れん"], compounds: [{ jp: "練る", reading: "ねる", meaning: "to knead, to train" }, { jp: "練習", reading: "れんしゅう", meaning: "practice" }, { jp: "訓練", reading: "くんれん", meaning: "training, drill" }, { jp: "熟練", reading: "じゅくれん", meaning: "skill, expertise" }] },
            { kanji: "路", reading: "みち", romaji: "michi", meaning: "Road, Path", region: "Noun", kunYomi: ["じ"], onYomi: ["ろ"], compounds: [{ jp: "道路", reading: "どうろ", meaning: "road" }, { jp: "路線", reading: "ろせん", meaning: "route, line" }, { jp: "進路", reading: "しんろ", meaning: "course, direction" }, { jp: "通路", reading: "つうろ", meaning: "passage, corridor" }] },
            { kanji: "和", reading: "やわらぐ", romaji: "yawaragu", meaning: "Harmony, Japan", region: "Noun", kunYomi: ["やわ", "なご"], onYomi: ["わ"], compounds: [{ jp: "和", reading: "わ", meaning: "harmony, Japan" }, { jp: "平和", reading: "へいわ", meaning: "peace" }, { jp: "和食", reading: "わしょく", meaning: "Japanese food" }, { jp: "調和", reading: "ちょうわ", meaning: "harmony" }] },
        ] },
    { id: "grade_4_kanji_level_1", label: "Level 1", sublabel: "Elementary Grade 4 · 50 cards", emoji: "📗", group: "grade_4", mode: "formal", category_key: "formal_grade_grade_4", cards: [
            { kanji: "愛", reading: "あい", romaji: "ai", meaning: "Love", region: "Noun", kunYomi: ["あい"], onYomi: ["あい"], compounds: [{ jp: "愛する", reading: "あいする", meaning: "to love" }, { jp: "愛情", reading: "あいじょう", meaning: "affection" }, { jp: "愛国", reading: "あいこく", meaning: "patriotism" }, { jp: "可愛い", reading: "かわいい", meaning: "cute, lovable" }] },
            { kanji: "案", reading: "あん", romaji: "an", meaning: "Plan, Idea", region: "Noun", kunYomi: ["—"], onYomi: ["あん"], compounds: [{ jp: "案内", reading: "あんない", meaning: "guidance" }, { jp: "提案", reading: "ていあん", meaning: "proposal" }, { jp: "案外", reading: "あんがい", meaning: "unexpectedly" }, { jp: "名案", reading: "めいあん", meaning: "good idea" }] },
            { kanji: "以", reading: "い", romaji: "i", meaning: "By means of", region: "Particle", kunYomi: ["もっ"], onYomi: ["い"], compounds: [{ jp: "以上", reading: "いじょう", meaning: "above, more than" }, { jp: "以下", reading: "いか", meaning: "below, less than" }, { jp: "以外", reading: "いがい", meaning: "other than" }, { jp: "以前", reading: "いぜん", meaning: "before, formerly" }] },
            { kanji: "衣", reading: "ころも", romaji: "koromo", meaning: "Clothing", region: "Noun", kunYomi: ["ころも", "きぬ"], onYomi: ["い"], compounds: [{ jp: "衣服", reading: "いふく", meaning: "clothing" }, { jp: "衣食住", reading: "いしょくじゅう", meaning: "food, clothing, shelter" }, { jp: "白衣", reading: "はくい", meaning: "white coat" }, { jp: "衣装", reading: "いしょう", meaning: "costume" }] },
            { kanji: "位", reading: "くらい", romaji: "kurai", meaning: "Rank, Position", region: "Noun", kunYomi: ["くらい"], onYomi: ["い"], compounds: [{ jp: "位", reading: "くらい", meaning: "rank, position" }, { jp: "地位", reading: "ちい", meaning: "status, position" }, { jp: "単位", reading: "たんい", meaning: "unit, credit" }, { jp: "順位", reading: "じゅんい", meaning: "ranking" }] },
            { kanji: "囲", reading: "かこむ", romaji: "kakomu", meaning: "Surround", region: "Verb", kunYomi: ["かこ"], onYomi: ["い"], compounds: [{ jp: "囲む", reading: "かこむ", meaning: "to surround" }, { jp: "周囲", reading: "しゅうい", meaning: "surroundings" }, { jp: "範囲", reading: "はんい", meaning: "range, scope" }, { jp: "囲碁", reading: "いご", meaning: "Go (board game)" }] },
            { kanji: "胃", reading: "い", romaji: "i", meaning: "Stomach", region: "Noun", kunYomi: ["—"], onYomi: ["い"], compounds: [{ jp: "胃", reading: "い", meaning: "stomach" }, { jp: "胃腸", reading: "いちょう", meaning: "stomach and intestines" }, { jp: "胃痛", reading: "いつう", meaning: "stomach pain" }, { jp: "胃袋", reading: "いぶくろ", meaning: "stomach, belly" }] },
            { kanji: "印", reading: "しるし", romaji: "shirushi", meaning: "Seal, Mark", region: "Noun", kunYomi: ["しるし"], onYomi: ["いん"], compounds: [{ jp: "印鑑", reading: "いんかん", meaning: "seal, stamp" }, { jp: "印刷", reading: "いんさつ", meaning: "printing" }, { jp: "印象", reading: "いんしょう", meaning: "impression" }, { jp: "目印", reading: "めじるし", meaning: "landmark, mark" }] },
            { kanji: "英", reading: "えい", romaji: "ei", meaning: "England, Hero", region: "Noun", kunYomi: ["—"], onYomi: ["えい"], compounds: [{ jp: "英語", reading: "えいご", meaning: "English language" }, { jp: "英雄", reading: "えいゆう", meaning: "hero" }, { jp: "英国", reading: "えいこく", meaning: "England" }, { jp: "英才", reading: "えいさい", meaning: "genius, gifted" }] },
            { kanji: "栄", reading: "さかえる", romaji: "sakaeru", meaning: "Prosper, Glory", region: "Verb", kunYomi: ["さか", "は"], onYomi: ["えい"], compounds: [{ jp: "栄える", reading: "さかえる", meaning: "to prosper" }, { jp: "栄光", reading: "えいこう", meaning: "glory" }, { jp: "繁栄", reading: "はんえい", meaning: "prosperity" }, { jp: "栄養", reading: "えいよう", meaning: "nutrition" }] },
            { kanji: "塩", reading: "しお", romaji: "shio", meaning: "Salt", region: "Noun", kunYomi: ["しお"], onYomi: ["えん"], compounds: [{ jp: "塩", reading: "しお", meaning: "salt" }, { jp: "食塩", reading: "しょくえん", meaning: "table salt" }, { jp: "塩分", reading: "えんぶん", meaning: "salt content" }, { jp: "塩辛い", reading: "しおからい", meaning: "salty" }] },
            { kanji: "億", reading: "おく", romaji: "oku", meaning: "100 million", region: "Noun", kunYomi: ["—"], onYomi: ["おく"], compounds: [{ jp: "億", reading: "おく", meaning: "100 million" }, { jp: "数億", reading: "すうおく", meaning: "hundreds of millions" }, { jp: "億万長者", reading: "おくまんちょうじゃ", meaning: "billionaire" }, { jp: "十億", reading: "じゅうおく", meaning: "one billion" }] },
            { kanji: "加", reading: "くわえる", romaji: "kuwaeru", meaning: "Add, Join", region: "Verb", kunYomi: ["くわ"], onYomi: ["か"], compounds: [{ jp: "加える", reading: "くわえる", meaning: "to add" }, { jp: "参加", reading: "さんか", meaning: "participation" }, { jp: "追加", reading: "ついか", meaning: "addition" }, { jp: "加工", reading: "かこう", meaning: "processing" }] },
            { kanji: "果", reading: "はたす", romaji: "hatasu", meaning: "Fruit, Result", region: "Noun", kunYomi: ["は", "はた", "はて"], onYomi: ["か"], compounds: [{ jp: "果たす", reading: "はたす", meaning: "to accomplish" }, { jp: "結果", reading: "けっか", meaning: "result" }, { jp: "果物", reading: "くだもの", meaning: "fruit" }, { jp: "効果", reading: "こうか", meaning: "effect" }] },
            { kanji: "貨", reading: "か", romaji: "ka", meaning: "Goods, Currency", region: "Noun", kunYomi: ["—"], onYomi: ["か"], compounds: [{ jp: "貨物", reading: "かもつ", meaning: "cargo, freight" }, { jp: "通貨", reading: "つうか", meaning: "currency" }, { jp: "外貨", reading: "がいか", meaning: "foreign currency" }, { jp: "百貨店", reading: "ひゃっかてん", meaning: "department store" }] },
            { kanji: "課", reading: "か", romaji: "ka", meaning: "Section, Lesson", region: "Noun", kunYomi: ["—"], onYomi: ["か"], compounds: [{ jp: "課長", reading: "かちょう", meaning: "section chief" }, { jp: "課題", reading: "かだい", meaning: "task, assignment" }, { jp: "課税", reading: "かぜい", meaning: "taxation" }, { jp: "授業課", reading: "じゅぎょうか", meaning: "class section" }] },
            { kanji: "芽", reading: "め", romaji: "me", meaning: "Bud, Sprout", region: "Noun", kunYomi: ["め"], onYomi: ["が"], compounds: [{ jp: "芽", reading: "め", meaning: "bud, sprout" }, { jp: "発芽", reading: "はつが", meaning: "germination" }, { jp: "新芽", reading: "しんめ", meaning: "new bud, sprout" }, { jp: "芽生え", reading: "めばえ", meaning: "budding, sprouting" }] },
            { kanji: "改", reading: "あらためる", romaji: "aratameru", meaning: "Reform, Revise", region: "Verb", kunYomi: ["あらた"], onYomi: ["かい"], compounds: [{ jp: "改める", reading: "あらためる", meaning: "to reform, revise" }, { jp: "改善", reading: "かいぜん", meaning: "improvement" }, { jp: "改正", reading: "かいせい", meaning: "revision, amendment" }, { jp: "改革", reading: "かいかく", meaning: "reform" }] },
            { kanji: "械", reading: "かい", romaji: "kai", meaning: "Machine", region: "Noun", kunYomi: ["—"], onYomi: ["かい"], compounds: [{ jp: "機械", reading: "きかい", meaning: "machine, machinery" }, { jp: "器械", reading: "きかい", meaning: "instrument, apparatus" }, { jp: "機械化", reading: "きかいか", meaning: "mechanization" }] },
            { kanji: "害", reading: "がい", romaji: "gai", meaning: "Harm, Damage", region: "Noun", kunYomi: ["—"], onYomi: ["がい"], compounds: [{ jp: "害", reading: "がい", meaning: "harm, damage" }, { jp: "被害", reading: "ひがい", meaning: "damage, harm" }, { jp: "害虫", reading: "がいちゅう", meaning: "harmful insect" }, { jp: "公害", reading: "こうがい", meaning: "pollution" }] },
            { kanji: "街", reading: "まち", romaji: "machi", meaning: "Town, Street", region: "Noun", kunYomi: ["まち"], onYomi: ["がい", "かい"], compounds: [{ jp: "街", reading: "まち", meaning: "town, street" }, { jp: "商店街", reading: "しょうてんがい", meaning: "shopping street" }, { jp: "街道", reading: "かいどう", meaning: "highway" }, { jp: "繁華街", reading: "はんかがい", meaning: "bustling street" }] },
            { kanji: "各", reading: "おのおの", romaji: "onoono", meaning: "Each, Every", region: "Noun", kunYomi: ["おのおの"], onYomi: ["かく"], compounds: [{ jp: "各自", reading: "かくじ", meaning: "each person" }, { jp: "各地", reading: "かくち", meaning: "various places" }, { jp: "各種", reading: "かくしゅ", meaning: "various kinds" }, { jp: "各国", reading: "かっこく", meaning: "each country" }] },
            { kanji: "覚", reading: "おぼえる", romaji: "oboeru", meaning: "Remember, Awaken", region: "Verb", kunYomi: ["おぼ", "さ"], onYomi: ["かく"], compounds: [{ jp: "覚える", reading: "おぼえる", meaning: "to remember, memorize" }, { jp: "覚醒", reading: "かくせい", meaning: "awakening" }, { jp: "感覚", reading: "かんかく", meaning: "sense, feeling" }, { jp: "自覚", reading: "じかく", meaning: "self-awareness" }] },
            { kanji: "完", reading: "かん", romaji: "kan", meaning: "Complete, Perfect", region: "Verb", kunYomi: ["—"], onYomi: ["かん"], compounds: [{ jp: "完成", reading: "かんせい", meaning: "completion" }, { jp: "完全", reading: "かんぜん", meaning: "perfect, complete" }, { jp: "完了", reading: "かんりょう", meaning: "completion, finish" }, { jp: "未完", reading: "みかん", meaning: "unfinished" }] },
            { kanji: "官", reading: "かん", romaji: "kan", meaning: "Government Official", region: "Noun", kunYomi: ["—"], onYomi: ["かん"], compounds: [{ jp: "官庁", reading: "かんちょう", meaning: "government office" }, { jp: "警官", reading: "けいかん", meaning: "police officer" }, { jp: "官僚", reading: "かんりょう", meaning: "bureaucrat" }, { jp: "長官", reading: "ちょうかん", meaning: "director, chief" }] },
            { kanji: "管", reading: "くだ", romaji: "kuda", meaning: "Pipe, Control", region: "Noun", kunYomi: ["くだ"], onYomi: ["かん"], compounds: [{ jp: "管理", reading: "かんり", meaning: "management, control" }, { jp: "管轄", reading: "かんかつ", meaning: "jurisdiction" }, { jp: "血管", reading: "けっかん", meaning: "blood vessel" }, { jp: "水道管", reading: "すいどうかん", meaning: "water pipe" }] },
            { kanji: "関", reading: "せき", romaji: "seki", meaning: "Related, Barrier", region: "Noun", kunYomi: ["せき", "かか"], onYomi: ["かん"], compounds: [{ jp: "関係", reading: "かんけい", meaning: "relation, connection" }, { jp: "関心", reading: "かんしん", meaning: "interest, concern" }, { jp: "関連", reading: "かんれん", meaning: "relation" }, { jp: "玄関", reading: "げんかん", meaning: "entrance, foyer" }] },
            { kanji: "観", reading: "みる", romaji: "miru", meaning: "View, Observe", region: "Verb", kunYomi: ["み"], onYomi: ["かん"], compounds: [{ jp: "観る", reading: "みる", meaning: "to watch, observe" }, { jp: "観光", reading: "かんこう", meaning: "sightseeing" }, { jp: "観察", reading: "かんさつ", meaning: "observation" }, { jp: "観客", reading: "かんきゃく", meaning: "audience" }] },
            { kanji: "願", reading: "ねがう", romaji: "negau", meaning: "Wish, Request", region: "Verb", kunYomi: ["ねが"], onYomi: ["がん"], compounds: [{ jp: "願う", reading: "ねがう", meaning: "to wish, request" }, { jp: "願望", reading: "がんぼう", meaning: "desire, wish" }, { jp: "志願", reading: "しがん", meaning: "application" }, { jp: "念願", reading: "ねんがん", meaning: "long-cherished wish" }] },
            { kanji: "希", reading: "まれ", romaji: "mare", meaning: "Rare, Hope", region: "Adjective", kunYomi: ["まれ"], onYomi: ["き"], compounds: [{ jp: "希望", reading: "きぼう", meaning: "hope, wish" }, { jp: "希少", reading: "きしょう", meaning: "rare, scarce" }, { jp: "希有", reading: "けう", meaning: "rare, uncommon" }, { jp: "希薄", reading: "きはく", meaning: "thin, dilute" }] },
            { kanji: "季", reading: "き", romaji: "ki", meaning: "Season", region: "Noun", kunYomi: ["—"], onYomi: ["き"], compounds: [{ jp: "季節", reading: "きせつ", meaning: "season" }, { jp: "四季", reading: "しき", meaning: "four seasons" }, { jp: "季語", reading: "きご", meaning: "seasonal word in haiku" }, { jp: "雨季", reading: "うき", meaning: "rainy season" }] },
            { kanji: "旗", reading: "はた", romaji: "hata", meaning: "Flag, Banner", region: "Noun", kunYomi: ["はた"], onYomi: ["き"], compounds: [{ jp: "旗", reading: "はた", meaning: "flag, banner" }, { jp: "国旗", reading: "こっき", meaning: "national flag" }, { jp: "旗手", reading: "きしゅ", meaning: "flag bearer" }, { jp: "旗印", reading: "はたじるし", meaning: "banner, emblem" }] },
            { kanji: "器", reading: "うつわ", romaji: "utsuwa", meaning: "Container, Vessel", region: "Noun", kunYomi: ["うつわ"], onYomi: ["き"], compounds: [{ jp: "器", reading: "うつわ", meaning: "container, vessel" }, { jp: "機器", reading: "きき", meaning: "equipment" }, { jp: "武器", reading: "ぶき", meaning: "weapon" }, { jp: "食器", reading: "しょっき", meaning: "tableware" }] },
            { kanji: "機", reading: "はた", romaji: "hata", meaning: "Machine, Opportunity", region: "Noun", kunYomi: ["はた"], onYomi: ["き"], compounds: [{ jp: "機会", reading: "きかい", meaning: "opportunity, chance" }, { jp: "飛行機", reading: "ひこうき", meaning: "airplane" }, { jp: "機械", reading: "きかい", meaning: "machine" }, { jp: "動機", reading: "どうき", meaning: "motive" }] },
            { kanji: "議", reading: "ぎ", romaji: "gi", meaning: "Discuss, Deliberate", region: "Verb", kunYomi: ["—"], onYomi: ["ぎ"], compounds: [{ jp: "会議", reading: "かいぎ", meaning: "meeting, conference" }, { jp: "議論", reading: "ぎろん", meaning: "argument, discussion" }, { jp: "議員", reading: "ぎいん", meaning: "member of parliament" }, { jp: "審議", reading: "しんぎ", meaning: "deliberation" }] },
            { kanji: "求", reading: "もとめる", romaji: "motomeru", meaning: "Seek, Request", region: "Verb", kunYomi: ["もと"], onYomi: ["きゅう"], compounds: [{ jp: "求める", reading: "もとめる", meaning: "to seek, request" }, { jp: "要求", reading: "ようきゅう", meaning: "demand, request" }, { jp: "求職", reading: "きゅうしょく", meaning: "job hunting" }, { jp: "追求", reading: "ついきゅう", meaning: "pursuit" }] },
            { kanji: "泣", reading: "なく", romaji: "naku", meaning: "Cry, Weep", region: "Verb", kunYomi: ["な"], onYomi: ["きゅう"], compounds: [{ jp: "泣く", reading: "なく", meaning: "to cry, weep" }, { jp: "泣き声", reading: "なきごえ", meaning: "crying voice" }, { jp: "感泣", reading: "かんきゅう", meaning: "crying from emotion" }, { jp: "号泣", reading: "ごうきゅう", meaning: "sobbing, wailing" }] },
            { kanji: "給", reading: "きゅう", romaji: "kyuu", meaning: "Supply, Salary", region: "Noun", kunYomi: ["—"], onYomi: ["きゅう"], compounds: [{ jp: "給料", reading: "きゅうりょう", meaning: "salary" }, { jp: "給食", reading: "きゅうしょく", meaning: "school lunch" }, { jp: "補給", reading: "ほきゅう", meaning: "supply, replenishment" }, { jp: "給与", reading: "きゅうよ", meaning: "wages" }] },
            { kanji: "挙", reading: "あげる", romaji: "ageru", meaning: "Raise, List", region: "Verb", kunYomi: ["あ"], onYomi: ["きょ"], compounds: [{ jp: "挙げる", reading: "あげる", meaning: "to raise, list" }, { jp: "選挙", reading: "せんきょ", meaning: "election" }, { jp: "挙動", reading: "きょどう", meaning: "behavior, conduct" }, { jp: "一挙", reading: "いっきょ", meaning: "one stroke, at once" }] },
            { kanji: "漁", reading: "りょう", romaji: "ryou", meaning: "Fishing", region: "Noun", kunYomi: ["りょう", "あさ"], onYomi: ["ぎょ", "りょう"], compounds: [{ jp: "漁業", reading: "ぎょぎょう", meaning: "fishing industry" }, { jp: "漁師", reading: "りょうし", meaning: "fisherman" }, { jp: "漁港", reading: "ぎょこう", meaning: "fishing port" }, { jp: "漁船", reading: "ぎょせん", meaning: "fishing boat" }] },
            { kanji: "共", reading: "ともに", romaji: "tomoni", meaning: "Together, Both", region: "Noun", kunYomi: ["とも"], onYomi: ["きょう"], compounds: [{ jp: "共に", reading: "ともに", meaning: "together" }, { jp: "共通", reading: "きょうつう", meaning: "common, shared" }, { jp: "共同", reading: "きょうどう", meaning: "joint, cooperative" }, { jp: "公共", reading: "こうきょう", meaning: "public" }] },
            { kanji: "協", reading: "きょう", romaji: "kyou", meaning: "Cooperate", region: "Verb", kunYomi: ["—"], onYomi: ["きょう"], compounds: [{ jp: "協力", reading: "きょうりょく", meaning: "cooperation" }, { jp: "協議", reading: "きょうぎ", meaning: "consultation" }, { jp: "協会", reading: "きょうかい", meaning: "association" }, { jp: "妥協", reading: "だきょう", meaning: "compromise" }] },
            { kanji: "鏡", reading: "かがみ", romaji: "kagami", meaning: "Mirror", region: "Noun", kunYomi: ["かがみ"], onYomi: ["きょう"], compounds: [{ jp: "鏡", reading: "かがみ", meaning: "mirror" }, { jp: "眼鏡", reading: "めがね", meaning: "glasses" }, { jp: "望遠鏡", reading: "ぼうえんきょう", meaning: "telescope" }, { jp: "顕微鏡", reading: "けんびきょう", meaning: "microscope" }] },
            { kanji: "競", reading: "きそう", romaji: "kisou", meaning: "Compete, Race", region: "Verb", kunYomi: ["きそ", "せ"], onYomi: ["きょう", "けい"], compounds: [{ jp: "競争", reading: "きょうそう", meaning: "competition" }, { jp: "競技", reading: "きょうぎ", meaning: "athletic event" }, { jp: "競走", reading: "きょうそう", meaning: "race" }, { jp: "競馬", reading: "けいば", meaning: "horse racing" }] },
            { kanji: "極", reading: "きわめる", romaji: "kiwameru", meaning: "Extreme, Pole", region: "Noun", kunYomi: ["きわ"], onYomi: ["きょく", "ごく"], compounds: [{ jp: "極める", reading: "きわめる", meaning: "to master, reach extreme" }, { jp: "極端", reading: "きょくたん", meaning: "extreme" }, { jp: "南極", reading: "なんきょく", meaning: "South Pole" }, { jp: "積極的", reading: "せっきょくてき", meaning: "positive, proactive" }] },
            { kanji: "訓", reading: "くん", romaji: "kun", meaning: "Instruction, Reading", region: "Noun", kunYomi: ["—"], onYomi: ["くん"], compounds: [{ jp: "訓練", reading: "くんれん", meaning: "training, drill" }, { jp: "訓読み", reading: "くんよみ", meaning: "kun reading" }, { jp: "教訓", reading: "きょうくん", meaning: "lesson, moral" }, { jp: "訓示", reading: "くんじ", meaning: "instruction, directive" }] },
            { kanji: "軍", reading: "ぐん", romaji: "gun", meaning: "Military, Army", region: "Noun", kunYomi: ["—"], onYomi: ["ぐん"], compounds: [{ jp: "軍隊", reading: "ぐんたい", meaning: "military, army" }, { jp: "軍人", reading: "ぐんじん", meaning: "soldier, military person" }, { jp: "海軍", reading: "かいぐん", meaning: "navy" }, { jp: "空軍", reading: "くうぐん", meaning: "air force" }] },
            { kanji: "郡", reading: "ぐん", romaji: "gun", meaning: "County, District", region: "Noun", kunYomi: ["—"], onYomi: ["ぐん"], compounds: [{ jp: "郡", reading: "ぐん", meaning: "county, district" }, { jp: "郡部", reading: "ぐんぶ", meaning: "rural area" }, { jp: "郡山", reading: "こおりやま", meaning: "Koriyama city" }, { jp: "郡界", reading: "ぐんかい", meaning: "county boundary" }] },
            { kanji: "径", reading: "みち", romaji: "michi", meaning: "Path, Diameter", region: "Noun", kunYomi: ["みち"], onYomi: ["けい"], compounds: [{ jp: "直径", reading: "ちょっけい", meaning: "diameter" }, { jp: "半径", reading: "はんけい", meaning: "radius" }, { jp: "径路", reading: "けいろ", meaning: "path, route" }, { jp: "口径", reading: "こうけい", meaning: "caliber, bore" }] },
            { kanji: "型", reading: "かた", romaji: "kata", meaning: "Model, Type", region: "Noun", kunYomi: ["かた"], onYomi: ["けい"], compounds: [{ jp: "型", reading: "かた", meaning: "model, type, mold" }, { jp: "体型", reading: "たいけい", meaning: "body type" }, { jp: "大型", reading: "おおがた", meaning: "large-scale" }, { jp: "新型", reading: "しんがた", meaning: "new model" }] },
        ] },
    { id: "grade_4_kanji_level_2", label: "Level 2", sublabel: "Elementary Grade 4 · 50 cards", emoji: "📗", group: "grade_4", mode: "formal", category_key: "formal_grade_grade_4", cards: [
            { kanji: "景", reading: "けい", romaji: "kei", meaning: "Scenery, View", region: "Noun", kunYomi: ["—"], onYomi: ["けい"], compounds: [{ jp: "景色", reading: "けしき", meaning: "scenery, view" }, { jp: "風景", reading: "ふうけい", meaning: "landscape" }, { jp: "背景", reading: "はいけい", meaning: "background" }, { jp: "景気", reading: "けいき", meaning: "economic conditions" }] },
            { kanji: "芸", reading: "げい", romaji: "gei", meaning: "Art, Skill", region: "Noun", kunYomi: ["—"], onYomi: ["げい"], compounds: [{ jp: "芸術", reading: "げいじゅつ", meaning: "art" }, { jp: "芸能", reading: "げいのう", meaning: "performing arts" }, { jp: "工芸", reading: "こうげい", meaning: "craft, handicraft" }, { jp: "芸人", reading: "げいにん", meaning: "entertainer" }] },
            { kanji: "欠", reading: "かける", romaji: "kakeru", meaning: "Lack, Miss", region: "Verb", kunYomi: ["か", "か"], onYomi: ["けつ"], compounds: [{ jp: "欠ける", reading: "かける", meaning: "to be lacking" }, { jp: "欠席", reading: "けっせき", meaning: "absence" }, { jp: "欠点", reading: "けってん", meaning: "flaw, weakness" }, { jp: "不欠", reading: "ふけつ", meaning: "without fail" }] },
            { kanji: "結", reading: "むすぶ", romaji: "musubu", meaning: "Tie, Result", region: "Verb", kunYomi: ["むす", "ゆ"], onYomi: ["けつ"], compounds: [{ jp: "結ぶ", reading: "むすぶ", meaning: "to tie, connect" }, { jp: "結果", reading: "けっか", meaning: "result" }, { jp: "結婚", reading: "けっこん", meaning: "marriage" }, { jp: "団結", reading: "だんけつ", meaning: "unity, solidarity" }] },
            { kanji: "建", reading: "たてる", romaji: "tateru", meaning: "Build, Establish", region: "Verb", kunYomi: ["た", "たて"], onYomi: ["けん"], compounds: [{ jp: "建てる", reading: "たてる", meaning: "to build" }, { jp: "建物", reading: "たてもの", meaning: "building" }, { jp: "建設", reading: "けんせつ", meaning: "construction" }, { jp: "建築", reading: "けんちく", meaning: "architecture" }] },
            { kanji: "験", reading: "けん", romaji: "ken", meaning: "Test, Experience", region: "Noun", kunYomi: ["—"], onYomi: ["けん", "げん"], compounds: [{ jp: "試験", reading: "しけん", meaning: "exam, test" }, { jp: "経験", reading: "けいけん", meaning: "experience" }, { jp: "実験", reading: "じっけん", meaning: "experiment" }, { jp: "受験", reading: "じゅけん", meaning: "taking an exam" }] },
            { kanji: "固", reading: "かたい", romaji: "katai", meaning: "Hard, Firm", region: "Adjective", kunYomi: ["かた"], onYomi: ["こ"], compounds: [{ jp: "固い", reading: "かたい", meaning: "hard, firm" }, { jp: "固定", reading: "こてい", meaning: "fixed, stationary" }, { jp: "固有", reading: "こゆう", meaning: "unique, characteristic" }, { jp: "頑固", reading: "がんこ", meaning: "stubborn" }] },
            { kanji: "功", reading: "こう", romaji: "kou", meaning: "Achievement, Merit", region: "Noun", kunYomi: ["—"], onYomi: ["こう", "く"], compounds: [{ jp: "功績", reading: "こうせき", meaning: "achievement, merit" }, { jp: "成功", reading: "せいこう", meaning: "success" }, { jp: "功労", reading: "こうろう", meaning: "meritorious service" }, { jp: "武功", reading: "ぶこう", meaning: "military exploit" }] },
            { kanji: "好", reading: "すき", romaji: "suki", meaning: "Like, Fond", region: "Verb", kunYomi: ["す", "この"], onYomi: ["こう"], compounds: [{ jp: "好き", reading: "すき", meaning: "like, fond of" }, { jp: "好意", reading: "こうい", meaning: "goodwill, kindness" }, { jp: "好奇心", reading: "こうきしん", meaning: "curiosity" }, { jp: "友好", reading: "ゆうこう", meaning: "friendship" }] },
            { kanji: "候", reading: "そうろう", romaji: "sourou", meaning: "Season, Weather", region: "Noun", kunYomi: ["そうろう"], onYomi: ["こう"], compounds: [{ jp: "気候", reading: "きこう", meaning: "climate" }, { jp: "候補", reading: "こうほ", meaning: "candidate" }, { jp: "時候", reading: "じこう", meaning: "season, climate" }, { jp: "兆候", reading: "ちょうこう", meaning: "sign, symptom" }] },
            { kanji: "航", reading: "こう", romaji: "kou", meaning: "Navigate, Sail", region: "Verb", kunYomi: ["—"], onYomi: ["こう"], compounds: [{ jp: "航空", reading: "こうくう", meaning: "aviation" }, { jp: "航海", reading: "こうかい", meaning: "voyage, navigation" }, { jp: "航路", reading: "こうろ", meaning: "sea route" }, { jp: "就航", reading: "しゅうこう", meaning: "going into service" }] },
            { kanji: "康", reading: "こう", romaji: "kou", meaning: "Health, Peace", region: "Noun", kunYomi: ["—"], onYomi: ["こう"], compounds: [{ jp: "健康", reading: "けんこう", meaning: "health" }, { jp: "康復", reading: "こうふく", meaning: "recovery" }, { jp: "小康", reading: "しょうこう", meaning: "temporary calm" }, { jp: "康平", reading: "こうへい", meaning: "peaceful" }] },
            { kanji: "告", reading: "つげる", romaji: "tsugeru", meaning: "Announce, Tell", region: "Verb", kunYomi: ["つ"], onYomi: ["こく"], compounds: [{ jp: "告げる", reading: "つげる", meaning: "to announce, tell" }, { jp: "報告", reading: "ほうこく", meaning: "report" }, { jp: "広告", reading: "こうこく", meaning: "advertisement" }, { jp: "警告", reading: "けいこく", meaning: "warning" }] },
            { kanji: "差", reading: "さす", romaji: "sasu", meaning: "Difference, Insert", region: "Noun", kunYomi: ["さ"], onYomi: ["さ"], compounds: [{ jp: "差", reading: "さ", meaning: "difference" }, { jp: "差別", reading: "さべつ", meaning: "discrimination" }, { jp: "差し上げる", reading: "さしあげる", meaning: "to give (polite)" }, { jp: "誤差", reading: "ごさ", meaning: "error, margin" }] },
            { kanji: "菜", reading: "な", romaji: "na", meaning: "Vegetable, Greens", region: "Noun", kunYomi: ["な"], onYomi: ["さい"], compounds: [{ jp: "野菜", reading: "やさい", meaning: "vegetable" }, { jp: "菜の花", reading: "なのはな", meaning: "rapeseed flower" }, { jp: "白菜", reading: "はくさい", meaning: "Chinese cabbage" }, { jp: "菜食", reading: "さいしょく", meaning: "vegetarian diet" }] },
            { kanji: "最", reading: "もっとも", romaji: "mottomo", meaning: "Most, Extreme", region: "Adverb", kunYomi: ["もっと"], onYomi: ["さい"], compounds: [{ jp: "最も", reading: "もっとも", meaning: "most" }, { jp: "最高", reading: "さいこう", meaning: "highest, best" }, { jp: "最後", reading: "さいご", meaning: "last, final" }, { jp: "最近", reading: "さいきん", meaning: "recently" }] },
            { kanji: "材", reading: "ざい", romaji: "zai", meaning: "Material, Timber", region: "Noun", kunYomi: ["—"], onYomi: ["ざい"], compounds: [{ jp: "材料", reading: "ざいりょう", meaning: "materials" }, { jp: "木材", reading: "もくざい", meaning: "lumber, timber" }, { jp: "人材", reading: "じんざい", meaning: "human resources" }, { jp: "素材", reading: "そざい", meaning: "raw material" }] },
            { kanji: "昨", reading: "さく", romaji: "saku", meaning: "Yesterday, Previous", region: "Noun", kunYomi: ["—"], onYomi: ["さく"], compounds: [{ jp: "昨日", reading: "きのう", meaning: "yesterday" }, { jp: "昨年", reading: "さくねん", meaning: "last year" }, { jp: "昨夜", reading: "さくや", meaning: "last night" }, { jp: "昨今", reading: "さっこん", meaning: "nowadays, recently" }] },
            { kanji: "刷", reading: "する", romaji: "suru", meaning: "Print, Brush", region: "Verb", kunYomi: ["す"], onYomi: ["さつ"], compounds: [{ jp: "印刷", reading: "いんさつ", meaning: "printing" }, { jp: "刷る", reading: "する", meaning: "to print" }, { jp: "刷新", reading: "さっしん", meaning: "reform, renewal" }, { jp: "増刷", reading: "ぞうさつ", meaning: "additional printing" }] },
            { kanji: "察", reading: "さっする", romaji: "sassuru", meaning: "Guess, Inspect", region: "Verb", kunYomi: ["—"], onYomi: ["さつ"], compounds: [{ jp: "観察", reading: "かんさつ", meaning: "observation" }, { jp: "警察", reading: "けいさつ", meaning: "police" }, { jp: "察する", reading: "さっする", meaning: "to guess, sense" }, { jp: "視察", reading: "しさつ", meaning: "inspection" }] },
            { kanji: "参", reading: "まいる", romaji: "mairu", meaning: "Visit, Attend", region: "Verb", kunYomi: ["まい"], onYomi: ["さん", "しん"], compounds: [{ jp: "参加", reading: "さんか", meaning: "participation" }, { jp: "参考", reading: "さんこう", meaning: "reference" }, { jp: "参拝", reading: "さんぱい", meaning: "shrine visit" }, { jp: "参照", reading: "さんしょう", meaning: "reference, consultation" }] },
            { kanji: "散", reading: "ちらす", romaji: "chirasu", meaning: "Scatter, Disperse", region: "Verb", kunYomi: ["ち"], onYomi: ["さん"], compounds: [{ jp: "散る", reading: "ちる", meaning: "to scatter, fall" }, { jp: "散歩", reading: "さんぽ", meaning: "walk, stroll" }, { jp: "解散", reading: "かいさん", meaning: "dissolution" }, { jp: "分散", reading: "ぶんさん", meaning: "dispersion" }] },
            { kanji: "産", reading: "うむ", romaji: "umu", meaning: "Produce, Birth", region: "Verb", kunYomi: ["う", "うぶ"], onYomi: ["さん"], compounds: [{ jp: "産む", reading: "うむ", meaning: "to give birth" }, { jp: "生産", reading: "せいさん", meaning: "production" }, { jp: "産業", reading: "さんぎょう", meaning: "industry" }, { jp: "遺産", reading: "いさん", meaning: "legacy, heritage" }] },
            { kanji: "残", reading: "のこる", romaji: "nokoru", meaning: "Remain, Leftover", region: "Verb", kunYomi: ["のこ"], onYomi: ["ざん"], compounds: [{ jp: "残る", reading: "のこる", meaning: "to remain" }, { jp: "残業", reading: "ざんぎょう", meaning: "overtime" }, { jp: "残念", reading: "ざんねん", meaning: "regrettable" }, { jp: "残高", reading: "ざんだか", meaning: "balance, remainder" }] },
            { kanji: "氏", reading: "うじ", romaji: "uji", meaning: "Family Name, Mr.", region: "Noun", kunYomi: ["うじ"], onYomi: ["し"], compounds: [{ jp: "氏名", reading: "しめい", meaning: "full name" }, { jp: "氏", reading: "し", meaning: "Mr., Ms." }, { jp: "源氏", reading: "げんじ", meaning: "Genji clan" }, { jp: "同氏", reading: "どうし", meaning: "the same person" }] },
            { kanji: "試", reading: "こころみる", romaji: "kokoromiru", meaning: "Try, Test", region: "Verb", kunYomi: ["こころ", "ため"], onYomi: ["し"], compounds: [{ jp: "試みる", reading: "こころみる", meaning: "to try, attempt" }, { jp: "試験", reading: "しけん", meaning: "exam, test" }, { jp: "試合", reading: "しあい", meaning: "match, game" }, { jp: "試練", reading: "しれん", meaning: "trial, ordeal" }] },
            { kanji: "失", reading: "うしなう", romaji: "ushinau", meaning: "Lose, Miss", region: "Verb", kunYomi: ["うしな"], onYomi: ["しつ"], compounds: [{ jp: "失う", reading: "うしなう", meaning: "to lose" }, { jp: "失敗", reading: "しっぱい", meaning: "failure" }, { jp: "失望", reading: "しつぼう", meaning: "disappointment" }, { jp: "紛失", reading: "ふんしつ", meaning: "loss, misplacement" }] },
            { kanji: "辞", reading: "やめる", romaji: "yameru", meaning: "Resign, Word", region: "Verb", kunYomi: ["や"], onYomi: ["じ"], compounds: [{ jp: "辞める", reading: "やめる", meaning: "to resign, quit" }, { jp: "辞書", reading: "じしょ", meaning: "dictionary" }, { jp: "辞典", reading: "じてん", meaning: "dictionary, encyclopedia" }, { jp: "辞表", reading: "じひょう", meaning: "letter of resignation" }] },
            { kanji: "児", reading: "こ", romaji: "ko", meaning: "Child", region: "Noun", kunYomi: ["こ"], onYomi: ["じ", "に"], compounds: [{ jp: "児童", reading: "じどう", meaning: "child, juvenile" }, { jp: "幼児", reading: "ようじ", meaning: "infant, toddler" }, { jp: "孤児", reading: "こじ", meaning: "orphan" }, { jp: "育児", reading: "いくじ", meaning: "childcare" }] },
            { kanji: "治", reading: "なおす", romaji: "naosu", meaning: "Cure, Govern", region: "Verb", kunYomi: ["なお", "おさ"], onYomi: ["じ", "ち"], compounds: [{ jp: "治す", reading: "なおす", meaning: "to cure, heal" }, { jp: "治療", reading: "ちりょう", meaning: "treatment, therapy" }, { jp: "政治", reading: "せいじ", meaning: "politics" }, { jp: "統治", reading: "とうち", meaning: "rule, governance" }] },
            { kanji: "滋", reading: "しげる", romaji: "shigeru", meaning: "Nourish, Lush", region: "Verb", kunYomi: ["しげ"], onYomi: ["じ"], compounds: [{ jp: "滋養", reading: "じよう", meaning: "nourishment" }, { jp: "滋賀", reading: "しが", meaning: "Shiga prefecture" }, { jp: "滋味", reading: "じみ", meaning: "nourishing taste" }, { jp: "滋潤", reading: "じじゅん", meaning: "moist, nourishing" }] },
            { kanji: "鹿", reading: "しか", romaji: "shika", meaning: "Deer", region: "Noun", kunYomi: ["しか", "か"], onYomi: ["ろく"], compounds: [{ jp: "鹿", reading: "しか", meaning: "deer" }, { jp: "鹿島", reading: "かしま", meaning: "Kashima" }, { jp: "馬鹿", reading: "ばか", meaning: "fool, idiot" }, { jp: "鹿児島", reading: "かごしま", meaning: "Kagoshima" }] },
            { kanji: "城", reading: "しろ", romaji: "shiro", meaning: "Castle", region: "Noun", kunYomi: ["しろ", "き"], onYomi: ["じょう"], compounds: [{ jp: "城", reading: "しろ", meaning: "castle" }, { jp: "城下", reading: "じょうか", meaning: "castle town" }, { jp: "宮城", reading: "みやぎ", meaning: "Miyagi prefecture" }, { jp: "城壁", reading: "じょうへき", meaning: "castle wall" }] },
            { kanji: "示", reading: "しめす", romaji: "shimesu", meaning: "Show, Indicate", region: "Verb", kunYomi: ["しめ"], onYomi: ["し", "じ"], compounds: [{ jp: "示す", reading: "しめす", meaning: "to show, indicate" }, { jp: "指示", reading: "しじ", meaning: "instruction, direction" }, { jp: "展示", reading: "てんじ", meaning: "display, exhibition" }, { jp: "示唆", reading: "しさ", meaning: "suggestion, hint" }] },
            { kanji: "種", reading: "たね", romaji: "tane", meaning: "Seed, Kind", region: "Noun", kunYomi: ["たね"], onYomi: ["しゅ"], compounds: [{ jp: "種", reading: "たね", meaning: "seed, kind" }, { jp: "種類", reading: "しゅるい", meaning: "type, kind" }, { jp: "人種", reading: "じんしゅ", meaning: "race, ethnicity" }, { jp: "品種", reading: "ひんしゅ", meaning: "variety, breed" }] },
            { kanji: "周", reading: "まわり", romaji: "mawari", meaning: "Circumference, Around", region: "Noun", kunYomi: ["まわ"], onYomi: ["しゅう"], compounds: [{ jp: "周り", reading: "まわり", meaning: "surroundings, around" }, { jp: "周囲", reading: "しゅうい", meaning: "circumference, surroundings" }, { jp: "周期", reading: "しゅうき", meaning: "period, cycle" }, { jp: "一周", reading: "いっしゅう", meaning: "one round, one lap" }] },
            { kanji: "祝", reading: "いわう", romaji: "iwau", meaning: "Celebrate, Congratulate", region: "Verb", kunYomi: ["いわ"], onYomi: ["しゅく", "しゅう"], compounds: [{ jp: "祝う", reading: "いわう", meaning: "to celebrate" }, { jp: "祝日", reading: "しゅくじつ", meaning: "national holiday" }, { jp: "祝福", reading: "しゅくふく", meaning: "blessing" }, { jp: "お祝い", reading: "おいわい", meaning: "celebration, gift" }] },
            { kanji: "順", reading: "じゅん", romaji: "jun", meaning: "Order, Obedient", region: "Noun", kunYomi: ["—"], onYomi: ["じゅん"], compounds: [{ jp: "順番", reading: "じゅんばん", meaning: "turn, order" }, { jp: "順序", reading: "じゅんじょ", meaning: "order, sequence" }, { jp: "順調", reading: "じゅんちょう", meaning: "smooth, going well" }, { jp: "従順", reading: "じゅうじゅん", meaning: "obedient, docile" }] },
            { kanji: "初", reading: "はじめ", romaji: "hajime", meaning: "First, Beginning", region: "Noun", kunYomi: ["はじ", "うい", "そ", "はつ"], onYomi: ["しょ"], compounds: [{ jp: "初め", reading: "はじめ", meaning: "beginning, first" }, { jp: "最初", reading: "さいしょ", meaning: "first, at first" }, { jp: "初めて", reading: "はじめて", meaning: "for the first time" }, { jp: "初心者", reading: "しょしんしゃ", meaning: "beginner" }] },
            { kanji: "松", reading: "まつ", romaji: "matsu", meaning: "Pine Tree", region: "Noun", kunYomi: ["まつ"], onYomi: ["しょう"], compounds: [{ jp: "松", reading: "まつ", meaning: "pine tree" }, { jp: "松林", reading: "まつばやし", meaning: "pine forest" }, { jp: "門松", reading: "かどまつ", meaning: "New Year's pine decoration" }, { jp: "松茸", reading: "まつたけ", meaning: "matsutake mushroom" }] },
            { kanji: "笑", reading: "わらう", romaji: "warau", meaning: "Laugh, Smile", region: "Verb", kunYomi: ["わら", "え"], onYomi: ["しょう"], compounds: [{ jp: "笑う", reading: "わらう", meaning: "to laugh, smile" }, { jp: "笑顔", reading: "えがお", meaning: "smiling face" }, { jp: "苦笑", reading: "くしょう", meaning: "wry smile" }, { jp: "爆笑", reading: "ばくしょう", meaning: "burst of laughter" }] },
            { kanji: "唱", reading: "となえる", romaji: "tonaeru", meaning: "Recite, Chant", region: "Verb", kunYomi: ["とな"], onYomi: ["しょう"], compounds: [{ jp: "唱える", reading: "となえる", meaning: "to recite, chant" }, { jp: "合唱", reading: "がっしょう", meaning: "chorus, choir" }, { jp: "独唱", reading: "どくしょう", meaning: "solo singing" }, { jp: "提唱", reading: "ていしょう", meaning: "advocacy, proposal" }] },
            { kanji: "焼", reading: "やく", romaji: "yaku", meaning: "Burn, Bake", region: "Verb", kunYomi: ["や"], onYomi: ["しょう"], compounds: [{ jp: "焼く", reading: "やく", meaning: "to burn, bake" }, { jp: "焼き肉", reading: "やきにく", meaning: "grilled meat" }, { jp: "全焼", reading: "ぜんしょう", meaning: "completely burned" }, { jp: "焼却", reading: "しょうきゃく", meaning: "incineration" }] },
            { kanji: "象", reading: "ぞう", romaji: "zou", meaning: "Elephant, Image", region: "Noun", kunYomi: ["—"], onYomi: ["しょう", "ぞう"], compounds: [{ jp: "象", reading: "ぞう", meaning: "elephant" }, { jp: "象徴", reading: "しょうちょう", meaning: "symbol" }, { jp: "印象", reading: "いんしょう", meaning: "impression" }, { jp: "現象", reading: "げんしょう", meaning: "phenomenon" }] },
            { kanji: "照", reading: "てらす", romaji: "terasu", meaning: "Shine, Illuminate", region: "Verb", kunYomi: ["て", "てら"], onYomi: ["しょう"], compounds: [{ jp: "照らす", reading: "てらす", meaning: "to illuminate" }, { jp: "照明", reading: "しょうめい", meaning: "lighting, illumination" }, { jp: "参照", reading: "さんしょう", meaning: "reference" }, { jp: "対照", reading: "たいしょう", meaning: "contrast" }] },
            { kanji: "賞", reading: "しょう", romaji: "shou", meaning: "Prize, Reward", region: "Noun", kunYomi: ["—"], onYomi: ["しょう"], compounds: [{ jp: "賞", reading: "しょう", meaning: "prize, reward" }, { jp: "受賞", reading: "じゅしょう", meaning: "winning a prize" }, { jp: "賞金", reading: "しょうきん", meaning: "prize money" }, { jp: "入賞", reading: "にゅうしょう", meaning: "winning a prize" }] },
            { kanji: "信", reading: "しんじる", romaji: "shinjiru", meaning: "Believe, Trust", region: "Verb", kunYomi: ["—"], onYomi: ["しん"], compounds: [{ jp: "信じる", reading: "しんじる", meaning: "to believe, trust" }, { jp: "信頼", reading: "しんらい", meaning: "trust, reliance" }, { jp: "自信", reading: "じしん", meaning: "self-confidence" }, { jp: "信号", reading: "しんごう", meaning: "traffic signal" }] },
            { kanji: "成", reading: "なる", romaji: "naru", meaning: "Become, Succeed", region: "Verb", kunYomi: ["な"], onYomi: ["せい", "じょう"], compounds: [{ jp: "成る", reading: "なる", meaning: "to become" }, { jp: "成功", reading: "せいこう", meaning: "success" }, { jp: "成長", reading: "せいちょう", meaning: "growth" }, { jp: "完成", reading: "かんせい", meaning: "completion" }] },
            { kanji: "費", reading: "ついやす", romaji: "tsuiyasu", meaning: "Expense, Spend", region: "Noun", kunYomi: ["つい", "ひ"], onYomi: ["ひ"], compounds: [{ jp: "費用", reading: "ひよう", meaning: "expense, cost" }, { jp: "消費", reading: "しょうひ", meaning: "consumption" }, { jp: "旅費", reading: "りょひ", meaning: "travel expenses" }, { jp: "学費", reading: "がくひ", meaning: "school fees" }] },
            { kanji: "必", reading: "かならず", romaji: "kanarazu", meaning: "Necessarily, Must", region: "Adverb", kunYomi: ["かなら"], onYomi: ["ひつ"], compounds: [{ jp: "必ず", reading: "かならず", meaning: "certainly, without fail" }, { jp: "必要", reading: "ひつよう", meaning: "necessary" }, { jp: "必死", reading: "ひっし", meaning: "desperate" }, { jp: "必勝", reading: "ひっしょう", meaning: "certain victory" }] },
        ] },
    { id: "grade_4_kanji_level_3", label: "Level 3", sublabel: "Elementary Grade 4 · 50 cards", emoji: "📗", group: "grade_4", mode: "formal", category_key: "formal_grade_grade_4", cards: [
            { kanji: "省", reading: "はぶく", romaji: "habuku", meaning: "Omit, Ministry", region: "Verb", kunYomi: ["はぶ", "かえり"], onYomi: ["しょう", "せい"], compounds: [{ jp: "省く", reading: "はぶく", meaning: "to omit, save" }, { jp: "省エネ", reading: "しょうえね", meaning: "energy saving" }, { jp: "文部省", reading: "もんぶしょう", meaning: "Ministry of Education" }, { jp: "反省", reading: "はんせい", meaning: "reflection, reconsideration" }] },
            { kanji: "清", reading: "きよい", romaji: "kiyoi", meaning: "Clean, Pure", region: "Adjective", kunYomi: ["きよ"], onYomi: ["せい", "しん"], compounds: [{ jp: "清い", reading: "きよい", meaning: "clean, pure" }, { jp: "清潔", reading: "せいけつ", meaning: "cleanliness, hygiene" }, { jp: "清掃", reading: "せいそう", meaning: "cleaning, sweeping" }, { jp: "清水", reading: "しみず", meaning: "clean water, spring water" }] },
            { kanji: "静", reading: "しずか", romaji: "shizuka", meaning: "Quiet, Calm", region: "Adjective", kunYomi: ["しず"], onYomi: ["せい", "じょう"], compounds: [{ jp: "静か", reading: "しずか", meaning: "quiet, calm" }, { jp: "静止", reading: "せいし", meaning: "stillness, halt" }, { jp: "平静", reading: "へいせい", meaning: "calm, composure" }, { jp: "静脈", reading: "じょうみゃく", meaning: "vein" }] },
            { kanji: "席", reading: "せき", romaji: "seki", meaning: "Seat, Place", region: "Noun", kunYomi: ["—"], onYomi: ["せき"], compounds: [{ jp: "席", reading: "せき", meaning: "seat, place" }, { jp: "出席", reading: "しゅっせき", meaning: "attendance" }, { jp: "欠席", reading: "けっせき", meaning: "absence" }, { jp: "主席", reading: "しゅせき", meaning: "chief, president" }] },
            { kanji: "積", reading: "つむ", romaji: "tsumu", meaning: "Pile up, Accumulate", region: "Verb", kunYomi: ["つ"], onYomi: ["せき"], compounds: [{ jp: "積む", reading: "つむ", meaning: "to pile up, accumulate" }, { jp: "積極的", reading: "せっきょくてき", meaning: "positive, proactive" }, { jp: "面積", reading: "めんせき", meaning: "area, surface" }, { jp: "蓄積", reading: "ちくせき", meaning: "accumulation" }] },
            { kanji: "折", reading: "おる", romaji: "oru", meaning: "Fold, Break", region: "Verb", kunYomi: ["お"], onYomi: ["せつ"], compounds: [{ jp: "折る", reading: "おる", meaning: "to fold, break" }, { jp: "折り紙", reading: "おりがみ", meaning: "origami" }, { jp: "骨折", reading: "こっせつ", meaning: "bone fracture" }, { jp: "屈折", reading: "くっせつ", meaning: "refraction, bending" }] },
            { kanji: "節", reading: "ふし", romaji: "fushi", meaning: "Section, Festival", region: "Noun", kunYomi: ["ふし"], onYomi: ["せつ", "せち"], compounds: [{ jp: "節", reading: "ふし", meaning: "section, joint, node" }, { jp: "季節", reading: "きせつ", meaning: "season" }, { jp: "関節", reading: "かんせつ", meaning: "joint (anatomy)" }, { jp: "節約", reading: "せつやく", meaning: "economy, saving" }] },
            { kanji: "説", reading: "とく", romaji: "toku", meaning: "Explain, Theory", region: "Verb", kunYomi: ["と"], onYomi: ["せつ", "ぜい"], compounds: [{ jp: "説明", reading: "せつめい", meaning: "explanation" }, { jp: "小説", reading: "しょうせつ", meaning: "novel" }, { jp: "説得", reading: "せっとく", meaning: "persuasion" }, { jp: "解説", reading: "かいせつ", meaning: "commentary, explanation" }] },
            { kanji: "浅", reading: "あさい", romaji: "asai", meaning: "Shallow", region: "Adjective", kunYomi: ["あさ"], onYomi: ["せん"], compounds: [{ jp: "浅い", reading: "あさい", meaning: "shallow" }, { jp: "浅瀬", reading: "あさせ", meaning: "shallow water, shoal" }, { jp: "浅草", reading: "あさくさ", meaning: "Asakusa" }, { jp: "浅知恵", reading: "あさぢえ", meaning: "shallow wisdom" }] },
            { kanji: "戦", reading: "たたかう", romaji: "tatakau", meaning: "War, Battle", region: "Verb", kunYomi: ["たたか", "いくさ"], onYomi: ["せん"], compounds: [{ jp: "戦う", reading: "たたかう", meaning: "to fight" }, { jp: "戦争", reading: "せんそう", meaning: "war" }, { jp: "作戦", reading: "さくせん", meaning: "strategy, operation" }, { jp: "戦士", reading: "せんし", meaning: "warrior" }] },
            { kanji: "選", reading: "えらぶ", romaji: "erabu", meaning: "Choose, Select", region: "Verb", kunYomi: ["えら"], onYomi: ["せん"], compounds: [{ jp: "選ぶ", reading: "えらぶ", meaning: "to choose, select" }, { jp: "選択", reading: "せんたく", meaning: "choice, selection" }, { jp: "選手", reading: "せんしゅ", meaning: "athlete, player" }, { jp: "当選", reading: "とうせん", meaning: "winning, being elected" }] },
            { kanji: "然", reading: "ぜん", romaji: "zen", meaning: "Natural, So", region: "Adverb", kunYomi: ["—"], onYomi: ["ぜん", "ねん"], compounds: [{ jp: "自然", reading: "しぜん", meaning: "nature, natural" }, { jp: "当然", reading: "とうぜん", meaning: "naturally, of course" }, { jp: "全然", reading: "ぜんぜん", meaning: "not at all" }, { jp: "突然", reading: "とつぜん", meaning: "suddenly" }] },
            { kanji: "争", reading: "あらそう", romaji: "arasou", meaning: "Compete, Quarrel", region: "Verb", kunYomi: ["あらそ"], onYomi: ["そう"], compounds: [{ jp: "争う", reading: "あらそう", meaning: "to compete, quarrel" }, { jp: "戦争", reading: "せんそう", meaning: "war" }, { jp: "競争", reading: "きょうそう", meaning: "competition" }, { jp: "争点", reading: "そうてん", meaning: "point of contention" }] },
            { kanji: "倉", reading: "くら", romaji: "kura", meaning: "Storehouse", region: "Noun", kunYomi: ["くら"], onYomi: ["そう"], compounds: [{ jp: "倉庫", reading: "そうこ", meaning: "warehouse, storehouse" }, { jp: "倉", reading: "くら", meaning: "storehouse, granary" }, { jp: "穀倉", reading: "こくそう", meaning: "granary" }, { jp: "倉敷", reading: "くらしき", meaning: "Kurashiki city" }] },
            { kanji: "巣", reading: "す", romaji: "su", meaning: "Nest", region: "Noun", kunYomi: ["す"], onYomi: ["そう"], compounds: [{ jp: "巣", reading: "す", meaning: "nest" }, { jp: "巣箱", reading: "すばこ", meaning: "nesting box" }, { jp: "蜂巣", reading: "はちのす", meaning: "honeycomb" }, { jp: "帰巣", reading: "きそう", meaning: "homing, returning to nest" }] },
            { kanji: "束", reading: "たば", romaji: "taba", meaning: "Bundle, Bind", region: "Noun", kunYomi: ["たば", "つか"], onYomi: ["そく"], compounds: [{ jp: "束", reading: "たば", meaning: "bundle" }, { jp: "束縛", reading: "そくばく", meaning: "restraint, binding" }, { jp: "約束", reading: "やくそく", meaning: "promise" }, { jp: "花束", reading: "はなたば", meaning: "bouquet" }] },
            { kanji: "側", reading: "がわ", romaji: "gawa", meaning: "Side, Flank", region: "Noun", kunYomi: ["かわ", "そば"], onYomi: ["そく"], compounds: [{ jp: "側", reading: "がわ", meaning: "side" }, { jp: "両側", reading: "りょうがわ", meaning: "both sides" }, { jp: "側面", reading: "そくめん", meaning: "side, aspect" }, { jp: "内側", reading: "うちがわ", meaning: "inside" }] },
            { kanji: "続", reading: "つづく", romaji: "tsuzuku", meaning: "Continue", region: "Verb", kunYomi: ["つづ"], onYomi: ["ぞく"], compounds: [{ jp: "続く", reading: "つづく", meaning: "to continue" }, { jp: "継続", reading: "けいぞく", meaning: "continuation" }, { jp: "連続", reading: "れんぞく", meaning: "consecutive, continuous" }, { jp: "持続", reading: "じぞく", meaning: "sustainability, continuance" }] },
            { kanji: "卒", reading: "そつ", romaji: "sotsu", meaning: "Graduate, Finish", region: "Verb", kunYomi: ["—"], onYomi: ["そつ"], compounds: [{ jp: "卒業", reading: "そつぎょう", meaning: "graduation" }, { jp: "卒論", reading: "そつろん", meaning: "graduation thesis" }, { jp: "新卒", reading: "しんそつ", meaning: "new graduate" }, { jp: "卒倒", reading: "そっとう", meaning: "fainting, collapse" }] },
            { kanji: "孫", reading: "まご", romaji: "mago", meaning: "Grandchild", region: "Noun", kunYomi: ["まご"], onYomi: ["そん"], compounds: [{ jp: "孫", reading: "まご", meaning: "grandchild" }, { jp: "子孫", reading: "しそん", meaning: "descendant, offspring" }, { jp: "孫息子", reading: "まごむすこ", meaning: "grandson" }, { jp: "外孫", reading: "そとまご", meaning: "grandchild on daughter's side" }] },
            { kanji: "帯", reading: "おびる", romaji: "obiru", meaning: "Wear, Zone", region: "Verb", kunYomi: ["お"], onYomi: ["たい"], compounds: [{ jp: "帯びる", reading: "おびる", meaning: "to wear, carry" }, { jp: "地帯", reading: "ちたい", meaning: "zone, area" }, { jp: "携帯", reading: "けいたい", meaning: "mobile phone, portable" }, { jp: "熱帯", reading: "ねったい", meaning: "tropical zone" }] },
            { kanji: "隊", reading: "たい", romaji: "tai", meaning: "Squad, Corps", region: "Noun", kunYomi: ["—"], onYomi: ["たい"], compounds: [{ jp: "隊", reading: "たい", meaning: "squad, corps" }, { jp: "部隊", reading: "ぶたい", meaning: "unit, troop" }, { jp: "軍隊", reading: "ぐんたい", meaning: "military forces" }, { jp: "隊長", reading: "たいちょう", meaning: "squad leader" }] },
            { kanji: "達", reading: "たち", romaji: "tachi", meaning: "Plural, Attain", region: "Noun", kunYomi: ["—"], onYomi: ["たつ", "だつ"], compounds: [{ jp: "友達", reading: "ともだち", meaning: "friend" }, { jp: "発達", reading: "はったつ", meaning: "development, growth" }, { jp: "達成", reading: "たっせい", meaning: "achievement, accomplishment" }, { jp: "上達", reading: "じょうたつ", meaning: "improvement, progress" }] },
            { kanji: "単", reading: "たん", romaji: "tan", meaning: "Single, Simple", region: "Adjective", kunYomi: ["—"], onYomi: ["たん"], compounds: [{ jp: "単語", reading: "たんご", meaning: "word, vocabulary" }, { jp: "単純", reading: "たんじゅん", meaning: "simple" }, { jp: "単位", reading: "たんい", meaning: "unit, credit" }, { jp: "単独", reading: "たんどく", meaning: "alone, independent" }] },
            { kanji: "置", reading: "おく", romaji: "oku", meaning: "Place, Put", region: "Verb", kunYomi: ["お"], onYomi: ["ち"], compounds: [{ jp: "置く", reading: "おく", meaning: "to place, put" }, { jp: "位置", reading: "いち", meaning: "position, location" }, { jp: "設置", reading: "せっち", meaning: "installation, setup" }, { jp: "放置", reading: "ほうち", meaning: "leaving alone, neglect" }] },
            { kanji: "仲", reading: "なか", romaji: "naka", meaning: "Relationship, Fellow", region: "Noun", kunYomi: ["なか"], onYomi: ["ちゅう"], compounds: [{ jp: "仲", reading: "なか", meaning: "relationship, terms" }, { jp: "仲間", reading: "なかま", meaning: "companion, friend" }, { jp: "仲良し", reading: "なかよし", meaning: "close friend" }, { jp: "仲介", reading: "ちゅうかい", meaning: "mediation, brokerage" }] },
            { kanji: "兆", reading: "きざし", romaji: "kizashi", meaning: "Trillion, Sign", region: "Noun", kunYomi: ["きざ"], onYomi: ["ちょう"], compounds: [{ jp: "兆", reading: "ちょう", meaning: "trillion" }, { jp: "兆候", reading: "ちょうこう", meaning: "sign, symptom" }, { jp: "兆し", reading: "きざし", meaning: "sign, omen" }, { jp: "前兆", reading: "ぜんちょう", meaning: "omen, forewarning" }] },
            { kanji: "挑", reading: "いどむ", romaji: "idomu", meaning: "Challenge", region: "Verb", kunYomi: ["いど"], onYomi: ["ちょう"], compounds: [{ jp: "挑む", reading: "いどむ", meaning: "to challenge" }, { jp: "挑戦", reading: "ちょうせん", meaning: "challenge" }, { jp: "挑発", reading: "ちょうはつ", meaning: "provocation" }, { jp: "挑戦者", reading: "ちょうせんしゃ", meaning: "challenger" }] },
            { kanji: "腸", reading: "ちょう", romaji: "chou", meaning: "Intestine", region: "Noun", kunYomi: ["—"], onYomi: ["ちょう"], compounds: [{ jp: "腸", reading: "ちょう", meaning: "intestine" }, { jp: "胃腸", reading: "いちょう", meaning: "stomach and intestines" }, { jp: "大腸", reading: "だいちょう", meaning: "large intestine" }, { jp: "腸炎", reading: "ちょうえん", meaning: "enteritis" }] },
            { kanji: "低", reading: "ひくい", romaji: "hikui", meaning: "Low", region: "Adjective", kunYomi: ["ひく"], onYomi: ["てい"], compounds: [{ jp: "低い", reading: "ひくい", meaning: "low" }, { jp: "最低", reading: "さいてい", meaning: "lowest, minimum" }, { jp: "低下", reading: "ていか", meaning: "decline, drop" }, { jp: "低温", reading: "ていおん", meaning: "low temperature" }] },
            { kanji: "停", reading: "とまる", romaji: "tomaru", meaning: "Stop, Halt", region: "Verb", kunYomi: ["—"], onYomi: ["てい"], compounds: [{ jp: "停止", reading: "ていし", meaning: "stop, suspension" }, { jp: "停車", reading: "ていしゃ", meaning: "stopping a vehicle" }, { jp: "停電", reading: "ていでん", meaning: "power outage" }, { jp: "調停", reading: "ちょうてい", meaning: "mediation" }] },
            { kanji: "底", reading: "そこ", romaji: "soko", meaning: "Bottom, Base", region: "Noun", kunYomi: ["そこ"], onYomi: ["てい"], compounds: [{ jp: "底", reading: "そこ", meaning: "bottom, base" }, { jp: "海底", reading: "かいてい", meaning: "sea bottom" }, { jp: "底辺", reading: "ていへん", meaning: "base, bottom rung" }, { jp: "根底", reading: "こんてい", meaning: "root, foundation" }] },
            { kanji: "的", reading: "まと", romaji: "mato", meaning: "Target, -ish", region: "Suffix", kunYomi: ["まと"], onYomi: ["てき"], compounds: [{ jp: "目的", reading: "もくてき", meaning: "purpose, goal" }, { jp: "的", reading: "まと", meaning: "target" }, { jp: "積極的", reading: "せっきょくてき", meaning: "positive, proactive" }, { jp: "基本的", reading: "きほんてき", meaning: "basic, fundamental" }] },
            { kanji: "典", reading: "てん", romaji: "ten", meaning: "Classic, Rule", region: "Noun", kunYomi: ["—"], onYomi: ["てん"], compounds: [{ jp: "辞典", reading: "じてん", meaning: "dictionary" }, { jp: "古典", reading: "こてん", meaning: "classic literature" }, { jp: "典型", reading: "てんけい", meaning: "typical example" }, { jp: "祭典", reading: "さいてん", meaning: "festival, celebration" }] },
            { kanji: "伝", reading: "つたえる", romaji: "tsutaeru", meaning: "Convey, Tradition", region: "Verb", kunYomi: ["つた"], onYomi: ["でん"], compounds: [{ jp: "伝える", reading: "つたえる", meaning: "to convey, tell" }, { jp: "伝統", reading: "でんとう", meaning: "tradition" }, { jp: "遺伝", reading: "いでん", meaning: "heredity, genetics" }, { jp: "伝説", reading: "でんせつ", meaning: "legend, tradition" }] },
            { kanji: "徒", reading: "と", romaji: "to", meaning: "Disciple, On foot", region: "Noun", kunYomi: ["かち"], onYomi: ["と"], compounds: [{ jp: "生徒", reading: "せいと", meaning: "student, pupil" }, { jp: "徒歩", reading: "とほ", meaning: "on foot, walking" }, { jp: "徒弟", reading: "とてい", meaning: "apprentice" }, { jp: "使徒", reading: "しと", meaning: "apostle" }] },
            { kanji: "努", reading: "つとめる", romaji: "tsutomeru", meaning: "Endeavor, Strive", region: "Verb", kunYomi: ["つと"], onYomi: ["ど"], compounds: [{ jp: "努める", reading: "つとめる", meaning: "to endeavor, strive" }, { jp: "努力", reading: "どりょく", meaning: "effort, endeavor" }, { jp: "勤努", reading: "きんど", meaning: "diligence, hard work" }] },
            { kanji: "灯", reading: "ひ", romaji: "hi", meaning: "Lamp, Light", region: "Noun", kunYomi: ["ひ", "とも"], onYomi: ["とう"], compounds: [{ jp: "灯り", reading: "あかり", meaning: "light, lamp" }, { jp: "街灯", reading: "がいとう", meaning: "street light" }, { jp: "灯台", reading: "とうだい", meaning: "lighthouse" }, { jp: "提灯", reading: "ちょうちん", meaning: "paper lantern" }] },
            { kanji: "堂", reading: "どう", romaji: "dou", meaning: "Hall, Dignified", region: "Noun", kunYomi: ["—"], onYomi: ["どう"], compounds: [{ jp: "食堂", reading: "しょくどう", meaning: "dining hall" }, { jp: "講堂", reading: "こうどう", meaning: "auditorium" }, { jp: "堂々", reading: "どうどう", meaning: "magnificent, dignified" }, { jp: "仏堂", reading: "ぶつどう", meaning: "Buddhist hall" }] },
            { kanji: "働", reading: "はたらく", romaji: "hataraku", meaning: "Work, Labor", region: "Verb", kunYomi: ["はたら"], onYomi: ["どう"], compounds: [{ jp: "働く", reading: "はたらく", meaning: "to work" }, { jp: "労働", reading: "ろうどう", meaning: "labor" }, { jp: "働き", reading: "はたらき", meaning: "work, function" }, { jp: "実働", reading: "じつどう", meaning: "actual working time" }] },
            { kanji: "特", reading: "とく", romaji: "toku", meaning: "Special, Particular", region: "Adjective", kunYomi: ["—"], onYomi: ["とく"], compounds: [{ jp: "特別", reading: "とくべつ", meaning: "special" }, { jp: "特徴", reading: "とくちょう", meaning: "characteristic, feature" }, { jp: "特に", reading: "とくに", meaning: "especially" }, { jp: "独特", reading: "どくとく", meaning: "unique, peculiar" }] },
            { kanji: "得", reading: "える", romaji: "eru", meaning: "Gain, Acquire", region: "Verb", kunYomi: ["え", "う"], onYomi: ["とく"], compounds: [{ jp: "得る", reading: "える", meaning: "to gain, acquire" }, { jp: "得意", reading: "とくい", meaning: "one's strong point" }, { jp: "納得", reading: "なっとく", meaning: "consent, understanding" }, { jp: "取得", reading: "しゅとく", meaning: "acquisition" }] },
            { kanji: "毒", reading: "どく", romaji: "doku", meaning: "Poison", region: "Noun", kunYomi: ["—"], onYomi: ["どく"], compounds: [{ jp: "毒", reading: "どく", meaning: "poison" }, { jp: "毒薬", reading: "どくやく", meaning: "poison, toxic drug" }, { jp: "解毒", reading: "げどく", meaning: "detoxification" }, { jp: "中毒", reading: "ちゅうどく", meaning: "poisoning, addiction" }] },
            { kanji: "熱", reading: "あつい", romaji: "atsui", meaning: "Heat, Fever", region: "Noun", kunYomi: ["あつ"], onYomi: ["ねつ"], compounds: [{ jp: "熱い", reading: "あつい", meaning: "hot" }, { jp: "熱心", reading: "ねっしん", meaning: "enthusiastic, zealous" }, { jp: "発熱", reading: "はつねつ", meaning: "fever, heat generation" }, { jp: "熱帯", reading: "ねったい", meaning: "tropics" }] },
            { kanji: "念", reading: "ねん", romaji: "nen", meaning: "Thought, Feeling", region: "Noun", kunYomi: ["—"], onYomi: ["ねん"], compounds: [{ jp: "念", reading: "ねん", meaning: "thought, feeling" }, { jp: "念願", reading: "ねんがん", meaning: "long-cherished wish" }, { jp: "残念", reading: "ざんねん", meaning: "regrettable" }, { jp: "記念", reading: "きねん", meaning: "commemoration, memory" }] },
            { kanji: "敗", reading: "まける", romaji: "makeru", meaning: "Defeat, Fail", region: "Verb", kunYomi: ["やぶ"], onYomi: ["はい"], compounds: [{ jp: "敗れる", reading: "やぶれる", meaning: "to be defeated" }, { jp: "失敗", reading: "しっぱい", meaning: "failure" }, { jp: "敗北", reading: "はいぼく", meaning: "defeat" }, { jp: "勝敗", reading: "しょうはい", meaning: "victory or defeat" }] },
            { kanji: "梅", reading: "うめ", romaji: "ume", meaning: "Plum", region: "Noun", kunYomi: ["うめ"], onYomi: ["ばい"], compounds: [{ jp: "梅", reading: "うめ", meaning: "plum" }, { jp: "梅雨", reading: "つゆ", meaning: "rainy season" }, { jp: "梅干し", reading: "うめぼし", meaning: "pickled plum" }, { jp: "紅梅", reading: "こうばい", meaning: "red plum" }] },
            { kanji: "博", reading: "はく", romaji: "haku", meaning: "Broad, Exhibition", region: "Noun", kunYomi: ["—"], onYomi: ["はく", "ばく"], compounds: [{ jp: "博物館", reading: "はくぶつかん", meaning: "museum" }, { jp: "博士", reading: "はかせ", meaning: "doctor, PhD" }, { jp: "博覧会", reading: "はくらんかい", meaning: "exposition" }, { jp: "博識", reading: "はくしき", meaning: "well-read, erudite" }] },
            { kanji: "飯", reading: "めし", romaji: "meshi", meaning: "Meal, Rice", region: "Noun", kunYomi: ["めし"], onYomi: ["はん"], compounds: [{ jp: "飯", reading: "めし", meaning: "meal, rice" }, { jp: "ご飯", reading: "ごはん", meaning: "meal, cooked rice" }, { jp: "朝飯", reading: "あさめし", meaning: "breakfast" }, { jp: "炊飯", reading: "すいはん", meaning: "cooking rice" }] },
            { kanji: "飛", reading: "とぶ", romaji: "tobu", meaning: "Fly, Jump", region: "Verb", kunYomi: ["と"], onYomi: ["ひ"], compounds: [{ jp: "飛ぶ", reading: "とぶ", meaning: "to fly, jump" }, { jp: "飛行機", reading: "ひこうき", meaning: "airplane" }, { jp: "飛躍", reading: "ひやく", meaning: "leap, great progress" }, { jp: "飛び込む", reading: "とびこむ", meaning: "to jump into" }] },
        ] },
    { id: "grade_4_kanji_level_4", label: "Level 4", sublabel: "Elementary Grade 4 · 41 cards", emoji: "📗", group: "grade_4", mode: "formal", category_key: "formal_grade_grade_4", cards: [
            { kanji: "票", reading: "ひょう", romaji: "hyou", meaning: "Ballot, Ticket", region: "Noun", kunYomi: ["—"], onYomi: ["ひょう"], compounds: [{ jp: "投票", reading: "とうひょう", meaning: "vote, ballot" }, { jp: "票", reading: "ひょう", meaning: "ballot, ticket" }, { jp: "得票", reading: "とくひょう", meaning: "votes received" }, { jp: "票数", reading: "ひょうすう", meaning: "number of votes" }] },
            { kanji: "標", reading: "しるべ", romaji: "shirube", meaning: "Mark, Target", region: "Noun", kunYomi: ["しるべ"], onYomi: ["ひょう"], compounds: [{ jp: "目標", reading: "もくひょう", meaning: "goal, target" }, { jp: "標準", reading: "ひょうじゅん", meaning: "standard" }, { jp: "標識", reading: "ひょうしき", meaning: "sign, marker" }, { jp: "指標", reading: "しひょう", meaning: "index, indicator" }] },
            { kanji: "不", reading: "ふ", romaji: "fu", meaning: "Not, Un-", region: "Prefix", kunYomi: ["—"], onYomi: ["ふ", "ぶ"], compounds: [{ jp: "不安", reading: "ふあん", meaning: "anxiety, unease" }, { jp: "不思議", reading: "ふしぎ", meaning: "mysterious, wonder" }, { jp: "不満", reading: "ふまん", meaning: "dissatisfaction" }, { jp: "不要", reading: "ふよう", meaning: "unnecessary" }] },
            { kanji: "夫", reading: "おっと", romaji: "otto", meaning: "Husband, Man", region: "Noun", kunYomi: ["おっと", "おと"], onYomi: ["ふ", "ふう"], compounds: [{ jp: "夫", reading: "おっと", meaning: "husband" }, { jp: "夫婦", reading: "ふうふ", meaning: "married couple" }, { jp: "工夫", reading: "くふう", meaning: "ingenuity, device" }, { jp: "夫人", reading: "ふじん", meaning: "wife, Mrs." }] },
            { kanji: "付", reading: "つける", romaji: "tsukeru", meaning: "Attach, Give", region: "Verb", kunYomi: ["つ"], onYomi: ["ふ"], compounds: [{ jp: "付ける", reading: "つける", meaning: "to attach, put on" }, { jp: "付近", reading: "ふきん", meaning: "vicinity, nearby" }, { jp: "交付", reading: "こうふ", meaning: "delivery, issue" }, { jp: "添付", reading: "てんぷ", meaning: "attachment, enclosure" }] },
            { kanji: "府", reading: "ふ", romaji: "fu", meaning: "Prefecture, Authority", region: "Noun", kunYomi: ["—"], onYomi: ["ふ"], compounds: [{ jp: "府", reading: "ふ", meaning: "prefecture" }, { jp: "政府", reading: "せいふ", meaning: "government" }, { jp: "大阪府", reading: "おおさかふ", meaning: "Osaka Prefecture" }, { jp: "首府", reading: "しゅふ", meaning: "capital city" }] },
            { kanji: "副", reading: "ふく", romaji: "fuku", meaning: "Vice, Sub-", region: "Prefix", kunYomi: ["—"], onYomi: ["ふく"], compounds: [{ jp: "副", reading: "ふく", meaning: "vice, sub-" }, { jp: "副長", reading: "ふくちょう", meaning: "deputy chief" }, { jp: "副作用", reading: "ふくさよう", meaning: "side effect" }, { jp: "副業", reading: "ふくぎょう", meaning: "side job" }] },
            { kanji: "粉", reading: "こな", romaji: "kona", meaning: "Powder, Flour", region: "Noun", kunYomi: ["こな", "こ"], onYomi: ["ふん"], compounds: [{ jp: "粉", reading: "こな", meaning: "powder, flour" }, { jp: "花粉", reading: "かふん", meaning: "pollen" }, { jp: "粉末", reading: "ふんまつ", meaning: "powder" }, { jp: "小麦粉", reading: "こむぎこ", meaning: "wheat flour" }] },
            { kanji: "兵", reading: "へい", romaji: "hei", meaning: "Soldier, Military", region: "Noun", kunYomi: ["—"], onYomi: ["へい", "ひょう"], compounds: [{ jp: "兵士", reading: "へいし", meaning: "soldier" }, { jp: "兵器", reading: "へいき", meaning: "weapon, arms" }, { jp: "兵庫", reading: "ひょうご", meaning: "Hyogo prefecture" }, { jp: "兵隊", reading: "へいたい", meaning: "soldier, troops" }] },
            { kanji: "別", reading: "わかれる", romaji: "wakareru", meaning: "Separate, Different", region: "Verb", kunYomi: ["わか"], onYomi: ["べつ"], compounds: [{ jp: "別れる", reading: "わかれる", meaning: "to separate, part" }, { jp: "特別", reading: "とくべつ", meaning: "special" }, { jp: "別々", reading: "べつべつ", meaning: "separately" }, { jp: "差別", reading: "さべつ", meaning: "discrimination" }] },
            { kanji: "変", reading: "かわる", romaji: "kawaru", meaning: "Change, Strange", region: "Verb", kunYomi: ["か"], onYomi: ["へん"], compounds: [{ jp: "変わる", reading: "かわる", meaning: "to change" }, { jp: "変化", reading: "へんか", meaning: "change, variation" }, { jp: "大変", reading: "たいへん", meaning: "very, serious" }, { jp: "変な", reading: "へんな", meaning: "strange, odd" }] },
            { kanji: "辺", reading: "あたり", romaji: "atari", meaning: "Area, Vicinity", region: "Noun", kunYomi: ["あたり", "ほとり", "べ"], onYomi: ["へん"], compounds: [{ jp: "辺り", reading: "あたり", meaning: "area, vicinity" }, { jp: "辺", reading: "へん", meaning: "area, side" }, { jp: "周辺", reading: "しゅうへん", meaning: "surroundings" }, { jp: "身辺", reading: "しんぺん", meaning: "one's personal affairs" }] },
            { kanji: "便", reading: "たより", romaji: "tayori", meaning: "Convenient, Mail", region: "Noun", kunYomi: ["たよ"], onYomi: ["べん", "びん"], compounds: [{ jp: "便利", reading: "べんり", meaning: "convenient" }, { jp: "郵便", reading: "ゆうびん", meaning: "mail, post" }, { jp: "便", reading: "びん", meaning: "flight, mail" }, { jp: "不便", reading: "ふべん", meaning: "inconvenient" }] },
            { kanji: "包", reading: "つつむ", romaji: "tsutsumu", meaning: "Wrap, Include", region: "Verb", kunYomi: ["つつ"], onYomi: ["ほう"], compounds: [{ jp: "包む", reading: "つつむ", meaning: "to wrap" }, { jp: "包装", reading: "ほうそう", meaning: "packaging, wrapping" }, { jp: "包丁", reading: "ほうちょう", meaning: "kitchen knife" }, { jp: "包含", reading: "ほうがん", meaning: "inclusion" }] },
            { kanji: "法", reading: "ほう", romaji: "hou", meaning: "Law, Method", region: "Noun", kunYomi: ["—"], onYomi: ["ほう", "はっ", "ほっ"], compounds: [{ jp: "法律", reading: "ほうりつ", meaning: "law" }, { jp: "方法", reading: "ほうほう", meaning: "method, way" }, { jp: "法則", reading: "ほうそく", meaning: "rule, law" }, { jp: "合法", reading: "ごうほう", meaning: "legal, lawful" }] },
            { kanji: "望", reading: "のぞむ", romaji: "nozomu", meaning: "Hope, Wish", region: "Verb", kunYomi: ["のぞ"], onYomi: ["ぼう", "もう"], compounds: [{ jp: "望む", reading: "のぞむ", meaning: "to hope, wish" }, { jp: "希望", reading: "きぼう", meaning: "hope, wish" }, { jp: "失望", reading: "しつぼう", meaning: "disappointment" }, { jp: "展望", reading: "てんぼう", meaning: "view, outlook" }] },
            { kanji: "牧", reading: "まき", romaji: "maki", meaning: "Pasture, Tend", region: "Noun", kunYomi: ["まき"], onYomi: ["ぼく"], compounds: [{ jp: "牧場", reading: "ぼくじょう", meaning: "ranch, pasture" }, { jp: "牧草", reading: "ぼくそう", meaning: "grass, pasture" }, { jp: "牧師", reading: "ぼくし", meaning: "pastor, minister" }, { jp: "遊牧", reading: "ゆうぼく", meaning: "nomadic herding" }] },
            { kanji: "末", reading: "すえ", romaji: "sue", meaning: "End, Tip", region: "Noun", kunYomi: ["すえ"], onYomi: ["まつ", "ばつ"], compounds: [{ jp: "末", reading: "すえ", meaning: "end, tip" }, { jp: "週末", reading: "しゅうまつ", meaning: "weekend" }, { jp: "末尾", reading: "まつび", meaning: "end, tail" }, { jp: "結末", reading: "けつまつ", meaning: "ending, conclusion" }] },
            { kanji: "満", reading: "みちる", romaji: "michiru", meaning: "Full, Satisfy", region: "Verb", kunYomi: ["み"], onYomi: ["まん"], compounds: [{ jp: "満ちる", reading: "みちる", meaning: "to fill, be full" }, { jp: "満足", reading: "まんぞく", meaning: "satisfaction" }, { jp: "満員", reading: "まんいん", meaning: "full capacity" }, { jp: "不満", reading: "ふまん", meaning: "dissatisfaction" }] },
            { kanji: "未", reading: "いまだ", romaji: "imada", meaning: "Not yet, Un-", region: "Prefix", kunYomi: ["いまだ", "ま"], onYomi: ["み"], compounds: [{ jp: "未来", reading: "みらい", meaning: "future" }, { jp: "未定", reading: "みてい", meaning: "undecided" }, { jp: "未知", reading: "みち", meaning: "unknown" }, { jp: "未完成", reading: "みかんせい", meaning: "unfinished" }] },
            { kanji: "民", reading: "たみ", romaji: "tami", meaning: "People, Folk", region: "Noun", kunYomi: ["たみ"], onYomi: ["みん"], compounds: [{ jp: "民", reading: "たみ", meaning: "people, folk" }, { jp: "国民", reading: "こくみん", meaning: "citizen, national" }, { jp: "民族", reading: "みんぞく", meaning: "ethnic group" }, { jp: "民主", reading: "みんしゅ", meaning: "democracy" }] },
            { kanji: "無", reading: "ない", romaji: "nai", meaning: "Nothing, Without", region: "Prefix", kunYomi: ["な"], onYomi: ["む", "ぶ"], compounds: [{ jp: "無い", reading: "ない", meaning: "there is not" }, { jp: "無料", reading: "むりょう", meaning: "free of charge" }, { jp: "無限", reading: "むげん", meaning: "infinite" }, { jp: "無事", reading: "ぶじ", meaning: "safe, without incident" }] },
            { kanji: "約", reading: "やく", romaji: "yaku", meaning: "Promise, Approximately", region: "Noun", kunYomi: ["—"], onYomi: ["やく"], compounds: [{ jp: "約束", reading: "やくそく", meaning: "promise" }, { jp: "約", reading: "やく", meaning: "approximately" }, { jp: "条約", reading: "じょうやく", meaning: "treaty" }, { jp: "予約", reading: "よやく", meaning: "reservation, booking" }] },
            { kanji: "勇", reading: "いさむ", romaji: "isamu", meaning: "Brave, Courage", region: "Adjective", kunYomi: ["いさ"], onYomi: ["ゆう"], compounds: [{ jp: "勇気", reading: "ゆうき", meaning: "courage, bravery" }, { jp: "勇者", reading: "ゆうしゃ", meaning: "brave person, hero" }, { jp: "勇敢", reading: "ゆうかん", meaning: "brave, courageous" }, { jp: "武勇", reading: "ぶゆう", meaning: "valor, bravery" }] },
            { kanji: "要", reading: "いる", romaji: "iru", meaning: "Need, Important", region: "Verb", kunYomi: ["い", "かなめ"], onYomi: ["よう"], compounds: [{ jp: "要る", reading: "いる", meaning: "to need" }, { jp: "必要", reading: "ひつよう", meaning: "necessary" }, { jp: "重要", reading: "じゅうよう", meaning: "important" }, { jp: "要求", reading: "ようきゅう", meaning: "demand, request" }] },
            { kanji: "養", reading: "やしなう", romaji: "yashinau", meaning: "Raise, Nourish", region: "Verb", kunYomi: ["やしな"], onYomi: ["よう"], compounds: [{ jp: "養う", reading: "やしなう", meaning: "to raise, nourish" }, { jp: "養育", reading: "よういく", meaning: "upbringing, rearing" }, { jp: "栄養", reading: "えいよう", meaning: "nutrition" }, { jp: "養成", reading: "ようせい", meaning: "training, cultivation" }] },
            { kanji: "浴", reading: "あびる", romaji: "abiru", meaning: "Bathe, Shower", region: "Verb", kunYomi: ["あ"], onYomi: ["よく"], compounds: [{ jp: "浴びる", reading: "あびる", meaning: "to bathe, shower" }, { jp: "入浴", reading: "にゅうよく", meaning: "bathing" }, { jp: "浴室", reading: "よくしつ", meaning: "bathroom" }, { jp: "浴衣", reading: "ゆかた", meaning: "summer kimono" }] },
            { kanji: "利", reading: "きく", romaji: "kiku", meaning: "Profit, Benefit", region: "Noun", kunYomi: ["き"], onYomi: ["り"], compounds: [{ jp: "利益", reading: "りえき", meaning: "profit, benefit" }, { jp: "便利", reading: "べんり", meaning: "convenient" }, { jp: "有利", reading: "ゆうり", meaning: "advantageous" }, { jp: "利用", reading: "りよう", meaning: "use, utilization" }] },
            { kanji: "陸", reading: "おか", romaji: "oka", meaning: "Land, Shore", region: "Noun", kunYomi: ["おか"], onYomi: ["りく"], compounds: [{ jp: "陸", reading: "おか", meaning: "land, shore" }, { jp: "陸地", reading: "りくち", meaning: "land" }, { jp: "上陸", reading: "じょうりく", meaning: "landing, going ashore" }, { jp: "大陸", reading: "たいりく", meaning: "continent" }] },
            { kanji: "料", reading: "りょう", romaji: "ryou", meaning: "Fee, Ingredient", region: "Noun", kunYomi: ["—"], onYomi: ["りょう"], compounds: [{ jp: "料金", reading: "りょうきん", meaning: "fee, charge" }, { jp: "料理", reading: "りょうり", meaning: "cooking, cuisine" }, { jp: "材料", reading: "ざいりょう", meaning: "materials, ingredients" }, { jp: "無料", reading: "むりょう", meaning: "free of charge" }] },
            { kanji: "良", reading: "よい", romaji: "yoi", meaning: "Good, Fine", region: "Adjective", kunYomi: ["よ", "い"], onYomi: ["りょう"], compounds: [{ jp: "良い", reading: "よい", meaning: "good, fine" }, { jp: "良心", reading: "りょうしん", meaning: "conscience" }, { jp: "改良", reading: "かいりょう", meaning: "improvement" }, { jp: "優良", reading: "ゆうりょう", meaning: "excellent, superior" }] },
            { kanji: "量", reading: "はかる", romaji: "hakaru", meaning: "Quantity, Measure", region: "Noun", kunYomi: ["はか"], onYomi: ["りょう"], compounds: [{ jp: "量", reading: "りょう", meaning: "quantity, amount" }, { jp: "重量", reading: "じゅうりょう", meaning: "weight" }, { jp: "大量", reading: "たいりょう", meaning: "large quantity" }, { jp: "計量", reading: "けいりょう", meaning: "measurement" }] },
            { kanji: "輪", reading: "わ", romaji: "wa", meaning: "Ring, Wheel", region: "Noun", kunYomi: ["わ"], onYomi: ["りん"], compounds: [{ jp: "輪", reading: "わ", meaning: "ring, wheel, circle" }, { jp: "車輪", reading: "しゃりん", meaning: "wheel" }, { jp: "指輪", reading: "ゆびわ", meaning: "ring (jewelry)" }, { jp: "年輪", reading: "ねんりん", meaning: "tree ring, annual ring" }] },
            { kanji: "類", reading: "たぐい", romaji: "tagui", meaning: "Kind, Category", region: "Noun", kunYomi: ["たぐ"], onYomi: ["るい"], compounds: [{ jp: "種類", reading: "しゅるい", meaning: "type, kind" }, { jp: "分類", reading: "ぶんるい", meaning: "classification" }, { jp: "類似", reading: "るいじ", meaning: "similarity, resemblance" }, { jp: "人類", reading: "じんるい", meaning: "humankind" }] },
            { kanji: "令", reading: "れい", romaji: "rei", meaning: "Order, Command", region: "Noun", kunYomi: ["—"], onYomi: ["れい"], compounds: [{ jp: "命令", reading: "めいれい", meaning: "order, command" }, { jp: "令和", reading: "れいわ", meaning: "Reiwa era" }, { jp: "法令", reading: "ほうれい", meaning: "laws and ordinances" }, { jp: "指令", reading: "しれい", meaning: "directive, command" }] },
            { kanji: "冷", reading: "つめたい", romaji: "tsumetai", meaning: "Cold, Chill", region: "Adjective", kunYomi: ["つめ", "ひ", "さ"], onYomi: ["れい"], compounds: [{ jp: "冷たい", reading: "つめたい", meaning: "cold" }, { jp: "冷蔵庫", reading: "れいぞうこ", meaning: "refrigerator" }, { jp: "冷静", reading: "れいせい", meaning: "calm, cool-headed" }, { jp: "冷房", reading: "れいぼう", meaning: "air conditioning" }] },
            { kanji: "例", reading: "たとえ", romaji: "tatoe", meaning: "Example", region: "Noun", kunYomi: ["たと"], onYomi: ["れい"], compounds: [{ jp: "例", reading: "れい", meaning: "example" }, { jp: "例えば", reading: "たとえば", meaning: "for example" }, { jp: "事例", reading: "じれい", meaning: "case, example" }, { jp: "慣例", reading: "かんれい", meaning: "custom, convention" }] },
            { kanji: "連", reading: "つれる", romaji: "tsureru", meaning: "Connect, Take along", region: "Verb", kunYomi: ["つ", "つら"], onYomi: ["れん"], compounds: [{ jp: "連れる", reading: "つれる", meaning: "to take along" }, { jp: "連絡", reading: "れんらく", meaning: "contact, communication" }, { jp: "関連", reading: "かんれん", meaning: "relation, connection" }, { jp: "連続", reading: "れんぞく", meaning: "consecutive, continuous" }] },
            { kanji: "老", reading: "おいる", romaji: "oiru", meaning: "Old, Age", region: "Verb", kunYomi: ["お"], onYomi: ["ろう"], compounds: [{ jp: "老いる", reading: "おいる", meaning: "to age, grow old" }, { jp: "老人", reading: "ろうじん", meaning: "elderly person" }, { jp: "老化", reading: "ろうか", meaning: "aging" }, { jp: "養老", reading: "ようろう", meaning: "care for the elderly" }] },
            { kanji: "労", reading: "ろう", romaji: "rou", meaning: "Labor, Toil", region: "Noun", kunYomi: ["—"], onYomi: ["ろう"], compounds: [{ jp: "労働", reading: "ろうどう", meaning: "labor, work" }, { jp: "苦労", reading: "くろう", meaning: "hardship, trouble" }, { jp: "労力", reading: "ろうりょく", meaning: "labor, effort" }, { jp: "勤労", reading: "きんろう", meaning: "diligence, labor" }] },
            { kanji: "録", reading: "ろく", romaji: "roku", meaning: "Record", region: "Verb", kunYomi: ["—"], onYomi: ["ろく"], compounds: [{ jp: "記録", reading: "きろく", meaning: "record" }, { jp: "録音", reading: "ろくおん", meaning: "recording (audio)" }, { jp: "登録", reading: "とうろく", meaning: "registration" }, { jp: "収録", reading: "しゅうろく", meaning: "recording, compilation" }] },
        ] },
    { id: "grade_5_kanji_level_1", label: "Level 1", sublabel: "Elementary Grade 5 · 50 cards", emoji: "📘", group: "grade_5", mode: "formal", category_key: "formal_grade_grade_5", cards: [
            { kanji: "圧", reading: "あつ", romaji: "atsu", meaning: "Pressure", region: "Noun", kunYomi: ["お"], onYomi: ["あつ"], compounds: [{ jp: "圧力", reading: "あつりょく", meaning: "pressure" }, { jp: "気圧", reading: "きあつ", meaning: "atmospheric pressure" }, { jp: "血圧", reading: "けつあつ", meaning: "blood pressure" }, { jp: "圧倒", reading: "あっとう", meaning: "overwhelm" }] },
            { kanji: "移", reading: "うつる", romaji: "utsuru", meaning: "Move, Transfer", region: "Verb", kunYomi: ["うつ"], onYomi: ["い"], compounds: [{ jp: "移る", reading: "うつる", meaning: "to move, transfer" }, { jp: "移動", reading: "いどう", meaning: "movement, transfer" }, { jp: "移住", reading: "いじゅう", meaning: "migration" }, { jp: "移植", reading: "いしょく", meaning: "transplant" }] },
            { kanji: "因", reading: "よる", romaji: "yoru", meaning: "Cause, Reason", region: "Noun", kunYomi: ["よ"], onYomi: ["いん"], compounds: [{ jp: "原因", reading: "げんいん", meaning: "cause, reason" }, { jp: "因果", reading: "いんが", meaning: "cause and effect" }, { jp: "要因", reading: "よういん", meaning: "factor, cause" }, { jp: "起因", reading: "きいん", meaning: "cause, origin" }] },
            { kanji: "永", reading: "ながい", romaji: "nagai", meaning: "Eternal, Long", region: "Adjective", kunYomi: ["なが"], onYomi: ["えい"], compounds: [{ jp: "永遠", reading: "えいえん", meaning: "eternity, forever" }, { jp: "永久", reading: "えいきゅう", meaning: "permanent, forever" }, { jp: "永続", reading: "えいぞく", meaning: "continuity" }, { jp: "永住", reading: "えいじゅう", meaning: "permanent residence" }] },
            { kanji: "営", reading: "いとなむ", romaji: "itonamu", meaning: "Manage, Run", region: "Verb", kunYomi: ["いとな"], onYomi: ["えい"], compounds: [{ jp: "営む", reading: "いとなむ", meaning: "to manage, run" }, { jp: "営業", reading: "えいぎょう", meaning: "business operations" }, { jp: "経営", reading: "けいえい", meaning: "management" }, { jp: "運営", reading: "うんえい", meaning: "operation" }] },
            { kanji: "衛", reading: "えい", romaji: "ei", meaning: "Guard, Protect", region: "Verb", kunYomi: ["まも"], onYomi: ["えい"], compounds: [{ jp: "衛星", reading: "えいせい", meaning: "satellite" }, { jp: "防衛", reading: "ぼうえい", meaning: "defense" }, { jp: "衛生", reading: "えいせい", meaning: "hygiene" }, { jp: "護衛", reading: "ごえい", meaning: "guard, escort" }] },
            { kanji: "易", reading: "やさしい", romaji: "yasashii", meaning: "Easy, Trade", region: "Adjective", kunYomi: ["やさ", "やす"], onYomi: ["い", "えき"], compounds: [{ jp: "容易", reading: "ようい", meaning: "easy, simple" }, { jp: "貿易", reading: "ぼうえき", meaning: "trade" }, { jp: "易しい", reading: "やさしい", meaning: "easy" }, { jp: "難易", reading: "なんい", meaning: "difficulty" }] },
            { kanji: "益", reading: "えき", romaji: "eki", meaning: "Benefit, Profit", region: "Noun", kunYomi: ["ます"], onYomi: ["えき", "やく"], compounds: [{ jp: "利益", reading: "りえき", meaning: "profit, benefit" }, { jp: "益々", reading: "ますます", meaning: "more and more" }, { jp: "有益", reading: "ゆうえき", meaning: "beneficial" }, { jp: "公益", reading: "こうえき", meaning: "public benefit" }] },
            { kanji: "液", reading: "えき", romaji: "eki", meaning: "Liquid, Fluid", region: "Noun", kunYomi: ["—"], onYomi: ["えき"], compounds: [{ jp: "液体", reading: "えきたい", meaning: "liquid" }, { jp: "血液", reading: "けつえき", meaning: "blood" }, { jp: "溶液", reading: "ようえき", meaning: "solution" }, { jp: "液晶", reading: "えきしょう", meaning: "liquid crystal" }] },
            { kanji: "演", reading: "えんじる", romaji: "enjiru", meaning: "Perform, Act", region: "Verb", kunYomi: ["—"], onYomi: ["えん"], compounds: [{ jp: "演じる", reading: "えんじる", meaning: "to perform" }, { jp: "演技", reading: "えんぎ", meaning: "acting" }, { jp: "演奏", reading: "えんそう", meaning: "musical performance" }, { jp: "講演", reading: "こうえん", meaning: "lecture" }] },
            { kanji: "応", reading: "こたえる", romaji: "kotaeru", meaning: "Respond, Apply", region: "Verb", kunYomi: ["こた"], onYomi: ["おう"], compounds: [{ jp: "応える", reading: "こたえる", meaning: "to respond" }, { jp: "応用", reading: "おうよう", meaning: "application" }, { jp: "対応", reading: "たいおう", meaning: "response" }, { jp: "反応", reading: "はんのう", meaning: "reaction" }] },
            { kanji: "往", reading: "おう", romaji: "ou", meaning: "Go, Proceed", region: "Verb", kunYomi: ["—"], onYomi: ["おう"], compounds: [{ jp: "往復", reading: "おうふく", meaning: "round trip" }, { jp: "往来", reading: "おうらい", meaning: "coming and going" }, { jp: "往路", reading: "おうろ", meaning: "outward journey" }, { jp: "既往", reading: "きおう", meaning: "past" }] },
            { kanji: "恩", reading: "おん", romaji: "on", meaning: "Grace, Favor", region: "Noun", kunYomi: ["—"], onYomi: ["おん"], compounds: [{ jp: "恩", reading: "おん", meaning: "grace, favor" }, { jp: "恩人", reading: "おんじん", meaning: "benefactor" }, { jp: "恩返し", reading: "おんがえし", meaning: "repaying a favor" }, { jp: "感恩", reading: "かんおん", meaning: "gratitude" }] },
            { kanji: "仮", reading: "かり", romaji: "kari", meaning: "Temporary, Suppose", region: "Adjective", kunYomi: ["かり"], onYomi: ["か", "け"], compounds: [{ jp: "仮に", reading: "かりに", meaning: "temporarily" }, { jp: "仮定", reading: "かてい", meaning: "assumption" }, { jp: "仮面", reading: "かめん", meaning: "mask" }, { jp: "仮説", reading: "かせつ", meaning: "hypothesis" }] },
            { kanji: "価", reading: "あたい", romaji: "atai", meaning: "Price, Value", region: "Noun", kunYomi: ["あたい"], onYomi: ["か"], compounds: [{ jp: "価値", reading: "かち", meaning: "value, worth" }, { jp: "価格", reading: "かかく", meaning: "price" }, { jp: "評価", reading: "ひょうか", meaning: "evaluation" }, { jp: "物価", reading: "ぶっか", meaning: "commodity prices" }] },
            { kanji: "河", reading: "かわ", romaji: "kawa", meaning: "River", region: "Noun", kunYomi: ["かわ"], onYomi: ["か"], compounds: [{ jp: "河川", reading: "かせん", meaning: "rivers" }, { jp: "銀河", reading: "ぎんが", meaning: "galaxy" }, { jp: "河口", reading: "かこう", meaning: "river mouth" }, { jp: "運河", reading: "うんが", meaning: "canal" }] },
            { kanji: "過", reading: "すぎる", romaji: "sugiru", meaning: "Pass, Exceed", region: "Verb", kunYomi: ["す", "あやま"], onYomi: ["か"], compounds: [{ jp: "過ぎる", reading: "すぎる", meaning: "to pass, exceed" }, { jp: "通過", reading: "つうか", meaning: "passage" }, { jp: "過去", reading: "かこ", meaning: "past" }, { jp: "超過", reading: "ちょうか", meaning: "excess" }] },
            { kanji: "賀", reading: "が", romaji: "ga", meaning: "Congratulate", region: "Verb", kunYomi: ["—"], onYomi: ["が"], compounds: [{ jp: "年賀", reading: "ねんが", meaning: "New Year greeting" }, { jp: "祝賀", reading: "しゅくが", meaning: "celebration" }, { jp: "賀状", reading: "がじょう", meaning: "greeting card" }, { jp: "慶賀", reading: "けいが", meaning: "felicitation" }] },
            { kanji: "解", reading: "とく", romaji: "toku", meaning: "Solve, Untie", region: "Verb", kunYomi: ["と", "ほど"], onYomi: ["かい", "げ"], compounds: [{ jp: "解く", reading: "とく", meaning: "to solve" }, { jp: "理解", reading: "りかい", meaning: "understanding" }, { jp: "解決", reading: "かいけつ", meaning: "resolution" }, { jp: "解説", reading: "かいせつ", meaning: "explanation" }] },
            { kanji: "格", reading: "かく", romaji: "kaku", meaning: "Status, Standard", region: "Noun", kunYomi: ["—"], onYomi: ["かく", "こう"], compounds: [{ jp: "性格", reading: "せいかく", meaning: "personality" }, { jp: "資格", reading: "しかく", meaning: "qualification" }, { jp: "規格", reading: "きかく", meaning: "standard" }, { jp: "格差", reading: "かくさ", meaning: "disparity" }] },
            { kanji: "確", reading: "たしか", romaji: "tashika", meaning: "Certain, Confirm", region: "Adjective", kunYomi: ["たし", "たしか"], onYomi: ["かく"], compounds: [{ jp: "確か", reading: "たしか", meaning: "certain, sure" }, { jp: "確認", reading: "かくにん", meaning: "confirmation" }, { jp: "確実", reading: "かくじつ", meaning: "certain" }, { jp: "正確", reading: "せいかく", meaning: "accurate" }] },
            { kanji: "額", reading: "ひたい", romaji: "hitai", meaning: "Amount, Forehead", region: "Noun", kunYomi: ["ひたい"], onYomi: ["がく"], compounds: [{ jp: "額", reading: "ひたい", meaning: "forehead" }, { jp: "金額", reading: "きんがく", meaning: "amount of money" }, { jp: "総額", reading: "そうがく", meaning: "total amount" }, { jp: "額縁", reading: "がくぶち", meaning: "picture frame" }] },
            { kanji: "刊", reading: "かん", romaji: "kan", meaning: "Publish, Print", region: "Verb", kunYomi: ["—"], onYomi: ["かん"], compounds: [{ jp: "刊行", reading: "かんこう", meaning: "publication" }, { jp: "週刊", reading: "しゅうかん", meaning: "weekly" }, { jp: "月刊", reading: "げっかん", meaning: "monthly" }, { jp: "創刊", reading: "そうかん", meaning: "inaugural issue" }] },
            { kanji: "幹", reading: "みき", romaji: "miki", meaning: "Trunk, Main", region: "Noun", kunYomi: ["みき"], onYomi: ["かん"], compounds: [{ jp: "幹", reading: "みき", meaning: "trunk (of tree)" }, { jp: "幹部", reading: "かんぶ", meaning: "executive" }, { jp: "幹線", reading: "かんせん", meaning: "main line" }, { jp: "根幹", reading: "こんかん", meaning: "foundation" }] },
            { kanji: "慣", reading: "なれる", romaji: "nareru", meaning: "Accustom, Habit", region: "Verb", kunYomi: ["な"], onYomi: ["かん"], compounds: [{ jp: "慣れる", reading: "なれる", meaning: "to get used to" }, { jp: "習慣", reading: "しゅうかん", meaning: "habit, custom" }, { jp: "慣例", reading: "かんれい", meaning: "convention" }, { jp: "慣用", reading: "かんよう", meaning: "common usage" }] },
            { kanji: "眼", reading: "め", romaji: "me", meaning: "Eye, Eyeball", region: "Noun", kunYomi: ["め", "まなこ"], onYomi: ["がん", "げん"], compounds: [{ jp: "眼鏡", reading: "めがね", meaning: "glasses" }, { jp: "眼科", reading: "がんか", meaning: "ophthalmology" }, { jp: "眼球", reading: "がんきゅう", meaning: "eyeball" }, { jp: "肉眼", reading: "にくがん", meaning: "naked eye" }] },
            { kanji: "基", reading: "もと", romaji: "moto", meaning: "Base, Foundation", region: "Noun", kunYomi: ["もと"], onYomi: ["き"], compounds: [{ jp: "基本", reading: "きほん", meaning: "basics, foundation" }, { jp: "基準", reading: "きじゅん", meaning: "standard" }, { jp: "基地", reading: "きち", meaning: "base" }, { jp: "基礎", reading: "きそ", meaning: "foundation" }] },
            { kanji: "寄", reading: "よる", romaji: "yoru", meaning: "Approach, Contribute", region: "Verb", kunYomi: ["よ"], onYomi: ["き"], compounds: [{ jp: "寄る", reading: "よる", meaning: "to stop by" }, { jp: "寄付", reading: "きふ", meaning: "donation" }, { jp: "寄り道", reading: "よりみち", meaning: "detour" }, { jp: "寄生", reading: "きせい", meaning: "parasitism" }] },
            { kanji: "規", reading: "き", romaji: "ki", meaning: "Rule, Standard", region: "Noun", kunYomi: ["—"], onYomi: ["き"], compounds: [{ jp: "規則", reading: "きそく", meaning: "rule, regulation" }, { jp: "規模", reading: "きぼ", meaning: "scale, scope" }, { jp: "規律", reading: "きりつ", meaning: "discipline" }, { jp: "規制", reading: "きせい", meaning: "regulation" }] },
            { kanji: "技", reading: "わざ", romaji: "waza", meaning: "Skill, Technique", region: "Noun", kunYomi: ["わざ"], onYomi: ["ぎ"], compounds: [{ jp: "技術", reading: "ぎじゅつ", meaning: "technology, skill" }, { jp: "技能", reading: "ぎのう", meaning: "skill" }, { jp: "競技", reading: "きょうぎ", meaning: "competition" }, { jp: "演技", reading: "えんぎ", meaning: "performance" }] },
            { kanji: "義", reading: "ぎ", romaji: "gi", meaning: "Justice, Duty", region: "Noun", kunYomi: ["—"], onYomi: ["ぎ"], compounds: [{ jp: "義務", reading: "ぎむ", meaning: "duty, obligation" }, { jp: "正義", reading: "せいぎ", meaning: "justice" }, { jp: "意義", reading: "いぎ", meaning: "meaning, significance" }, { jp: "義理", reading: "ぎり", meaning: "duty" }] },
            { kanji: "逆", reading: "さかさ", romaji: "sakasa", meaning: "Reverse, Opposite", region: "Adjective", kunYomi: ["さか", "さかさ", "さから"], onYomi: ["ぎゃく"], compounds: [{ jp: "逆", reading: "ぎゃく", meaning: "reverse, opposite" }, { jp: "逆転", reading: "ぎゃくてん", meaning: "reversal" }, { jp: "逆効果", reading: "ぎゃくこうか", meaning: "counterproductive" }, { jp: "反逆", reading: "はんぎゃく", meaning: "rebellion" }] },
            { kanji: "久", reading: "ひさしい", romaji: "hisashii", meaning: "Long time, Lasting", region: "Adjective", kunYomi: ["ひさ"], onYomi: ["きゅう", "く"], compounds: [{ jp: "久しぶり", reading: "ひさしぶり", meaning: "long time no see" }, { jp: "永久", reading: "えいきゅう", meaning: "permanent, forever" }, { jp: "久遠", reading: "くおん", meaning: "eternity" }, { jp: "耐久", reading: "たいきゅう", meaning: "durability" }] },
            { kanji: "旧", reading: "ふるい", romaji: "furui", meaning: "Old, Former", region: "Adjective", kunYomi: ["ふる"], onYomi: ["きゅう"], compounds: [{ jp: "旧式", reading: "きゅうしき", meaning: "old style" }, { jp: "旧友", reading: "きゅうゆう", meaning: "old friend" }, { jp: "復旧", reading: "ふっきゅう", meaning: "restoration" }, { jp: "旧来", reading: "きゅうらい", meaning: "old, conventional" }] },
            { kanji: "居", reading: "いる", romaji: "iru", meaning: "Reside, Be present", region: "Verb", kunYomi: ["い", "お"], onYomi: ["きょ"], compounds: [{ jp: "居る", reading: "いる", meaning: "to be, reside" }, { jp: "居場所", reading: "いばしょ", meaning: "one's place" }, { jp: "同居", reading: "どうきょ", meaning: "living together" }, { jp: "居住", reading: "きょじゅう", meaning: "residence" }] },
            { kanji: "許", reading: "ゆるす", romaji: "yurusu", meaning: "Permit, Forgive", region: "Verb", kunYomi: ["ゆる"], onYomi: ["きょ"], compounds: [{ jp: "許す", reading: "ゆるす", meaning: "to permit, forgive" }, { jp: "許可", reading: "きょか", meaning: "permission" }, { jp: "免許", reading: "めんきょ", meaning: "license" }, { jp: "許容", reading: "きょよう", meaning: "tolerance" }] },
            { kanji: "境", reading: "さかい", romaji: "sakai", meaning: "Boundary, Border", region: "Noun", kunYomi: ["さかい"], onYomi: ["きょう", "けい"], compounds: [{ jp: "環境", reading: "かんきょう", meaning: "environment" }, { jp: "国境", reading: "こっきょう", meaning: "national border" }, { jp: "境界", reading: "きょうかい", meaning: "boundary" }, { jp: "境地", reading: "きょうち", meaning: "state of mind" }] },
            { kanji: "均", reading: "ひとしい", romaji: "hitoshii", meaning: "Equal, Average", region: "Adjective", kunYomi: ["ひと"], onYomi: ["きん"], compounds: [{ jp: "平均", reading: "へいきん", meaning: "average" }, { jp: "均等", reading: "きんとう", meaning: "equal, even" }, { jp: "均衡", reading: "きんこう", meaning: "balance" }, { jp: "不均衡", reading: "ふきんこう", meaning: "imbalance" }] },
            { kanji: "禁", reading: "きん", romaji: "kin", meaning: "Prohibit, Forbid", region: "Verb", kunYomi: ["—"], onYomi: ["きん"], compounds: [{ jp: "禁止", reading: "きんし", meaning: "prohibition, ban" }, { jp: "禁煙", reading: "きんえん", meaning: "no smoking" }, { jp: "禁じる", reading: "きんじる", meaning: "to prohibit" }, { jp: "厳禁", reading: "げんきん", meaning: "strictly forbidden" }] },
            { kanji: "句", reading: "く", romaji: "ku", meaning: "Phrase, Haiku", region: "Noun", kunYomi: ["—"], onYomi: ["く"], compounds: [{ jp: "俳句", reading: "はいく", meaning: "haiku" }, { jp: "文句", reading: "もんく", meaning: "complaint, phrase" }, { jp: "一句", reading: "いっく", meaning: "a verse" }, { jp: "節句", reading: "せっく", meaning: "seasonal festival" }] },
            { kanji: "群", reading: "むれ", romaji: "mure", meaning: "Group, Crowd", region: "Noun", kunYomi: ["む", "むら"], onYomi: ["ぐん"], compounds: [{ jp: "群れ", reading: "むれ", meaning: "group, flock" }, { jp: "群衆", reading: "ぐんしゅう", meaning: "crowd" }, { jp: "群島", reading: "ぐんとう", meaning: "archipelago" }, { jp: "抜群", reading: "ばつぐん", meaning: "outstanding" }] },
            { kanji: "経", reading: "へる", romaji: "heru", meaning: "Pass through, Economy", region: "Verb", kunYomi: ["へ", "たて"], onYomi: ["けい", "きょう"], compounds: [{ jp: "経験", reading: "けいけん", meaning: "experience" }, { jp: "経済", reading: "けいざい", meaning: "economy" }, { jp: "経営", reading: "けいえい", meaning: "management" }, { jp: "経路", reading: "けいろ", meaning: "route, path" }] },
            { kanji: "潔", reading: "いさぎよい", romaji: "isagiyoi", meaning: "Pure, Clean", region: "Adjective", kunYomi: ["いさぎよ"], onYomi: ["けつ"], compounds: [{ jp: "清潔", reading: "せいけつ", meaning: "clean, hygienic" }, { jp: "潔い", reading: "いさぎよい", meaning: "pure, honorable" }, { jp: "潔白", reading: "けっぱく", meaning: "innocence" }, { jp: "不潔", reading: "ふけつ", meaning: "dirty, unclean" }] },
            { kanji: "件", reading: "けん", romaji: "ken", meaning: "Matter, Case", region: "Noun", kunYomi: ["—"], onYomi: ["けん"], compounds: [{ jp: "条件", reading: "じょうけん", meaning: "condition, terms" }, { jp: "事件", reading: "じけん", meaning: "incident, case" }, { jp: "要件", reading: "ようけん", meaning: "requirement" }, { jp: "件数", reading: "けんすう", meaning: "number of cases" }] },
            { kanji: "券", reading: "けん", romaji: "ken", meaning: "Ticket, Certificate", region: "Noun", kunYomi: ["—"], onYomi: ["けん"], compounds: [{ jp: "乗車券", reading: "じょうしゃけん", meaning: "train ticket" }, { jp: "食券", reading: "しょっけん", meaning: "meal ticket" }, { jp: "入場券", reading: "にゅうじょうけん", meaning: "admission ticket" }, { jp: "金券", reading: "きんけん", meaning: "gift certificate" }] },
            { kanji: "険", reading: "けわしい", romaji: "kewashii", meaning: "Steep, Danger", region: "Adjective", kunYomi: ["けわ"], onYomi: ["けん"], compounds: [{ jp: "険しい", reading: "けわしい", meaning: "steep, harsh" }, { jp: "危険", reading: "きけん", meaning: "danger" }, { jp: "険悪", reading: "けんあく", meaning: "dangerous, hostile" }, { jp: "保険", reading: "ほけん", meaning: "insurance" }] },
            { kanji: "検", reading: "けん", romaji: "ken", meaning: "Examine, Inspect", region: "Verb", kunYomi: ["—"], onYomi: ["けん"], compounds: [{ jp: "検査", reading: "けんさ", meaning: "inspection" }, { jp: "検討", reading: "けんとう", meaning: "review" }, { jp: "点検", reading: "てんけん", meaning: "inspection, check" }, { jp: "検索", reading: "けんさく", meaning: "search" }] },
            { kanji: "限", reading: "かぎる", romaji: "kagiru", meaning: "Limit, Restrict", region: "Verb", kunYomi: ["かぎ"], onYomi: ["げん"], compounds: [{ jp: "制限", reading: "せいげん", meaning: "restriction" }, { jp: "限界", reading: "げんかい", meaning: "limit" }, { jp: "無限", reading: "むげん", meaning: "infinite" }, { jp: "期限", reading: "きげん", meaning: "deadline" }] },
            { kanji: "現", reading: "あらわれる", romaji: "arawareru", meaning: "Appear, Present", region: "Verb", kunYomi: ["あらわ"], onYomi: ["げん"], compounds: [{ jp: "現れる", reading: "あらわれる", meaning: "to appear" }, { jp: "現在", reading: "げんざい", meaning: "present, now" }, { jp: "現実", reading: "げんじつ", meaning: "reality" }, { jp: "表現", reading: "ひょうげん", meaning: "expression" }] },
            { kanji: "減", reading: "へる", romaji: "heru", meaning: "Decrease, Reduce", region: "Verb", kunYomi: ["へ"], onYomi: ["げん"], compounds: [{ jp: "減る", reading: "へる", meaning: "to decrease" }, { jp: "削減", reading: "さくげん", meaning: "reduction" }, { jp: "減少", reading: "げんしょう", meaning: "decrease" }, { jp: "軽減", reading: "けいげん", meaning: "mitigation" }] },
        ] },
    { id: "grade_5_kanji_level_2", label: "Level 2", sublabel: "Elementary Grade 5 · 50 cards", emoji: "📘", group: "grade_5", mode: "formal", category_key: "formal_grade_grade_5", cards: [
            { kanji: "故", reading: "ゆえ", romaji: "yue", meaning: "Reason, Old", region: "Noun", kunYomi: ["ゆえ", "ふる"], onYomi: ["こ"], compounds: [{ jp: "故に", reading: "ゆえに", meaning: "therefore" }, { jp: "故障", reading: "こしょう", meaning: "breakdown" }, { jp: "事故", reading: "じこ", meaning: "accident" }, { jp: "故郷", reading: "こきょう", meaning: "hometown" }] },
            { kanji: "個", reading: "こ", romaji: "ko", meaning: "Individual, Item", region: "Noun", kunYomi: ["—"], onYomi: ["こ"], compounds: [{ jp: "個人", reading: "こじん", meaning: "individual" }, { jp: "個別", reading: "こべつ", meaning: "individual, separate" }, { jp: "個性", reading: "こせい", meaning: "individuality" }, { jp: "各個", reading: "かっこ", meaning: "each individual" }] },
            { kanji: "護", reading: "まもる", romaji: "mamoru", meaning: "Protect, Guard", region: "Verb", kunYomi: ["まも"], onYomi: ["ご"], compounds: [{ jp: "保護", reading: "ほご", meaning: "protection" }, { jp: "弁護", reading: "べんご", meaning: "defense" }, { jp: "看護", reading: "かんご", meaning: "nursing" }, { jp: "護衛", reading: "ごえい", meaning: "escort, guard" }] },
            { kanji: "効", reading: "きく", romaji: "kiku", meaning: "Effect, Efficient", region: "Noun", kunYomi: ["き"], onYomi: ["こう"], compounds: [{ jp: "効果", reading: "こうか", meaning: "effect" }, { jp: "有効", reading: "ゆうこう", meaning: "effective" }, { jp: "効率", reading: "こうりつ", meaning: "efficiency" }, { jp: "特効", reading: "とっこう", meaning: "special effect" }] },
            { kanji: "厚", reading: "あつい", romaji: "atsui", meaning: "Thick, Kind", region: "Adjective", kunYomi: ["あつ"], onYomi: ["こう"], compounds: [{ jp: "厚い", reading: "あつい", meaning: "thick, kind" }, { jp: "厚意", reading: "こうい", meaning: "goodwill" }, { jp: "厚生", reading: "こうせい", meaning: "welfare" }, { jp: "濃厚", reading: "のうこう", meaning: "rich, dense" }] },
            { kanji: "耕", reading: "たがやす", romaji: "tagayasu", meaning: "Cultivate, Till", region: "Verb", kunYomi: ["たがや"], onYomi: ["こう"], compounds: [{ jp: "耕す", reading: "たがやす", meaning: "to cultivate" }, { jp: "農耕", reading: "のうこう", meaning: "agriculture" }, { jp: "耕地", reading: "こうち", meaning: "cultivated land" }, { jp: "耕作", reading: "こうさく", meaning: "farming" }] },
            { kanji: "鉱", reading: "こう", romaji: "kou", meaning: "Mineral, Ore", region: "Noun", kunYomi: ["—"], onYomi: ["こう"], compounds: [{ jp: "鉱山", reading: "こうざん", meaning: "mine" }, { jp: "鉱物", reading: "こうぶつ", meaning: "mineral" }, { jp: "鉄鉱", reading: "てっこう", meaning: "iron ore" }, { jp: "鉱石", reading: "こうせき", meaning: "ore" }] },
            { kanji: "構", reading: "かまえる", romaji: "kamaeru", meaning: "Structure, Posture", region: "Verb", kunYomi: ["かま"], onYomi: ["こう"], compounds: [{ jp: "構造", reading: "こうぞう", meaning: "structure" }, { jp: "構成", reading: "こうせい", meaning: "composition" }, { jp: "結構", reading: "けっこう", meaning: "quite, fine" }, { jp: "機構", reading: "きこう", meaning: "mechanism" }] },
            { kanji: "興", reading: "おこる", romaji: "okoru", meaning: "Prosper, Interest", region: "Verb", kunYomi: ["おこ"], onYomi: ["こう", "きょう"], compounds: [{ jp: "興味", reading: "きょうみ", meaning: "interest" }, { jp: "興奮", reading: "こうふん", meaning: "excitement" }, { jp: "振興", reading: "しんこう", meaning: "promotion" }, { jp: "興行", reading: "こうぎょう", meaning: "performance, show" }] },
            { kanji: "講", reading: "こう", romaji: "kou", meaning: "Lecture, Study", region: "Noun", kunYomi: ["—"], onYomi: ["こう"], compounds: [{ jp: "講義", reading: "こうぎ", meaning: "lecture" }, { jp: "講師", reading: "こうし", meaning: "instructor" }, { jp: "講演", reading: "こうえん", meaning: "speech" }, { jp: "受講", reading: "じゅこう", meaning: "taking a course" }] },
            { kanji: "混", reading: "まざる", romaji: "mazaru", meaning: "Mix, Confuse", region: "Verb", kunYomi: ["ま", "こ"], onYomi: ["こん"], compounds: [{ jp: "混ざる", reading: "まざる", meaning: "to mix" }, { jp: "混雑", reading: "こんざつ", meaning: "congestion" }, { jp: "混乱", reading: "こんらん", meaning: "chaos" }, { jp: "混同", reading: "こんどう", meaning: "confusion" }] },
            { kanji: "査", reading: "しらべる", romaji: "shiraberu", meaning: "Investigate, Check", region: "Verb", kunYomi: ["—"], onYomi: ["さ"], compounds: [{ jp: "調査", reading: "ちょうさ", meaning: "investigation" }, { jp: "審査", reading: "しんさ", meaning: "screening" }, { jp: "査定", reading: "さてい", meaning: "assessment" }, { jp: "検査", reading: "けんさ", meaning: "inspection" }] },
            { kanji: "再", reading: "ふたたび", romaji: "futatabi", meaning: "Again, Re-", region: "Adverb", kunYomi: ["ふたた"], onYomi: ["さい", "さ"], compounds: [{ jp: "再び", reading: "ふたたび", meaning: "again" }, { jp: "再生", reading: "さいせい", meaning: "regeneration" }, { jp: "再度", reading: "さいど", meaning: "once more" }, { jp: "再開", reading: "さいかい", meaning: "resumption" }] },
            { kanji: "妻", reading: "つま", romaji: "tsuma", meaning: "Wife", region: "Noun", kunYomi: ["つま"], onYomi: ["さい"], compounds: [{ jp: "妻", reading: "つま", meaning: "wife" }, { jp: "夫妻", reading: "ふさい", meaning: "husband and wife" }, { jp: "人妻", reading: "ひとづま", meaning: "married woman" }, { jp: "妻子", reading: "さいし", meaning: "wife and children" }] },
            { kanji: "採", reading: "とる", romaji: "toru", meaning: "Adopt, Gather", region: "Verb", kunYomi: ["と"], onYomi: ["さい"], compounds: [{ jp: "採用", reading: "さいよう", meaning: "hiring, adoption" }, { jp: "採点", reading: "さいてん", meaning: "grading" }, { jp: "採掘", reading: "さいくつ", meaning: "mining" }, { jp: "採集", reading: "さいしゅう", meaning: "collecting" }] },
            { kanji: "際", reading: "きわ", romaji: "kiwa", meaning: "Edge, Occasion", region: "Noun", kunYomi: ["きわ"], onYomi: ["さい"], compounds: [{ jp: "国際", reading: "こくさい", meaning: "international" }, { jp: "実際", reading: "じっさい", meaning: "in reality" }, { jp: "交際", reading: "こうさい", meaning: "social relations" }, { jp: "際立つ", reading: "きわだつ", meaning: "to stand out" }] },
            { kanji: "在", reading: "ある", romaji: "aru", meaning: "Exist, Presence", region: "Verb", kunYomi: ["あ"], onYomi: ["ざい"], compounds: [{ jp: "存在", reading: "そんざい", meaning: "existence" }, { jp: "在学", reading: "ざいがく", meaning: "enrolled" }, { jp: "現在", reading: "げんざい", meaning: "present" }, { jp: "在庫", reading: "ざいこ", meaning: "stock, inventory" }] },
            { kanji: "財", reading: "たから", romaji: "takara", meaning: "Wealth, Property", region: "Noun", kunYomi: ["たから"], onYomi: ["ざい", "さい"], compounds: [{ jp: "財産", reading: "ざいさん", meaning: "property, assets" }, { jp: "財政", reading: "ざいせい", meaning: "public finances" }, { jp: "財布", reading: "さいふ", meaning: "wallet" }, { jp: "文化財", reading: "ぶんかざい", meaning: "cultural property" }] },
            { kanji: "罪", reading: "つみ", romaji: "tsumi", meaning: "Crime, Sin", region: "Noun", kunYomi: ["つみ"], onYomi: ["ざい"], compounds: [{ jp: "罪", reading: "つみ", meaning: "crime, sin" }, { jp: "犯罪", reading: "はんざい", meaning: "crime" }, { jp: "謝罪", reading: "しゃざい", meaning: "apology" }, { jp: "無罪", reading: "むざい", meaning: "innocence" }] },
            { kanji: "雑", reading: "ざつ", romaji: "zatsu", meaning: "Miscellaneous, Mixed", region: "Adjective", kunYomi: ["—"], onYomi: ["ざつ", "ぞう"], compounds: [{ jp: "雑誌", reading: "ざっし", meaning: "magazine" }, { jp: "複雑", reading: "ふくざつ", meaning: "complex" }, { jp: "雑談", reading: "ざつだん", meaning: "small talk" }, { jp: "雑音", reading: "ざつおん", meaning: "noise" }] },
            { kanji: "酸", reading: "すい", romaji: "sui", meaning: "Acid, Sour", region: "Noun", kunYomi: ["す"], onYomi: ["さん"], compounds: [{ jp: "酸素", reading: "さんそ", meaning: "oxygen" }, { jp: "酸っぱい", reading: "すっぱい", meaning: "sour" }, { jp: "炭酸", reading: "たんさん", meaning: "carbonic acid" }, { jp: "酸化", reading: "さんか", meaning: "oxidation" }] },
            { kanji: "賛", reading: "さん", romaji: "san", meaning: "Agree, Praise", region: "Verb", kunYomi: ["—"], onYomi: ["さん"], compounds: [{ jp: "賛成", reading: "さんせい", meaning: "agreement" }, { jp: "賛同", reading: "さんどう", meaning: "support" }, { jp: "絶賛", reading: "ぜっさん", meaning: "high praise" }, { jp: "賛否", reading: "さんぴ", meaning: "pros and cons" }] },
            { kanji: "支", reading: "ささえる", romaji: "sasaeru", meaning: "Support, Branch", region: "Verb", kunYomi: ["ささ"], onYomi: ["し"], compounds: [{ jp: "支える", reading: "ささえる", meaning: "to support" }, { jp: "支持", reading: "しじ", meaning: "support" }, { jp: "支店", reading: "してん", meaning: "branch office" }, { jp: "支出", reading: "ししゅつ", meaning: "expenditure" }] },
            { kanji: "志", reading: "こころざし", romaji: "kokorozashi", meaning: "Will, Ambition", region: "Noun", kunYomi: ["こころざ", "こころざし"], onYomi: ["し"], compounds: [{ jp: "意志", reading: "いし", meaning: "will, volition" }, { jp: "志望", reading: "しぼう", meaning: "aspiration" }, { jp: "同志", reading: "どうし", meaning: "comrade" }, { jp: "有志", reading: "ゆうし", meaning: "volunteer" }] },
            { kanji: "枝", reading: "えだ", romaji: "eda", meaning: "Branch, Twig", region: "Noun", kunYomi: ["えだ"], onYomi: ["し"], compounds: [{ jp: "枝", reading: "えだ", meaning: "branch, twig" }, { jp: "枝葉", reading: "えだは", meaning: "branches and leaves" }, { jp: "小枝", reading: "こえだ", meaning: "small twig" }, { jp: "枝道", reading: "えだみち", meaning: "branch road" }] },
            { kanji: "師", reading: "し", romaji: "shi", meaning: "Teacher, Master", region: "Noun", kunYomi: ["—"], onYomi: ["し"], compounds: [{ jp: "教師", reading: "きょうし", meaning: "teacher" }, { jp: "医師", reading: "いし", meaning: "physician" }, { jp: "師匠", reading: "ししょう", meaning: "master, mentor" }, { jp: "恩師", reading: "おんし", meaning: "one's teacher" }] },
            { kanji: "資", reading: "し", romaji: "shi", meaning: "Resources, Capital", region: "Noun", kunYomi: ["—"], onYomi: ["し"], compounds: [{ jp: "資料", reading: "しりょう", meaning: "materials, data" }, { jp: "資金", reading: "しきん", meaning: "funds" }, { jp: "資源", reading: "しげん", meaning: "resources" }, { jp: "投資", reading: "とうし", meaning: "investment" }] },
            { kanji: "飼", reading: "かう", romaji: "kau", meaning: "Raise, Keep (animal)", region: "Verb", kunYomi: ["か"], onYomi: ["し"], compounds: [{ jp: "飼う", reading: "かう", meaning: "to raise (animal)" }, { jp: "飼育", reading: "しいく", meaning: "breeding" }, { jp: "飼い主", reading: "かいぬし", meaning: "pet owner" }, { jp: "飼料", reading: "しりょう", meaning: "animal feed" }] },
            { kanji: "似", reading: "にる", romaji: "niru", meaning: "Resemble, Similar", region: "Verb", kunYomi: ["に"], onYomi: ["じ"], compounds: [{ jp: "似る", reading: "にる", meaning: "to resemble" }, { jp: "類似", reading: "るいじ", meaning: "similarity" }, { jp: "似顔絵", reading: "にがおえ", meaning: "portrait" }, { jp: "相似", reading: "そうじ", meaning: "resemblance" }] },
            { kanji: "識", reading: "しき", romaji: "shiki", meaning: "Know, Discern", region: "Verb", kunYomi: ["—"], onYomi: ["しき"], compounds: [{ jp: "知識", reading: "ちしき", meaning: "knowledge" }, { jp: "意識", reading: "いしき", meaning: "consciousness" }, { jp: "常識", reading: "じょうしき", meaning: "common sense" }, { jp: "認識", reading: "にんしき", meaning: "recognition" }] },
            { kanji: "質", reading: "しつ", romaji: "shitsu", meaning: "Quality, Nature", region: "Noun", kunYomi: ["—"], onYomi: ["しつ", "しち", "ち"], compounds: [{ jp: "品質", reading: "ひんしつ", meaning: "quality" }, { jp: "物質", reading: "ぶっしつ", meaning: "matter, substance" }, { jp: "質問", reading: "しつもん", meaning: "question" }, { jp: "性質", reading: "せいしつ", meaning: "nature, disposition" }] },
            { kanji: "舎", reading: "しゃ", romaji: "sha", meaning: "Building, Hut", region: "Noun", kunYomi: ["や"], onYomi: ["しゃ"], compounds: [{ jp: "校舎", reading: "こうしゃ", meaning: "school building" }, { jp: "宿舎", reading: "しゅくしゃ", meaning: "lodging" }, { jp: "田舎", reading: "いなか", meaning: "countryside" }, { jp: "庁舎", reading: "ちょうしゃ", meaning: "government building" }] },
            { kanji: "謝", reading: "あやまる", romaji: "ayamaru", meaning: "Apologize, Thank", region: "Verb", kunYomi: ["あやま"], onYomi: ["しゃ"], compounds: [{ jp: "謝る", reading: "あやまる", meaning: "to apologize" }, { jp: "感謝", reading: "かんしゃ", meaning: "gratitude" }, { jp: "謝罪", reading: "しゃざい", meaning: "apology" }, { jp: "謝礼", reading: "しゃれい", meaning: "honorarium" }] },
            { kanji: "授", reading: "さずける", romaji: "sazukeru", meaning: "Grant, Teach", region: "Verb", kunYomi: ["さず"], onYomi: ["じゅ"], compounds: [{ jp: "授業", reading: "じゅぎょう", meaning: "class, lesson" }, { jp: "教授", reading: "きょうじゅ", meaning: "professor" }, { jp: "授与", reading: "じゅよ", meaning: "awarding" }, { jp: "授権", reading: "じゅけん", meaning: "authorization" }] },
            { kanji: "述", reading: "のべる", romaji: "noberu", meaning: "State, Mention", region: "Verb", kunYomi: ["の"], onYomi: ["じゅつ"], compounds: [{ jp: "述べる", reading: "のべる", meaning: "to state" }, { jp: "記述", reading: "きじゅつ", meaning: "description" }, { jp: "陳述", reading: "ちんじゅつ", meaning: "statement" }, { jp: "口述", reading: "こうじゅつ", meaning: "oral statement" }] },
            { kanji: "準", reading: "じゅん", romaji: "jun", meaning: "Standard, Semi-", region: "Noun", kunYomi: ["—"], onYomi: ["じゅん"], compounds: [{ jp: "準備", reading: "じゅんび", meaning: "preparation" }, { jp: "基準", reading: "きじゅん", meaning: "standard" }, { jp: "水準", reading: "すいじゅん", meaning: "level" }, { jp: "準決勝", reading: "じゅんけっしょう", meaning: "semifinal" }] },
            { kanji: "序", reading: "じょ", romaji: "jo", meaning: "Order, Preface", region: "Noun", kunYomi: ["—"], onYomi: ["じょ"], compounds: [{ jp: "秩序", reading: "ちつじょ", meaning: "order, discipline" }, { jp: "序列", reading: "じょれつ", meaning: "ranking" }, { jp: "序文", reading: "じょぶん", meaning: "preface" }, { jp: "序章", reading: "じょしょう", meaning: "prologue" }] },
            { kanji: "承", reading: "うけたまわる", romaji: "uketamawaru", meaning: "Receive, Consent", region: "Verb", kunYomi: ["うけたまわ"], onYomi: ["しょう"], compounds: [{ jp: "承認", reading: "しょうにん", meaning: "approval" }, { jp: "了承", reading: "りょうしょう", meaning: "understanding" }, { jp: "承知", reading: "しょうち", meaning: "consent" }, { jp: "継承", reading: "けいしょう", meaning: "succession" }] },
            { kanji: "招", reading: "まねく", romaji: "maneku", meaning: "Invite, Beckon", region: "Verb", kunYomi: ["まね"], onYomi: ["しょう"], compounds: [{ jp: "招待", reading: "しょうたい", meaning: "invitation" }, { jp: "招集", reading: "しょうしゅう", meaning: "convocation" }, { jp: "招く", reading: "まねく", meaning: "to invite" }, { jp: "自招", reading: "じしょう", meaning: "self-caused" }] },
            { kanji: "証", reading: "あかし", romaji: "akashi", meaning: "Proof, Evidence", region: "Noun", kunYomi: ["あかし"], onYomi: ["しょう"], compounds: [{ jp: "証明", reading: "しょうめい", meaning: "proof" }, { jp: "証拠", reading: "しょうこ", meaning: "evidence" }, { jp: "保証", reading: "ほしょう", meaning: "guarantee" }, { jp: "証言", reading: "しょうげん", meaning: "testimony" }] },
            { kanji: "条", reading: "じょう", romaji: "jou", meaning: "Clause, Article", region: "Noun", kunYomi: ["—"], onYomi: ["じょう"], compounds: [{ jp: "条件", reading: "じょうけん", meaning: "condition" }, { jp: "条約", reading: "じょうやく", meaning: "treaty" }, { jp: "条例", reading: "じょうれい", meaning: "ordinance" }, { jp: "箇条", reading: "かじょう", meaning: "article, item" }] },
            { kanji: "状", reading: "じょう", romaji: "jou", meaning: "Condition, Letter", region: "Noun", kunYomi: ["—"], onYomi: ["じょう"], compounds: [{ jp: "状況", reading: "じょうきょう", meaning: "situation" }, { jp: "状態", reading: "じょうたい", meaning: "condition, state" }, { jp: "礼状", reading: "れいじょう", meaning: "thank-you letter" }, { jp: "症状", reading: "しょうじょう", meaning: "symptom" }] },
            { kanji: "常", reading: "つね", romaji: "tsune", meaning: "Normal, Always", region: "Adjective", kunYomi: ["つね", "とこ"], onYomi: ["じょう"], compounds: [{ jp: "日常", reading: "にちじょう", meaning: "everyday" }, { jp: "通常", reading: "つうじょう", meaning: "normal, usual" }, { jp: "非常", reading: "ひじょう", meaning: "emergency" }, { jp: "常識", reading: "じょうしき", meaning: "common sense" }] },
            { kanji: "情", reading: "なさけ", romaji: "nasake", meaning: "Feeling, Emotion", region: "Noun", kunYomi: ["なさけ"], onYomi: ["じょう", "せい"], compounds: [{ jp: "感情", reading: "かんじょう", meaning: "emotion" }, { jp: "事情", reading: "じじょう", meaning: "circumstances" }, { jp: "情報", reading: "じょうほう", meaning: "information" }, { jp: "同情", reading: "どうじょう", meaning: "sympathy" }] },
            { kanji: "織", reading: "おる", romaji: "oru", meaning: "Weave", region: "Verb", kunYomi: ["お", "おり"], onYomi: ["しょく", "しき"], compounds: [{ jp: "組織", reading: "そしき", meaning: "organization" }, { jp: "織物", reading: "おりもの", meaning: "textile" }, { jp: "毛織", reading: "けおり", meaning: "woolen fabric" }, { jp: "染織", reading: "せんしょく", meaning: "dyeing and weaving" }] },
            { kanji: "職", reading: "しょく", romaji: "shoku", meaning: "Occupation, Post", region: "Noun", kunYomi: ["—"], onYomi: ["しょく"], compounds: [{ jp: "職業", reading: "しょくぎょう", meaning: "occupation" }, { jp: "職場", reading: "しょくば", meaning: "workplace" }, { jp: "就職", reading: "しゅうしょく", meaning: "getting a job" }, { jp: "職員", reading: "しょくいん", meaning: "staff member" }] },
            { kanji: "制", reading: "せい", romaji: "sei", meaning: "System, Control", region: "Noun", kunYomi: ["—"], onYomi: ["せい"], compounds: [{ jp: "制度", reading: "せいど", meaning: "system" }, { jp: "制限", reading: "せいげん", meaning: "restriction" }, { jp: "規制", reading: "きせい", meaning: "regulation" }, { jp: "制作", reading: "せいさく", meaning: "production" }] },
            { kanji: "性", reading: "さが", romaji: "saga", meaning: "Nature, Gender", region: "Noun", kunYomi: ["さが"], onYomi: ["せい", "しょう"], compounds: [{ jp: "性格", reading: "せいかく", meaning: "personality" }, { jp: "性質", reading: "せいしつ", meaning: "nature" }, { jp: "個性", reading: "こせい", meaning: "individuality" }, { jp: "感性", reading: "かんせい", meaning: "sensibility" }] },
            { kanji: "示", reading: "しめす", romaji: "shimesu", meaning: "Show, Indicate", region: "Verb", kunYomi: ["しめ"], onYomi: ["し", "じ"], compounds: [{ jp: "示す", reading: "しめす", meaning: "to show, indicate" }, { jp: "指示", reading: "しじ", meaning: "instruction" }, { jp: "展示", reading: "てんじ", meaning: "exhibition" }, { jp: "示唆", reading: "しさ", meaning: "suggestion" }] },
            { kanji: "術", reading: "じゅつ", romaji: "jutsu", meaning: "Art, Technique", region: "Noun", kunYomi: ["すべ"], onYomi: ["じゅつ"], compounds: [{ jp: "技術", reading: "ぎじゅつ", meaning: "technology, skill" }, { jp: "芸術", reading: "げいじゅつ", meaning: "art" }, { jp: "手術", reading: "しゅじゅつ", meaning: "surgery" }, { jp: "学術", reading: "がくじゅつ", meaning: "science, academics" }] },
        ] },
    { id: "grade_5_kanji_level_3", label: "Level 3", sublabel: "Elementary Grade 5 · 50 cards", emoji: "📘", group: "grade_5", mode: "formal", category_key: "formal_grade_grade_5", cards: [
            { kanji: "政", reading: "まつりごと", romaji: "matsrigoto", meaning: "Politics, Government", region: "Noun", kunYomi: ["まつりごと"], onYomi: ["せい", "しょう"], compounds: [{ jp: "政治", reading: "せいじ", meaning: "politics" }, { jp: "政府", reading: "せいふ", meaning: "government" }, { jp: "行政", reading: "ぎょうせい", meaning: "administration" }, { jp: "財政", reading: "ざいせい", meaning: "public finance" }] },
            { kanji: "勢", reading: "いきおい", romaji: "ikioi", meaning: "Force, Vigor", region: "Noun", kunYomi: ["いきお"], onYomi: ["せい"], compounds: [{ jp: "勢い", reading: "いきおい", meaning: "force, vigor" }, { jp: "形勢", reading: "けいせい", meaning: "situation" }, { jp: "勢力", reading: "せいりょく", meaning: "power, influence" }, { jp: "優勢", reading: "ゆうせい", meaning: "dominance" }] },
            { kanji: "精", reading: "せい", romaji: "sei", meaning: "Spirit, Precise", region: "Noun", kunYomi: ["—"], onYomi: ["せい", "しょう"], compounds: [{ jp: "精神", reading: "せいしん", meaning: "spirit, mind" }, { jp: "精密", reading: "せいみつ", meaning: "precise" }, { jp: "精力", reading: "せいりょく", meaning: "energy" }, { jp: "精通", reading: "せいつう", meaning: "expertise" }] },
            { kanji: "製", reading: "せい", romaji: "sei", meaning: "Manufacture, Make", region: "Verb", kunYomi: ["—"], onYomi: ["せい"], compounds: [{ jp: "製品", reading: "せいひん", meaning: "product" }, { jp: "製造", reading: "せいぞう", meaning: "manufacture" }, { jp: "製作", reading: "せいさく", meaning: "production" }, { jp: "日本製", reading: "にほんせい", meaning: "made in Japan" }] },
            { kanji: "税", reading: "ぜい", romaji: "zei", meaning: "Tax", region: "Noun", kunYomi: ["—"], onYomi: ["ぜい"], compounds: [{ jp: "税金", reading: "ぜいきん", meaning: "tax" }, { jp: "消費税", reading: "しょうひぜい", meaning: "consumption tax" }, { jp: "納税", reading: "のうぜい", meaning: "paying taxes" }, { jp: "脱税", reading: "だつぜい", meaning: "tax evasion" }] },
            { kanji: "責", reading: "せめる", romaji: "semeru", meaning: "Blame, Responsibility", region: "Verb", kunYomi: ["せ"], onYomi: ["せき"], compounds: [{ jp: "責任", reading: "せきにん", meaning: "responsibility" }, { jp: "自責", reading: "じせき", meaning: "self-reproach" }, { jp: "責務", reading: "せきむ", meaning: "duty" }, { jp: "問責", reading: "もんせき", meaning: "censure" }] },
            { kanji: "績", reading: "せき", romaji: "seki", meaning: "Achievement, Result", region: "Noun", kunYomi: ["—"], onYomi: ["せき"], compounds: [{ jp: "成績", reading: "せいせき", meaning: "grades, results" }, { jp: "業績", reading: "ぎょうせき", meaning: "achievement" }, { jp: "実績", reading: "じっせき", meaning: "track record" }, { jp: "功績", reading: "こうせき", meaning: "merit" }] },
            { kanji: "接", reading: "つぐ", romaji: "tsugu", meaning: "Contact, Join", region: "Verb", kunYomi: ["つ"], onYomi: ["せつ"], compounds: [{ jp: "接続", reading: "せつぞく", meaning: "connection" }, { jp: "接待", reading: "せったい", meaning: "hospitality" }, { jp: "直接", reading: "ちょくせつ", meaning: "direct" }, { jp: "接触", reading: "せっしょく", meaning: "contact" }] },
            { kanji: "設", reading: "もうける", romaji: "moukeru", meaning: "Establish, Set up", region: "Verb", kunYomi: ["もう"], onYomi: ["せつ"], compounds: [{ jp: "設備", reading: "せつび", meaning: "equipment" }, { jp: "設計", reading: "せっけい", meaning: "design, plan" }, { jp: "建設", reading: "けんせつ", meaning: "construction" }, { jp: "設置", reading: "せっち", meaning: "installation" }] },
            { kanji: "絶", reading: "たえる", romaji: "taeru", meaning: "Sever, Extinct", region: "Verb", kunYomi: ["た", "たや"], onYomi: ["ぜつ"], compounds: [{ jp: "絶対", reading: "ぜったい", meaning: "absolute" }, { jp: "絶望", reading: "ぜつぼう", meaning: "despair" }, { jp: "絶滅", reading: "ぜつめつ", meaning: "extinction" }, { jp: "途絶", reading: "とぜつ", meaning: "interruption" }] },
            { kanji: "祖", reading: "そ", romaji: "so", meaning: "Ancestor", region: "Noun", kunYomi: ["—"], onYomi: ["そ"], compounds: [{ jp: "祖父", reading: "そふ", meaning: "grandfather" }, { jp: "祖母", reading: "そぼ", meaning: "grandmother" }, { jp: "先祖", reading: "せんぞ", meaning: "ancestor" }, { jp: "祖国", reading: "そこく", meaning: "homeland" }] },
            { kanji: "素", reading: "もと", romaji: "moto", meaning: "Element, Plain", region: "Noun", kunYomi: ["もと"], onYomi: ["そ", "す"], compounds: [{ jp: "素材", reading: "そざい", meaning: "raw material" }, { jp: "素直", reading: "すなお", meaning: "honest" }, { jp: "元素", reading: "げんそ", meaning: "element" }, { jp: "素晴らしい", reading: "すばらしい", meaning: "wonderful" }] },
            { kanji: "総", reading: "すべて", romaji: "subete", meaning: "All, General", region: "Adjective", kunYomi: ["すべ"], onYomi: ["そう"], compounds: [{ jp: "総合", reading: "そうごう", meaning: "comprehensive" }, { jp: "総理", reading: "そうり", meaning: "prime minister" }, { jp: "総額", reading: "そうがく", meaning: "total amount" }, { jp: "総括", reading: "そうかつ", meaning: "summary" }] },
            { kanji: "造", reading: "つくる", romaji: "tsukuru", meaning: "Create, Build", region: "Verb", kunYomi: ["つく"], onYomi: ["ぞう"], compounds: [{ jp: "製造", reading: "せいぞう", meaning: "manufacturing" }, { jp: "建造", reading: "けんぞう", meaning: "construction" }, { jp: "創造", reading: "そうぞう", meaning: "creation" }, { jp: "造形", reading: "ぞうけい", meaning: "modeling, shaping" }] },
            { kanji: "像", reading: "ぞう", romaji: "zou", meaning: "Image, Statue", region: "Noun", kunYomi: ["—"], onYomi: ["ぞう"], compounds: [{ jp: "想像", reading: "そうぞう", meaning: "imagination" }, { jp: "映像", reading: "えいぞう", meaning: "image, video" }, { jp: "銅像", reading: "どうぞう", meaning: "bronze statue" }, { jp: "偶像", reading: "ぐうぞう", meaning: "idol, image" }] },
            { kanji: "増", reading: "ふえる", romaji: "fueru", meaning: "Increase", region: "Verb", kunYomi: ["ふ", "ま"], onYomi: ["ぞう"], compounds: [{ jp: "増える", reading: "ふえる", meaning: "to increase" }, { jp: "増加", reading: "ぞうか", meaning: "increase" }, { jp: "増大", reading: "ぞうだい", meaning: "growth" }, { jp: "急増", reading: "きゅうぞう", meaning: "rapid increase" }] },
            { kanji: "則", reading: "のり", romaji: "nori", meaning: "Rule, Law", region: "Noun", kunYomi: ["のり"], onYomi: ["そく"], compounds: [{ jp: "規則", reading: "きそく", meaning: "rule" }, { jp: "原則", reading: "げんそく", meaning: "principle" }, { jp: "法則", reading: "ほうそく", meaning: "law" }, { jp: "罰則", reading: "ばっそく", meaning: "penalty" }] },
            { kanji: "測", reading: "はかる", romaji: "hakaru", meaning: "Measure, Survey", region: "Verb", kunYomi: ["はか"], onYomi: ["そく"], compounds: [{ jp: "観測", reading: "かんそく", meaning: "observation" }, { jp: "測定", reading: "そくてい", meaning: "measurement" }, { jp: "推測", reading: "すいそく", meaning: "conjecture" }, { jp: "計測", reading: "けいそく", meaning: "measurement" }] },
            { kanji: "属", reading: "ぞく", romaji: "zoku", meaning: "Belong, Category", region: "Verb", kunYomi: ["—"], onYomi: ["ぞく"], compounds: [{ jp: "所属", reading: "しょぞく", meaning: "affiliation" }, { jp: "金属", reading: "きんぞく", meaning: "metal" }, { jp: "付属", reading: "ふぞく", meaning: "affiliated" }, { jp: "従属", reading: "じゅうぞく", meaning: "subordination" }] },
            { kanji: "率", reading: "ひきいる", romaji: "hikiiru", meaning: "Rate, Lead", region: "Noun", kunYomi: ["ひき"], onYomi: ["そつ", "りつ"], compounds: [{ jp: "効率", reading: "こうりつ", meaning: "efficiency" }, { jp: "比率", reading: "ひりつ", meaning: "ratio" }, { jp: "確率", reading: "かくりつ", meaning: "probability" }, { jp: "税率", reading: "ぜいりつ", meaning: "tax rate" }] },
            { kanji: "損", reading: "そこなう", romaji: "sokonau", meaning: "Loss, Damage", region: "Verb", kunYomi: ["そこ"], onYomi: ["そん"], compounds: [{ jp: "損失", reading: "そんしつ", meaning: "loss, damage" }, { jp: "損害", reading: "そんがい", meaning: "damage" }, { jp: "破損", reading: "はそん", meaning: "damage, breakage" }, { jp: "損得", reading: "そんとく", meaning: "profit and loss" }] },
            { kanji: "貸", reading: "かす", romaji: "kasu", meaning: "Lend, Loan", region: "Verb", kunYomi: ["か"], onYomi: ["たい"], compounds: [{ jp: "貸す", reading: "かす", meaning: "to lend" }, { jp: "貸し出し", reading: "かしだし", meaning: "lending" }, { jp: "賃貸", reading: "ちんたい", meaning: "rental" }, { jp: "貸借", reading: "たいしゃく", meaning: "borrowing and lending" }] },
            { kanji: "態", reading: "たい", romaji: "tai", meaning: "Attitude, Condition", region: "Noun", kunYomi: ["—"], onYomi: ["たい"], compounds: [{ jp: "状態", reading: "じょうたい", meaning: "state, condition" }, { jp: "態度", reading: "たいど", meaning: "attitude" }, { jp: "実態", reading: "じったい", meaning: "actual state" }, { jp: "形態", reading: "けいたい", meaning: "form" }] },
            { kanji: "団", reading: "だん", romaji: "dan", meaning: "Group, Organization", region: "Noun", kunYomi: ["—"], onYomi: ["だん", "とん"], compounds: [{ jp: "団体", reading: "だんたい", meaning: "group, organization" }, { jp: "集団", reading: "しゅうだん", meaning: "group" }, { jp: "団結", reading: "だんけつ", meaning: "unity" }, { jp: "布団", reading: "ふとん", meaning: "futon, bedding" }] },
            { kanji: "断", reading: "たつ", romaji: "tatsu", meaning: "Sever, Decide", region: "Verb", kunYomi: ["た", "ことわ"], onYomi: ["だん"], compounds: [{ jp: "判断", reading: "はんだん", meaning: "judgment" }, { jp: "断言", reading: "だんげん", meaning: "assertion" }, { jp: "断る", reading: "ことわる", meaning: "to refuse" }, { jp: "中断", reading: "ちゅうだん", meaning: "interruption" }] },
            { kanji: "築", reading: "きずく", romaji: "kizuku", meaning: "Build, Construct", region: "Verb", kunYomi: ["きず"], onYomi: ["ちく"], compounds: [{ jp: "建築", reading: "けんちく", meaning: "architecture" }, { jp: "新築", reading: "しんちく", meaning: "new construction" }, { jp: "改築", reading: "かいちく", meaning: "renovation" }, { jp: "築く", reading: "きずく", meaning: "to build" }] },
            { kanji: "張", reading: "はる", romaji: "haru", meaning: "Stretch, Expand", region: "Verb", kunYomi: ["は"], onYomi: ["ちょう"], compounds: [{ jp: "主張", reading: "しゅちょう", meaning: "assertion" }, { jp: "緊張", reading: "きんちょう", meaning: "tension" }, { jp: "出張", reading: "しゅっちょう", meaning: "business trip" }, { jp: "拡張", reading: "かくちょう", meaning: "expansion" }] },
            { kanji: "提", reading: "さげる", romaji: "sageru", meaning: "Propose, Carry", region: "Verb", kunYomi: ["さ"], onYomi: ["てい"], compounds: [{ jp: "提案", reading: "ていあん", meaning: "proposal" }, { jp: "提供", reading: "ていきょう", meaning: "provision" }, { jp: "提出", reading: "ていしゅつ", meaning: "submission" }, { jp: "前提", reading: "ぜんてい", meaning: "premise" }] },
            { kanji: "程", reading: "ほど", romaji: "hodo", meaning: "Degree, Extent", region: "Noun", kunYomi: ["ほど"], onYomi: ["てい"], compounds: [{ jp: "程度", reading: "ていど", meaning: "degree, level" }, { jp: "日程", reading: "にってい", meaning: "schedule" }, { jp: "過程", reading: "かてい", meaning: "process" }, { jp: "工程", reading: "こうてい", meaning: "process, step" }] },
            { kanji: "敵", reading: "かたき", romaji: "kataki", meaning: "Enemy, Rival", region: "Noun", kunYomi: ["かたき", "てき"], onYomi: ["てき"], compounds: [{ jp: "敵対", reading: "てきたい", meaning: "hostility" }, { jp: "天敵", reading: "てんてき", meaning: "natural enemy" }, { jp: "無敵", reading: "むてき", meaning: "invincible" }, { jp: "敵軍", reading: "てきぐん", meaning: "enemy forces" }] },
            { kanji: "適", reading: "かなう", romaji: "kanau", meaning: "Suitable, Fit", region: "Adjective", kunYomi: ["かな"], onYomi: ["てき"], compounds: [{ jp: "適当", reading: "てきとう", meaning: "appropriate" }, { jp: "適切", reading: "てきせつ", meaning: "proper" }, { jp: "最適", reading: "さいてき", meaning: "optimal" }, { jp: "適用", reading: "てきよう", meaning: "application" }] },
            { kanji: "統", reading: "すべる", romaji: "suberu", meaning: "Govern, Unite", region: "Verb", kunYomi: ["す"], onYomi: ["とう"], compounds: [{ jp: "統一", reading: "とういつ", meaning: "unification" }, { jp: "統治", reading: "とうち", meaning: "governance" }, { jp: "伝統", reading: "でんとう", meaning: "tradition" }, { jp: "統計", reading: "とうけい", meaning: "statistics" }] },
            { kanji: "銅", reading: "どう", romaji: "dou", meaning: "Copper", region: "Noun", kunYomi: ["—"], onYomi: ["どう"], compounds: [{ jp: "銅像", reading: "どうぞう", meaning: "bronze statue" }, { jp: "銅メダル", reading: "どうめだる", meaning: "bronze medal" }, { jp: "青銅", reading: "せいどう", meaning: "bronze" }, { jp: "銅板", reading: "どうばん", meaning: "copper plate" }] },
            { kanji: "導", reading: "みちびく", romaji: "michibiku", meaning: "Guide, Lead", region: "Verb", kunYomi: ["みちび"], onYomi: ["どう"], compounds: [{ jp: "指導", reading: "しどう", meaning: "guidance" }, { jp: "導入", reading: "どうにゅう", meaning: "introduction" }, { jp: "誘導", reading: "ゆうどう", meaning: "induction" }, { jp: "主導", reading: "しゅどう", meaning: "initiative" }] },
            { kanji: "徳", reading: "とく", romaji: "toku", meaning: "Virtue, Morality", region: "Noun", kunYomi: ["—"], onYomi: ["とく"], compounds: [{ jp: "道徳", reading: "どうとく", meaning: "morality" }, { jp: "人徳", reading: "じんとく", meaning: "personal virtue" }, { jp: "徳育", reading: "とくいく", meaning: "moral education" }, { jp: "美徳", reading: "びとく", meaning: "virtue" }] },
            { kanji: "独", reading: "ひとり", romaji: "hitori", meaning: "Alone, Germany", region: "Adjective", kunYomi: ["ひと"], onYomi: ["どく"], compounds: [{ jp: "独立", reading: "どくりつ", meaning: "independence" }, { jp: "独自", reading: "どくじ", meaning: "unique" }, { jp: "孤独", reading: "こどく", meaning: "solitude" }, { jp: "独占", reading: "どくせん", meaning: "monopoly" }] },
            { kanji: "任", reading: "まかせる", romaji: "makaseru", meaning: "Entrust, Appoint", region: "Verb", kunYomi: ["まか"], onYomi: ["にん"], compounds: [{ jp: "責任", reading: "せきにん", meaning: "responsibility" }, { jp: "任務", reading: "にんむ", meaning: "duty, mission" }, { jp: "担任", reading: "たんにん", meaning: "homeroom teacher" }, { jp: "任命", reading: "にんめい", meaning: "appointment" }] },
            { kanji: "燃", reading: "もえる", romaji: "moeru", meaning: "Burn, Ignite", region: "Verb", kunYomi: ["も"], onYomi: ["ねん"], compounds: [{ jp: "燃料", reading: "ねんりょう", meaning: "fuel" }, { jp: "燃焼", reading: "ねんしょう", meaning: "combustion" }, { jp: "可燃", reading: "かねん", meaning: "combustible" }, { jp: "燃える", reading: "もえる", meaning: "to burn" }] },
            { kanji: "能", reading: "のう", romaji: "nou", meaning: "Ability, Talent", region: "Noun", kunYomi: ["—"], onYomi: ["のう"], compounds: [{ jp: "能力", reading: "のうりょく", meaning: "ability" }, { jp: "可能", reading: "かのう", meaning: "possible" }, { jp: "技能", reading: "ぎのう", meaning: "skill" }, { jp: "有能", reading: "ゆうのう", meaning: "capable" }] },
            { kanji: "破", reading: "やぶる", romaji: "yaburu", meaning: "Break, Tear", region: "Verb", kunYomi: ["やぶ"], onYomi: ["は"], compounds: [{ jp: "破壊", reading: "はかい", meaning: "destruction" }, { jp: "突破", reading: "とっぱ", meaning: "breakthrough" }, { jp: "打破", reading: "だは", meaning: "overcoming" }, { jp: "破片", reading: "はへん", meaning: "fragment, shard" }] },
            { kanji: "犯", reading: "おかす", romaji: "okasu", meaning: "Crime, Violate", region: "Verb", kunYomi: ["おか"], onYomi: ["はん"], compounds: [{ jp: "犯罪", reading: "はんざい", meaning: "crime" }, { jp: "犯人", reading: "はんにん", meaning: "criminal" }, { jp: "違犯", reading: "いはん", meaning: "violation" }, { jp: "共犯", reading: "きょうはん", meaning: "complicity" }] },
            { kanji: "判", reading: "はんだん", romaji: "handan", meaning: "Judge, Distinguish", region: "Verb", kunYomi: ["わか"], onYomi: ["はん", "ばん"], compounds: [{ jp: "判断", reading: "はんだん", meaning: "judgment" }, { jp: "裁判", reading: "さいばん", meaning: "trial" }, { jp: "判定", reading: "はんてい", meaning: "ruling" }, { jp: "判明", reading: "はんめい", meaning: "becoming clear" }] },
            { kanji: "版", reading: "はん", romaji: "han", meaning: "Edition, Print", region: "Noun", kunYomi: ["—"], onYomi: ["はん"], compounds: [{ jp: "出版", reading: "しゅっぱん", meaning: "publishing" }, { jp: "初版", reading: "しょはん", meaning: "first edition" }, { jp: "版権", reading: "はんけん", meaning: "copyright" }, { jp: "改版", reading: "かいはん", meaning: "revised edition" }] },
            { kanji: "比", reading: "くらべる", romaji: "kuraberu", meaning: "Compare, Ratio", region: "Verb", kunYomi: ["くら"], onYomi: ["ひ"], compounds: [{ jp: "比べる", reading: "くらべる", meaning: "to compare" }, { jp: "比較", reading: "ひかく", meaning: "comparison" }, { jp: "比率", reading: "ひりつ", meaning: "ratio" }, { jp: "対比", reading: "たいひ", meaning: "contrast" }] },
            { kanji: "否", reading: "いや", romaji: "iya", meaning: "No, Deny", region: "Verb", kunYomi: ["いな"], onYomi: ["ひ"], compounds: [{ jp: "否定", reading: "ひてい", meaning: "denial" }, { jp: "否認", reading: "ひにん", meaning: "disavowal" }, { jp: "賛否", reading: "さんぴ", meaning: "pros and cons" }, { jp: "拒否", reading: "きょひ", meaning: "rejection" }] },
            { kanji: "批", reading: "ひ", romaji: "hi", meaning: "Criticize", region: "Verb", kunYomi: ["—"], onYomi: ["ひ"], compounds: [{ jp: "批判", reading: "ひはん", meaning: "criticism" }, { jp: "批評", reading: "ひひょう", meaning: "review" }, { jp: "批准", reading: "ひじゅん", meaning: "ratification" }, { jp: "批難", reading: "ひなん", meaning: "censure" }] },
            { kanji: "秘", reading: "ひめる", romaji: "himeru", meaning: "Secret", region: "Noun", kunYomi: ["ひ"], onYomi: ["ひ"], compounds: [{ jp: "秘密", reading: "ひみつ", meaning: "secret" }, { jp: "秘書", reading: "ひしょ", meaning: "secretary" }, { jp: "神秘", reading: "しんぴ", meaning: "mystery" }, { jp: "秘訣", reading: "ひけつ", meaning: "secret, knack" }] },
            { kanji: "俵", reading: "たわら", romaji: "tawara", meaning: "Straw Bale", region: "Noun", kunYomi: ["たわら"], onYomi: ["ひょう"], compounds: [{ jp: "米俵", reading: "こめだわら", meaning: "rice bale" }, { jp: "土俵", reading: "どひょう", meaning: "sumo ring" }, { jp: "俵物", reading: "たわらもの", meaning: "bagged goods" }, { jp: "一俵", reading: "いっぴょう", meaning: "one bale" }] },
            { kanji: "評", reading: "ひょう", romaji: "hyou", meaning: "Evaluate, Review", region: "Verb", kunYomi: ["—"], onYomi: ["ひょう"], compounds: [{ jp: "評価", reading: "ひょうか", meaning: "evaluation" }, { jp: "批評", reading: "ひひょう", meaning: "review" }, { jp: "評判", reading: "ひょうばん", meaning: "reputation" }, { jp: "好評", reading: "こうひょう", meaning: "favorable reception" }] },
            { kanji: "貧", reading: "まずしい", romaji: "mazushii", meaning: "Poor, Poverty", region: "Adjective", kunYomi: ["まず"], onYomi: ["ひん", "びん"], compounds: [{ jp: "貧しい", reading: "まずしい", meaning: "poor" }, { jp: "貧乏", reading: "びんぼう", meaning: "poverty" }, { jp: "貧困", reading: "ひんこん", meaning: "destitution" }, { jp: "貧富", reading: "ひんぷ", meaning: "rich and poor" }] },
        ] },
    { id: "grade_5_kanji_level_4", label: "Level 4", sublabel: "Elementary Grade 5 · 27 cards", emoji: "📘", group: "grade_5", mode: "formal", category_key: "formal_grade_grade_5", cards: [
            { kanji: "布", reading: "ぬの", romaji: "nuno", meaning: "Cloth, Spread", region: "Noun", kunYomi: ["ぬの"], onYomi: ["ふ"], compounds: [{ jp: "布", reading: "ぬの", meaning: "cloth" }, { jp: "配布", reading: "はいふ", meaning: "distribution" }, { jp: "公布", reading: "こうふ", meaning: "promulgation" }, { jp: "毛布", reading: "もうふ", meaning: "blanket" }] },
            { kanji: "婦", reading: "ふ", romaji: "fu", meaning: "Woman, Wife", region: "Noun", kunYomi: ["—"], onYomi: ["ふ"], compounds: [{ jp: "婦人", reading: "ふじん", meaning: "woman, lady" }, { jp: "主婦", reading: "しゅふ", meaning: "housewife" }, { jp: "夫婦", reading: "ふうふ", meaning: "married couple" }, { jp: "産婦", reading: "さんぷ", meaning: "pregnant woman" }] },
            { kanji: "富", reading: "とむ", romaji: "tomu", meaning: "Rich, Wealth", region: "Verb", kunYomi: ["と", "とみ"], onYomi: ["ふ", "ふう"], compounds: [{ jp: "豊富", reading: "ほうふ", meaning: "abundant" }, { jp: "富士山", reading: "ふじさん", meaning: "Mt. Fuji" }, { jp: "富裕", reading: "ふゆう", meaning: "wealthy" }, { jp: "富国", reading: "ふこく", meaning: "wealthy nation" }] },
            { kanji: "武", reading: "たけし", romaji: "takeshi", meaning: "Military, Brave", region: "Noun", kunYomi: ["たけ"], onYomi: ["ぶ", "む"], compounds: [{ jp: "武器", reading: "ぶき", meaning: "weapon" }, { jp: "武士", reading: "ぶし", meaning: "samurai" }, { jp: "武力", reading: "ぶりょく", meaning: "military force" }, { jp: "武道", reading: "ぶどう", meaning: "martial arts" }] },
            { kanji: "復", reading: "また", romaji: "mata", meaning: "Restore, Again", region: "Verb", kunYomi: ["また"], onYomi: ["ふく"], compounds: [{ jp: "回復", reading: "かいふく", meaning: "recovery" }, { jp: "復活", reading: "ふっかつ", meaning: "revival" }, { jp: "復習", reading: "ふくしゅう", meaning: "review" }, { jp: "修復", reading: "しゅうふく", meaning: "restoration" }] },
            { kanji: "複", reading: "ふく", romaji: "fuku", meaning: "Multiple, Complex", region: "Adjective", kunYomi: ["—"], onYomi: ["ふく"], compounds: [{ jp: "複雑", reading: "ふくざつ", meaning: "complex" }, { jp: "複数", reading: "ふくすう", meaning: "plural" }, { jp: "重複", reading: "ちょうふく", meaning: "duplication" }, { jp: "複合", reading: "ふくごう", meaning: "compound" }] },
            { kanji: "仏", reading: "ほとけ", romaji: "hotoke", meaning: "Buddha, France", region: "Noun", kunYomi: ["ほとけ"], onYomi: ["ぶつ", "ふつ"], compounds: [{ jp: "仏教", reading: "ぶっきょう", meaning: "Buddhism" }, { jp: "仏像", reading: "ぶつぞう", meaning: "Buddhist statue" }, { jp: "念仏", reading: "ねんぶつ", meaning: "Buddhist prayer" }, { jp: "仏壇", reading: "ぶつだん", meaning: "Buddhist altar" }] },
            { kanji: "編", reading: "あむ", romaji: "amu", meaning: "Knit, Compile", region: "Verb", kunYomi: ["あ"], onYomi: ["へん"], compounds: [{ jp: "編集", reading: "へんしゅう", meaning: "editing" }, { jp: "編成", reading: "へんせい", meaning: "formation" }, { jp: "長編", reading: "ちょうへん", meaning: "long work" }, { jp: "短編", reading: "たんぺん", meaning: "short work" }] },
            { kanji: "弁", reading: "べん", romaji: "ben", meaning: "Speech, Valve", region: "Noun", kunYomi: ["—"], onYomi: ["べん"], compounds: [{ jp: "弁護", reading: "べんご", meaning: "defense" }, { jp: "弁当", reading: "べんとう", meaning: "lunch box" }, { jp: "弁明", reading: "べんめい", meaning: "justification" }, { jp: "弁論", reading: "べんろん", meaning: "debate" }] },
            { kanji: "保", reading: "たもつ", romaji: "tamotsu", meaning: "Preserve, Guarantee", region: "Verb", kunYomi: ["たも"], onYomi: ["ほ"], compounds: [{ jp: "保護", reading: "ほご", meaning: "protection" }, { jp: "保証", reading: "ほしょう", meaning: "guarantee" }, { jp: "確保", reading: "かくほ", meaning: "securing" }, { jp: "保存", reading: "ほぞん", meaning: "preservation" }] },
            { kanji: "墓", reading: "はか", romaji: "haka", meaning: "Grave, Tomb", region: "Noun", kunYomi: ["はか"], onYomi: ["ぼ"], compounds: [{ jp: "墓地", reading: "ぼち", meaning: "cemetery" }, { jp: "お墓", reading: "おはか", meaning: "grave" }, { jp: "墓石", reading: "はかいし", meaning: "gravestone" }, { jp: "掃墓", reading: "そうぼ", meaning: "grave-cleaning" }] },
            { kanji: "報", reading: "むくいる", romaji: "mukuiru", meaning: "Report, Reward", region: "Verb", kunYomi: ["むく"], onYomi: ["ほう"], compounds: [{ jp: "報告", reading: "ほうこく", meaning: "report" }, { jp: "情報", reading: "じょうほう", meaning: "information" }, { jp: "報道", reading: "ほうどう", meaning: "news report" }, { jp: "予報", reading: "よほう", meaning: "forecast" }] },
            { kanji: "豊", reading: "ゆたか", romaji: "yutaka", meaning: "Abundant, Rich", region: "Adjective", kunYomi: ["ゆた"], onYomi: ["ほう"], compounds: [{ jp: "豊か", reading: "ゆたか", meaning: "abundant" }, { jp: "豊富", reading: "ほうふ", meaning: "abundant" }, { jp: "豊作", reading: "ほうさく", meaning: "good harvest" }, { jp: "豊満", reading: "ほうまん", meaning: "voluptuous" }] },
            { kanji: "防", reading: "ふせぐ", romaji: "fusegu", meaning: "Prevent, Defend", region: "Verb", kunYomi: ["ふせ"], onYomi: ["ぼう"], compounds: [{ jp: "防止", reading: "ぼうし", meaning: "prevention" }, { jp: "予防", reading: "よぼう", meaning: "prevention" }, { jp: "防衛", reading: "ぼうえい", meaning: "defense" }, { jp: "消防", reading: "しょうぼう", meaning: "firefighting" }] },
            { kanji: "貿", reading: "ぼう", romaji: "bou", meaning: "Trade", region: "Noun", kunYomi: ["—"], onYomi: ["ぼう"], compounds: [{ jp: "貿易", reading: "ぼうえき", meaning: "trade" }, { jp: "貿易赤字", reading: "ぼうえきあかじ", meaning: "trade deficit" }, { jp: "貿易黒字", reading: "ぼうえきくろじ", meaning: "trade surplus" }, { jp: "自由貿易", reading: "じゆうぼうえき", meaning: "free trade" }] },
            { kanji: "暴", reading: "あばれる", romaji: "abareru", meaning: "Violence, Sudden", region: "Verb", kunYomi: ["あば", "あら"], onYomi: ["ぼう", "ばく"], compounds: [{ jp: "暴力", reading: "ぼうりょく", meaning: "violence" }, { jp: "暴露", reading: "ばくろ", meaning: "exposure" }, { jp: "乱暴", reading: "らんぼう", meaning: "rough, rude" }, { jp: "暴風", reading: "ぼうふう", meaning: "storm" }] },
            { kanji: "脈", reading: "みゃく", romaji: "myaku", meaning: "Pulse, Vein", region: "Noun", kunYomi: ["—"], onYomi: ["みゃく"], compounds: [{ jp: "山脈", reading: "さんみゃく", meaning: "mountain range" }, { jp: "脈拍", reading: "みゃくはく", meaning: "pulse rate" }, { jp: "文脈", reading: "ぶんみゃく", meaning: "context" }, { jp: "人脈", reading: "じんみゃく", meaning: "personal connections" }] },
            { kanji: "務", reading: "つとめる", romaji: "tsutomeru", meaning: "Duty, Service", region: "Verb", kunYomi: ["つと"], onYomi: ["む"], compounds: [{ jp: "義務", reading: "ぎむ", meaning: "duty, obligation" }, { jp: "任務", reading: "にんむ", meaning: "mission" }, { jp: "業務", reading: "ぎょうむ", meaning: "operations" }, { jp: "事務", reading: "じむ", meaning: "office work" }] },
            { kanji: "夢", reading: "ゆめ", romaji: "yume", meaning: "Dream", region: "Noun", kunYomi: ["ゆめ"], onYomi: ["む"], compounds: [{ jp: "夢", reading: "ゆめ", meaning: "dream" }, { jp: "夢中", reading: "むちゅう", meaning: "absorbed" }, { jp: "悪夢", reading: "あくむ", meaning: "nightmare" }, { jp: "夢想", reading: "むそう", meaning: "daydream" }] },
            { kanji: "迷", reading: "まよう", romaji: "mayou", meaning: "Lose way, Hesitate", region: "Verb", kunYomi: ["まよ"], onYomi: ["めい"], compounds: [{ jp: "迷惑", reading: "めいわく", meaning: "trouble, annoyance" }, { jp: "迷子", reading: "まいご", meaning: "lost child" }, { jp: "迷路", reading: "めいろ", meaning: "maze" }, { jp: "迷宮", reading: "めいきゅう", meaning: "labyrinth" }] },
            { kanji: "綿", reading: "わた", romaji: "wata", meaning: "Cotton", region: "Noun", kunYomi: ["わた"], onYomi: ["めん"], compounds: [{ jp: "木綿", reading: "もめん", meaning: "cotton" }, { jp: "綿密", reading: "めんみつ", meaning: "detailed" }, { jp: "綿花", reading: "めんか", meaning: "cotton plant" }, { jp: "綿糸", reading: "めんし", meaning: "cotton thread" }] },
            { kanji: "輸", reading: "ゆ", romaji: "yu", meaning: "Transport, Export", region: "Verb", kunYomi: ["—"], onYomi: ["ゆ"], compounds: [{ jp: "輸出", reading: "ゆしゅつ", meaning: "export" }, { jp: "輸入", reading: "ゆにゅう", meaning: "import" }, { jp: "輸送", reading: "ゆそう", meaning: "transportation" }, { jp: "運輸", reading: "うんゆ", meaning: "transport" }] },
            { kanji: "余", reading: "あまる", romaji: "amaru", meaning: "Excess, Remain", region: "Verb", kunYomi: ["あま"], onYomi: ["よ"], compounds: [{ jp: "余裕", reading: "よゆう", meaning: "margin, leeway" }, { jp: "余暇", reading: "よか", meaning: "leisure" }, { jp: "余分", reading: "よぶん", meaning: "extra" }, { jp: "余地", reading: "よち", meaning: "room, margin" }] },
            { kanji: "容", reading: "いれる", romaji: "ireru", meaning: "Contain, Appearance", region: "Noun", kunYomi: ["—"], onYomi: ["よう"], compounds: [{ jp: "容量", reading: "ようりょう", meaning: "capacity" }, { jp: "内容", reading: "ないよう", meaning: "contents" }, { jp: "容姿", reading: "ようし", meaning: "appearance" }, { jp: "容認", reading: "ようにん", meaning: "tolerance, acceptance" }] },
            { kanji: "略", reading: "りゃく", romaji: "ryaku", meaning: "Abbreviate, Strategy", region: "Verb", kunYomi: ["—"], onYomi: ["りゃく"], compounds: [{ jp: "省略", reading: "しょうりゃく", meaning: "omission" }, { jp: "略語", reading: "りゃくご", meaning: "abbreviation" }, { jp: "戦略", reading: "せんりゃく", meaning: "strategy" }, { jp: "侵略", reading: "しんりゃく", meaning: "invasion" }] },
            { kanji: "留", reading: "とまる", romaji: "tomaru", meaning: "Stay, Detain", region: "Verb", kunYomi: ["と", "とど", "る"], onYomi: ["りゅう", "る"], compounds: [{ jp: "留学", reading: "りゅうがく", meaning: "studying abroad" }, { jp: "保留", reading: "ほりゅう", meaning: "holding" }, { jp: "留守", reading: "るす", meaning: "being away" }, { jp: "留意", reading: "りゅうい", meaning: "attention, care" }] },
            { kanji: "領", reading: "りょう", romaji: "ryou", meaning: "Territory, Receive", region: "Noun", kunYomi: ["—"], onYomi: ["りょう"], compounds: [{ jp: "領土", reading: "りょうど", meaning: "territory" }, { jp: "領域", reading: "りょういき", meaning: "domain" }, { jp: "占領", reading: "せんりょう", meaning: "occupation" }, { jp: "大統領", reading: "だいとうりょう", meaning: "president" }] },
        ] },
];
const BUILTIN_LIBRARIES = [
    ...THEMATIC_LIBRARIES,
    ...GRADE_LIBRARIES,
    ...REMAINING_GRADE_LIBRARIES,
];
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
        React.createElement("div", { style: { textAlign: "center", marginBottom: 10 } },
            React.createElement("div", { style: { fontFamily: "serif", fontSize: "2rem", fontWeight: 700, letterSpacing: "0.05em" } }, "J Kanji Tool"),
            React.createElement("div", { style: { fontSize: "0.6rem", letterSpacing: "0.2em", color: "#aaa", textTransform: "uppercase" } }, "Japanese Kanji Study \u00B7 \u6F22\u5B57\u5B66\u7FD2")),
        React.createElement("div", { style: { width: "100%", marginBottom: 10, position: "relative" } },
            React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "stretch", width: "100%" } },
                React.createElement("button", { onClick: () => { setShowLib(p => !p); setActiveGroup(null); }, style: Object.assign(Object.assign({}, S.libBtn), { flex: 1 }) },
                    React.createElement("span", { style: { fontWeight: 600 } }, lib.id === REVIEW_LIB_ID
                        ? "🔖 Kanji for Review"
                        : (() => {
                            const g = GROUPS.find(g => g.id === lib.group);
                            return `${lib.emoji} ${g ? g.label + " · " : ""}${lib.label}`;
                        })()),
                    React.createElement("span", { style: { fontSize: "0.65rem", color: "#aaa" } }, showLib ? "▴ close" : "▾ change library")),
                React.createElement("button", { onClick: () => { setShowSpicyPrompt(p => !p); setSpicyInput(""); setSpicyError(false); }, style: { padding: "0 10px", borderRadius: 3, border: "none",
                        background: "transparent", cursor: "default", color: "transparent", userSelect: "none" } }, "　")),
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
