const $ = (selector) => document.querySelector(selector);

const STORAGE_KEY = "heartstep-reading";
const SCHEDULE_STORAGE_KEY = "heartstep-schedule";
const COMPANION_STORAGE_KEY = "heartstep-companion";
const GUIDANCE_STORAGE_KEY = "heartstep-guidance-context";
const defaultReading = {
  systolic: 120,
  diastolic: 80,
  pulse: 72,
  repeatedHigh: false,
  saved: false,
  source: "manual"
};

const defaultSchedule = {
  version: 2,
  bedtime: "22:30",
  wakeTime: "06:00",
  exercise: {
    morning: 0,
    midday: 0,
    evening: 0
  }
};

const defaultCompanion = "futureSelf";
const defaultGuidance = {
  environment: "office",
  state: "sitting"
};
const companionProfiles = {
  futureSelf: {
    key: "futureSelf",
    title: "Future-self companion",
    shortTitle: "Future-self",
    image: "./assets/future-self.png",
    iconName: "heart",
    copy: "Lived experience, calm perspective, long-term encouragement.",
    lines: {
      readingTitle: "A note from your future self",
      readingCopy: "This is one reading, not the whole story. The steady choices you make today give tomorrow a softer landing.",
      reminderLead: "Your future self is keeping the route gentle.",
      reminderTitle: "A small exercise break helps tomorrow feel easier.",
      reminderCopy: "I remember days like this. Start small and let the rhythm come back.",
      microTitle: "Future you noticed this",
      microCopy: "Even a partial effort becomes part of the pattern you are building.",
      adjustmentCopy: "Your day changed, so we make the route smaller instead of dropping it.",
      completionTitle: "Future you is already benefiting",
      completionCopy: "These small choices stack up. You are making later-you easier to care for.",
      recoveryTitle: "You returned. That matters.",
      recoveryCopy: "A pause does not erase the habit. Starting again is part of the habit.",
      weeklyQuote: "A healthier heart starts with a habit you keep for yourself."
    }
  },
  clinician: {
    key: "clinician",
    title: "Clinician companion",
    shortTitle: "Clinician",
    image: "./assets/clinician.png",
    iconName: "stethoscope",
    copy: "Evidence-aware explanations, structured check-ins, clear next steps.",
    lines: {
      readingTitle: "Clinician-style check-in",
      readingCopy: "Your reading is useful in context. Keep tracking consistently so the trend can guide the next decision.",
      reminderLead: "A simple, evidence-aware action is ready.",
      reminderTitle: "Time for a short movement break.",
      reminderCopy: "Gentle activity can support circulation and help reduce stress load today.",
      microTitle: "Clinician note",
      microCopy: "Any completed portion is recorded. Consistency and trend matter more than perfection.",
      adjustmentCopy: "The original plan was interrupted. The safer next step is a lower-load recovery action.",
      completionTitle: "Progress recorded",
      completionCopy: "This action supports steadier routines. Keep observing your response over time.",
      recoveryTitle: "Plan continuity restored",
      recoveryCopy: "You resumed the routine. That gives your weekly pattern better continuity.",
      weeklyQuote: "Clear routines make blood pressure patterns easier to understand."
    }
  },
  friend: {
    key: "friend",
    title: "Friend companion",
    shortTitle: "Friend",
    image: "./assets/friend.png",
    iconName: "users",
    copy: "Warm support, emotional encouragement, gentle accountability.",
    lines: {
      readingTitle: "Your friend is with you",
      readingCopy: "You are paying attention, and that already counts. We can take the next tiny step together.",
      reminderLead: "A friendly nudge, nothing heavy.",
      reminderTitle: "Come on, let’s move a little.",
      reminderCopy: "Just a short exercise break. I am right here with you for the easy version.",
      microTitle: "You showed up",
      microCopy: "Full or partial, I am counting it. You did something good for yourself.",
      adjustmentCopy: "Life got in the way. No guilt. Let’s make the plan small enough to fit tonight.",
      completionTitle: "I’m proud of you",
      completionCopy: "You kept a promise to yourself today. That is worth noticing.",
      recoveryTitle: "You’re back with us",
      recoveryCopy: "Missing a step happens. Coming back is the win.",
      weeklyQuote: "You do not have to be perfect to keep caring for yourself."
    }
  }
};

const appState = {
  reading: loadReading(),
  schedule: loadSchedule(),
  companion: loadCompanion(),
  guidance: loadGuidance(),
  reminderDismissed: false,
  microPlanDismissed: false,
  completion: "all",
  recoveryOption: "beforeSleep"
};

function loadReading() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultReading, ...JSON.parse(saved) } : { ...defaultReading };
  } catch {
    return { ...defaultReading };
  }
}

function saveReading(reading) {
  appState.reading = {
    systolic: clampNumber(reading.systolic, 70, 240, defaultReading.systolic),
    diastolic: clampNumber(reading.diastolic, 40, 150, defaultReading.diastolic),
    pulse: clampNumber(reading.pulse, 35, 180, defaultReading.pulse),
    repeatedHigh: Boolean(reading.repeatedHigh),
    saved: true,
    source: reading.source || "manual"
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.reading));
}

function loadSchedule() {
  try {
    const saved = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return saved ? mergeSchedule(JSON.parse(saved)) : structuredClone(defaultSchedule);
  } catch {
    return structuredClone(defaultSchedule);
  }
}

function mergeSchedule(schedule) {
  const useSavedExercise = schedule?.version === defaultSchedule.version;

  return {
    ...defaultSchedule,
    bedtime: schedule?.bedtime || defaultSchedule.bedtime,
    wakeTime: schedule?.wakeTime || defaultSchedule.wakeTime,
    exercise: useSavedExercise
      ? {
          ...defaultSchedule.exercise,
          ...(schedule?.exercise || {})
        }
      : { ...defaultSchedule.exercise },
    version: defaultSchedule.version
  };
}

function saveSchedule(schedule) {
  appState.schedule = mergeSchedule(schedule);
  window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(appState.schedule));
}

function loadCompanion() {
  const saved = readStoredValue(COMPANION_STORAGE_KEY);
  return companionProfiles[saved] ? saved : defaultCompanion;
}

function readStoredValue(key) {
  const stores = [window.localStorage, window.sessionStorage];
  for (const store of stores) {
    try {
      const value = store?.getItem(key);
      if (value) return value;
    } catch {
      continue;
    }
  }
  return null;
}

function writeStoredValue(key, value) {
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      store?.setItem(key, value);
    } catch {
      continue;
    }
  }
}

function saveCompanion(key) {
  appState.companion = companionProfiles[key] ? key : defaultCompanion;
  writeStoredValue(COMPANION_STORAGE_KEY, appState.companion);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function getReading() {
  return appState.reading;
}

function getSchedule() {
  return appState.schedule;
}

function getCompanionProfile() {
  return companionProfiles[appState.companion] || companionProfiles[defaultCompanion];
}

function loadGuidance() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GUIDANCE_STORAGE_KEY) || "null");
    return {
      environment: saved?.environment || defaultGuidance.environment,
      state: saved?.state || defaultGuidance.state
    };
  } catch {
    return { ...defaultGuidance };
  }
}

function saveGuidanceContext(partial) {
  appState.guidance = {
    ...defaultGuidance,
    ...appState.guidance,
    ...partial
  };
  window.localStorage.setItem(GUIDANCE_STORAGE_KEY, JSON.stringify(appState.guidance));
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return ((hours || 0) * 60 + (minutes || 0)) % 1440;
}

function minutesToTime(minutes) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatTime(time) {
  const minutes = timeToMinutes(time);
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
}

