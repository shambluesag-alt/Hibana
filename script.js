const PROFILE_STORAGE_KEY = "hibana.chat.profile.v1";
const ATTEMPT_STORAGE_KEY = "hibana.chat.attempts.v1";
const OLD_KEYS = [
  "hibana.profile.v1",
  "hibana.entries.v1",
  "hibana.attempts.v1",
  "afterglow.profile.v1",
  "afterglow.entries.v1",
  "afterglow.attempts.v1",
];

const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const quickActions = document.getElementById("quick-actions");
const restartAppButton = document.getElementById("restart-app");
const profileCard = document.getElementById("profile-card");
const activityStage = document.getElementById("activity-stage");

const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Other"];
const suggestedActivities = [
  "Drawing",
  "Music",
  "Reading comics",
  "Basketball",
  "Baking",
  "Gaming",
  "Dancing",
  "Writing",
  "Photography",
  "Gardening",
  "Cooking",
  "Walking",
  "Singing",
  "Painting",
  "Crafts",
  "Cycling",
];

const helplinesByCountry = {
  India: {
    note: "If there is immediate danger in India, call 112.",
    lines: ["Tele-MANAS: call 14416", "Vandrevala Foundation: call or WhatsApp 9999666555"],
  },
  "United States": {
    note: "If there is immediate danger in the United States, call 911.",
    lines: ["988 Suicide & Crisis Lifeline: call or text 988", "988 chat: 988lifeline.org"],
  },
  "United Kingdom": {
    note: "If you cannot keep yourself or someone else safe in the UK, call 999 or go to A&E.",
    lines: ["Samaritans: call 116 123", "NHS 111: call 111 and choose mental health", "Childline: call 0800 1111"],
  },
  Canada: {
    note: "If there is immediate danger in Canada, call 911.",
    lines: ["9-8-8 Suicide Crisis Helpline: call or text 9-8-8", "Kids Help Phone: call 1-800-668-6868"],
  },
  Australia: {
    note: "If life is in danger in Australia, call 000.",
    lines: ["Lifeline: call 13 11 14", "Lifeline text: text 0477 13 11 14", "Kids Helpline: call 1800 55 1800"],
  },
  Other: {
    note: "If there is immediate danger, call your local emergency number.",
    lines: ["Find a Helpline: findahelpline.com", "Use your local emergency number if you are in immediate danger"],
  },
};

