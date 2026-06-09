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
const default行动指导 = {
  environment: "office",
  state: "sitting"
};
const companionProfiles = {
  futureSelf: {
    key: "futureSelf",
    title: "未来的自己",
    shortTitle: "未来自我",
    image: "./assets/future-self.png",
    iconName: "heart",
    copy: "过来人的经验、平和视角和长期陪伴。",
    lines: {
      readingTitle: "来自未来自己的留言",
      readingCopy: "这只是一次读数，不是全部故事。今天稳稳做出的小选择，会让明天更轻松一点。",
      reminderLead: "未来的你正在把路线调得更轻松。",
      reminderTitle: "一个小小的运动间隙，会让明天更容易开始。",
      reminderCopy: "我也经历过这样的日子。先从很小的一步开始，让节奏慢慢回来。",
      microTitle: "未来的你看见了这一点",
      microCopy: "就算只做了一部分，也算今天的进步。",
      adjustmentCopy: "今天的安排变了，所以我们把计划缩小，而不是放弃它。",
      completionTitle: "未来的你已经在受益",
      completionCopy: "这些小选择会慢慢累积。你正在让以后的自己更容易被照顾。",
      recoveryTitle: "你回来了，这很重要。",
      recoveryCopy: "暂停不会抹掉习惯。重新开始本身就是习惯的一部分。",
      weeklyQuote: "更健康的心脏，始于你愿意为自己保留的一个习惯。"
    }
  },
  clinician: {
    key: "clinician",
    title: "医生角度的建议",
    shortTitle: "专业指导",
    image: "./assets/clinician.png",
    iconName: "stethoscope",
    copy: "更专业的解释、检查提醒和下一步建议。",
    lines: {
      readingTitle: "专业式提醒",
      readingCopy: "单次读数只能说明一部分。坚持记录，才能看清变化。",
      reminderLead: "一个简单、基于证据的行动已准备好。",
      reminderTitle: "是时候进行一个短暂活动了。",
      reminderCopy: "轻量活动有助于支持循环，并降低今天的压力负荷。",
      microTitle: "专业提示",
      microCopy: "任何完成部分都会被记录。持续性和趋势比完美更重要。",
      adjustmentCopy: "原计划被打断了。没关系，先做一个更轻松的小任务。",
      completionTitle: "进展已记录",
      completionCopy: "这次行动已经记录。继续保持，看看接下来几天的变化。",
      recoveryTitle: "计划连续性已恢复",
      recoveryCopy: "你重新开始了，这会让本周更容易坚持下去。",
      weeklyQuote: "每天固定一点点，血压变化会更容易看懂。"
    }
  },
  friend: {
    key: "friend",
    title: "朋友型陪伴",
    shortTitle: "朋友陪伴",
    image: "./assets/friend.png",
    iconName: "users",
    copy: "温暖支持、情绪鼓励和轻柔提醒。",
    lines: {
      readingTitle: "你的朋友在陪着你",
      readingCopy: "你已经开始关注自己了，这本身就很重要。我们一起走下一小步。",
      reminderLead: "一个朋友式的小提醒，不给你压力。",
      reminderTitle: "来吧，我们稍微动一动。",
      reminderCopy: "只是一个很短的运动间隙。我陪你一起做轻松版本。",
      microTitle: "你出现了",
      microCopy: "无论全部还是部分完成，我都算作进展。你为自己做了一件好事。",
      adjustmentCopy: "生活偶尔会打断计划。没关系，我们把今晚的计划调小一点。",
      completionTitle: "我为你感到骄傲",
      completionCopy: "你今天守住了一个对自己的承诺，这值得被看见。",
      recoveryTitle: "你又回来了",
      recoveryCopy: "漏掉一步很正常。愿意回来，就是胜利。",
      weeklyQuote: "照顾自己不需要完美。"
    }
  }
};

const appState = {
  reading: loadReading(),
  schedule: loadSchedule(),
  companion: loadCompanion(),
  guidance: load行动指导(),
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
  const useSaved运动 = schedule?.version === defaultSchedule.version;

  return {
    ...defaultSchedule,
    bedtime: schedule?.bedtime || defaultSchedule.bedtime,
    wakeTime: schedule?.wakeTime || defaultSchedule.wakeTime,
    exercise: useSaved运动
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

function load行动指导() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GUIDANCE_STORAGE_KEY) || "null");
    return {
      environment: saved?.environment || default行动指导.environment,
      state: saved?.state || default行动指导.state
    };
  } catch {
    return { ...default行动指导 };
  }
}

