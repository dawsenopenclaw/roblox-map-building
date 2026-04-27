import 'server-only'

// ─── Profanity / Offensive Word List ────────────────────────────────────────
// Comprehensive list covering English + common Spanish/Portuguese/French terms.
// These are stored as lowercase. Matching uses word-boundary-aware logic to
// avoid false positives (e.g. "assassin" won't match "ass").
//
// IMPORTANT: This file exists solely for child safety (COPPA). Do NOT log
// which specific words matched — that teaches bypass techniques.

export const PROFANITY_LIST: string[] = [
  // ── English vulgar / profanity ──
  'fuck', 'fucking', 'fucked', 'fucker', 'fuckers', 'fucks', 'motherfucker',
  'motherfucking', 'motherfuckers', 'shit', 'shits', 'shitty', 'shitting',
  'shithead', 'bullshit', 'horseshit', 'dipshit', 'apeshit',
  'ass', 'asses', 'asshole', 'assholes', 'arsehole', 'arseholes',
  'bitch', 'bitches', 'bitchy', 'bitching', 'sonofabitch',
  'damn', 'damned', 'dammit', 'goddamn', 'goddammit',
  'hell', 'bastard', 'bastards',
  'dick', 'dicks', 'dickhead', 'dickheads',
  'cock', 'cocks', 'cocksucker', 'cocksuckers',
  'cunt', 'cunts',
  'piss', 'pissed', 'pissing', 'pisses',
  'crap', 'crappy',
  'wanker', 'wankers', 'wank',
  'twat', 'twats',
  'tits', 'titty', 'titties', 'boobs', 'boobies',
  'whore', 'whores', 'slut', 'sluts', 'slutty',
  'hoe', 'hoes', 'skank', 'skanks',
  'douche', 'douchebag', 'douchebags',
  'jackass', 'dumbass', 'fatass', 'smartass', 'badass', 'lameass', 'hardass',

  // ── Racial / ethnic slurs (English) ──
  'nigger', 'niggers', 'nigga', 'niggas', 'negro', 'negroes',
  'chink', 'chinks', 'gook', 'gooks', 'spic', 'spics', 'spick',
  'wetback', 'wetbacks', 'beaner', 'beaners',
  'kike', 'kikes', 'hymie', 'hymies',
  'wop', 'wops', 'dago', 'dagos', 'guinea', 'guido',
  'raghead', 'ragheads', 'towelhead', 'towelheads', 'sandnigger',
  'camel jockey', 'paki', 'pakis',
  'cracker', 'crackers', 'honky', 'honkey', 'honkies',
  'redskin', 'redskins', 'injun',
  'coon', 'coons', 'jigaboo', 'jigaboos', 'darkie', 'darkies',
  'zipperhead', 'zipperheads', 'slope', 'slopes',
  'halfbreed',

  // ── Homophobic / transphobic slurs ──
  'fag', 'fags', 'faggot', 'faggots', 'faggy',
  'dyke', 'dykes', 'lesbo', 'lesbos',
  'tranny', 'trannies', 'shemale', 'shemales', 'ladyboy',
  'homo', 'homos',

  // ── Sexual terms ──
  'penis', 'vagina', 'clitoris', 'blowjob', 'blowjobs',
  'handjob', 'handjobs', 'rimjob', 'rimjobs',
  'cumshot', 'cumshots', 'creampie',
  'cum', 'cumming', 'jizz', 'jizzed',
  'dildo', 'dildos', 'vibrator',
  'orgasm', 'orgasms', 'masturbate', 'masturbation', 'masturbating',
  'ejaculate', 'ejaculation',
  'anal', 'anus', 'butthole', 'buttplug',
  'porn', 'porno', 'pornography', 'hentai', 'xxx',
  'erection', 'boner', 'boners',
  'horny', 'sexually', 'intercourse', 'fornicate', 'fornication',
  'gangbang', 'orgy', 'threesome', 'foursome',
  'felatio', 'fellatio', 'cunnilingus', 'sodomy',
  'pedophile', 'pedophilia', 'paedophile', 'paedophilia',
  'molest', 'molester', 'molestation',
  'rape', 'raped', 'raping', 'rapist', 'rapists',
  'incest', 'bestiality', 'necrophilia',
  'prostitute', 'prostitution', 'escort service',
  'stripper', 'strippers', 'lap dance',
  'nude', 'nudes', 'naked', 'nudity',
  'sexy', 'sexting',

  // ── Drug references ──
  'cocaine', 'heroin', 'methamphetamine', 'meth',
  'crack', 'crackhead', 'crackheads',
  'weed', 'marijuana', 'cannabis',
  'ecstasy', 'mdma', 'molly',
  'lsd', 'acid', 'shrooms', 'mushrooms',
  'ketamine', 'fentanyl', 'opioid', 'opioids',
  'xanax', 'adderall', 'percocet',
  'stoner', 'stoners', 'pothead', 'potheads',
  'druggie', 'druggies', 'junkie', 'junkies',
  'overdose', 'overdosed',
  'snort', 'snorting', 'inject', 'shooting up',

  // ── Violence glorification ──
  'kill yourself', 'kys', 'neck yourself',
  'murder', 'murderer', 'murderers',
  'suicide', 'suicidal', 'self harm', 'selfharm', 'self-harm',
  'slit wrists', 'hang yourself', 'jump off',
  'school shooting', 'mass shooting', 'shooter',
  'bomb threat', 'terrorist', 'terrorism',
  'genocide', 'ethnic cleansing', 'holocaust denial',
  'beheading', 'decapitate', 'decapitation',
  'dismember', 'dismemberment',
  'torture', 'tortured', 'torturing',
  'mutilate', 'mutilation',
  'gore', 'gory', 'gorey',

  // ── Hate speech / extremism ──
  'nazi', 'nazis', 'neonazi', 'neo-nazi',
  'white power', 'white supremacy', 'white supremacist',
  'heil hitler', 'sieg heil',
  'kkk', 'ku klux klan',
  'aryan', 'aryan nation', 'aryan brotherhood',
  'jihad', 'jihadist',
  'allahu akbar',
  'gas the jews', 'race war',

  // ── Spanish profanity (Latin American user base) ──
  'puta', 'putas', 'puto', 'putos', 'putinha',
  'mierda', 'mierdas',
  'joder', 'jodido', 'jodidos',
  'coño', 'pendejo', 'pendejos', 'pendeja', 'pendejas',
  'cabron', 'cabrón', 'cabrones',
  'chingar', 'chingado', 'chingada', 'chinga tu madre',
  'verga', 'pinche', 'culero', 'culera',
  'maricón', 'maricon', 'maricones',
  'mamón', 'mamon',
  'hijo de puta', 'hijueputa',
  'culo', 'culos',
  'idiota', 'imbécil', 'imbecil',
  'estúpido', 'estupido', 'estúpida', 'estupida',

  // ── Portuguese profanity (Brazilian user base) ──
  'caralho', 'caralhos',
  'porra', 'porras',
  'foda', 'fodase', 'foda-se',
  'merda', 'merdas',
  'viado', 'viados', 'veado', 'veados',
  'buceta', 'boceta',
  'piranha', 'piranhas',
  'otário', 'otario', 'otários',
  'arrombado', 'arrombada',
  'cuzão', 'cuzao',
  'babaca', 'babacas',
  'filho da puta', 'filha da puta',
  'desgraçado', 'desgraçada', 'desgracado', 'desgracada',
  'vá se foder', 'vai se foder',
  'pau no cu',

  // ── French profanity ──
  'merde', 'merdes',
  'putain', 'putains',
  'salaud', 'salauds', 'salope', 'salopes',
  'connard', 'connards', 'connasse', 'connasses',
  'enculé', 'encule', 'enculer',
  'bordel',
  'nique', 'niquer', 'nique ta mère', 'nique ta mere',
  'bâtard', 'batard',
  'foutre', 'va te faire foutre',
  'ta gueule',
  'pédé', 'pede',
  'branleur', 'branleurs',
  'fils de pute',

  // ── German profanity ──
  'scheiße', 'scheisse', 'scheiß',
  'arschloch', 'arschlöcher',
  'hurensohn', 'hurensöhne',
  'wichser', 'wichsers',
  'fotze', 'fotzen',
  'miststück', 'miststuck',
  'schwuchtel', 'schwuchteln',

  // ── Grooming / predatory patterns ──
  'send nudes', 'send pics', 'send me pics',
  'show me your body', 'show your body',
  'are you alone', 'home alone',
  'dont tell anyone', 'dont tell your parents',
  'our secret', 'our little secret',
  'how old are you', 'whats your age',
  'where do you live', 'what school',
  'come to my house', 'meet me', 'meet up',
  'boyfriend', 'girlfriend', 'dating',
  'love you', 'i love you baby',
  'sugar daddy', 'sugar mommy',
]