function formatRange(start, end) {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function normalizeTimeValue(value, fallback) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    return fallback;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function isCompleteTimeValue(value) {
  return normalizeTimeValue(value, null) !== null;
}

function exerciseWindows(schedule = getSchedule()) {
  const wake = timeToMinutes(schedule.wakeTime);
  const bed = timeToMinutes(schedule.bedtime);
  return {
    morning: {
      label: "After waking",
      range: formatRange(schedule.wakeTime, minutesToTime(wake + 180)),
      iconName: "sunrise",
      tone: "pink"
    },
    midday: {
      label: "Midday",
      range: formatRange("12:00", "14:00"),
      iconName: "sun",
      tone: "amber"
    },
    evening: {
      label: "Before bedtime",
      range: formatRange(minutesToTime(bed - 180), schedule.bedtime),
      iconName: "moon",
      tone: "blue"
    }
  };
}

function classifyReading(reading = getReading()) {
  const { systolic, diastolic } = reading;

  if (systolic >= 160 || diastolic >= 100) {
    return {
      key: "nearCritical",
      label: "Near Critical",
      chip: "red",
      tone: "red",
      iconName: "alert",
      image: "./assets/state-near-critical.png",
      short: "Your blood pressure is very high. Call or visit a healthcare professional now!",
      title: "Near Critical",
      explanation: "Your blood pressure is very high. Call or visit a healthcare professional now!",
      actionTitle: "Contact medical care",
      actionCopy: "Your blood pressure is very high. Call or visit a healthcare professional now!"
    };
  }

  if (systolic >= 140 || diastolic >= 90) {
    return {
      key: "repeatedHigh",
      label: "Repeatedly High",
      chip: "pink",
      tone: "pink",
      iconName: "trend",
      image: "./assets/state-repeatedly-high.png",
      short: "Your blood pressure has been consistently high. Review your habits and stay consistent.",
      title: "Your recent readings have been high",
      explanation: "Your blood pressure has been consistently high. Review your habits and stay consistent.",
      actionTitle: "Start 3-day observation",
      actionCopy: "Your blood pressure has been consistently high. Review your habits and stay consistent."
    };
  }

  if (systolic >= 130 || diastolic >= 85) {
    return {
      key: "singleHigh",
      label: "Single High",
      chip: "amber",
      tone: "amber",
      iconName: "alert",
      image: "./assets/state-single-high.png",
      short: "This reading is higher than normal. Rest and check again later.",
      title: "One high reading is not unusual",
      explanation: "This reading is higher than normal. Rest and check again later.",
      actionTitle: "Recheck after resting",
      actionCopy: "This reading is higher than normal. Rest and check again later."
    };
  }

  return {
    key: "normal",
    label: "Normal",
    chip: "green",
    tone: "normal",
    iconName: "heart",
    image: "./assets/state-normal.png",
    short: "Your blood pressure is within a healthy range. Keep it up.",
    title: "Your reading is normal",
    explanation: "Your blood pressure is within a healthy range. Keep it up.",
    actionTitle: "Keep it up",
    actionCopy: "Your blood pressure is within a healthy range. Keep it up."
  };
}

function formatReading(reading = getReading()) {
  return `${reading.systolic} / ${reading.diastolic}`;
}

function icon(name, extraClass = "") {
  const paths = {
    "arrow-left": '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    watch: '<rect x="7" y="5" width="10" height="14" rx="3"/><path d="M9 1h6"/><path d="M9 23h6"/>',
    sunrise: '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 2v9"/><path d="m4.2 10.2 1.4 1.4"/><path d="m19.8 10.2-1.4 1.4"/><path d="M3 18h18"/><path d="M5 22h14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>',
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    shoe: '<path d="M3 16c3 2 7 2 12 2h5c1 0 1.5-1.3.7-2l-2.5-2.1a4 4 0 0 0-3.5-.8l-2 .5L8 7H5l1.5 7H3v2Z"/>',
    bowl: '<path d="M4 11h16"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M9 7c.6-1.2 1.4-1.8 2.5-2"/><path d="M14 7c.8-.8 1.8-1.3 3-1.4"/>',
    water: '<path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z"/>',
    breath: '<path d="M5 12h8a3 3 0 1 0-3-3"/><path d="M3 18h12a3 3 0 1 0-3-3"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    stethoscope: '<path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M10 12v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    alert: '<path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2.1Z"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
    check: '<path d="m20 6-11 11-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    log: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    couch: '<path d="M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4"/><path d="M4 12h16a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2Z"/><path d="M6 19v2"/><path d="M18 19v2"/>',
    tree: '<path d="M12 22v-7"/><path d="M7 14a5 5 0 1 1 10 0"/><path d="M5 18h14"/>',
    bus: '<path d="M6 17h12"/><path d="M6 17v3"/><path d="M18 17v3"/><rect x="5" y="3" width="14" height="14" rx="2"/><path d="M5 9h14"/><circle cx="8" cy="13" r="1"/><circle cx="16" cy="13" r="1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
    pill: '<path d="m10.5 20.5 10-10a4 4 0 0 0-5.7-5.7l-10 10a4 4 0 0 0 5.7 5.7Z"/><path d="m8.5 8.5 7 7"/>',
    trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 5H3v3a4 4 0 0 0 4 4"/><path d="M19 5h2v3a4 4 0 0 1-4 4"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-9-1 9-5 16-9 16Z"/><path d="M4 13c4 0 8 0 12-5"/>',
    snow: '<path d="M12 2v20"/><path d="m17 5-5 5-5-5"/><path d="m7 19 5-5 5 5"/><path d="M2 12h20"/><path d="m5 7 5 5-5 5"/><path d="m19 7-5 5 5 5"/>',
    camera: '<path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v14"/>'
  };

  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.heart}</svg>`;
}

function statusBar() {
  return `
    <div class="status-bar">
      <span>9:41</span>
      <span class="status-icons"><span class="signal"></span><span class="wifi"></span><span class="battery"></span></span>
    </div>
  `;
}

function progressDots(active, total = 4) {
  return `<div class="progress-dots" aria-hidden="true">${Array.from({ length: total }, (_, index) => `<span class="${index < active ? "is-on" : ""}"></span>`).join("")}</div>`;
}

function appBar(screen, back = true) {
  return `
    <div class="app-bar">
      ${back ? `<button class="back-control" type="button" data-prev aria-label="Previous screen">${icon("arrow-left")}</button>` : "<span></span>"}
      <div class="step-stack">
        ${progressDots(screen.progress, screen.total || 4)}
      </div>
      <div class="avatar-wrap"><span class="avatar"></span><span>Sophia</span></div>
    </div>
  `;
}

function bottomTabs() {
  const tabs = [
    ["Step 01", "Onboarding", "home", "Step 01 Onboarding"],
    ["Step 02", "Readings Card", "pulse", "Step 02 Readings Card"],
    ["Step 03", "Guidance", "shoe", "Step 03 Guidance"],
    ["Step 04", "Feedback", "leaf", "Step 04 Feedback"]
  ];
  const activeGroup = screens[currentScreen]?.group;
  return `<nav class="bottom-tabs" aria-label="Main app steps">${tabs.map(([step, label, iconName, group]) => `
    <button class="tab-item ${group === activeGroup ? "is-active" : ""}" type="button" data-section-tab="${group}" aria-label="${step} ${label}">
      ${icon(iconName)}
      <span>${step}</span>
      <small>${label}</small>
    </button>
  `).join("")}</nav>`;
}

function titleBlock(title, copy = "") {
  return `
    <div class="screen-title">
      <h2>${title}</h2>
      ${copy ? `<p>${copy}</p>` : ""}
    </div>
  `;
}

function cta(label, tone = "", iconName = "arrow-right", action = "data-next") {
  return `<button class="primary-action ${tone}" type="button" ${action}="true">${label}${icon(iconName)}</button>`;
}

function screenShell(screen, body, options = {}) {
  const hasCta = Boolean(options.ctaLabel);
  const hasBottomActions = Boolean(hasCta || options.bottomActions);
  const showStepTabs = options.stepTabs !== false;
  const scrollClass = [
    "screen-scroll",
    showStepTabs ? "with-tabs" : "",
    options.bottomActions ? "bottom-dual" : "",
    hasCta && !options.bottomActions ? "bottom-cta" : "",
    !hasBottomActions && !showStepTabs ? "no-action" : "",
    options.modalSpace ? "modal-space" : ""
  ].filter(Boolean).join(" ");

  return `
    ${statusBar()}
    ${appBar(screen, options.back !== false && screen.group !== "Step 04 Feedback")}
    <div class="${scrollClass}">${body}</div>
    ${options.bottomActions || (hasCta ? cta(options.ctaLabel, options.ctaTone || "", options.ctaIcon || "arrow-right", options.ctaAction || "data-next") : "")}
    ${showStepTabs ? bottomTabs() : ""}
  `;
}

function arteryMarkup(kind = "open") {
  return `
    <div class="artery ${kind}">
      <span class="flow-arrow one"></span>
      <span class="flow-arrow two"></span>
      <span class="flow-arrow three"></span>
      <span class="blood-cell a"></span>
      <span class="blood-cell b"></span>
    </div>
  `;
}

function getTrendSeries(reading = getReading()) {
  return {
    systolic: [125, 123, 121, 120, 118, 117, reading.systolic],
    diastolic: [82, 80, 79, 78, 77, 76, reading.diastolic],
    labels: ["May 6", "7", "8", "9", "10", "11", "12"]
  };
}

function average(values) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function chartPoint(value, index) {
  const x = 58 + index * 38;
  const clamped = Math.min(180, Math.max(50, value));
  const y = 172 - ((clamped - 50) / 130) * 144;
  return `${x},${Math.round(y)}`;
}

function trendChart(compact = false, reading = getReading()) {
  const height = compact ? 185 : 226;
  const series = getTrendSeries(reading);
  const systolicPoints = series.systolic.map(chartPoint).join(" ");
  const diastolicPoints = series.diastolic.map(chartPoint).join(" ");
  return `
    <svg class="trend-svg" viewBox="0 0 320 ${height}" role="img" aria-label="Seven day blood pressure trend chart">
      <g stroke="#e3e9f5" stroke-width="1">
        <line x1="34" y1="28" x2="304" y2="28"/>
        <line x1="34" y1="68" x2="304" y2="68"/>
        <line x1="34" y1="108" x2="304" y2="108"/>
        <line x1="34" y1="148" x2="304" y2="148"/>
      </g>
      <g fill="#7180a8" font-size="10" font-weight="700">
        <text x="4" y="32">140</text><text x="4" y="72">120</text><text x="6" y="112">100</text><text x="10" y="152">80</text>
      </g>
      <polyline points="${systolicPoints}" fill="none" stroke="#0648d8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${diastolicPoints}" fill="none" stroke="#f05284" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="#0648d8">
        ${series.systolic.map((value, index) => {
          const [x, y] = chartPoint(value, index).split(",");
          return `<circle cx="${x}" cy="${y}" r="4"/>`;
        }).join("")}
      </g>
      <g fill="#f05284">
        ${series.diastolic.map((value, index) => {
          const [x, y] = chartPoint(value, index).split(",");
          return `<circle cx="${x}" cy="${y}" r="4"/>`;
        }).join("")}
      </g>
      <g fill="#3f4a78" font-size="10" font-weight="750">
        ${series.labels.map((label, index) => `<text x="${index === 0 ? 50 : 93 + (index - 1) * 38}" y="${height - 18}">${label}</text>`).join("")}
      </g>
      <g fill="#102568" font-size="11" font-weight="850">
        ${series.systolic.map((value, index) => {
          const [x, y] = chartPoint(value, index).split(",").map(Number);
          return `<text x="${x - 10}" y="${Math.max(14, y - 8)}">${value}</text>`;
        }).join("")}
      </g>
      <g fill="#7d4b68" font-size="11" font-weight="850">
        ${series.diastolic.map((value, index) => {
          const [x, y] = chartPoint(value, index).split(",").map(Number);
          return `<text x="${x - 7}" y="${Math.max(14, y - 8)}">${value}</text>`;
        }).join("")}
      </g>
    </svg>
  `;
}

function companionNoteTitle(companion) {
  if (companion.key === "futureSelf") return "A note from your future self";
  if (companion.key === "clinician") return "A note from your clinician companion";
  return "A note from your friend";
}

function companionStateNote(companion, status) {
  const notes = {
    futureSelf: {
      normal: "This is the kind of steady reading that future you will be grateful for. Keep the rhythm simple and repeatable.",
      singleHigh: "One higher reading does not define the whole path. Rest, recheck, and let the next small choice bring the day back into balance.",
      repeatedHigh: "This is a signal to stay consistent, not to blame yourself. The pattern can change when your next steps become steady again.",
      nearCritical: "This is the moment to let care come closer. Reach out for medical guidance now; getting help is part of protecting future you."
    },
    clinician: {
      normal: "This reading is within the target range for this prototype. Continue regular measurement and keep your routine consistent.",
      singleHigh: "A single elevated reading can happen. Rest quietly, avoid rushing, and recheck later to understand whether it persists.",
      repeatedHigh: "This range suggests the need for structured observation. Keep measuring consistently and review lifestyle patterns.",
      nearCritical: "This reading is high enough to require prompt medical guidance. Contact a healthcare professional now."
    },
    friend: {
      normal: "Nice work. Your reading looks steady today, and you deserve to notice that your care is adding up.",
      singleHigh: "It is okay. Take a pause, breathe, and check again later. We can handle this one step at a time.",
      repeatedHigh: "I know this can feel worrying, but you are not stuck. Let us stay consistent and make the next action small enough to do.",
      nearCritical: "This is bigger than a self-care tip. Please call or visit a healthcare professional now. I am with you while you get help."
    }
  };

  return notes[companion.key]?.[status.key] || companion.lines.readingCopy;
}

function detailContentForStatus(status) {
  const sharedRecordItems = [
    ["Systolic / Diastolic", "mmHg"],
    ["Pulse rate", "bpm"],
    ["Notes", "stress, sleep, symptoms"]
  ];
  const content = {
    normal: {
      title: "Your reading is normal",
      subtitle: "Your blood pressure is within a healthy range. Great job taking care of yourself.",
      explanationTitle: "Why this is normal",
      explanation: "Your heart is pumping with steady, lower pressure and your arteries can stay more open and flexible, allowing blood to flow smoothly.",
      supportTitle: "Your habits are making a difference",
      support: "Recent choices such as light exercise, balanced meals, mindful breathing, and good sleep can support healthier blood pressure patterns.",
      actionTitle: "What to keep doing",
      actions: [
        ["Keep regular measurement", "Check at a consistent time so your trend stays meaningful.", "pulse"],
        ["Continue light exercise", "Short daily movement helps circulation stay steady.", "shoe"],
        ["Protect sleep routine", "Rest supports stress recovery and heart rhythm.", "moon"]
      ],
      recordTitle: "What to record",
      recordItems: [
        ["Blood pressure", "today"],
        ["Exercise and meals", "daily"],
        ["Sleep quality", "nightly"]
      ]
    },
    singleHigh: {
      title: "One high reading is not unusual",
      subtitle: "Your blood pressure can rise for many temporary reasons.",
      explanationTitle: "Why it may be higher",
      explanation: "Stress, poor sleep, caffeine, salty meals, recent activity, or measuring too quickly can cause a short-term increase in blood pressure.",
      supportTitle: "Recent habits to review",
      support: "Look at today’s sleep, meal timing, stress, and movement. A small adjustment may help the next reading come back down.",
      actionTitle: "What you can do",
      actions: [
        ["Drink water", "Hydration can support a calmer recheck.", "water"],
        ["Take slow breaths", "Sit quietly and let your body settle before measuring again.", "breath"],
        ["Take a short exercise break", "Gentle movement can lower stress if you feel well.", "shoe"],
        ["Recheck later", "Measure again after resting, not immediately.", "clock"]
      ],
      recordTitle: "What to record",
      recordItems: [
        ["Systolic / Diastolic", "mmHg"],
        ["Context", "stress, caffeine, meals"],
        ["Recheck result", "later today"]
      ]
    },
    repeatedHigh: {
      title: "Repeatedly High",
      subtitle: "Let’s observe for 3 days and keep your next steps clear.",
      explanationTitle: "Why this needs observation",
      explanation: "A higher pattern is more meaningful than one reading. Consistent measurement helps you see whether lifestyle changes are helping or whether medical guidance is needed.",
      supportTitle: "Plan: 3-Day Observation",
      support: "Measure at consistent times, record context, and share the pattern with a healthcare professional if readings stay high.",
      actionTitle: "When to measure",
      actions: [
        ["Morning", "After waking up", "sunrise"],
        ["Afternoon", "Before dinner", "sun"],
        ["Evening", "Before bed", "moon"]
      ],
      recordTitle: "What to record",
      recordItems: sharedRecordItems,
      planTitle: "Your 3-Day Plan",
      planItems: [
        ["Day 1", "Measure & record"],
        ["Day 2", "Keep tracking"],
        ["Day 3", "Review & decide"]
      ],
      careNote: "After 3 days, share your results with your doctor or healthcare professional."
    },
    nearCritical: {
      title: "Near Critical",
      subtitle: "Seek medical care now.",
      explanationTitle: "Why this is urgent",
      explanation: "Your reading is in a very high range. This should not be handled by lifestyle tips alone, especially if you feel unwell.",
      supportTitle: "Medical warning",
      support: "Your reading is in a dangerous range. Don’t delay getting guidance.",
      actionTitle: "What to do now",
      actions: [
        ["Contact your doctor or emergency services", "Use urgent care if symptoms are present.", "phone"],
        ["Rest in a comfortable position", "Sit down, stay calm, and avoid exertion.", "user"],
        ["Do not take extra medication", "Only take medication as directed by a doctor.", "pill"]
      ],
      recordTitle: "Call emergency services if you have",
      recordItems: [
        ["Chest pain", "urgent"],
        ["Shortness of breath", "urgent"],
        ["Severe headache", "urgent"],
        ["Vision changes", "urgent"]
      ],
      careNote: "If symptoms are present, call emergency services now."
    }
  };

  return content[status.key] || content.normal;
}

function miniVisual(kind) {
  const variants = {
    measure: '<span class="mini-line"></span><span class="simple-heart"></span>',
    move: '<span class="mini-person"></span><span class="mini-line"></span>',
    sleep: '<span class="mini-moon"></span><span class="mini-line"></span>',
    food: '<span class="mini-bowl"></span><span class="simple-heart"></span>'
  };
  return `<div class="mini-visual">${variants[kind]}</div>`;
}

function screenConnect(screen) {
  const reading = getReading();
  const body = `
    ${titleBlock("Connect Data", "Sync blood pressure from your smartwatch,<br>or enter today’s reading manually.")}
    <section class="sync-section">
      <div class="section-header">
        <div>
          <p class="section-label">Sync from your watch</p>
          <p>Get accurate blood pressure readings automatically when your smartwatch is nearby and ready to share data.</p>
        </div>
      </div>
      <div class="visual blue connect-visual">
        <img class="connect-asset" src="./assets/connect-blood-pressure.png" alt="" />
      </div>
      <button class="watch-connect-button" type="button" data-watch-sync>
        Connect Blood Pressure from Watch
        ${icon("watch")}
      </button>
    </section>
    <form class="reading-form" data-reading-form>
      <div class="form-heading">
        <div>
          <p class="section-label">Enter today’s reading</p>
          <p>Use manual entry when your watch is not nearby, or when you want to add a reading from another blood pressure monitor.</p>
        </div>
        <small>mmHg</small>
      </div>
      <div class="input-grid">
        <label class="input-card">
          <span>Systolic</span>
          <input id="systolicInput" inputmode="numeric" type="number" min="70" max="240" value="${reading.systolic}" />
        </label>
        <label class="input-card">
          <span>Diastolic</span>
          <input id="diastolicInput" inputmode="numeric" type="number" min="40" max="150" value="${reading.diastolic}" />
        </label>
      </div>
    </form>
    <div class="privacy-row section-gap">
      <span class="round-icon pink">${icon("shield")}</span>
      <div><strong>Your data stays private</strong><p>Encrypted, secure, and never shared without your consent.</p></div>
      ${icon("arrow-right")}
    </div>
  `;
  return screenShell(screen, body, {
    bottomActions: `
      <div class="bottom-actions">
        <button class="bottom-action primary" type="button" data-save-setup>Save Readings ${icon("check")}</button>
        <button class="bottom-action secondary" type="button" data-save-view>Save and Go to Step 02 ${icon("pulse")}</button>
      </div>
    `
  });
}

function screenDirection(screen) {
  const body = `
    ${titleBlock("Lifestyle Intervention", "Actionable, personalized support for exercise and diet.")}
    <div class="program-intro">
      <span class="round-icon pink">${icon("heart")}</span>
      <div>
        <strong>Core design</strong>
        <p>Micro-actions · flexible plans · visible progress</p>
      </div>
    </div>
    <div class="intervention-grid">
      <article class="intervention-card movement">
        <img src="./assets/sport.png" alt="" />
        <div class="intervention-content">
          <h3>Exercise</h3>
          <ul>
            <li>Scene-based micro-actions</li>
            <li>Partial completion</li>
            <li>Companion support</li>
            <li>Interruption recovery</li>
          </ul>
        </div>
      </article>
      <article class="intervention-card diet">
        <img src="./assets/diet.png" alt="" />
        <div class="intervention-content">
          <h3>Diet</h3>
          <ul>
            <li>Meal photo logging</li>
            <li>Daily calorie estimate</li>
            <li>Social meal support</li>
            <li>Exercise compensation</li>
          </ul>
        </div>
      </article>
    </div>
  `;
  return screenShell(screen, body, {
    bottomActions: `
      <div class="bottom-actions">
        <button class="bottom-action primary" type="button" data-got-it>Got it ${icon("check")}</button>
        <button class="bottom-action secondary" type="button" data-step02>Save and Go to Step 02 ${icon("pulse")}</button>
      </div>
    `
  });
}

function screenSchedule(screen) {
  const schedule = getSchedule();
  const windows = exerciseWindows(schedule);
  const allocatedMinutes = Object.values(schedule.exercise).reduce((total, minutes) => total + Number(minutes || 0), 0);
  const remainingMinutes = Math.max(0, 30 - allocatedMinutes);
  const exerciseCards = [
    ["morning", "Morning", windows.morning],
    ["midday", "Midday", windows.midday],
    ["evening", "Evening", windows.evening]
  ];
  const body = `
    ${titleBlock('Define Your <span class="accent">Schedule</span>', "Set your day rhythm first. Your exercise windows adjust around it.")}
    <div class="schedule-hero">
      <img src="./assets/light-exercise.png" alt="" />
    </div>
    <div class="panel schedule-panel">
      <p class="section-label">Daily schedule</p>
      <div class="time-grid">
        <div class="time-card adjustable-time">
          <span>Wake-up time</span>
          <div class="time-adjuster">
            <button type="button" data-time-step="wakeTime" data-delta="-15" aria-label="Move wake-up time 15 minutes earlier">-15</button>
            <input aria-label="Wake-up time" type="text" inputmode="numeric" maxlength="5" value="${schedule.wakeTime}" data-schedule-field="wakeTime" />
            <button type="button" data-time-step="wakeTime" data-delta="15" aria-label="Move wake-up time 15 minutes later">+15</button>
          </div>
          <strong class="accent">${formatTime(schedule.wakeTime)}</strong>
        </div>
        <div class="time-card adjustable-time">
          <span>Bedtime</span>
          <div class="time-adjuster">
            <button type="button" data-time-step="bedtime" data-delta="-15" aria-label="Move bedtime 15 minutes earlier">-15</button>
            <input aria-label="Bedtime" type="text" inputmode="numeric" maxlength="5" value="${schedule.bedtime}" data-schedule-field="bedtime" />
            <button type="button" data-time-step="bedtime" data-delta="15" aria-label="Move bedtime 15 minutes later">+15</button>
          </div>
          <strong>${formatTime(schedule.bedtime)}</strong>
        </div>
      </div>
    </div>
    <div class="panel schedule-panel">
      <p class="section-label">Light exercise time</p>
      <p class="remaining-line">${remainingMinutes} min remaining today</p>
      <div class="exercise-window-grid">
        ${exerciseCards.map(([key, label, item]) => `
          <article class="exercise-window">
            <span class="round-icon ${item.tone || ""}">${icon(item.iconName)}</span>
            <div>
              <strong>${label}</strong>
              <span>${item.label}</span>
              <time>${item.range}</time>
            </div>
            <div class="mini-stepper" aria-label="${label} exercise minutes">
              <button type="button" data-allocation-step="${key}" data-delta="-5">-</button>
              <b>${schedule.exercise[key]} min</b>
              <button type="button" data-allocation-step="${key}" data-delta="5">+</button>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
  return screenShell(screen, body, {
    bottomActions: `
      <div class="bottom-actions">
        <button class="bottom-action primary" type="button" data-save-settings>Save Settings ${icon("check")}</button>
        <button class="bottom-action secondary" type="button" data-step02>Save and Go to Step 02 ${icon("pulse")}</button>
      </div>
    `
  });
}

function screenCompanion(screen) {
  const selected = getCompanionProfile();
  const cards = Object.values(companionProfiles);
  const body = `
    ${titleBlock("Hi Sophia,<br>Choose Your Companion", "Pick the support style you want beside you.")}
    <div class="companion-list">
      ${cards.map((card) => `
        <button class="panel companion-card ${card.key === selected.key ? "is-selected" : ""}" type="button" data-companion-choice="${card.key}" aria-pressed="${card.key === selected.key}">
          <span class="choice-check">${icon("check")}</span>
          <div class="companion-portrait">
            <img src="${card.image}" alt="" />
          </div>
          <div>
            <span class="round-icon pink">${icon(card.iconName)}</span>
            <h3>${card.title}</h3>
            <p>${card.copy}</p>
          </div>
        </button>
      `).join("")}
    </div>
  `;
  return screenShell(screen, body, {
    ctaLabel: "Save and Go to Step 02",
    ctaIcon: "pulse",
    ctaAction: "data-step02"
  });
}

function screenTrend(screen) {
  const reading = getReading();
  const status = classifyReading(reading);
  const series = getTrendSeries(reading);
  const avgSystolic = average(series.systolic);
  const avgDiastolic = average(series.diastolic);
  const companion = getCompanionProfile();
  const body = `
    ${titleBlock("Your Current State", "Today’s reading is interpreted with your recent 7-day trend.")}
    <article class="reading-state-card ${status.tone}">
      <p class="state-card-label">Current state</p>
      <div class="state-image">
        <img src="${status.image}" alt="" />
      </div>
      <div class="state-card-body">
        <span class="status-chip ${status.chip}">${icon(status.iconName)} ${status.label}</span>
        <div class="bp-number compact"><span>${reading.systolic}</span><span class="slash">/</span><span class="dia">${reading.diastolic}</span><small>mmHg</small></div>
        <p>${status.short}</p>
      </div>
    </article>
    <div class="chart-card section-gap">
      <div class="chart-head"><strong>7-Day Average</strong><span class="status-chip ${status.chip}">${avgSystolic} / <span class="accent">${avgDiastolic}</span> mmHg</span></div>
      <div class="legend"><span>Systolic</span><span>Diastolic</span></div>
      ${trendChart(true, reading)}
      <div class="trend-current">
        <span>Today’s reading</span>
        <strong>${reading.systolic} / ${reading.diastolic} mmHg</strong>
      </div>
    </div>
    <article class="panel companion-note section-gap">
      <span class="round-icon ${status.chip === "green" ? "green" : status.chip}">${icon(companion.iconName)}</span>
      <div>
        <strong>${companionNoteTitle(companion)}</strong>
        <p>${companionStateNote(companion, status)}</p>
      </div>
    </article>
  `;
  return screenShell(screen, body, { ctaLabel: "Continue", ctaIcon: "arrow-right", back: false });
}

function screenState(screen) {
  const reading = getReading();
  const status = classifyReading(reading);
  const states = [
    ["normal", "Normal", "118 / 76", "Within a healthy range. Keep your routine steady.", "Keep it up", "green"],
    ["amber", "Single High", "135 / 88", "Higher than usual once. Rest and check again later.", "Recheck soon", "amber"],
    ["pink", "Repeatedly High", "148 / 94", "Several high readings in a row. Start observation.", "Take action", "pink"],
    ["red", "Near Critical", "168 / 106", "Very high. Contact a clinician promptly.", "Contact care", "red"]
  ];
  const body = `
    ${titleBlock("Your Current State", "Blood pressure can change. The card focuses on what matters now.")}
    <article class="current-state-card ${status.tone}">
      <div>
        <span class="status-chip ${status.chip}">${icon(status.iconName)} ${status.label}</span>
        <div class="bp-number compact"><span>${reading.systolic}</span><span class="slash">/</span><span class="dia">${reading.diastolic}</span><small>mmHg</small></div>
        <p>${status.short}</p>
      </div>
      <div class="state-figure"><span class="organ-heart"></span></div>
    </article>
    <p class="section-label section-gap">Status scale</p>
    <div class="state-grid">
      ${states.map(([tone, title, reading, copy, action, chip]) => `
        <article class="state-card ${tone} ${chip === status.chip ? "is-current" : ""}">
          <div class="state-figure"><span class="organ-heart"></span></div>
          <div>
            <span class="status-chip ${chip}">${title}</span>
            <div class="state-reading">${reading}</div>
            <p>${copy}</p>
            <p><strong>${action}</strong></p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
  return screenShell(screen, body, { bottomTabs: true });
}

function screenExplanation(screen) {
  const reading = getReading();
  const status = classifyReading(reading);
  const companion = getCompanionProfile();
  const detail = detailContentForStatus(status);
  const isWarningState = status.key === "repeatedHigh" || status.key === "nearCritical";
  const body = `
    ${titleBlock(detail.title, detail.subtitle)}
    <article class="panel reading-detail-summary ${status.tone}">
      <div>
        <span class="status-chip ${status.chip}">${icon(status.iconName)} Today’s reading</span>
        <strong>${reading.systolic}<span class="pink"> / ${reading.diastolic}</span></strong>
        <span>${status.label}</span>
      </div>
      <span class="round-icon ${status.chip === "green" ? "green" : status.chip}">${icon(status.iconName)}</span>
    </article>
    <div class="panel explain-block">
      <h3>${detail.explanationTitle}</h3>
      <p>${detail.explanation}</p>
    </div>
    <div class="panel explain-block ${isWarningState ? "warning-block is-active-plan" : ""}">
      <h3>${detail.supportTitle}</h3>
      <p>${detail.support}</p>
    </div>
    <div class="panel explain-block">
      <h3>${detail.actionTitle}</h3>
      <div class="detail-action-list">
        ${detail.actions.map(([title, copy, iconName]) => `
          <div class="detail-action-item">
            <span class="round-icon ${status.chip === "green" ? "" : status.chip}">${icon(iconName)}</span>
            <div><strong>${title}</strong><span>${copy}</span></div>
          </div>
        `).join("")}
      </div>
    </div>
    <div class="panel explain-block">
      <h3>${detail.recordTitle}</h3>
      <div class="record-list">
        ${detail.recordItems.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
      </div>
    </div>
    ${detail.planItems ? `
      <div class="panel explain-block">
        <h3>${detail.planTitle}</h3>
        <div class="three-day">
          ${detail.planItems.map(([day, task], index) => `<div><span class="day-dot">${index + 1}</span><strong>${day}</strong><span>${task}</span></div>`).join("")}
        </div>
      </div>
    ` : ""}
    ${detail.careNote ? `
      <div class="panel explain-block ${status.key === "nearCritical" ? "urgent-note" : ""}">
        <h3>${status.key === "nearCritical" ? "Care reminder" : "Next decision"}</h3>
        <p>${detail.careNote}</p>
      </div>
    ` : ""}
    <div class="panel explain-block">
      <h3>${companionNoteTitle(companion)}</h3>
      <p>${companionStateNote(companion, status)}</p>
    </div>
  `;
  return screenShell(screen, body, { ctaLabel: "Save and Go to Step 03", ctaIcon: "shoe", ctaAction: "data-step03" });
}

function screenWarnings(screen) {
  const reading = getReading();
  const status = classifyReading(reading);
  const observationActive = status.key === "repeatedHigh";
  const careActive = status.key === "nearCritical";
  const body = `
    ${titleBlock("Observation & Warning", "When readings stay high, the next step should be clear.")}
    <div class="panel warning-block ${observationActive ? "is-active-plan" : ""}">
      <span class="status-chip ${observationActive ? "pink" : "green"}">${icon(observationActive ? "trend" : "check")} ${observationActive ? "Repeatedly High" : "Observation not required now"}</span>
      <h3 style="margin-top:10px">Plan: 3-Day Observation</h3>
      <p>${observationActive ? "Measure at consistent times and record context, symptoms, and notes to discuss with your clinician." : "Your current manual input does not require a 3-day observation flow. Keep measuring regularly and recheck if readings rise."}</p>
      <div class="observation-grid section-gap">
        <div class="observe-time">${icon("clock")}<strong>Morning</strong><span>After waking</span></div>
        <div class="observe-time">${icon("pulse")}<strong>Afternoon</strong><span>Before dinner</span></div>
        <div class="observe-time">${icon("moon")}<strong>Evening</strong><span>Before bed</span></div>
      </div>
      <div class="record-list">
        <div><span>Systolic / Diastolic</span><strong>mmHg</strong></div>
        <div><span>Pulse rate</span><strong>bpm</strong></div>
        <div><span>Notes</span><strong>stress, sleep, symptoms</strong></div>
      </div>
      <div class="three-day">
        <div><span class="day-dot">1</span><strong>Day 1</strong><span>Measure & record</span></div>
        <div><span class="day-dot">2</span><strong>Day 2</strong><span>Keep tracking</span></div>
        <div><span class="day-dot">3</span><strong>Day 3</strong><span>Review & decide</span></div>
      </div>
    </div>
    <div class="panel warning-block section-gap ${careActive ? "is-active-plan" : ""}" style="background:#fff4f7;border-color:#ffd1dc">
      <span class="status-chip ${careActive ? "red" : "amber"}">${icon(careActive ? "alert" : "heart")} ${careActive ? status.label : "Medical warning inactive"}</span>
      <h3 style="margin-top:10px;color:var(--red)">Get medical guidance promptly</h3>
      <p>${careActive ? "This manual reading is high enough to ask for medical guidance promptly. If warning symptoms are present, use emergency services." : "This card becomes active for very high readings. It stays visible here so you can review the warning workflow."}</p>
      <div class="action-row section-gap">
        <div class="action-item"><span class="round-icon red">${icon("phone")}</span><div><strong>Contact your doctor or local emergency services</strong><span>Use urgent care if symptoms are present.</span></div>${icon("arrow-right")}</div>
        <div class="action-item"><span class="round-icon pink">${icon("user")}</span><div><strong>Rest in a comfortable position</strong><span>Stay calm while waiting for guidance.</span></div>${icon("arrow-right")}</div>
      </div>
      <p class="section-label section-gap" style="color:var(--red)">Call emergency services if you have</p>
      <div class="symptom-grid">
        <span class="symptom"><span class="round-icon red">${icon("heart")}</span>Chest pain</span>
        <span class="symptom"><span class="round-icon red">${icon("breath")}</span>Shortness of breath</span>
        <span class="symptom"><span class="round-icon red">${icon("alert")}</span>Severe headache</span>
        <span class="symptom"><span class="round-icon red">${icon("pulse")}</span>Vision changes</span>
      </div>
    </div>
  `;
  return screenShell(screen, body, {
    ctaLabel: observationActive ? "Start Observation" : careActive ? "Contact Care" : "Continue Monitoring",
    ctaIcon: observationActive ? "calendar" : careActive ? "phone" : "check",
    ctaTone: observationActive || careActive ? "pink" : ""
  });
}

function screenReminder(screen) {
  const companion = getCompanionProfile();
  const schedule = getSchedule();
  const morningWindow = exerciseWindows(schedule).morning;
  const morningMinutes = schedule.exercise.morning || 10;
  const exerciseCta = `Start ${morningMinutes}-min Exercise`;
  const body = `
    ${titleBlock("Guidance", "Small, adjustable actions for exercise and diet.")}
    <div class="guidance-board">
      <article class="guidance-tile exercise">
        <div class="guidance-tile-art exercise">
          <img src="./assets/guidance-exercise.png" alt="" />
        </div>
        <div class="guidance-tile-copy">
          <span class="section-label">Exercise</span>
          <h3>Morning exercise plan</h3>
          <p>${morningWindow.range}</p>
          <span>${morningMinutes} min planned</span>
        </div>
        <button class="tile-cta" type="button" data-start-exercise>${exerciseCta}</button>
      </article>
      <article class="guidance-tile diet">
        <div class="guidance-tile-art diet">
          <img src="./assets/guidance-diet.png" alt="" />
        </div>
        <div class="guidance-tile-copy">
          <span class="section-label">Diet</span>
          <h3>Suggested meal plan</h3>
          <p>Build a balanced plate with vegetables, lean protein, whole grains, and lower-sodium choices.</p>
          <span>Photo log after eating</span>
        </div>
        <button class="tile-cta" type="button" data-log-meal>Log My Meal</button>
      </article>
    </div>
  `;
  const overlay = appState.reminderDismissed ? "" : `
    <div class="modal-backdrop guidance-modal-backdrop"></div>
    <div class="reminder-card guidance-reminder-card">
      <button class="close-dot" type="button" data-dismiss-reminder aria-label="Close exercise reminder">${icon("x")}</button>
      <span class="round-icon pink">${icon("shoe")}</span>
      <h2>Time for your morning exercise.</h2>
      <p>${companion.lines.reminderCopy}</p>
      <div class="exercise-reminder-summary">
        <div>
          <span>Scheduled window</span>
          <strong>${morningWindow.range}</strong>
        </div>
        <div>
          <span>Planned duration</span>
          <strong>${morningMinutes} min</strong>
        </div>
      </div>
      <div class="reminder-image exercise section-gap">
        <img src="./assets/guidance-exercise.png" alt="" />
      </div>
      <div class="info-row section-gap">
        <span class="round-icon pink">${icon("heart")}</span>
        <div><strong>Supports steadier blood pressure</strong><p>Gentle exercise helps circulation and lowers stress.</p></div>
      </div>
      <button class="modal-cta" type="button" data-start-exercise>${exerciseCta}</button>
    </div>
  `;
  return `${screenShell(screen, body, { back: true })}${overlay}`;
}

function screenContext(screen) {
  const environments = [
    { key: "office", label: "Office", image: "./assets/context-office.png" },
    { key: "home", label: "Home", image: "./assets/context-home.png" },
    { key: "outdoor", label: "Outdoor", image: "./assets/context-outdoor.png" },
    { key: "publicSpace", label: "Public Space", image: "./assets/context-public-space.png" }
  ];
  const states = [
    { key: "sitting", label: "Sitting for a long time", image: "./assets/state-sitting.png" },
    { key: "meals", label: "After meals", image: "./assets/state-meals.png" },
    { key: "overtime", label: "After overtime work", image: "./assets/state-overtime-work.png" }
  ];
  const selectedEnvironment = appState.guidance.environment || defaultGuidance.environment;
  const selectedState = appState.guidance.state || defaultGuidance.state;
  const body = `
    ${titleBlock("Choose Your Current Environment", "Guidance changes with where you are and how much choice you have.")}
    <div class="environment-grid">
      ${environments.map(({ key, label, image }) => `
        <button class="environment-card ${selectedEnvironment === key ? "is-selected" : ""}" type="button" data-environment-choice="${key}" aria-pressed="${selectedEnvironment === key}">
          <div class="environment-art"><img src="${image}" alt="" /></div>
          <strong>${label}</strong>
        </button>
      `).join("")}
    </div>
    <p class="section-label context-state-label">Choose Your Current State</p>
    <div class="state-list">
      ${states.map(({ key, label, image }) => `
        <button class="state-option ${selectedState === key ? "is-selected" : ""}" type="button" data-state-choice="${key}" aria-pressed="${selectedState === key}">
          <div class="environment-art"><img src="${image}" alt="" /></div>
          <strong>${label}</strong>
          <span class="radio-dot"></span>
        </button>
      `).join("")}
    </div>
  `;
  return screenShell(screen, body, { ctaLabel: "Confirm", ctaIcon: "arrow-right" });
}

function screenMicroActions(screen) {
  const schedule = getSchedule();
  const plannedMinutes = schedule.exercise.morning || 10;
  const environmentLabels = {
    office: "Office",
    home: "Home",
    outdoor: "Outdoor",
    publicSpace: "Public Space"
  };
  const stateLabels = {
    sitting: "Sitting for a long time",
    meals: "After meals",
    overtime: "After overtime work"
  };
  const selectedEnvironment = environmentLabels[appState.guidance.environment] || environmentLabels.office;
  const selectedState = stateLabels[appState.guidance.state] || stateLabels.sitting;
  const plans = {
    office: {
      place: "Office",
      title: "Wall stand",
      time: "5 min / set",
      copy: "Lean against a wall, engage your core, and hold steady with slow, even breathing.",
      image: "./assets/micro-office.png"
    },
    home: {
      place: "Home",
      title: "Chair march",
      time: "5 min / set",
      copy: "Sit upright and lift your knees one at a time at a gentle pace to activate your legs.",
      image: "./assets/micro-home.png"
    },
    outdoor: {
      place: "Outdoor",
      title: "Brisk walk",
      time: "5 min / set",
      copy: "Walk at a slightly faster pace than usual while keeping your shoulders relaxed and breathing steady.",
      image: "./assets/micro-outdoor.png"
    },
    publicSpace: {
      place: "Public Space",
      title: "Calf raises",
      time: "5 min / set",
      copy: "Stand tall and slowly raise your heels, then lower them with control to improve circulation.",
      image: "./assets/micro-public-space.png"
    }
  };
  const plan = plans[appState.guidance.environment] || plans.office;
  const completionOptions = [
    {
      key: "all",
      title: "Completed all",
      copy: "Great job. You finished the full micro-action.",
      suffix: `<span class="status-chip green">${icon("check")}</span>`
    },
    {
      key: "50",
      title: "Partly completed",
      copy: "You completed at least 50%. Progress saved.",
      suffix: `<span class="percent-ring" style="--percent:50%">50%</span>`
    },
    {
      key: "interrupted",
      title: "Plan interrupted",
      copy: "Less than 50% completed. Let’s adjust the plan.",
      suffix: `<span class="status-chip amber">${icon("alert")}</span>`
    }
  ];
  const body = `
    ${titleBlock("Your Micro-Actions", "Small moves can help your blood pressure stay in balance.")}
    <article class="panel micro-context-summary">
      <div class="micro-context-row">
        <span class="round-icon">${icon("briefcase")}</span>
        <div><strong>${selectedEnvironment} / ${selectedState}</strong></div>
      </div>
      <div class="compact-exercise-card">
        <div class="compact-exercise-image"><img src="${plan.image}" alt="" /></div>
        <div>
          <h3>${plan.title}</h3>
          <strong>${plan.time}</strong>
          <span>${plannedMinutes} min planned</span>
        </div>
      </div>
    </article>
    <div class="panel">
      <p class="section-label">How did it go?</p>
      <div class="completion-list">
        ${completionOptions.map((option) => `
          <button class="completion-option ${appState.completion === option.key ? "is-selected" : ""}" type="button" data-completion-choice="${option.key}" aria-pressed="${appState.completion === option.key}">
            <span class="check-dot">${appState.completion === option.key ? icon("check") : ""}</span>
            <div><strong>${option.title}</strong><span>${option.copy}</span></div>
            ${option.suffix}
          </button>
        `).join("")}
      </div>
    </div>
  `;
  const overlay = appState.microPlanDismissed ? "" : `
    <div class="modal-backdrop guidance-modal-backdrop"></div>
    <div class="reminder-card micro-plan-modal">
      <button class="close-dot" type="button" data-dismiss-micro-plan aria-label="Close exercise plan">${icon("x")}</button>
      <span class="round-icon pink">${icon("shoe")}</span>
      <h2>Exercise plan</h2>
      <p>${plan.place} / ${selectedState}</p>
      <div class="micro-plan-image section-gap">
        <img src="${plan.image}" alt="" />
      </div>
      <article class="micro-plan-detail">
        <div>
          <span class="metric-title">${plan.place}</span>
          <h3>${plan.title}</h3>
          <p>${plan.copy}</p>
        </div>
        <div class="micro-plan-time">
          <strong>${plan.time}</strong>
          <span>${plannedMinutes} min planned</span>
        </div>
      </article>
      <button class="modal-cta" type="button" data-dismiss-micro-plan>Start Exercise</button>
    </div>
  `;
  return `${screenShell(screen, body, { ctaLabel: "Continue", ctaIcon: "arrow-right", ctaAction: "data-complete-micro-action" })}${overlay}`;
}

function screenAdjustment(screen) {
  const companion = getCompanionProfile();
  const schedule = getSchedule();
  const bedtime = formatTime(schedule.bedtime);
  const recoveryOptions = [
    {
      key: "beforeSleep",
      title: "Before today’s sleep",
      time: bedtime,
      copy: "3 min gentle stretching"
    },
    {
      key: "tomorrowMorning",
      title: "Tomorrow morning",
      time: formatTime(schedule.wakeTime),
      copy: "5 min light exercise reset"
    }
  ];
  const body = `
    <div class="adjustment-card panel">
      <div class="adjustment-heading">
        <span class="round-icon">${icon("check")}</span>
        <div>
          <h1>New plan created</h1>
          <p>Here’s a simple plan to keep you on track with less stress.</p>
        </div>
      </div>
      <div class="adjustment-hero">
        <img src="./assets/recovery-light-exercise.png" alt="" />
      </div>
      <section class="minimum-plan">
        <p class="section-label">Your new minimum plan</p>
        <p>Small steps, real impact.</p>
        <div class="recovery-option-list">
          ${recoveryOptions.map((option) => `
            <button class="recovery-option ${appState.recoveryOption === option.key ? "is-selected" : ""}" type="button" data-recovery-option="${option.key}" aria-pressed="${appState.recoveryOption === option.key}">
              <span class="round-icon ${appState.recoveryOption === option.key ? "" : "soft"}">${icon(option.key === "beforeSleep" ? "moon" : "sun")}</span>
              <div>
                <strong>${option.title}</strong>
                <span>${option.copy}</span>
              </div>
              <time>${option.time}</time>
            </button>
          `).join("")}
        </div>
      </section>
    </div>
    <div class="info-row section-gap">
      <span class="round-icon pink">${icon("heart")}</span>
      <div><strong>Consistency, not perfection</strong><p>${companion.lines.adjustmentCopy}</p></div>
    </div>
  `;
  return screenShell(screen, body, {
    bottomActions: `
      <div class="bottom-actions">
        <button class="bottom-action primary" type="button" data-go-feedback-active>I’m on Track ${icon("check")}</button>
        <button class="bottom-action secondary" type="button" data-go-feedback-missed>Maybe Later ${icon("arrow-right")}</button>
      </div>
    `
  });
}

function screenCompletion(screen) {
  const body = `
    <div class="feedback-home missed">
      <div class="feedback-greeting">
        <h1>Hello, <span>Sophia</span></h1>
      </div>
      <div class="feedback-status-card missed">
        <span class="round-icon pink">${icon("snow")}</span>
        <div><strong>Plan missed</strong><p>Your day is off track.<br>Let’s get back on track together.</p></div>
      </div>
      <div class="feedback-world">
        <img src="./assets/feedback-iced-heart.png" alt="" />
      </div>
      <div class="feedback-task-card">
        <div class="task-card-header"><strong>Today</strong><span><b>0 / 3</b> completed</span></div>
        <div class="feedback-task-list">
          <div><span class="round-icon pink">${icon("heart")}</span><strong>Morning Meds<small>8:00 AM</small></strong><em>Missed</em></div>
          <div><span class="round-icon">${icon("pulse")}</span><strong>Blood Pressure Check<small>12:00 PM</small></strong><em>Missed</em></div>
          <div><span class="round-icon purple">${icon("shoe")}</span><strong>Evening Exercise<small>6:00 PM</small></strong><em>Missed</em></div>
        </div>
      </div>
      <div class="feedback-nudge">
        <span class="round-icon pink">${icon("heart")}</span>
        <div><strong>Small steps matter</strong><p>Complete your next task to reactivate your progress.</p></div>
        ${icon("arrow-right")}
      </div>
    </div>
  `;
  return screenShell(screen, body, { stepTabs: true });
}

function screenGarden(screen) {
  const body = `
    <div class="feedback-home active">
      <div class="feedback-greeting">
        <h1>Hello, <span>Sophia</span></h1>
      </div>
      <div class="feedback-status-card active">
        <span class="round-icon green">${icon("check")}</span>
        <div><strong>Great job!</strong><p>You completed your task.<br>Your progress is back on track.</p></div>
      </div>
      <div class="feedback-world">
        <img src="./assets/feedback-lived-heart.png" alt="" />
      </div>
      <div class="feedback-task-card">
        <div class="task-card-header"><strong>Today</strong><span><b>2 / 3</b> completed</span></div>
        <div class="feedback-task-list">
          <div><span class="round-icon green">${icon("heart")}</span><strong>Morning Meds<small>8:00 AM</small></strong><em class="done">${icon("check")} Done</em></div>
          <div><span class="round-icon green">${icon("check")}</span><strong>Blood Pressure Check<small>12:00 PM</small></strong><em class="done">${icon("check")} Done</em></div>
          <div><span class="round-icon">${icon("shoe")}</span><strong>Evening Exercise<small>6:00 PM</small></strong><em class="upcoming">Upcoming</em></div>
        </div>
      </div>
      <div class="feedback-nudge active">
        <span class="round-icon">${icon("trophy")}</span>
        <div><strong>You’re back on track!</strong><p>Consistency today builds better tomorrows.</p></div>
        ${icon("arrow-right")}
      </div>
    </div>
  `;
  return screenShell(screen, body, { stepTabs: true });
}

function screenRecovery(screen) {
  const companion = getCompanionProfile();
  const body = `
    ${titleBlock("Recovery Feedback", "When plans pause, the world changes. When you return, it wakes up.")}
    <div class="panel" style="background:#f3f6fb">
      <span class="status-chip red">${icon("snow")} Plan missed</span>
      <div class="frozen-visual section-gap"><span class="ice-block"></span><span class="organ-heart"></span></div>
      <div class="task-list section-gap">
        <div class="plan-row"><span class="round-icon pink">${icon("heart")}</span><div><strong>Morning meds</strong><span>8:00 AM</span></div><time>Missed</time></div>
        <div class="plan-row"><span class="round-icon">${icon("pulse")}</span><div><strong>Blood pressure check</strong><span>12:00 PM</span></div><time>Missed</time></div>
      </div>
    </div>
    <div class="panel" style="background:#f2fff7">
      <span class="status-chip green">${icon("check")} Great job</span>
      <div class="active-visual section-gap"><span class="organ-heart"></span></div>
      <div class="task-list section-gap">
        <div class="plan-row"><span class="round-icon green">${icon("check")}</span><div><strong>Morning meds</strong><span>8:00 AM</span></div><time>Done</time></div>
        <div class="plan-row"><span class="round-icon">${icon("shoe")}</span><div><strong>Evening walk</strong><span>6:00 PM</span></div><time>Upcoming</time></div>
      </div>
    </div>
    <div class="info-row section-gap">
      <span class="round-icon">${icon(companion.iconName)}</span>
      <div><strong>${companion.lines.recoveryTitle}</strong><p>${companion.lines.recoveryCopy}</p></div>
      ${icon("arrow-right")}
    </div>
  `;
  return screenShell(screen, body, { bottomTabs: true });
}

function screenWeekly(screen) {
  const reading = getReading();
  const series = getTrendSeries(reading);
  const avgSystolic = average(series.systolic);
  const avgDiastolic = average(series.diastolic);
  const companion = getCompanionProfile();
  const body = `
    ${titleBlock("Your Weekly Summary", "May 6 - May 12")}
    <div class="chart-card">
      <div class="chart-head"><strong>Blood Pressure Overview</strong><span>This week vs. last week</span></div>
      <div class="metric-row">
        <div><strong>${avgSystolic}<span class="pink">/${avgDiastolic}</span></strong><span>7-day average</span></div>
        <div><strong style="color:var(--pink)">125/82</strong><span>Last week average</span></div>
      </div>
      ${trendChart(true, reading)}
    </div>
    <div class="panel">
      <p class="section-label">This week at a glance</p>
      <div class="summary-grid">
        <div class="summary-tile">${icon("heart")}<strong>7/7</strong><span>Record BP days</span></div>
        <div class="summary-tile">${icon("shoe")}<strong>6/7</strong><span>Move days</span></div>
        <div class="summary-tile">${icon("moon")}<strong>7/7</strong><span>Sleep well days</span></div>
        <div class="summary-tile">${icon("bowl")}<strong>6/7</strong><span>Eat healthy days</span></div>
        <div class="summary-tile">${icon("breath")}<strong>5/7</strong><span>Stress care days</span></div>
        <div class="summary-tile">${icon("water")}<strong>7/7</strong><span>Hydration days</span></div>
      </div>
    </div>
    <div class="panel">
      <p class="section-label">Dynamic adjustments</p>
      <div class="record-list">
        <div><span>Medication taken as prescribed</span><strong>7/7</strong></div>
        <div><span>Lifestyle adjustments</span><strong>5 times</strong></div>
        <div><span>Plan updates</span><strong>2 times</strong></div>
      </div>
    </div>
    <div class="quote-card">${companion.lines.weeklyQuote}</div>
  `;
  return screenShell(screen, body, { ctaLabel: "Continue Your Journey", ctaIcon: "share" });
}

const screens = [
  { code: "1.1", step: "Step 01 / 1.1", title: "Connect Data", group: "Step 01 Onboarding", progress: 1, total: 4, render: screenConnect },
  { code: "1.2", step: "Step 01 / 1.2", title: "Choose Direction", group: "Step 01 Onboarding", progress: 2, total: 4, render: screenDirection },
  { code: "1.3", step: "Step 01 / 1.3", title: "Define Time", group: "Step 01 Onboarding", progress: 3, total: 4, render: screenSchedule },
  { code: "1.4", step: "Step 01 / 1.4", title: "Choose Companion", group: "Step 01 Onboarding", progress: 4, total: 4, render: screenCompanion },
  { code: "2.1", step: "Step 02 / 2.1", title: "Current State", group: "Step 02 Readings Card", progress: 1, total: 2, render: screenTrend },
  { code: "2.2", step: "Step 02 / 2.2", title: "Reason & Warning", group: "Step 02 Readings Card", progress: 2, total: 2, render: screenExplanation },
  { code: "3.1", step: "Step 03 / 3.1", title: "Reminder Popup", group: "Step 03 Guidance", progress: 1, total: 4, render: screenReminder },
  { code: "3.2", step: "Step 03 / 3.2", title: "Scene Selection", group: "Step 03 Guidance", progress: 2, total: 4, render: screenContext },
  { code: "3.3", step: "Step 03 / 3.3", title: "Micro-Actions", group: "Step 03 Guidance", progress: 3, total: 4, render: screenMicroActions },
  { code: "3.4", step: "Step 03 / 3.4", title: "Dynamic Adjustment", group: "Step 03 Guidance", progress: 4, total: 4, render: screenAdjustment },
  { code: "4.1", step: "Step 04 / 4.1", title: "Plan Missed", group: "Step 04 Feedback", progress: 1, total: 2, render: screenCompletion },
  { code: "4.2", step: "Step 04 / 4.2", title: "Back on Track", group: "Step 04 Feedback", progress: 2, total: 2, render: screenGarden }
];

let currentScreen = 0;

function renderNav() {
  const groups = [...new Set(screens.map((screen) => screen.group))];
  $("#screenNav").innerHTML = groups.map((group) => `
    <section class="nav-group">
      <p class="nav-group-title">${group}</p>
      ${screens.map((screen, index) => screen.group === group ? `
        <button type="button" data-screen="${index}" class="${index === currentScreen ? "is-active" : ""}" ${index === currentScreen ? 'aria-current="true"' : ""}>
          <span class="nav-code">${screen.code}</span>
          <span class="nav-title">${screen.title}</span>
        </button>
      ` : "").join("")}
    </section>
  `).join("");
}

function renderScreen() {
  const screen = screens[currentScreen];
  $("#phoneScreen").innerHTML = screen.render(screen);
  $("#screenCounter").textContent = `${currentScreen + 1} / ${screens.length}`;
  $("#prevScreen").disabled = currentScreen === 0;
  $("#nextScreen").disabled = currentScreen === screens.length - 1;
  renderNav();
}

function goToScreen(index) {
  currentScreen = Math.max(0, Math.min(screens.length - 1, index));
  if (screens[currentScreen]?.code === "3.1") {
    appState.reminderDismissed = false;
  }
  if (screens[currentScreen]?.code === "3.3") {
    appState.microPlanDismissed = false;
  }
  renderScreen();
}

function scrollStageIntoView() {
  if (window.matchMedia("(max-width: 900px)").matches) {
    requestAnimationFrame(() => {
      document.querySelector(".stage")?.scrollIntoView({ block: "start" });
    });
  }
}

function readFormValues() {
  return {
    systolic: $("#systolicInput")?.value,
    diastolic: $("#diastolicInput")?.value,
    pulse: getReading().pulse,
    repeatedHigh: false
  };
}

function handleSaveReading(targetIndex = 4) {
  saveReading(readFormValues());
  goToScreen(targetIndex);
}

function handleWatchSync() {
  saveReading({
    systolic: 128,
    diastolic: 82,
    pulse: 72,
    repeatedHigh: false,
    source: "watch"
  });
  renderScreen();
}

function updateScheduleField(field, value) {
  if (!value) return;
  const schedule = getSchedule();
  const normalizedValue = normalizeTimeValue(value, schedule[field] || defaultSchedule[field]);
  saveSchedule({
    ...schedule,
    [field]: normalizedValue
  });
  renderScreen();
}

function updateScheduleTime(field, delta) {
  const schedule = getSchedule();
  const current = schedule[field] || defaultSchedule[field];
  updateScheduleField(field, minutesToTime(timeToMinutes(current) + delta));
}

function updateExerciseAllocation(key, delta) {
  const schedule = getSchedule();
  const current = schedule.exercise[key] ?? 0;
  saveSchedule({
    ...schedule,
    exercise: {
      ...schedule.exercise,
      [key]: clampNumber(current + delta, 0, 60, current)
    }
  });
  renderScreen();
}

function isTypingTarget(target) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);
}

document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-screen]");
  if (navButton) {
    goToScreen(Number(navButton.dataset.screen));
    scrollStageIntoView();
    return;
  }

  const sectionTab = event.target.closest("[data-section-tab]");
  if (sectionTab) {
    const targetIndex = screens.findIndex((screen) => screen.group === sectionTab.dataset.sectionTab);
    if (targetIndex >= 0) {
      goToScreen(targetIndex);
    }
    return;
  }

  if (event.target.closest("[data-watch-sync]")) {
    handleWatchSync();
    return;
  }

  if (event.target.closest("[data-save-setup]")) {
    handleSaveReading(1);
    return;
  }

  if (event.target.closest("[data-save-view]") || event.target.closest("[data-save-reading]")) {
    handleSaveReading(4);
    return;
  }

  if (event.target.closest("[data-got-it]")) {
    goToScreen(2);
    return;
  }

  if (event.target.closest("[data-step02]")) {
    goToScreen(4);
    return;
  }

  if (event.target.closest("[data-step03]")) {
    const step03Index = screens.findIndex((screen) => screen.group === "Step 03 Guidance");
    goToScreen(step03Index >= 0 ? step03Index : currentScreen + 1);
    return;
  }

  if (event.target.closest("[data-dismiss-reminder]")) {
    appState.reminderDismissed = true;
    renderScreen();
    return;
  }

  if (event.target.closest("[data-start-exercise]")) {
    const step32Index = screens.findIndex((screen) => screen.code === "3.2");
    goToScreen(step32Index >= 0 ? step32Index : currentScreen + 1);
    return;
  }

  if (event.target.closest("[data-log-meal]")) {
    appState.reminderDismissed = true;
    renderScreen();
    return;
  }

  if (event.target.closest("[data-dismiss-micro-plan]")) {
    appState.microPlanDismissed = true;
    renderScreen();
    return;
  }

  if (event.target.closest("[data-go-feedback-active]")) {
    const targetIndex = screens.findIndex((screen) => screen.code === "4.2");
    goToScreen(targetIndex >= 0 ? targetIndex : currentScreen + 1);
    return;
  }

  if (event.target.closest("[data-go-feedback-missed]")) {
    const targetIndex = screens.findIndex((screen) => screen.code === "4.1");
    goToScreen(targetIndex >= 0 ? targetIndex : currentScreen + 1);
    return;
  }

  if (event.target.closest("[data-complete-micro-action]")) {
    const targetCode = appState.completion === "interrupted" ? "3.4" : "4.2";
    const targetIndex = screens.findIndex((screen) => screen.code === targetCode);
    goToScreen(targetIndex >= 0 ? targetIndex : currentScreen + 1);
    return;
  }

  if (event.target.closest("[data-save-settings]")) {
    goToScreen(3);
    return;
  }

  if (event.target.closest("[data-save-companion]")) {
    renderScreen();
    return;
  }

  const companionChoice = event.target.closest("[data-companion-choice]");
  if (companionChoice) {
    saveCompanion(companionChoice.dataset.companionChoice);
    renderScreen();
    return;
  }

  const environmentChoice = event.target.closest("[data-environment-choice]");
  if (environmentChoice) {
    saveGuidanceContext({ environment: environmentChoice.dataset.environmentChoice });
    renderScreen();
    return;
  }

  const stateChoice = event.target.closest("[data-state-choice]");
  if (stateChoice) {
    saveGuidanceContext({ state: stateChoice.dataset.stateChoice });
    renderScreen();
    return;
  }

  const completionChoice = event.target.closest("[data-completion-choice]");
  if (completionChoice) {
    appState.completion = completionChoice.dataset.completionChoice;
    renderScreen();
    return;
  }

  const recoveryOption = event.target.closest("[data-recovery-option]");
  if (recoveryOption) {
    appState.recoveryOption = recoveryOption.dataset.recoveryOption;
    renderScreen();
    return;
  }

  const timeStepButton = event.target.closest("[data-time-step]");
  if (timeStepButton) {
    updateScheduleTime(timeStepButton.dataset.timeStep, Number(timeStepButton.dataset.delta));
    return;
  }

  const allocationButton = event.target.closest("[data-allocation-step]");
  if (allocationButton) {
    updateExerciseAllocation(allocationButton.dataset.allocationStep, Number(allocationButton.dataset.delta));
    return;
  }

  if (event.target.closest("[data-next]")) {
    goToScreen(currentScreen + 1);
    return;
  }

  if (event.target.closest("[data-prev]")) {
    goToScreen(currentScreen - 1);
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.matches("[data-reading-form]")) {
    event.preventDefault();
    handleSaveReading();
  }
});

document.addEventListener("change", (event) => {
  const scheduleInput = event.target.closest("[data-schedule-field]");
  if (scheduleInput) {
    updateScheduleField(scheduleInput.dataset.scheduleField, scheduleInput.value);
  }
});

document.addEventListener("input", (event) => {
  const scheduleInput = event.target.closest("[data-schedule-field]");
  if (scheduleInput && isCompleteTimeValue(scheduleInput.value)) {
    updateScheduleField(scheduleInput.dataset.scheduleField, scheduleInput.value);
  }
});

document.addEventListener("focusin", (event) => {
  const scheduleInput = event.target.closest("[data-schedule-field]");
  if (scheduleInput) {
    scheduleInput.select();
  }
});

$("#prevScreen").addEventListener("click", () => goToScreen(currentScreen - 1));
$("#nextScreen").addEventListener("click", () => goToScreen(currentScreen + 1));

document.addEventListener("keydown", (event) => {
  if (event.target.closest("[data-reading-form]") && event.key === "Enter") {
    event.preventDefault();
    handleSaveReading(1);
    return;
  }
  if (isTypingTarget(event.target)) return;
  if (event.key === "ArrowRight") goToScreen(currentScreen + 1);
  if (event.key === "ArrowLeft") goToScreen(currentScreen - 1);
});

renderScreen();