const stepLibraries = [
  {
    match: ["draw", "drawing", "paint", "sketch", "art"],
    steps: ["Hold a pencil for ten seconds.", "Draw one line.", "Draw one shape.", "Add one tiny detail.", "Doodle for two minutes."],
    easierSteps: ["Look at a pencil or blank page for five seconds.", "Make one dot.", "Trace one tiny shape in the air.", "Choose one color.", "Watch your hand move for ten seconds."],
    alternatives: ["coloring", "tracing", "doodling", "looking at art"],
  },
  {
    match: ["music", "guitar", "piano", "sing", "song", "drum"],
    steps: ["Open one song.", "Listen to ten seconds.", "Tap one beat.", "Hum or play one note.", "Stay with it for two minutes."],
    easierSteps: ["Think of one song title.", "Listen to three seconds.", "Tap one finger once.", "Imagine one note.", "Look at the song screen for ten seconds."],
    alternatives: ["making a playlist", "humming", "reading lyrics", "watching a performance"],
  },
  {
    match: ["read", "book", "comic", "manga", "novel"],
    steps: ["Put the book or comic near you.", "Open any page.", "Read one sentence.", "Read one paragraph or panel.", "Stop after two minutes."],
    easierSteps: ["Look at the cover or title.", "Touch the book or open the app.", "Read one word.", "Look at one panel or paragraph.", "Close it after ten seconds."],
    alternatives: ["audiobooks", "short comics", "poems", "one quote"],
  },
  {
    match: ["dance", "dancing", "choreography"],
    steps: [
      "Stand up or sit tall and notice the beat of your breathing.",
      "Move one hand, shoulder, or foot once.",
      "Repeat one tiny movement three times.",
      "Play ten seconds of a song and sway however you can.",
      "Dance for one minute with no mirror and no performance goal.",
    ],
    easierSteps: [
      "Stay seated and tap one finger once.",
      "Move only one shoulder or one foot.",
      "Nod your head to one silent beat.",
      "Listen to five seconds of a song without moving.",
      "Sway once, then stop.",
    ],
    alternatives: ["watching a dance clip", "stretching to music", "learning one move", "swaying while seated"],
  },
  {
    match: ["sport", "basketball", "football", "soccer", "cricket", "run", "gym"],
    steps: ["Touch the shoes or equipment.", "Do one stretch.", "Repeat one tiny movement three times.", "Move for one minute.", "Try a two-minute version."],
    easierSteps: ["Look at the shoes or imagine the place.", "Move one joint once.", "Do one tiny stretch.", "Stand up for ten seconds.", "Watch one short highlight."],
    alternatives: ["watching a highlight", "stretching", "walking", "one skill practice"],
  },
  {
    match: ["cook", "bake", "food", "recipe"],
    steps: ["Look at one ingredient.", "Put one item on the counter.", "Read one recipe step.", "Prepare one tiny part.", "Make the smallest snack or drink."],
    easierSteps: ["Think of one food you used to like.", "Look toward the kitchen.", "Touch one cup, spoon, or packet.", "Read only the recipe title.", "Take one sip of water."],
    alternatives: ["making tea", "choosing a recipe", "smelling spices", "assembling a snack"],
  },
  {
    match: ["game", "gaming", "minecraft", "roblox", "chess"],
    steps: ["Open the game or place it nearby.", "Look at the start screen.", "Do one harmless action.", "Play for two minutes with no goal.", "Stop before it becomes pressure."],
    easierSteps: ["Think of the game name.", "Look at the icon.", "Open it, then stop.", "Watch the loading screen for ten seconds.", "Choose a low-pressure mode."],
    alternatives: ["watching a short clip", "customizing a character", "low-stakes mode", "reading game notes"],
  },
];

const defaultSteps = [
  "Name the smallest version of this activity.",
  "Set a timer for ten seconds and only prepare to begin.",
  "Do one tiny motion, sound, word, or setup step related to it.",
  "Try it for one minute.",
  "Stop and notice whether it felt impossible, neutral, or slightly okay.",
];

const defaultEasierSteps = [
  "Think about this activity for five seconds, then stop.",
  "Name one tiny part of it.",
  "Only prepare your space for ten seconds.",
  "Try the smallest possible version once.",
  "Pause and notice if it feels even 1% less impossible.",
];

let profile = loadProfile();
let attempts = loadAttempts();
let conversationStep = profile ? "ready" : "name";
let draftProfile = {};
let currentActivityIndex = 0;
let isAddingCustomActivity = false;

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveProfile() {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function loadAttempts() {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPT_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAttempts() {
  localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempts));
}

function cleanText(value) {
  return value.toString().trim().replace(/\s+/g, " ");
}

function addMessage(text, sender = "bot") {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.textContent = text;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setQuickActions(actions = []) {
  quickActions.innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action;
    button.addEventListener("click", () => {
      chatInput.value = action;
      chatForm.requestSubmit();
    });
    quickActions.appendChild(button);
  });
}

function addDraftActivity(activity) {
  const cleanActivity = cleanText(activity);
  if (!cleanActivity) return false;
  if (!draftProfile.activities) draftProfile.activities = [];
  const alreadyExists = draftProfile.activities.some((item) => item.toLowerCase() === cleanActivity.toLowerCase());
  if (alreadyExists) return false;
  draftProfile.activities.push(cleanActivity);
  return true;
}

function renderActivityPicker() {
  const selected = draftProfile.activities || [];
  const remainingSuggestions = suggestedActivities.filter((activity) => {
    return !selected.some((item) => item.toLowerCase() === activity.toLowerCase());
  });
  const actions = [...remainingSuggestions.slice(0, 10), "Add custom activity"];

  if (selected.length >= 1) {
    actions.unshift("Done");
  }

  setQuickActions(actions);
}