// ── L33tspeak / Bypass Patterns ─────────────────────────────────────────────
// Maps a canonical offensive term to a regex that catches common obfuscations.
// These use word-boundary checks where possible.

export const BYPASS_PATTERNS: Map<string, RegExp> = new Map([
  // f-word variants
  ['fuck', /\bf+[u\*@0üùú]+[c¢ç]+[k]+(?:ing|ed|er|ers|s)?\b/i],
  ['fck',  /\bf+[^a-z]*c+[^a-z]*k+\b/i],
  ['fuk',  /\bf+[^a-z]*u+[^a-z]*k+\b/i],
  ['phuck', /\bph+[u\*@]+[c¢ç]+k+\b/i],

  // s-word variants
  ['shit', /\bs+[h]+[i1!¡]+[t]+(?:ty|ting|ted|head|s)?\b/i],
  ['sh1t', /\bs+h+[1!]+t+\b/i],

  // a-word variants
  ['ass', /\b[a@][s\$][s\$](?:hole|h[o0]le)?\b/i],
  ['a$$', /\ba\$\$\b/i],

  // b-word
  ['bitch', /\bb+[i1!]+[t]+[c¢ç]+h+(?:es|y|ing)?\b/i],
  ['b1tch', /\bb+[1!]+t+ch+\b/i],

  // n-word (critical — catch all bypass attempts)
  ['nword', /\bn+[i1!]+[g9]+[g9]+[e3]+r+s?\b/i],
  ['n1gga', /\bn+[1!]+[g9]+[g9]+[a@]+s?\b/i],
  ['nigg', /\bn+[^a-z]*i+[^a-z]*g+[^a-z]*g+/i],

  // c-word
  ['cunt', /\bc+[u\*@]+n+t+s?\b/i],

  // d-word
  ['dick', /\bd+[i1!]+[c¢ç]+k+(?:head|s)?\b/i],

  // p-word
  ['pussy', /\bp+[u\*@]+[s\$]+[s\$]+[y¥]+\b/i],

  // cock
  ['cock', /\bc+[o0]+[c¢ç]+k+(?:sucker|s)?\b/i],

  // wh-words
  ['whore', /\bwh+[o0]+r+e+s?\b/i],

  // faggot
  ['faggot', /\bf+[a@]+[g9]+[g9]+[o0]+t+s?\b/i],
  ['fag', /\bf+[a@]+[g9]+s?\b/i],

  // retard
  ['retard', /\br+[e3]+t+[a@]+r+d+(?:ed|s)?\b/i],
  ['retard', /\br+[^a-z]*3+[^a-z]*t+[^a-z]*a+[^a-z]*r+[^a-z]*d+/i],

  // kys
  ['kys', /\bk+[^a-z]*y+[^a-z]*s+\b/i],

  // porn
  ['porn', /\bp+[o0]+r+n+(?:o|ography)?\b/i],

  // sex
  ['sex', /\bs+[e3]+x+(?:y|ting|ual)?\b/i],

  // kill yourself  (spaced / dotted)
  ['killyourself', /k+[^a-z]*i+[^a-z]*l+[^a-z]*l+[^a-z]*y+[^a-z]*o+[^a-z]*u+[^a-z]*r+[^a-z]*s+[^a-z]*e+[^a-z]*l+[^a-z]*f+/i],

  // Zero-width / invisible char bypass: strip them before matching
  // (handled in the main moderation file, not here)

  // Common symbol substitution catch-all for "fuck" written as "f u c k"
  ['fuck_spaced', /f\s+u\s+c\s+k/i],
  ['shit_spaced', /s\s+h\s+i\s+t/i],
  ['dick_spaced', /d\s+i\s+c\s+k/i],
  ['cock_spaced', /c\s+o\s+c\s+k/i],
])

