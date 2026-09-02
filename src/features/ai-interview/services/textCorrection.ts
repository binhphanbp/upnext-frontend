/**
 * Intelligent Speech-to-Text Spelling, Grammar & Tech Terminology Corrector
 * Converts phonetic Vietnamese STT transcriptions to proper software engineering terms,
 * preserves 100% Vietnamese UTF-8 diacritics / accents using Unicode property escapes.
 */

// Note: Using (?<!\p{L}) and (?!\p{L}) with /u flag instead of ASCII \b
// because ASCII \b breaks on Vietnamese accented letters (treating ừ, à, ê, ô as word boundaries).
const TECH_REPLACEMENTS: [RegExp, string][] = [
  // Distorted compound terms (Must be replaced first)
  [
    /(?<!\p{L})(React\.\s*Data\s*Script|React\s*Data\s*Script|Data\s*Script|data\s*script)(?!\p{L})/giu,
    "TypeScript",
  ],
  [/(?<!\p{L})(NetJson|net\s*json|net\.json|nét\s*json)(?!\p{L})/giu, "Next.js"],
  [
    /(?<!\p{L})(nét\s*di\s*ét|nét\s*gi\s*ét|nét\s*chây\s*ét|nec\s*js|nek\s*js)(?!\p{L})/giu,
    "Next.js",
  ],
  [/(?<!\p{L})(nét\s*ét\s*di\s*ét|nét\s*sơ\s*di\s*ét|nét\s*ét|nest\s*js)(?!\p{L})/giu, "NestJS"],
  [/(?<!\p{L})(đót\s*nét|\.net\s*core|dot\s*net)(?!\p{L})/giu, ".NET Core"],

  // Frameworks & Libraries
  [/(?<!\p{L})(di\s*ếc|ri\s*ếc|rì\s*át|ri\s*ác|diact|reack|reacat|re-act)(?!\p{L})/giu, "React"],
  [
    /(?<!\p{L})(táp\s*sít|thai\s*x\s*cờ\s*ríp|tai\s*x\s*cờ\s*ríp|tai\s*sờ\s*cờ\s*ríp|táp\s*sờ\s*kíp|type\s*scrip|tai\s*sờ\s*cờ\s*rít)(?!\p{L})/giu,
    "TypeScript",
  ],
  [
    /(?<!\p{L})(gia\s*va\s*sờ\s*cờ\s*ríp|da\s*va\s*sờ\s*cờ\s*ríp|gia\s*va\s*sít|da\s*va\s*sít|ja\s*va\s*sít)(?!\p{L})/giu,
    "JavaScript",
  ],
  [
    /(?<!\p{L})(nốt\s*di\s*ét|nốt\s*gi\s*ét|nốt\s*chây\s*ét|nốt\s*dê\s*ét|nốt\s*js)(?!\p{L})/giu,
    "Node.js",
  ],
  [/(?<!\p{L})(tai\s*uyn|thêu\s*uyn|thêu\s*guyn|tê\s*uyn|tail\s*uyn)(?!\p{L})/giu, "Tailwind CSS"],
  [/(?<!\p{L})(dép\s*bách|uép\s*bách|uép\s*pách|uét\s*bách)(?!\p{L})/giu, "Webpack"],
  [/(?<!\p{L})(vai\s*tê|vai\s*t|vai\s*ti|vát|vít\s*js)(?!\p{L})/giu, "Vite"],
  [/(?<!\p{L})(néc\s*di\s*ét|ních\s*di\s*ét|néch\s*chây\s*ét)(?!\p{L})/giu, "Next.js"],
  [/(?<!\p{L})(viu\s*di\s*ét|viu\s*chây\s*ét|vu\s*js)(?!\p{L})/giu, "Vue.js"],
  [/(?<!\p{L})(ăng\s*gu\s*la|ăng\s*gu\s*lơ)(?!\p{L})/giu, "Angular"],

  // React & Web Concepts
  [
    /(?<!\p{L})(dút\s*tê|dút\s*sờ\s*tét|du\s*xờ\s*tét|dút\s*thê|du\s*sờ\s*tét)(?!\p{L})/giu,
    "useState",
  ],
  [
    /(?<!\p{L})(dút\s*ép\s*phếch|du\s*xờ\s*e\s*phếch|dút\s*ít\s*phếch|dút\s*e\s*phếch)(?!\p{L})/giu,
    "useEffect",
  ],
  [/(?<!\p{L})(dút\s*mé\s*mô|du\s*xờ\s*me\s*mo|dút\s*me\s*mo)(?!\p{L})/giu, "useMemo"],
  [
    /(?<!\p{L})(dút\s*con\s*bách|dút\s*côn\s*bách|du\s*xờ\s*côn\s*bách|dút\s*côn\s*béc)(?!\p{L})/giu,
    "useCallback",
  ],
  [/(?<!\p{L})(dút\s*rét|dút\s*rép|du\s*xờ\s*rép|dút\s*ref)(?!\p{L})/giu, "useRef"],
  [/(?<!\p{L})(dút\s*con\s*tếch|du\s*xờ\s*cơn\s*tếch|dút\s*cơn\s*tếch)(?!\p{L})/giu, "useContext"],
  [
    /(?<!\p{L})(vơ\s*truần\s*đom|vơ\s*chùa\s*đom|vơ\s*chồ\s*đom|vơ\s*sua\s*đom)(?!\p{L})/giu,
    "Virtual DOM",
  ],
  [/(?<!\p{L})(đom\s*thật|đom\s*gốc|đi\s*ô\s*em)(?!\p{L})/giu, "DOM"],
  [/(?<!\p{L})(đíp\s*phinh|đíp\s*xinh)(?!\p{L})/giu, "Diffing Algorithm"],
  [
    /(?<!\p{L})(ri\s*cơn\s*si\s*li\s*ây\s*sơn|ri\s*cân\s*si\s*li\s*a\s*sần)(?!\p{L})/giu,
    "Reconciliation",
  ],
  [/(?<!\p{L})(cốt\s*xì\s*pờ\s*lít\s*tinh|cốt\s*xì\s*pơ\s*lít)(?!\p{L})/giu, "Code Splitting"],
  [/(?<!\p{L})(lây\s*di\s*lốt|lây\s*zi\s*lốt)(?!\p{L})/giu, "Lazy Loading"],
  [/(?<!\p{L})(rê\s*đúc|rê\s*đắc|rì\s*đắc)(?!\p{L})/giu, "Redux"],
  [/(?<!\p{L})(dút\s*tan|giút\s*tan)(?!\p{L})/giu, "Zustand"],

  // Backend, DB & APIs
  [
    /(?<!\p{L})(rết\s*áp\s*pi|rét\s*ép\s*pi|rét\s*áp\s*pi|rết\s*phun\s*áp\s*pi|rết\s*phun|rét\s*phu)(?!\p{L})/giu,
    "RESTful API",
  ],
  [/(?<!\p{L})(áp\s*bi\s*ai|ép\s*pi\s*ai|a\s*pê\s*i)(?!\p{L})/giu, "API"],
  [/(?<!\p{L})(gờ\s*rap\s*cu\s*en|gờ\s*dáp\s*cu\s*en)(?!\p{L})/giu, "GraphQL"],
  [/(?<!\p{L})(rét\s*đít|rê\s*đít|rê\s*đít\s*x)(?!\p{L})/giu, "Redis"],
  [/(?<!\p{L})(mông\s*gô\s*đê\s*bê|mông\s*gô)(?!\p{L})/giu, "MongoDB"],
  [/(?<!\p{L})(pốt\s*gờ\s*rết|pốt\s*gờ\s*re\s*sql|pốt\s*gờ\s*rét)(?!\p{L})/giu, "PostgreSQL"],
  [/(?<!\p{L})(mai\s*ét\s*cu\s*en|mai\s*ét\s*kiu\s*eo|mai\s*si\s*queo)(?!\p{L})/giu, "MySQL"],
  [/(?<!\p{L})(ét\s*cút\s*eo|ét\s*kiu\s*eo|si\s*queo)(?!\p{L})/giu, "SQL"],
  [/(?<!\p{L})(đốc\s*cơ|đốc\s*kơ)(?!\p{L})/giu, "Docker"],
  [/(?<!\p{L})(cu\s*bơ\s*nét\s*tít|kê\s*tám\s*ét)(?!\p{L})/giu, "Kubernetes"],
  [/(?<!\p{L})(gít\s*hắp|ghít\s*hắp|gít\s*húp|gít\s*hóp)(?!\p{L})/giu, "GitHub"],
  [/(?<!\p{L})(gít\s*láp|ghít\s*láp)(?!\p{L})/giu, "GitLab"],
  [/(?<!\p{L})(dê\s*đúp\s*tê|di\s*đúp\s*tê)(?!\p{L})/giu, "JWT"],
  [/(?<!\p{L})(ô\s*ót\s*hai|ô\s*ót\s*2)(?!\p{L})/giu, "OAuth2"],
  [/(?<!\p{L})(ét\s*ét\s*eo|ét\s*ét\s*sờ\s*eo)(?!\p{L})/giu, "SSL"],
  [/(?<!\p{L})(cọt\s*x|co\s*rờ\s*ét)(?!\p{L})/giu, "CORS"],
  [/(?<!\p{L})(ích\s*ét\s*ét)(?!\p{L})/giu, "XSS"],
  [/(?<!\p{L})(xi\s*ét\s*rờ\s*ép)(?!\p{L})/giu, "CSRF"],
  [/(?<!\p{L})(chết|dét\s*js)(?!\p{L})/giu, "Jest"],
];