function describeSelectedActivities() {
  const selected = draftProfile.activities || [];
  if (!selected.length) return "None selected yet.";
  return `Selected ${selected.length}: ${selected.join(", ")}.`;
}

function updateProfileCard() {
  if (!profile) {
    profileCard.innerHTML = "<span>Getting started</span><strong>Name and country first</strong>";
    return;
  }

  profileCard.innerHTML = `
    <span>${profile.country}</span>
    <strong>${profile.name}</strong>
    <p>${profile.activities.length} past activities saved</p>
  `;
}

function findLibrary(activityName) {
  const normalized = activityName.toLowerCase();
  return stepLibraries.find((library) => library.match.some((keyword) => normalized.includes(keyword)));
}

function getActivitySteps(activityName) {
  const library = findLibrary(activityName);
  return library ? library.steps : defaultSteps;
}

function getEasierSteps(activityName) {
  const library = findLibrary(activityName);
  return library && library.easierSteps ? library.easierSteps : defaultEasierSteps;
}

function getAlternatives(activityName) {
  const library = findLibrary(activityName);
  return library ? library.alternatives : ["a smaller version", "watching someone do it", "setting up the space", "one-minute practice"];
}

function getAttemptsForActivity(activityName) {
  return attempts.filter((attempt) => attempt.activity === activityName);
}

function getCurrentStep(activityName) {
  const steps = getActivitySteps(activityName);
  const easierSteps = getEasierSteps(activityName);
  const activityAttempts = getAttemptsForActivity(activityName);
  const completed = activityAttempts.filter((attempt) => attempt.status === "completed").length;
  const recentMisses = activityAttempts.slice(-3).filter((attempt) => attempt.status !== "completed").length;
  const lastAttempt = activityAttempts.at(-1);
  let index = recentMisses >= 3 ? 0 : Math.min(completed, steps.length - 1);
  let text = steps[index];
  let isEasier = false;

  if (lastAttempt && lastAttempt.status === "easier") {
    text = easierSteps[Math.min(index, easierSteps.length - 1)];
    isEasier = true;
  }

  return { text, index, total: steps.length, recentMisses, isEasier };
}

function getActivityKind(activityName) {
  const normalized = activityName.toLowerCase();
  if (["dance", "dancing", "choreography"].some((word) => normalized.includes(word))) return "dance";
  if (["draw", "drawing", "paint", "sketch", "art"].some((word) => normalized.includes(word))) return "draw";
  if (["music", "guitar", "piano", "sing", "song", "drum"].some((word) => normalized.includes(word))) return "music";
  if (["read", "book", "comic", "manga", "novel"].some((word) => normalized.includes(word))) return "read";
  if (["cook", "bake", "food", "recipe"].some((word) => normalized.includes(word))) return "cook";
  if (["game", "gaming", "minecraft", "roblox", "chess"].some((word) => normalized.includes(word))) return "game";
  return "calm";
}

function renderActivityVisual(activityName) {
  const kind = getActivityKind(activityName);
  const visualByKind = {
    dance: `
      <div class="stage-visual dancer" aria-hidden="true">
        <span class="head"></span>
        <span class="body"></span>
        <span class="arm left"></span>
        <span class="arm right"></span>
        <span class="leg left"></span>
        <span class="leg right"></span>
        <span class="note one"></span>
        <span class="note two"></span>
      </div>
    `,
    draw: `
      <div class="stage-visual drawing-motion" aria-hidden="true">
        <span class="paper"></span>
        <span class="pencil"></span>
        <span class="line"></span>
      </div>
    `,
    music: `
      <div class="stage-visual music-motion" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    `,
    calm: `
      <div class="stage-visual calm-spark" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    `,
  };

  activityStage.innerHTML = `
    <span class="stage-label">Now rebuilding</span>
    ${visualByKind[kind] || visualByKind.calm}
    <strong>${activityName}</strong>
  `;
}

function getCountryResources() {
  if (!profile || !profile.country) return helplinesByCountry.Other;
  return helplinesByCountry[profile.country] || helplinesByCountry.Other;
}