function save行动指导Context(partial) {
  appState.guidance = {
    ...default行动指导,
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
  const period = hours24 >= 12 ? "下午" : "上午";
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
      label: "起床后",
      range: formatRange(schedule.wakeTime, minutesToTime(wake + 180)),
      iconName: "sunrise",
      tone: "pink"
    },
    midday: {
      label: "中午",
      range: formatRange("12:00", "14:00"),
      iconName: "sun",
      tone: "amber"
    },
    evening: {
      label: "睡前",
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
      label: "接近危急",
      chip: "red",
      tone: "red",
      iconName: "alert",
      image: "./assets/state-near-critical.png",
      short: "你的血压非常高。请立即联系或前往医疗机构。",
      title: "接近危急",
      explanation: "你的血压非常高。请立即联系或前往医疗机构。",
      actionTitle: "联系医疗支持",
      actionCopy: "你的血压非常高。请立即联系或前往医疗机构。"
    };
  }

  if (systolic >= 140 || diastolic >= 90) {
    return {
      key: "repeatedHigh",
      label: "连续偏高",
      chip: "pink",
      tone: "pink",
      iconName: "trend",
      image: "./assets/state-repeatedly-high.png",
      short: "你的血压最近一直偏高。请看看最近的饮食、运动和休息情况。",
      title: "你近期的读数偏高",
      explanation: "你的血压最近一直偏高。请看看最近的饮食、运动和休息情况。",
      actionTitle: "开始 3 天观察",
      actionCopy: "你的血压最近一直偏高。请看看最近的饮食、运动和休息情况。"
    };
  }

  if (systolic >= 130 || diastolic >= 85) {
    return {
      key: "singleHigh",
      label: "单次偏高",
      chip: "amber",
      tone: "amber",
      iconName: "alert",
      image: "./assets/state-single-high.png",
      short: "这次读数高于正常范围。请休息后再测一次。",
      title: "单次偏高并不罕见",
      explanation: "这次读数高于正常范围。请休息后再测一次。",
      actionTitle: "休息后复测",
      actionCopy: "这次读数高于正常范围。请休息后再测一次。"
    };
  }

  return {
    key: "normal",
    label: "正常",
    chip: "green",
    tone: "normal",
    iconName: "heart",
    image: "./assets/state-normal.png",
    short: "你的血压处于健康范围内。继续保持。",
    title: "你的读数正常",
    explanation: "你的血压处于健康范围内。继续保持。",
    actionTitle: "继续保持",
    actionCopy: "你的血压处于健康范围内。继续保持。"
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
      ${back ? `<button class="back-control" type="button" data-prev aria-label="上一页 screen">${icon("arrow-left")}</button>` : "<span></span>"}
      <div class="step-stack">
        ${progressDots(screen.progress, screen.total || 4)}
      </div>
      <div class="avatar-wrap"><span class="avatar"></span><span>小宁</span></div>
    </div>
  `;
}

function bottomTabs() {
  const tabs = [
    ["步骤 01", "引导设置", "home", "步骤 01 引导设置"],
    ["步骤 02", "读数卡片", "pulse", "步骤 02 读数卡片"],
    ["步骤 03", "行动指导", "shoe", "步骤 03 行动指导"],
    ["步骤 04", "反馈", "leaf", "步骤 04 反馈"]
  ];
  const activeGroup = screens[currentScreen]?.group;
  return `<nav class="bottom-tabs" aria-label="主要步骤">${tabs.map(([step, label, iconName, group]) => `
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
    ${appBar(screen, options.back !== false && screen.group !== "步骤 04 反馈")}
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
    labels: ["5月6日", "7", "8", "9", "10", "11", "12"]
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
    <svg class="trend-svg" viewBox="0 0 320 ${height}" role="img" aria-label="近七天血压趋势图">
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
  if (companion.key === "futureSelf") return "来自未来自己的留言";
  if (companion.key === "clinician") return "来自专业陪伴的提醒";
  return "来自朋友陪伴的留言";
}

function companionStateNote(companion, status) {
  const notes = {
    futureSelf: {
      normal: "今天的读数很稳。继续保持现在这些容易做到的小习惯就好。",
      singleHigh: "一次偏高不代表全部。先休息、再复测，让下一个小选择把今天带回平衡。",
      repeatedHigh: "这不是你的错。它只是提醒你：接下来几天要更规律地测量和行动。",
      nearCritical: "现在请先联系医生或医疗机构。寻求帮助，就是在保护自己。"
    },
    clinician: {
      normal: "当前读数在正常范围内。请继续按固定时间测量。",
      singleHigh: "单次升高可能发生。请安静休息，避免匆忙，并稍后复测，观察是否持续。",
      repeatedHigh: "这个范围需要连续观察。请固定时间测量，并记录最近的饮食、运动和睡眠。",
      nearCritical: "这个读数比较危险。请立即联系医生或医疗机构。"
    },
    friend: {
      normal: "做得很好。今天的读数看起来很稳定，你也值得看见这些照顾正在累积。",
      singleHigh: "没关系。先暂停一下，慢慢呼吸，稍后再测。我们一步一步来。",
      repeatedHigh: "我知道这可能让人担心，但你不是卡住了。我们保持一致，把下一步变得足够小、足够可做。",
      nearCritical: "这已经不是自我调节建议能处理的情况。请现在联系或前往医疗机构，我陪你一起把帮助找来。"
    }
  };

  return notes[companion.key]?.[status.key] || companion.lines.readingCopy;
}

function detailContentForStatus(status) {
  const sharedRecordItems = [
    ["收缩压 / 舒张压", "mmHg"],
    ["脉率", "bpm"],
    ["备注", "压力、睡眠、症状"]
  ];
  const content = {
    normal: {
      title: "你的读数正常",
      subtitle: "你的血压处于健康范围内。你正在好好照顾自己。",
      explanationTitle: "为什么这是正常的",
      explanation: "你的心脏以较稳定、较低的压力泵血，血管可以保持更开放和有弹性，血液流动更顺畅。",
      supportTitle: "你的习惯正在产生影响",
      support: "轻运动、均衡饮食、放松呼吸和睡好觉，都有助于血压更稳定。",
      actionTitle: "继续做什么",
      actions: [
        ["保持规律测量", "尽量在固定时间测量，方便看变化。", "pulse"],
        ["继续轻运动", "每天短时间活动有助于循环保持稳定。", "shoe"],
        ["保护睡眠", "睡好觉有助于身体恢复。", "moon"]
      ],
      recordTitle: "记录什么",
      recordItems: [
        ["血压", "今天"],
        ["运动和饮食", "每天"],
        ["睡眠情况", "每晚"]
      ]
    },
    singleHigh: {
      title: "单次偏高并不罕见",
      subtitle: "血压可能因为许多短暂因素而升高。",
      explanationTitle: "为什么可能偏高",
      explanation: "压力、睡眠不足、咖啡因、高盐饮食、刚活动完或测量过快，都可能导致血压短期升高。",
      supportTitle: "回顾近期习惯",
      support: "回看今天的睡眠、进餐时间、压力和活动情况。一个小调整可能帮助下次读数回落。",
      actionTitle: "现在可以做什么",
      actions: [
        ["喝水", "补充水分可以帮助你更平静地复测。", "water"],
        ["慢慢呼吸", "安静坐一会儿，让身体稳定后再测量。", "breath"],
        ["短暂轻运动", "如果身体感觉良好，轻柔活动可以帮助降低压力。", "shoe"],
        ["稍后复测", "休息后再测，不要立刻连续测量。", "clock"]
      ],
      recordTitle: "记录什么",
      recordItems: [
        ["收缩压 / 舒张压", "mmHg"],
        ["当时情况", "压力、咖啡因、饮食"],
        ["复测结果", "今天稍后"]
      ]
    },
    repeatedHigh: {
      title: "连续偏高",
      subtitle: "接下来观察 3 天，把每一步记录清楚。",
      explanationTitle: "为什么需要观察",
      explanation: "如果连续偏高，就比单次偏高更需要注意。连续测量可以帮助你判断是否需要看医生。",
      supportTitle: "计划：3 天观察",
      support: "每天固定时间测量。如果 3 天后仍然偏高，请把记录给医生看。",
      actionTitle: "何时测量",
      actions: [
        ["早晨", "起床后", "sunrise"],
        ["下午", "晚餐前", "sun"],
        ["晚间", "睡前", "moon"]
      ],
      recordTitle: "记录什么",
      recordItems: sharedRecordItems,
      planTitle: "你的 3 天计划",
      planItems: [
        ["第 1 天", "测量并记录"],
        ["第 2 天", "继续追踪"],
        ["第 3 天", "回顾并决定"]
      ],
      careNote: "3 天后，请把记录结果分享给医生或医疗专业人员。"
    },
    nearCritical: {
      title: "接近危急",
      subtitle: "请现在寻求医疗帮助。",
      explanationTitle: "为什么需要紧急处理",
      explanation: "这个读数已经很高，不能只靠运动或饮食来处理。尤其是身体不舒服时，请马上求助。",
      supportTitle: "医疗预警",
      support: "你的读数处于危险范围。请不要拖延，尽快联系医生或急救服务。",
      actionTitle: "现在该做什么",
      actions: [
        ["联系医生或急救服务", "如出现症状，请使用急诊/急救服务。", "phone"],
        ["以舒适姿势休息", "坐下、保持平静，避免继续用力活动。", "user"],
        ["不要自行加药", "仅按照医生建议服药。", "pill"]
      ],
      recordTitle: "如出现以下情况请呼叫急救",
      recordItems: [
        ["胸痛", "urgent"],
        ["呼吸急促", "urgent"],
        ["严重头痛", "urgent"],
        ["视力变化", "urgent"]
      ],
      careNote: "如果出现这些症状，请立即呼叫急救服务。"
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
    ${titleBlock("连接数据", "从智能手表同步血压，<br>或手动输入今天的读数。")}
    <section class="sync-section">
      <div class="section-header">
        <div>
          <p class="section-label">从手表同步</p>
          <p>当智能手表在附近并准备共享数据时，自动获取准确的血压读数。</p>
        </div>
      </div>
      <div class="visual blue connect-visual">
        <img class="connect-asset" src="./assets/connect-blood-pressure.png" alt="" />
      </div>
      <button class="watch-connect-button" type="button" data-watch-sync>
        从手表连接血压数据
        ${icon("watch")}
      </button>
    </section>
    <form class="reading-form" data-reading-form>
      <div class="form-heading">
        <div>
          <p class="section-label">输入今天的读数</p>
          <p>当手表不在身边，或你想录入其他血压计读数时，可以使用手动输入。</p>
        </div>
        <small>mmHg</small>
      </div>
      <div class="input-grid">
        <label class="input-card">
          <span>收缩压</span>
          <input id="systolicInput" inputmode="numeric" type="number" min="70" max="240" value="${reading.systolic}" />
        </label>
        <label class="input-card">
          <span>舒张压</span>
          <input id="diastolicInput" inputmode="numeric" type="number" min="40" max="150" value="${reading.diastolic}" />
        </label>
      </div>
    </form>
    <div class="privacy-row section-gap">
      <span class="round-icon pink">${icon("shield")}</span>
      <div><strong>你的数据保持私密</strong><p>数据加密且安全，未经同意不会被分享。</p></div>
      ${icon("arrow-right")}
    </div>
  `;
  return screenShell(screen, body, {
    bottomActions: `
      <div class="bottom-actions">
        <button class="bottom-action primary" type="button" data-save-setup>保存读数 ${icon("check")}</button>
        <button class="bottom-action secondary" type="button" data-save-view>保存并进入步骤 02 ${icon("pulse")}</button>
      </div>
    `
  });
}

function screenDirection(screen) {
  const body = `
    ${titleBlock("生活方式计划", "围绕运动和饮食，给你更容易执行的建议。")}
    <div class="program-intro">
      <span class="round-icon pink">${icon("heart")}</span>
      <div>
        <strong>核心设计</strong>
        <p>微行动 · 灵活计划 · 可见进展</p>
      </div>
    </div>
    <div class="intervention-grid">
      <article class="intervention-card movement">
        <img src="./assets/sport.png" alt="" />
        <div class="intervention-content">
          <h3>运动</h3>
          <ul>
            <li>按场景推荐小动作</li>
            <li>部分完成也记录</li>
            <li>陪伴提醒</li>
            <li>中断后可恢复</li>
          </ul>
        </div>
      </article>
      <article class="intervention-card diet">
        <img src="./assets/diet.png" alt="" />
        <div class="intervention-content">
          <h3>饮食</h3>
          <ul>
            <li>拍照记录饮食</li>
            <li>估算每日热量</li>
            <li>聚餐场景支持</li>
            <li>用运动及时调整</li>
          </ul>
        </div>
      </article>
    </div>
  `;
  return screenShell(screen, body, {
    bottomActions: `
      <div class="bottom-actions">
        <button class="bottom-action primary" type="button" data-got-it>我知道了 ${icon("check")}</button>
        <button class="bottom-action secondary" type="button" data-step02>保存并进入步骤 02 ${icon("pulse")}</button>
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
    ["morning", "早晨", windows.morning],
    ["midday", "中午", windows.midday],
    ["evening", "晚间", windows.evening]
  ];
  const body = `
    ${titleBlock('设定你的<span class="accent">日程</span>', "先设置起床和睡觉时间，下面的运动时间会自动变化。")}
    <div class="schedule-hero">
      <img src="./assets/light-exercise.png" alt="" />
    </div>
    <div class="panel schedule-panel">
      <p class="section-label">日常作息</p>
      <div class="time-grid">
        <div class="time-card adjustable-time">
          <span>起床时间</span>
          <div class="time-adjuster">
            <button type="button" data-time-step="wakeTime" data-delta="-15" aria-label="起床时间提前 15 分钟">-15</button>
            <input aria-label="起床时间" type="text" inputmode="numeric" maxlength="5" value="${schedule.wakeTime}" data-schedule-field="wakeTime" />
            <button type="button" data-time-step="wakeTime" data-delta="15" aria-label="起床时间推迟 15 分钟">+15</button>
          </div>
          <strong class="accent">${formatTime(schedule.wakeTime)}</strong>
        </div>
        <div class="time-card adjustable-time">
          <span>睡觉时间</span>
          <div class="time-adjuster">
            <button type="button" data-time-step="bedtime" data-delta="-15" aria-label="睡觉时间提前 15 分钟">-15</button>
            <input aria-label="睡觉时间" type="text" inputmode="numeric" maxlength="5" value="${schedule.bedtime}" data-schedule-field="bedtime" />
            <button type="button" data-time-step="bedtime" data-delta="15" aria-label="睡觉时间推迟 15 分钟">+15</button>
          </div>
          <strong>${formatTime(schedule.bedtime)}</strong>
        </div>
      </div>
    </div>
    <div class="panel schedule-panel">
      <p class="section-label">轻运动时间</p>
      <p class="remaining-line">今天还剩 ${remainingMinutes} 分钟</p>
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
        <button class="bottom-action primary" type="button" data-save-settings>保存设置 ${icon("check")}</button>
        <button class="bottom-action secondary" type="button" data-step02>保存并进入步骤 02 ${icon("pulse")}</button>
      </div>
    `
  });
}

function screenCompanion(screen) {
  const selected = getCompanionProfile();
  const cards = Object.values(companionProfiles);
  const body = `
    ${titleBlock("你好，小宁，<br>选择你的陪伴角色", "选择你希望陪在身边的支持风格。")}
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
    ctaLabel: "保存并进入步骤 02",
    ctaIcon: "pulse",
    ctaAction: "data-step02"
  });
}

function screenTrend(screen) {
  const reading = getReading();
  const status = classifyReading(reading);
  const series = getTrendSeries(reading);
  const avg收缩压 = average(series.systolic);
  const avg舒张压 = average(series.diastolic);
  const companion = getCompanionProfile();
  const body = `
    ${titleBlock("你的当前状态", "结合最近 7 天趋势，理解今天的读数。")}
    <article class="reading-state-card ${status.tone}">
      <p class="state-card-label">当前状态</p>
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
      <div class="chart-head"><strong>7 天平均值</strong><span class="status-chip ${status.chip}">${avg收缩压} / <span class="accent">${avg舒张压}</span> mmHg</span></div>
      <div class="legend"><span>收缩压</span><span>舒张压</span></div>
      ${trendChart(true, reading)}
      <div class="trend-current">
        <span>今天的读数</span>
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
  return screenShell(screen, body, { ctaLabel: "继续", ctaIcon: "arrow-right", back: false });
}

function screenState(screen) {
  const reading = getReading();
  const status = classifyReading(reading);
  const states = [
    ["normal", "正常", "118 / 76", "处于健康范围内。继续保持稳定节奏。", "继续保持", "green"],
    ["amber", "单次偏高", "135 / 88", "单次高于平常。请休息并稍后复测。", "尽快复测", "amber"],
    ["pink", "连续偏高", "148 / 94", "连续多次读数偏高。建议开始观察。", "采取行动", "pink"],
    ["red", "接近危急", "168 / 106", "读数非常高。请及时联系医疗专业人员。", "联系医疗支持", "red"]
  ];
  const body = `
    ${titleBlock("你的当前状态", "血压会波动，这张卡片只突出当前最重要的信息。")}
    <article class="current-state-card ${status.tone}">
      <div>
        <span class="status-chip ${status.chip}">${icon(status.iconName)} ${status.label}</span>
        <div class="bp-number compact"><span>${reading.systolic}</span><span class="slash">/</span><span class="dia">${reading.diastolic}</span><small>mmHg</small></div>
        <p>${status.short}</p>
      </div>
      <div class="state-figure"><span class="organ-heart"></span></div>
    </article>
    <p class="section-label section-gap">状态等级</p>
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
        <span class="status-chip ${status.chip}">${icon(status.iconName)} 今天的读数</span>
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
        <h3>${status.key === "nearCritical" ? "医疗提醒" : "下一步判断"}</h3>
        <p>${detail.careNote}</p>
      </div>
    ` : ""}
    <div class="panel explain-block">
      <h3>${companionNoteTitle(companion)}</h3>
      <p>${companionStateNote(companion, status)}</p>
    </div>
  `;
  return screenShell(screen, body, { ctaLabel: "保存并进入步骤 03", ctaIcon: "shoe", ctaAction: "data-step03" });
}

function screenWarnings(screen) {
  const reading = getReading();
  const status = classifyReading(reading);
  const observationActive = status.key === "repeatedHigh";
  const careActive = status.key === "nearCritical";
  const body = `
    ${titleBlock("观察与预警", "当读数持续偏高时，下一步需要清晰明确。")}
    <div class="panel warning-block ${observationActive ? "is-active-plan" : ""}">
      <span class="status-chip ${observationActive ? "pink" : "green"}">${icon(observationActive ? "trend" : "check")} ${observationActive ? "连续偏高" : "当前不需要观察流程"}</span>
      <h3 style="margin-top:10px">计划：3 天观察</h3>
      <p>${observationActive ? "在固定时间测量，并记录当时情况、症状和备注，方便之后和医生沟通。" : "当前读数暂不需要 3 天观察。请继续规律测量，如果升高再复测。"}</p>
      <div class="observation-grid section-gap">
        <div class="observe-time">${icon("clock")}<strong>早晨</strong><span>起床后</span></div>
        <div class="observe-time">${icon("pulse")}<strong>下午</strong><span>晚餐前</span></div>
        <div class="observe-time">${icon("moon")}<strong>晚间</strong><span>睡前</span></div>
      </div>
      <div class="record-list">
        <div><span>收缩压 / 舒张压</span><strong>mmHg</strong></div>
        <div><span>脉率</span><strong>bpm</strong></div>
        <div><span>备注</span><strong>压力、睡眠、症状</strong></div>
      </div>
      <div class="three-day">
        <div><span class="day-dot">1</span><strong>第 1 天</strong><span>测量并记录</span></div>
        <div><span class="day-dot">2</span><strong>第 2 天</strong><span>继续追踪</span></div>
        <div><span class="day-dot">3</span><strong>第 3 天</strong><span>回顾并决定</span></div>
      </div>
    </div>
    <div class="panel warning-block section-gap ${careActive ? "is-active-plan" : ""}" style="background:#fff4f7;border-color:#ffd1dc">
      <span class="status-chip ${careActive ? "red" : "amber"}">${icon(careActive ? "alert" : "heart")} ${careActive ? status.label : "医疗预警未激活"}</span>
      <h3 style="margin-top:10px;color:var(--red)">请及时寻求医疗指导</h3>
      <p>${careActive ? "当前读数已经很高。若同时出现不适症状，请使用急救服务。" : "读数非常高时，这里会显示就医提醒。"}</p>
      <div class="action-row section-gap">
        <div class="action-item"><span class="round-icon red">${icon("phone")}</span><div><strong>联系医生或当地急救服务</strong><span>如出现症状，请使用急诊/急救服务。</span></div>${icon("arrow-right")}</div>
        <div class="action-item"><span class="round-icon pink">${icon("user")}</span><div><strong>以舒适姿势休息</strong><span>等待指导时尽量保持平静。</span></div>${icon("arrow-right")}</div>
      </div>
      <p class="section-label section-gap" style="color:var(--red)">如出现以下情况请呼叫急救</p>
      <div class="symptom-grid">
        <span class="symptom"><span class="round-icon red">${icon("heart")}</span>胸痛</span>
        <span class="symptom"><span class="round-icon red">${icon("breath")}</span>呼吸急促</span>
        <span class="symptom"><span class="round-icon red">${icon("alert")}</span>严重头痛</span>
        <span class="symptom"><span class="round-icon red">${icon("pulse")}</span>视力变化</span>
      </div>
    </div>
  `;
  return screenShell(screen, body, {
    ctaLabel: observationActive ? "开始观察" : careActive ? "联系医疗支持" : "继续观察",
    ctaIcon: observationActive ? "calendar" : careActive ? "phone" : "check",
    ctaTone: observationActive || careActive ? "pink" : ""
  });
}

function screenReminder(screen) {
  const companion = getCompanionProfile();
  const schedule = getSchedule();
  const morningWindow = exerciseWindows(schedule).morning;
  const morningMinutes = schedule.exercise.morning || 10;
  const exerciseCta = `开始 ${morningMinutes} 分钟运动`;
  const body = `
    ${titleBlock("行动指导", "为运动和饮食提供小而可调整的行动。")}
    <div class="guidance-board">
      <article class="guidance-tile exercise">
        <div class="guidance-tile-art exercise">
          <img src="./assets/guidance-exercise.png" alt="" />
        </div>
        <div class="guidance-tile-copy">
          <span class="section-label">运动</span>
          <h3>早晨运动计划</h3>
          <p>${morningWindow.range}</p>
          <span>${morningMinutes} 分钟计划</span>
        </div>
        <button class="tile-cta" type="button" data-start-exercise>${exerciseCta}</button>
      </article>
      <article class="guidance-tile diet">
        <div class="guidance-tile-art diet">
          <img src="./assets/guidance-diet.png" alt="" />
        </div>
        <div class="guidance-tile-copy">
          <span class="section-label">饮食</span>
          <h3>推荐用餐方案</h3>
          <p>用蔬菜、优质蛋白、全谷物和低钠选择组成均衡一餐。</p>
          <span>饭后拍照记录</span>
        </div>
        <button class="tile-cta" type="button" data-log-meal>记录我的餐食</button>
      </article>
    </div>
  `;
  const overlay = appState.reminderDismissed ? "" : `
    <div class="modal-backdrop guidance-modal-backdrop"></div>
    <div class="reminder-card guidance-reminder-card">
      <button class="close-dot" type="button" data-dismiss-reminder aria-label="关闭运动提醒">${icon("x")}</button>
      <span class="round-icon pink">${icon("shoe")}</span>
      <h2>该进行早晨运动了。</h2>
      <p>${companion.lines.reminderCopy}</p>
      <div class="exercise-reminder-summary">
        <div>
          <span>计划时间窗</span>
          <strong>${morningWindow.range}</strong>
        </div>
        <div>
          <span>计划时长</span>
          <strong>${morningMinutes} min</strong>
        </div>
      </div>
      <div class="reminder-image exercise section-gap">
        <img src="./assets/guidance-exercise.png" alt="" />
      </div>
      <div class="info-row section-gap">
        <span class="round-icon pink">${icon("heart")}</span>
        <div><strong>支持更稳定的血压</strong><p>轻运动有助于循环并降低压力。</p></div>
      </div>
      <button class="modal-cta" type="button" data-start-exercise>${exerciseCta}</button>
    </div>
  `;
  return `${screenShell(screen, body, { back: true })}${overlay}`;
}

function screenContext(screen) {
  const environments = [
    { key: "office", label: "办公室", image: "./assets/context-office.png" },
    { key: "home", label: "居家", image: "./assets/context-home.png" },
    { key: "outdoor", label: "户外", image: "./assets/context-outdoor.png" },
    { key: "publicSpace", label: "公共空间", image: "./assets/context-public-space.png" }
  ];
  const states = [
    { key: "sitting", label: "久坐中", image: "./assets/state-sitting.png" },
    { key: "meals", label: "饭后", image: "./assets/state-meals.png" },
    { key: "overtime", label: "加班后", image: "./assets/state-overtime-work.png" }
  ];
  const selectedEnvironment = appState.guidance.environment || default行动指导.environment;
  const selectedState = appState.guidance.state || default行动指导.state;
  const body = `
    ${titleBlock("选择你当前的环境", "我们会根据你在哪里，推荐更容易完成的动作。")}
    <div class="environment-grid">
      ${environments.map(({ key, label, image }) => `
        <button class="environment-card ${selectedEnvironment === key ? "is-selected" : ""}" type="button" data-environment-choice="${key}" aria-pressed="${selectedEnvironment === key}">
          <div class="environment-art"><img src="${image}" alt="" /></div>
          <strong>${label}</strong>
        </button>
      `).join("")}
    </div>
    <p class="section-label context-state-label">选择你当前的状态</p>
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
  return screenShell(screen, body, { ctaLabel: "确认", ctaIcon: "arrow-right" });
}

function screenMicroActions(screen) {
  const schedule = getSchedule();
  const plannedMinutes = schedule.exercise.morning || 10;
  const environmentLabels = {
    office: "办公室",
    home: "居家",
    outdoor: "户外",
    publicSpace: "公共空间"
  };
  const stateLabels = {
    sitting: "久坐中",
    meals: "饭后",
    overtime: "加班后"
  };
  const selectedEnvironment = environmentLabels[appState.guidance.environment] || environmentLabels.office;
  const selectedState = stateLabels[appState.guidance.state] || stateLabels.sitting;
  const plans = {
    office: {
      place: "办公室",
      title: "靠墙静站",
      time: "5 分钟 / 组",
      copy: "背靠墙面，收紧核心，保持稳定并缓慢均匀呼吸。",
      image: "./assets/micro-office.png"
    },
    home: {
      place: "居家",
      title: "坐姿抬腿",
      time: "5 分钟 / 组",
      copy: "坐直身体，左右腿轮流抬起，轻轻活动腿部。",
      image: "./assets/micro-home.png"
    },
    outdoor: {
      place: "户外",
      title: "快步走",
      time: "5 分钟 / 组",
      copy: "以比平时稍快的速度行走，保持肩膀放松、呼吸平稳。",
      image: "./assets/micro-outdoor.png"
    },
    publicSpace: {
      place: "公共空间",
      title: "提踵",
      time: "5 分钟 / 组",
      copy: "站直后慢慢抬起脚跟，再有控制地下落，以促进循环。",
      image: "./assets/micro-public-space.png"
    }
  };
  const plan = plans[appState.guidance.environment] || plans.office;
  const completionOptions = [
    {
      key: "all",
      title: "全部完成",
      copy: "太棒了，你完成了完整的微行动。",
      suffix: `<span class="status-chip green">${icon("check")}</span>`
    },
    {
      key: "50",
      title: "部分完成",
      copy: "你完成了至少 50%，进展已保存。",
      suffix: `<span class="percent-ring" style="--percent:50%">50%</span>`
    },
    {
      key: "interrupted",
      title: "计划中断",
      copy: "完成不足 50%，我们来调整计划。",
      suffix: `<span class="status-chip amber">${icon("alert")}</span>`
    }
  ];
  const body = `
    ${titleBlock("你的微行动", "小行动可以帮助血压保持更稳定。")}
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
          <span>${plannedMinutes} 分钟计划</span>
        </div>
      </div>
    </article>
    <div class="panel">
      <p class="section-label">完成得怎么样？</p>
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
      <button class="close-dot" type="button" data-dismiss-micro-plan aria-label="关闭运动计划">${icon("x")}</button>
      <span class="round-icon pink">${icon("shoe")}</span>
      <h2>运动计划</h2>
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
          <span>${plannedMinutes} 分钟计划</span>
        </div>
      </article>
      <button class="modal-cta" type="button" data-dismiss-micro-plan>开始运动</button>
    </div>
  `;
  return `${screenShell(screen, body, { ctaLabel: "继续", ctaIcon: "arrow-right", ctaAction: "data-complete-micro-action" })}${overlay}`;
}

function screenAdjustment(screen) {
  const companion = getCompanionProfile();
  const schedule = getSchedule();
  const bedtime = formatTime(schedule.bedtime);
  const recoveryOptions = [
    {
      key: "beforeSleep",
      title: "今晚睡前",
      time: bedtime,
      copy: "3 分钟轻柔拉伸"
    },
    {
      key: "tomorrow早晨",
      title: "明天早晨",
      time: formatTime(schedule.wakeTime),
      copy: "5 分钟轻运动恢复"
    }
  ];
  const body = `
    <div class="adjustment-card panel">
      <div class="adjustment-heading">
        <span class="round-icon">${icon("check")}</span>
        <div>
          <h1>已生成新计划</h1>
          <p>这是一个更轻松的计划，帮你继续做下去。</p>
        </div>
      </div>
      <div class="adjustment-hero">
        <img src="./assets/recovery-light-exercise.png" alt="" />
      </div>
      <section class="minimum-plan">
        <p class="section-label">你的最低限度计划</p>
        <p>小步骤，也有真实影响。</p>
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
      <div><strong>重在持续，而非完美</strong><p>${companion.lines.adjustmentCopy}</p></div>
    </div>
  `;
  return screenShell(screen, body, {
    bottomActions: `
      <div class="bottom-actions">
        <button class="bottom-action primary" type="button" data-go-feedback-active>我回到正轨了 ${icon("check")}</button>
        <button class="bottom-action secondary" type="button" data-go-feedback-missed>稍后再说 ${icon("arrow-right")}</button>
      </div>
    `
  });
}

function screenCompletion(screen) {
  const body = `
    <div class="feedback-home missed">
      <div class="feedback-greeting">
        <h1>你好， <span>小宁</span></h1>
      </div>
      <div class="feedback-status-card missed">
        <span class="round-icon pink">${icon("snow")}</span>
        <div><strong>计划已错过</strong><p>今天没有按计划完成。<br>我们一起重新开始。</p></div>
      </div>
      <div class="feedback-world">
        <img src="./assets/feedback-iced-heart.png" alt="" />
      </div>
      <div class="feedback-task-card">
        <div class="task-card-header"><strong>今天</strong><span><b>0 / 3</b> 已完成</span></div>
        <div class="feedback-task-list">
          <div><span class="round-icon pink">${icon("heart")}</span><strong>晨间运动<small>上午 8:00</small></strong><em>已错过</em></div>
          <div><span class="round-icon">${icon("pulse")}</span><strong>午间运动<small>中午 12:00</small></strong><em>已错过</em></div>
          <div><span class="round-icon purple">${icon("shoe")}</span><strong>晚间运动<small>下午 6:00</small></strong><em>已错过</em></div>
        </div>
      </div>
      <div class="feedback-nudge">
        <span class="round-icon pink">${icon("heart")}</span>
        <div><strong>小步骤也很重要</strong><p>先完成下一个任务，把进度找回来。</p></div>
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
        <h1>你好， <span>小宁</span></h1>
      </div>
      <div class="feedback-status-card active">
        <span class="round-icon green">${icon("check")}</span>
        <div><strong>太棒了！</strong><p>你完成了任务。<br>进展已经回到正轨。</p></div>
      </div>
      <div class="feedback-world">
        <img src="./assets/feedback-lived-heart.png" alt="" />
      </div>
      <div class="feedback-task-card">
        <div class="task-card-header"><strong>今天</strong><span><b>2 / 3</b> 已完成</span></div>
        <div class="feedback-task-list">
          <div><span class="round-icon green">${icon("heart")}</span><strong>晨间运动<small>上午 8:00</small></strong><em class="done">${icon("check")} 已完成</em></div>
          <div><span class="round-icon green">${icon("check")}</span><strong>午间运动<small>中午 12:00</small></strong><em class="done">${icon("check")} 已完成</em></div>
          <div><span class="round-icon">${icon("shoe")}</span><strong>晚间运动<small>下午 6:00</small></strong><em class="upcoming">即将开始</em></div>
        </div>
      </div>
      <div class="feedback-nudge active">
        <span class="round-icon">${icon("trophy")}</span>
        <div><strong>你回到正轨了！</strong><p>今天的持续，会带来更好的明天。</p></div>
        ${icon("arrow-right")}
      </div>
    </div>
  `;
  return screenShell(screen, body, { stepTabs: true });
}

function screenRecovery(screen) {
  const companion = getCompanionProfile();
  const body = `
    ${titleBlock("恢复反馈", "当计划暂停时，世界会变化；当你回来时，它会重新活跃。")}
    <div class="panel" style="background:#f3f6fb">
      <span class="status-chip red">${icon("snow")} 计划已错过</span>
      <div class="frozen-visual section-gap"><span class="ice-block"></span><span class="organ-heart"></span></div>
      <div class="task-list section-gap">
        <div class="plan-row"><span class="round-icon pink">${icon("heart")}</span><div><strong>晨间运动</strong><span>上午 8:00</span></div><time>已错过</time></div>
        <div class="plan-row"><span class="round-icon">${icon("pulse")}</span><div><strong>午间运动</strong><span>中午 12:00</span></div><time>已错过</time></div>
      </div>
    </div>
    <div class="panel" style="background:#f2fff7">
      <span class="status-chip green">${icon("check")} 做得很好</span>
      <div class="active-visual section-gap"><span class="organ-heart"></span></div>
      <div class="task-list section-gap">
        <div class="plan-row"><span class="round-icon green">${icon("check")}</span><div><strong>晨间运动</strong><span>上午 8:00</span></div><time>已完成</time></div>
        <div class="plan-row"><span class="round-icon">${icon("shoe")}</span><div><strong>晚间运动</strong><span>下午 6:00</span></div><time>即将开始</time></div>
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
  const avg收缩压 = average(series.systolic);
  const avg舒张压 = average(series.diastolic);
  const companion = getCompanionProfile();
  const body = `
    ${titleBlock("你的周总结", "5月6日 - 5月12日")}
    <div class="chart-card">
      <div class="chart-head"><strong>血压概览</strong><span>本周与上周对比</span></div>
      <div class="metric-row">
        <div><strong>${avg收缩压}<span class="pink">/${avg舒张压}</span></strong><span>7 天平均值</span></div>
        <div><strong style="color:var(--pink)">125/82</strong><span>上周平均值</span></div>
      </div>
      ${trendChart(true, reading)}
    </div>
    <div class="panel">
      <p class="section-label">本周一览</p>
      <div class="summary-grid">
        <div class="summary-tile">${icon("heart")}<strong>7/7</strong><span>记录血压天数</span></div>
        <div class="summary-tile">${icon("shoe")}<strong>6/7</strong><span>运动天数</span></div>
        <div class="summary-tile">${icon("moon")}<strong>7/7</strong><span>睡眠良好天数</span></div>
        <div class="summary-tile">${icon("bowl")}<strong>6/7</strong><span>健康饮食天数</span></div>
        <div class="summary-tile">${icon("breath")}<strong>5/7</strong><span>压力管理天数</span></div>
        <div class="summary-tile">${icon("water")}<strong>7/7</strong><span>补水天数</span></div>
      </div>
    </div>
    <div class="panel">
      <p class="section-label">动态调整</p>
      <div class="record-list">
        <div><span>按医嘱用药</span><strong>7/7</strong></div>
        <div><span>生活方式调整</span><strong>5 次</strong></div>
        <div><span>计划更新</span><strong>2 次</strong></div>
      </div>
    </div>
    <div class="quote-card">${companion.lines.weeklyQuote}</div>
  `;
  return screenShell(screen, body, { ctaLabel: "继续你的旅程", ctaIcon: "share" });
}

const screens = [
  { code: "1.1", step: "步骤 01 / 1.1", title: "连接数据", group: "步骤 01 引导设置", progress: 1, total: 4, render: screenConnect },
  { code: "1.2", step: "步骤 01 / 1.2", title: "项目介绍", group: "步骤 01 引导设置", progress: 2, total: 4, render: screenDirection },
  { code: "1.3", step: "步骤 01 / 1.3", title: "时间设置", group: "步骤 01 引导设置", progress: 3, total: 4, render: screenSchedule },
  { code: "1.4", step: "步骤 01 / 1.4", title: "选择陪伴角色", group: "步骤 01 引导设置", progress: 4, total: 4, render: screenCompanion },
  { code: "2.1", step: "步骤 02 / 2.1", title: "当前状态", group: "步骤 02 读数卡片", progress: 1, total: 2, render: screenTrend },
  { code: "2.2", step: "步骤 02 / 2.2", title: "原因与提醒", group: "步骤 02 读数卡片", progress: 2, total: 2, render: screenExplanation },
  { code: "3.1", step: "步骤 03 / 3.1", title: "提醒弹窗", group: "步骤 03 行动指导", progress: 1, total: 4, render: screenReminder },
  { code: "3.2", step: "步骤 03 / 3.2", title: "场景选择", group: "步骤 03 行动指导", progress: 2, total: 4, render: screenContext },
  { code: "3.3", step: "步骤 03 / 3.3", title: "微行动", group: "步骤 03 行动指导", progress: 3, total: 4, render: screenMicroActions },
  { code: "3.4", step: "步骤 03 / 3.4", title: "动态调整", group: "步骤 03 行动指导", progress: 4, total: 4, render: screenAdjustment },
  { code: "4.1", step: "步骤 04 / 4.1", title: "计划错过", group: "步骤 04 反馈", progress: 1, total: 2, render: screenCompletion },
  { code: "4.2", step: "步骤 04 / 4.2", title: "回到正轨", group: "步骤 04 反馈", progress: 2, total: 2, render: screenGarden }
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

function update运动Allocation(key, delta) {
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
    const step03Index = screens.findIndex((screen) => screen.group === "步骤 03 行动指导");
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
    save行动指导Context({ environment: environmentChoice.dataset.environmentChoice });
    renderScreen();
    return;
  }

  const stateChoice = event.target.closest("[data-state-choice]");
  if (stateChoice) {
    save行动指导Context({ state: stateChoice.dataset.stateChoice });
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
    update运动Allocation(allocationButton.dataset.allocationStep, Number(allocationButton.dataset.delta));
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
