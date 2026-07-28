const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

const DEFINITIONS = [
  {
    type: "EMAIL",
    label: "Email",
    score: 0.99,
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    type: "SSN",
    label: "SSN",
    score: 0.99,
    regex: /\b(?!000|666|9\d\d)\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g,
  },
  {
    type: "PHONE",
    label: "Phone",
    score: 0.93,
    regex: /(?<!\w)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?!\w)/g,
  },
  {
    type: "IP_ADDRESS",
    label: "IP address",
    score: 0.98,
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
  },
  {
    type: "URL",
    label: "URL",
    score: 0.92,
    regex: /\bhttps?:\/\/[^\s<>"']+/gi,
  },
  {
    type: "DATE",
    label: "Date",
    score: 0.86,
    regex: new RegExp(
      `\\b(?:${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{2,4})?|\\d{1,2}\\s+${MONTH}(?:\\s+\\d{2,4})?|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})\\b`,
      "gi",
    ),
  },
  {
    type: "AGE",
    label: "Age over 89",
    score: 0.9,
    regex: /\b(?:9\d|1\d{2})[\s-]?(?:year|yr)s?[\s-]?old\b|\bage(?:d)?\s*(?:of\s*)?(?:9\d|1\d{2})\b/gi,
  },
  {
    type: "MEDICAL_RECORD",
    label: "Medical record",
    score: 0.96,
    regex: /\b(?:MRN|medical record|patient id|chart)(?:\s*(?:number|no\.?|#|:))?\s*[A-Z0-9][A-Z0-9-]{3,}\b/gi,
  },
  {
    type: "ACCOUNT",
    label: "Account",
    score: 0.9,
    regex: /\b(?:account|member|beneficiary|claim|policy)(?:\s*(?:number|no\.?|#|id|:))?\s*[A-Z0-9][A-Z0-9-]{4,}\b/gi,
  },
  {
    type: "ADDRESS",
    label: "Address",
    score: 0.91,
    regex:
      /\b\d{1,6}[ \t]+(?:[A-Z][A-Za-z0-9.'-]*[ \t]+){0,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Parkway|Pkwy|Highway|Hwy|Way|Terrace|Place|Circle|Cir)\.?(?![a-z])(?:[ \t]*(?:Apt|Unit|Suite|Ste|#)[ \t]*[A-Z0-9-]+)?/g,
  },
  {
    type: "ZIP_CODE",
    label: "ZIP code",
    score: 0.75,
    regex: /\b\d{5}(?:-\d{4})?\b/g,
  },
];

const words = (value) => new Set(value.trim().split(/\s+/));

// Capitalized words that routinely appear in clinical text but are not names.
const STOPWORDS = words(`
  a an and or but if then than that this these those there here with without within
  the his her him she he they them we you your our its it is was were are be been being
  i as at by for from in into of on to up over under about after before during while
  january february march april may june july august september october november december
  jan feb mar apr jun jul aug sep sept oct nov dec
  monday tuesday wednesday thursday friday saturday sunday today tomorrow yesterday
  patient patients client resident member subscriber insured guarantor
  doctor dr doctors physician physicians provider providers nurse nursing rn np pa md do
  hospital clinic center centre medical health healthcare care unit ward room bed floor
  department dept emergency urgent primary secondary specialty surgery surgical general
  university memorial regional community saint st mount mt valley county state national
  chief complaint history present illness past family social review systems physical exam
  examination assessment plan impression diagnosis diagnoses differential treatment
  discharge admission admitted discharged summary note notes progress consult consultation
  follow followup up return visit appointment scheduled schedule referral referred
  blood pressure heart rate pulse temperature respiratory oxygen saturation weight height
  chest abdomen abdominal back neck head eyes ears nose throat skin extremities neuro
  pain fever cough nausea vomiting diarrhea fatigue swelling shortness breath
  labs lab laboratory results result test tests imaging xray ray ct mri ultrasound ekg ecg
  normal abnormal negative positive stable improved worsening unchanged within limits
  medication medications meds allergy allergies allergic reaction dose dosage daily twice
  mg ml mcg units tablet tablets capsule injection oral iv po prn
  no yes none denies reports states continue continued start started stop stopped
  left right bilateral upper lower anterior posterior mild moderate severe acute chronic
  signed electronically dictated transcribed reviewed approved sincerely regards thank thanks
  date time name address phone email fax number id record chart account policy claim group
  male female age years year old dob sex gender race ethnicity language marital status
  insurance medicare medicaid coverage copay deductible authorization
  next of kin spouse mother father son daughter brother sister parent guardian contact
  attention re cc subject page total please note important confidential
`);

const FIRST_NAMES = words(`
  james robert john michael david william richard joseph thomas christopher charles daniel
  matthew anthony donald steven andrew paul joshua kenneth kevin brian george timothy ronald
  jason edward jeffrey ryan jacob gary nicholas eric jonathan stephen larry justin scott
  brandon benjamin samuel gregory alexander patrick jack dennis jerry tyler aaron jose adam
  nathan henry zachary douglas peter kyle noah ethan jeremy walter christian keith roger
  terry austin sean gerald carl harold dylan arthur lawrence jordan jesse bryan billy bruce
  gabriel logan albert willie alan juan wayne elijah randy vincent ralph eugene russell louis
  philip johnny bobby mason caleb ivan owen luke isaac oliver liam lucas jayden mateo levi
  julian aiden wyatt asher leo micah ezra theodore hudson nolan carter easton cooper jaxon
  mary patricia jennifer linda elizabeth barbara susan jessica sarah karen nancy lisa betty
  margaret sandra ashley kimberly emily donna michelle carol amanda dorothy melissa deborah
  stephanie rebecca sharon laura cynthia kathleen amy angela shirley anna brenda pamela emma
  nicole helen samantha katherine christine debra rachel carolyn janet catherine maria heather
  diane ruth julie olivia joyce virginia victoria kelly lauren christina joan evelyn judith
  megan andrea cheryl hannah jacqueline martha gloria teresa ann sara madison alexis kayla
  abigail sophia isabella charlotte amelia harper evelyn avery ella scarlett grace chloe
  lily zoey nora riley aria audrey brooklyn savannah claire skylar lucy paisley everly anna
  caroline nova genesis emilia kennedy maya willow kinsley naomi aaliyah elena sarah ariana
  allison gabriella alice madelyn cora ruby eva serenity autumn adeline hailey gianna valentina
  carlos luis miguel jorge ricardo eduardo fernando alejandro rafael manuel roberto pedro
  hector oscar sergio andres pablo diego javier raul marco antonio francisco alberto
  ana sofia lucia carmen elena rosa isabel laura marta cristina beatriz veronica alejandra
  wei ming li chen jing yan hui lin feng ping xin hao yu jun mei fang
  mohammed ahmed ali hassan omar khalid ibrahim yusuf amir farah layla noor zainab fatima
  aisha mariam hana sana rania dina nadia leila samir tariq karim rashid
  priya raj amit anil sunil vikram arjun rohit ravi deepak sanjay ashok kiran neha pooja
  anita sunita kavita meera divya shreya ananya aditya rahul manish nikhil
  yuki hiro kenji takashi haruto sota ren aoi sakura yui hana rin mio akira satoshi
  ivan dmitri sergei vladimir mikhail alexei nikolai andrei pavel oleg natasha olga irina
  svetlana tatiana ekaterina anastasia
  kwame kofi amara chidi ngozi obi zuri thabo sipho nia asha jomo tendai chipo folake
  ade bola tunde yemi segun femi adaeze uche ifeoma emeka
`);

// Names that double as ordinary words: only trusted with supporting context.
const AMBIGUOUS_NAMES = words(`
  may march april june august mark bill will grace faith hope joy art rich frank dawn rose
  sunny miles chase drew sky summer autumn winter carol norman curt guy max buddy ray jack
  pat van don bob sue jean amber crystal ruby pearl iris olive ginger sandy wade cliff dale
  glen brook forest heath lane reed reid bell cole stone rusty penny hazel daisy ivy holly
  jo ann sky angel christian earnest bee ken lee owen young long tan white brown green
`);

const CITIES = words(`
  boston cambridge worcester springfield providence hartford stamford bridgeport newark
  trenton philadelphia pittsburgh baltimore richmond norfolk raleigh durham charlotte
  greensboro columbia charleston savannah atlanta jacksonville orlando tampa miami
  nashville memphis knoxville louisville lexington cincinnati cleveland columbus toledo
  detroit lansing chicago rockford peoria milwaukee madison minneapolis duluth
  indianapolis fort wayne louis kansas wichita omaha lincoln oklahoma tulsa dallas
  houston austin antonio paso arlington denver colorado boulder aurora albuquerque
  phoenix tucson mesa scottsdale vegas reno salt provo boise spokane seattle tacoma
  portland eugene sacramento francisco oakland jose fresno bakersfield angeles diego
  anaheim riverside honolulu anchorage juneau billings fargo sioux rapid buffalo rochester
  syracuse albany yonkers jersey paterson wilmington dover manchester nashua burlington
  portland bangor allentown scranton erie akron dayton evansville jackson mobile birmingham
  huntsville montgomery shreveport baton orleans little rock springdale
`);

const STATE_NAMES = words(`
  alabama alaska arizona arkansas california colorado connecticut delaware florida georgia
  hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts
  michigan minnesota mississippi missouri montana nebraska nevada hampshire jersey mexico
  york carolina dakota ohio oklahoma oregon pennsylvania rhode island tennessee texas utah
  vermont virginia washington wisconsin wyoming
`);

const STATE_CODES =
  "AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC";

const S = "[ \\t]";
// Allows internal capitals and separators seen in names such as O'Connell, McDonald, Osei-Bonsu.
const TOKEN = "[A-Z][a-z]*[A-Z]?[a-z]+(?:['\u2019-][A-Z]?[a-z]+)*";
const INITIAL = "[A-Z]\\.";
const SUFFIX = "(?:Jr|Sr|III|IV|II)\\.?";
const PARTICLE = "(?:de|del|des|dos|das|da|di|du|van|von|der|den|ter|la|le|el|bin|ibn|al|abu)";
// Matches either capitalization without a case-insensitive flag, which would also
// let the name patterns match lowercase words.
const anyCase = (pattern) => pattern.replace(/[a-z]/g, (letter) => `[${letter}${letter.toUpperCase()}]`);

const TITLE = "(?:Mr|Mrs|Ms|Miss|Mx|Dr|Doctor|Prof|Professor|Nurse|Rev|Capt|Sgt|Sir|Dame)";
const TRIGGER =
  "(?:patient|client|resident|member|subscriber|insured|guarantor|name|provider|physician|doctor|nurse|surgeon|therapist|caregiver|attending|admitting|referring|consulting|pcp|signed(?:\\s+by)?|dictated(?:\\s+by)?|seen(?:\\s+by)?|examined(?:\\s+by)?|treated(?:\\s+by)?|spouse|mother|father|son|daughter|brother|sister|parent|guardian|emergency\\s+contact|next\\s+of\\s+kin|witness|contact)";

const PARTICLE_PART = `(?:${S}+${PARTICLE})*`;
const NAME_BODY = `${TOKEN}(?:${S}+${INITIAL})?(?:${PARTICLE_PART}${S}+${TOKEN}){0,3}(?:${S}+${SUFFIX}\\b)?`;
const FULL_NAME = `${TOKEN}(?:${S}+${INITIAL})?${PARTICLE_PART}${S}+${TOKEN}${PARTICLE_PART}(?:${S}+${TOKEN})?(?:${S}+${SUFFIX}\\b)?`;

const NAME_RULES = [
  {
    score: 0.95,
    regex: new RegExp(`\\b${TITLE}\\.?${S}+(${NAME_BODY})`, "g"),
  },
  {
    score: 0.93,
    regex: new RegExp(
      `\\b${anyCase(TRIGGER)}\\b(?:${S}+${anyCase("(?:is|was|are|were)")})?${S}*[:\\-]?${S}+(${NAME_BODY})`,
      "g",
    ),
  },
  {
    score: 0.88,
    regex: new RegExp(`\\b(${TOKEN},${S}+${TOKEN}(?:${S}+${INITIAL})?)`, "g"),
    reversed: true,
    requireKnownName: true,
  },
  {
    score: 0.84,
    regex: new RegExp(`\\b(${FULL_NAME})`, "g"),
    requireKnownName: true,
  },
  {
    score: 0.6,
    regex: new RegExp(`\\b(${FULL_NAME})`, "g"),
  },
  {
    score: 0.55,
    regex: new RegExp(`\\b(${TOKEN})\\b`, "g"),
    requireKnownName: true,
    singleToken: true,
  },
  {
    // Uppercase roster style used by many record systems, such as "MORRISON, JANE".
    score: 0.8,
    regex: new RegExp(`\\b([A-Z]{2,}(?:-[A-Z]{2,})?,${S}+[A-Z]{2,}(?:${S}+[A-Z]\\.)?)`, "g"),
    uppercase: true,
  },
];

const LOCATION_RULES = [
  {
    score: 0.93,
    regex: new RegExp(`\\b(${TOKEN}(?:${S}+${TOKEN})?),${S}*(?:${STATE_CODES})\\b`, "g"),
    stateCode: true,
  },
  {
    score: 0.72,
    regex: new RegExp(`\\b(${TOKEN}(?:${S}+${TOKEN})?)\\b`, "g"),
    knownPlaceOnly: true,
  },
  {
    score: 0.7,
    regex: new RegExp(`\\b(${TOKEN})\\b`, "g"),
    knownPlaceOnly: true,
  },
];

const normalize = (value) => value.replace(/[.,]/g, "").toLowerCase();

function isStopword(token) {
  return STOPWORDS.has(normalize(token));
}

function isKnownFirstName(token) {
  return FIRST_NAMES.has(normalize(token));
}

function isKnownPlace(value) {
  const parts = value.split(/\s+/).map(normalize);
  const whole = parts.join(" ");
  if (STATE_NAMES.has(whole) || CITIES.has(whole)) return true;
  return parts.every((part) => STATE_NAMES.has(part) || CITIES.has(part));
}

function looksLikeName(value, { requireKnownName, singleToken, uppercase, reversed }) {
  const tokens = value.split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return false;
  if (tokens.some((token) => isStopword(token))) return false;

  const isParticle = (token) => new RegExp(`^${PARTICLE}$`).test(normalize(token));
  if (!uppercase && tokens.some((token) => !/^[A-Z]/.test(token) && !isParticle(token))) return false;

  const nameTokens = tokens.filter(
    (token) =>
      !/^[A-Z]\.?$/.test(token) && !/^(?:Jr|Sr|II|III|IV)\.?$/i.test(token) && !isParticle(token),
  );
  if (!nameTokens.length) return false;

  if (singleToken) {
    return isKnownFirstName(value) && !AMBIGUOUS_NAMES.has(normalize(value));
  }
  if (requireKnownName) {
    const candidates = reversed ? nameTokens.slice(1) : nameTokens;
    return candidates.some((token) => isKnownFirstName(token));
  }
  return nameTokens.every((token) => token.length > 1 || /^[A-Z]\.?$/.test(token));
}

function collect(text, regex, handler) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const resumeAt = handler(match);
    if (typeof resumeAt === "number" && resumeAt > match.index && resumeAt < regex.lastIndex) {
      regex.lastIndex = resumeAt;
    }
    if (match[0] === "") regex.lastIndex += 1;
  }
}

function startsSentence(text, index) {
  return /(?:^|[.!?\n\r]|^\s*[-*\u2022])\s*$/.test(text.slice(0, index));
}

function addMatch(results, type, label, score, start, value) {
  results.push({ type, label, score, start, end: start + value.length, text: value });
}

function validZipContext(text, start, end) {
  const nearby = text.slice(Math.max(0, start - 28), Math.min(text.length, end + 12));
  return /\b(?:zip|postal|address|,\s*[A-Z]{2}\s*)/i.test(nearby);
}

export function detectPhi(text) {
  if (!text) return [];
  const results = [];

  for (const definition of DEFINITIONS) {
    collect(text, definition.regex, (match) => {
      const start = match.index;
      const end = start + match[0].length;
      if (definition.type === "ZIP_CODE" && !validZipContext(text, start, end)) return;
      addMatch(results, definition.type, definition.label, definition.score, start, match[0]);
    });
  }

  for (const rule of LOCATION_RULES) {
    collect(text, rule.regex, (match) => {
      const value = match[1];
      if (value.split(/\s+/).some((token) => isStopword(token))) return;
      if (rule.knownPlaceOnly && !isKnownPlace(value)) return;
      // "Al-Rashid, MD" is a credential, not a city and state, unless a ZIP or known city agrees.
      if (
        rule.stateCode &&
        !isKnownPlace(value) &&
        !/^[\s,]*\d{5}(?:-\d{4})?\b/.test(text.slice(match.index + match[0].length))
      ) {
        return;
      }
      const start = match.index + match[0].indexOf(value);
      addMatch(results, "LOCATION", "Location", rule.score, start, value);
    });
  }

  for (const rule of NAME_RULES) {
    collect(text, rule.regex, (match) => {
      const value = match[1].replace(/\s+$/, "");
      const start = match.index + match[0].lastIndexOf(value);
      const [firstToken] = value.split(/\s+/);

      // A capitalized word opening a sentence is usually ordinary prose, so resume
      // scanning after it rather than absorbing the real name that follows. A title or
      // trigger word ahead of the candidate is evidence enough to keep it.
      const hasContextPrefix = value !== match[0];
      if (
        !rule.uppercase &&
        !hasContextPrefix &&
        startsSentence(text, start) &&
        !isKnownFirstName(firstToken)
      ) {
        return start + firstToken.length;
      }
      if (!looksLikeName(value, rule)) return;
      if (!rule.uppercase && isKnownPlace(value)) return;
      addMatch(results, "PERSON", "Person", rule.score, start, value);
    });
  }

  return removeOverlaps(results);
}

function removeOverlaps(results) {
  const preferred = [...results].sort(
    (a, b) => b.score - a.score || b.end - b.start - (a.end - a.start) || a.start - b.start,
  );
  const accepted = [];
  for (const candidate of preferred) {
    if (!accepted.some((item) => candidate.start < item.end && candidate.end > item.start)) {
      accepted.push(candidate);
    }
  }
  return accepted.sort((a, b) => a.start - b.start);
}

export function scrubText(text, entities, style = "label") {
  const counters = {};
  let cursor = 0;
  let output = "";

  for (const entity of entities) {
    output += text.slice(cursor, entity.start);
    counters[entity.type] = (counters[entity.type] || 0) + 1;
    if (style === "mask") {
      output += "█".repeat(Math.max(4, entity.text.length));
    } else if (style === "token") {
      output += `<${entity.type}_${counters[entity.type]}>`;
    } else {
      output += `[${entity.type}]`;
    }
    cursor = entity.end;
  }
  return output + text.slice(cursor);
}