function showHelplines() {
  const resources = getCountryResources();
  addMessage(`Here are support options for ${profile ? profile.country : "your area"}:\n${resources.lines.map((line) => `- ${line}`).join("\n")}\n${resources.note}`);
}

function showNextStep() {
  if (!profile || !profile.activities.length) return;
  const activity = profile.activities[currentActivityIndex % profile.activities.length];
  const step = getCurrentStep(activity);
  const alternatives = getAlternatives(activity).join(", ");
  const nudge =
    step.recentMisses >= 3
      ? `This has felt hard lately. Related alternatives: ${alternatives}.`
      : "You do not have to want to do it. Just try the tiny version.";

  renderActivityVisual(activity);
  addMessage(`For ${activity}, your next micro-step is:\n"${step.text}"\n${step.isEasier ? "Easier version" : `Step ${step.index + 1} of ${step.total}`}. ${nudge}`);
  setQuickActions(["Completed", "Make easier", "Skip", "Another activity", "Helplines"]);
}

function recordAttempt(status) {
  const activity = profile.activities[currentActivityIndex % profile.activities.length];
  const step = getCurrentStep(activity);
  attempts.push({
    activity,
    step: step.text,
    status,
    createdAt: new Date().toISOString(),
  });
  attempts = attempts.slice(-100);
  saveAttempts();

  if (status === "completed") {
    addMessage("That counts. Tiny completion is still completion. I will move to another activity now.");
    currentActivityIndex = (currentActivityIndex + 1) % profile.activities.length;
  } else if (status === "easier") {
    addMessage("Good call. Making it smaller is not failure; it is the system adapting.");
  } else {
    addMessage("Skipping tells us useful information too. I will keep the next step very small.");
  }

  showNextStep();
}

function parseActivities(text) {
  return text
    .split(/,|\n|;/)
    .map(cleanText)
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index);
}

function containsUrgentLanguage(text) {
  const lower = text.toLowerCase();
  return ["unsafe", "suicide", "kill myself", "self harm", "hurt myself", "end it", "die"].some((word) => lower.includes(word));
}

function generalReply(text) {
  const lower = text.toLowerCase();

  if (containsUrgentLanguage(text)) {
    const resources = getCountryResources();
    return `I am really glad you said that here. If you might act on this feeling, contact emergency support now. ${resources.note} Support options: ${resources.lines.join("; ")}. Please move near another person if you can.`;
  }

  if (lower.includes("another activity")) {
    currentActivityIndex = (currentActivityIndex + 1) % profile.activities.length;
    showNextStep();
    return "";
  }

  if (lower.includes("completed") || lower === "done") {
    recordAttempt("completed");
    return "";
  }

  if (lower.includes("easier") || lower.includes("smaller")) {
    recordAttempt("easier");
    return "";
  }

  if (lower.includes("skip")) {
    recordAttempt("skipped");
    return "";
  }

  if (lower.includes("helpline") || lower.includes("safe") || lower.includes("crisis")) {
    showHelplines();
    return "";
  }

  if (lower.includes("step") || lower.includes("activity") || lower.includes("task")) {
    showNextStep();
    return "";
  }

  if (lower.includes("ground") || lower.includes("panic") || lower.includes("anxious")) {
    return "Place both feet down. Relax your jaw. Name one thing you can see, one thing you can touch, and one sound you can hear. No need to fix the whole day.";
  }

  if (lower.includes("numb") || lower.includes("empty") || lower.includes("sad")) {
    return "Numb is still a real signal. We do not need to force joy. Want a micro-step from one of your past activities?";
  }

  return "I hear you. I can help with a tiny activity step, grounding, or helplines. You can type 'step', 'ground me', or 'helplines'.";
}