// Pure filler words matcher using Unicode boundaries (will never match inside words like vừa, vào, làm)
const FILLER_WORDS_REGEX = /(?<!\p{L})(ờ|ừm|hơ|kiểu\s+như\s+là|thì\s+là\s+mà)(?!\p{L})/giu;

export interface TextCorrectionResult {
  originalText: string;
  correctedText: string;
  corrections: string[];
}

/**
 * Clean, normalize and fix Vietnamese text and tech terminology without corrupting UTF-8 accents
 */
export function correctSpeechTranscript(rawTranscript: string): TextCorrectionResult {
  if (!rawTranscript || !rawTranscript.trim()) {
    return {
      originalText: "",
      correctedText: "",
      corrections: [],
    };
  }

  // Normalize Unicode to Canonical Composition (NFC)
  let text = rawTranscript.normalize("NFC").trim();
  const corrections: string[] = [];

  // 1. Replace phonetic tech terms
  for (const [regex, replacement] of TECH_REPLACEMENTS) {
    if (regex.test(text)) {
      const matched = text.match(regex);
      if (matched) {
        matched.forEach((m) => {
          if (!corrections.includes(`"${m}" ➔ "${replacement}"`)) {
            corrections.push(`"${m}" ➔ "${replacement}"`);
          }
        });
      }
      text = text.replace(regex, replacement);
    }
  }

  // 2. Remove filler stuttering words safely with Unicode lookarounds
  text = text.replace(FILLER_WORDS_REGEX, "");

  // 3. Normalize multiple spaces and punctuation
  text = text.replace(/\s{2,}/g, " ").trim();

  // 4. Capitalize first letter of sentences
  text = text.replace(/(^\s*|[.?!]\s+)([\p{L}])/gu, (_, p1, p2) => p1 + p2.toUpperCase());

  // 5. Add closing punctuation if missing
  if (text.length > 0 && !/[.?!]$/.test(text)) {
    if (/^(bạn|hãy|làm thế nào|tại sao|khi nào|em|anh|chị)/iu.test(text)) {
      text += "?";
    } else {
      text += ".";
    }
  }

  return {
    originalText: rawTranscript,
    correctedText: text,
    corrections,
  };
}