// ── PII Detection Patterns ──────────────────────────────────────────────────
// Phone numbers, emails, SSNs, street addresses, IP addresses

export const PII_PATTERNS: { type: string; pattern: RegExp }[] = [
  // US phone: (123) 456-7890, 123-456-7890, 1234567890, +1 123 456 7890
  { type: 'phone', pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/ },

  // International phone (generic): +XX XXXXXXXX (7-14 digits after country code)
  { type: 'phone', pattern: /\+\d{1,4}[-.\s]?\d{4,14}\b/ },

  // Email addresses
  { type: 'email', pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/ },

  // SSN: 123-45-6789
  { type: 'ssn', pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/ },

  // Street address: "123 Main St", "456 Oak Avenue"
  { type: 'address', pattern: /\b\d{1,5}\s+[A-Za-z]+\s+(?:st(?:reet)?|ave(?:nue)?|blvd|boulevard|rd|road|dr(?:ive)?|ln|lane|ct|court|pl(?:ace)?|way|cir(?:cle)?|pkwy|parkway)\b/i },

  // URLs and links
  { type: 'url', pattern: /(?:https?:\/\/|www\.)[^\s<]+/i },
  { type: 'url', pattern: /\b[a-zA-Z0-9\-]+\.(?:com|net|org|io|gg|co|me|tv|xyz|dev|app|site|club|info|biz|us|uk|de|fr|br|ru)\b/i },

  // Discord invite links
  { type: 'url', pattern: /discord\.gg\/[a-zA-Z0-9]+/i },
  { type: 'url', pattern: /discord(?:app)?\.com\/invite\/[a-zA-Z0-9]+/i },

  // IP addresses
  { type: 'ip_address', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },

  // Social media handles (with @ prefix + platform context)
  { type: 'social_media', pattern: /\b(?:my|add me|follow me|dm me|message me|hit me up)\b.{0,30}@[a-zA-Z0-9_]{2,30}/i },

  // Age solicitation
  { type: 'age_solicitation', pattern: /\b(?:how old|what(?:'s| is) your age|ur age|a\/s\/l|asl\b)/i },

  // Location solicitation
  { type: 'location_solicitation', pattern: /\b(?:where (?:do )?you live|what city|what state|what country|where are you from|your address)\b/i },

  // Dating/romantic solicitation (important for kids platform)
  { type: 'solicitation', pattern: /\b(?:wanna date|be my (?:girl|boy)friend|go out with me|send (?:me )?(?:pics|nudes|photos))\b/i },

  // Snapchat / Instagram / TikTok handle sharing
  { type: 'social_media', pattern: /\b(?:snap(?:chat)?|insta(?:gram)?|tiktok|whatsapp|telegram|signal|kik)\s*(?::|is|=|@)\s*[a-zA-Z0-9_.]{2,30}/i },
]