function handleOnboarding(text) {
  if (conversationStep === "name") {
    draftProfile.name = text;
    conversationStep = "country";
    addMessage(`Thanks, ${draftProfile.name}. What country are you in?`);
    setQuickActions(countries);
    return;
  }

  if (conversationStep === "country") {
    const match = countries.find((country) => country.toLowerCase() === text.toLowerCase());
    draftProfile.country = match || "Other";
    conversationStep = "reason";
    addMessage("Why did you choose Hibana? One sentence is enough.");
    setQuickActions(["I want to enjoy things again", "I feel disconnected from hobbies", "I need tiny steps"]);
    return;
  }

  if (conversationStep === "reason") {
    draftProfile.reason = text;
    conversationStep = "activities";
    draftProfile.activities = [];
    addMessage("Now choose 1 or more activities you used to enjoy. Tap from the list below. If yours is not there, tap Add custom activity and type it.");
    renderActivityPicker();
    return;
  }

  if (conversationStep === "activities") {
    if (isAddingCustomActivity) {
      const customActivities = parseActivities(text);
      customActivities.forEach(addDraftActivity);
      isAddingCustomActivity = false;
      addMessage(`${describeSelectedActivities()} Choose more, add another custom activity, or tap Done when you are ready.`);
      renderActivityPicker();
      return;
    }

    if (text.toLowerCase() === "add custom activity") {
      isAddingCustomActivity = true;
      addMessage("Type the activity you want to add. You can add one, or several separated by commas.");
      setQuickActions([]);
      return;
    }

    if (text.toLowerCase() === "done") {
      const selectedActivities = draftProfile.activities || [];
      if (selectedActivities.length < 1) {
        addMessage("Please choose at least 1 activity before we start.");
        renderActivityPicker();
        return;
      }

      profile = {
        name: draftProfile.name,
        country: draftProfile.country,
        reason: draftProfile.reason,
        activities: selectedActivities,
        createdAt: new Date().toISOString(),
      };
      saveProfile();
      conversationStep = "ready";
      updateProfileCard();
      addMessage(`You're set, ${profile.name}. I saved: ${profile.activities.join(", ")}.`);
      showNextStep();
      return;
    }

    const pickedSuggestion = suggestedActivities.find((activity) => activity.toLowerCase() === text.toLowerCase());
    if (pickedSuggestion) {
      addDraftActivity(pickedSuggestion);
      addMessage(`${describeSelectedActivities()} Pick another activity, add a custom one, or tap Done when you are ready.`);
      renderActivityPicker();
      return;
    }

    parseActivities(text).forEach(addDraftActivity);
    if ((draftProfile.activities || []).length < 1) {
      addMessage("Please choose at least 1 activity. If yours is not in the list, tap Add custom activity.");
      renderActivityPicker();
      return;
    }

    addMessage(`${describeSelectedActivities()} Tap Done to start, or keep adding more.`);
    renderActivityPicker();
    return;
  }
}

function startProfileFromSelectedActivities() {
  const selectedActivities = draftProfile.activities || [];
  if (selectedActivities.length < 1) {
    addMessage("Please choose at least 1 activity before we start.");
    renderActivityPicker();
    return;
  }

    profile = {
      name: draftProfile.name,
      country: draftProfile.country,
      reason: draftProfile.reason,
      activities: selectedActivities,
      createdAt: new Date().toISOString(),
    };
    saveProfile();
    conversationStep = "ready";
    updateProfileCard();
    addMessage(`You're set, ${profile.name}. I saved: ${profile.activities.join(", ")}.`);
    showNextStep();
}

function handleMessage(text) {
  if (conversationStep !== "ready") {
    handleOnboarding(text);
    return;
  }

  const reply = generalReply(text);
  if (reply) addMessage(reply);
}

function restartApp() {
  [PROFILE_STORAGE_KEY, ATTEMPT_STORAGE_KEY, ...OLD_KEYS].forEach((key) => localStorage.removeItem(key));
  window.location.reload();
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = cleanText(chatInput.value);
  if (!text) return;

  addMessage(text, "user");
  chatInput.value = "";
  window.setTimeout(() => handleMessage(text), 180);
});

restartAppButton.addEventListener("click", restartApp);

function boot() {
  updateProfileCard();
  if (!profile) {
    addMessage("Hi, I am Hibana. I will guide everything through chat. What is your name?");
    setQuickActions([]);
    return;
  }

  addMessage(`Welcome back, ${profile.name}. I can suggest a tiny activity step, ground you, or show helplines for ${profile.country}.`);
  showNextStep();
}

boot();
