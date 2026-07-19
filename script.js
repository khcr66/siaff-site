/* ── HAMBURGER NAV ──
   Note: in the single-file prototype this file also had a showPage()
   function that toggled which page's content was visible. Now that each
   page is its own HTML file with a real URL, that's gone -- the browser
   handles "navigation" natively via <a href="about.html"> links, and each
   page's nav markup has its own link hardcoded with class="active". */
function toggleNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const isOpen = links.classList.toggle('open');
  toggle.classList.toggle('open', isOpen);
  toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;
  toggle.classList.remove('open');
  links.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', function(e) {
  const nav = document.querySelector('nav');
  if (nav && !nav.contains(e.target)) closeNav();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeNav();
});

/* ── SPROCKET HOLES ──
   Only present on the Home page, but harmless to include site-wide --
   these no-op safely on pages without the elements. */
function buildSprockets() {
  ['sprockets-top', 'sprockets-bottom'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    const count = Math.ceil(window.innerWidth / 42) + 4;
    for (let i = 0; i < count; i++) {
      const hole = document.createElement('div');
      hole.className = 'sprocket-hole';
      el.appendChild(hole);
    }
  });
}

buildSprockets();
window.addEventListener('resize', buildSprockets);

/* ── FILMSTRIP CAROUSEL (Home page only) ── */
const FRAMES_PER_VIEW_DESKTOP = 3;
const FRAMES_PER_VIEW_MOBILE  = 2;
let currentFrame = 0;

function getFramesPerView() {
  return window.innerWidth <= 900 ? FRAMES_PER_VIEW_MOBILE : FRAMES_PER_VIEW_DESKTOP;
}

function getTotalSlides() {
  const frames = document.querySelectorAll('.film-frame');
  return Math.max(0, frames.length - getFramesPerView() + 1);
}

function updateCarousel() {
  const track = document.getElementById('framesTrack');
  const frames = document.querySelectorAll('.film-frame');
  if (!track || frames.length === 0) return;

  const fpv = getFramesPerView();
  const totalSlides = getTotalSlides();
  currentFrame = Math.max(0, Math.min(currentFrame, totalSlides - 1));

  const frameWidth = frames[0].getBoundingClientRect().width;
  const gap = 2;
  track.style.transform = `translateX(-${currentFrame * (frameWidth + gap)}px)`;

  const dots = document.getElementById('counterDots');
  const text = document.getElementById('counterText');
  if (dots) {
    dots.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = 'counter-dot' + (i === currentFrame ? ' active' : '');
      dot.onclick = (function(idx) { return function() { currentFrame = idx; updateCarousel(); }; })(i);
      dots.appendChild(dot);
    }
  }
  if (text) {
    const start = currentFrame + 1;
    const end = Math.min(currentFrame + fpv, frames.length);
    text.textContent = `Frame ${start}–${end} of ${frames.length}`;
  }
}

function stripNext() {
  if (currentFrame < getTotalSlides() - 1) {
    currentFrame++;
    updateCarousel();
  }
}

function stripPrev() {
  if (currentFrame > 0) {
    currentFrame--;
    updateCarousel();
  }
}

let autoPlay = setInterval(function() {
  if (currentFrame < getTotalSlides() - 1) {
    currentFrame++;
  } else {
    currentFrame = 0;
  }
  updateCarousel();
}, 4000);

document.querySelector('.filmstrip-section')?.addEventListener('mouseenter', () => clearInterval(autoPlay));
document.querySelector('.filmstrip-section')?.addEventListener('mouseleave', () => {
  autoPlay = setInterval(function() {
    if (currentFrame < getTotalSlides() - 1) { currentFrame++; } else { currentFrame = 0; }
    updateCarousel();
  }, 4000);
});

window.addEventListener('resize', updateCarousel);
setTimeout(updateCarousel, 100);

document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight') stripNext();
  if (e.key === 'ArrowLeft') stripPrev();
});

/* ── FILMSTRIP CAROUSEL — TOUCH SWIPE (Home page only) ──
   Lets a finger drag the strip on phones/tablets: the track follows the
   finger in real time, then either snaps to the next/previous frame or
   springs back, depending on how far the swipe travelled. A vertical
   swipe is left alone so the page can still scroll normally. */
(function() {
  const viewport = document.querySelector('.frames-viewport');
  const track = document.getElementById('framesTrack');
  if (!viewport || !track) return;

  const SWIPE_THRESHOLD = 40; // px of horizontal travel to trigger a slide change

  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let dragging = false;
  let isHorizontal = null;

  function restartAutoplay() {
    clearInterval(autoPlay);
    autoPlay = setInterval(function() {
      if (currentFrame < getTotalSlides() - 1) { currentFrame++; } else { currentFrame = 0; }
      updateCarousel();
    }, 4000);
  }

  function currentOffset() {
    const frame = document.querySelector('.film-frame');
    if (!frame) return 0;
    const frameWidth = frame.getBoundingClientRect().width;
    const gap = 2;
    return -(currentFrame * (frameWidth + gap));
  }

  function onStart(x, y) {
    startX = x;
    startY = y;
    deltaX = 0;
    dragging = true;
    isHorizontal = null;
    clearInterval(autoPlay);
    track.style.transition = 'none';
    viewport.classList.add('dragging');
  }

  function onMove(x, y, evt) {
    if (!dragging) return false;
    deltaX = x - startX;
    const deltaY = y - startY;

    if (isHorizontal === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }
    if (!isHorizontal) return false;

    if (evt && evt.cancelable) evt.preventDefault();
    track.style.transform = `translateX(${currentOffset() + deltaX}px)`;
    return true;
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
    track.style.transition = '';

    if (isHorizontal && deltaX <= -SWIPE_THRESHOLD) {
      stripNext();
    } else if (isHorizontal && deltaX >= SWIPE_THRESHOLD) {
      stripPrev();
    } else {
      updateCarousel();
    }
    restartAutoplay();
  }

  // Touch events (phones/tablets)
  viewport.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1) return;
    onStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  viewport.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 1) return;
    onMove(e.touches[0].clientX, e.touches[0].clientY, e);
  }, { passive: false });

  viewport.addEventListener('touchend', onEnd);
  viewport.addEventListener('touchcancel', onEnd);

  // Mouse drag too, so trackpads/mice on touch-capable laptops work the same way
  viewport.addEventListener('mousedown', function(e) {
    onStart(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', function(e) {
    if (dragging) onMove(e.clientX, e.clientY, e);
  });
  window.addEventListener('mouseup', onEnd);
})();

/* ── FAQ ACCORDION (FAQ page only) ── */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  item.classList.toggle('open');
}

/* ── FAQ — SIMULATED AI CHAT WIDGET (FAQ page only) ── */
const FAQ_KB = [
  { keywords: ["who can submit", "eligib", "age require", "65"],
    a: "Any director aged 65 or older at the time of submission — that's our only hard eligibility rule. No prior festival experience, professional credentials, or minimum budget required. For co-directed films, the lead director must meet the age requirement." },
  { keywords: ["fee", "free", "cost", "charge", "price", "pay to submit"],
    a: "Yes — completely free, always. SIAFF is self-funded with no institutional sponsors or industry ties. Donations of any amount are genuinely welcome, but submitting will never require one." },
  { keywords: ["senior-centric", "senior centric", "about aging", "about ageing", "have to be about"],
    a: "It means the film meaningfully engages with older adult perspectives, intergenerational relationships, or challenges stereotypes of aging. It's not a strict requirement — but a film with only the director's age in common with 'senior' is unlikely to be selected. Not sure? Submit anyway and explain the connection in your director's statement." },
  { keywords: ["how do i submit", "how to submit", "filmfreeway", "where do i submit"],
    a: "Through FilmFreeWay, the industry-standard submission platform. Create a free filmmaker account, fill out your film's profile, and submit to SIAFF — about 20 minutes start to finish." },
  { keywords: ["found", "thomas yee", "start", "history", "agoac", "classroom"],
    a: "Thomas Yee, a filmmaker with 35+ years of experience, founded the AGOAC Filmmaking Group in Markham, Ontario in 2018 to teach older adults the full craft of filmmaking. SIAFF grew out of that weekly classroom in 2024." },
  { keywords: ["feedback", "hear back", "notify", "notified"],
    a: "Selected films and category winners receive written jury feedback, and every filmmaker who submits is notified of the outcome. We believe making a film deserves acknowledgement, not silence." },
  { keywords: ["world premiere", "premiere", "screened elsewhere", "already screened"],
    a: "No — films that have already screened elsewhere, including at other festivals, are welcome at SIAFF." },
  { keywords: ["runtime", "how long", "minutes", "genre", "language", "subtitle"],
    a: "Maximum 30 minutes including credits. Any genre — documentary, fiction, experimental, animation, or hybrid. Any language, as long as non-English films include English subtitles." },
  { keywords: ["winner", "laurel", "award", "prize"],
    a: "Selected films receive a digital laurel to use freely on posters, websites, and social media. Category winners receive their own distinct laurel recognizing the award." },
  { keywords: ["affiliat", "sponsor", "industry", "partner"],
    a: "No — by choice. SIAFF has no institutional sponsors or industry ties. We're run by the AGOAC Filmmaking Group, a community in Markham, Ontario. We do welcome collaboration with organizations that share our values." },
  { keywords: ["where is siaff", "located", "markham", "based", "country", "worldwide"],
    a: "SIAFF was founded in Markham, Ontario, Canada, and has run there since 2024. Starting in 2027, we're opening submissions to senior filmmakers worldwide." },
  { keywords: ["deadline", "when do submissions", "dates", "2027"],
    a: "2027 submissions open January 2027, with early, regular, and final deadlines running March through May 2027. Selections are announced in August, with the festival screening in October. See the Submit page for the full schedule." },
  { keywords: ["contact", "email", "reach you", "get in touch"],
    a: "Email admin@siaff.org, or use the contact form below — a real person from our small team reads every message." },
  { keywords: ["donat", "support you", "contribute"],
    a: "Yes, and it's genuinely appreciated — donations of any amount help cover the cost of running the festival. But submitting your film will never require one." }
];

const FAQ_FALLBACK = "I don't have a pre-written answer for that one — this is a simulated prototype assistant, not a live AI. Try one of the suggested questions above, or use the contact form below to reach a real person.";

function findFaqAnswer(text) {
  const t = text.toLowerCase();
  for (const entry of FAQ_KB) {
    for (const kw of entry.keywords) {
      if (t.includes(kw)) return entry.a;
    }
  }
  return null;
}

function appendChatMsg(text, role) {
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg ' + role;
  const bubble = document.createElement('div');
  bubble.className = 'chat-msg-bubble';
  bubble.textContent = text;
  wrap.appendChild(bubble);
  const msgs = document.getElementById('chatMessages');
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function askChat(question) {
  appendChatMsg(question, 'user');
  const answer = findFaqAnswer(question) || FAQ_FALLBACK;
  setTimeout(() => appendChatMsg(answer, 'bot'), 450);
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const val = input.value.trim();
  if (!val) return;
  input.value = '';
  askChat(val);
}

/* ── FAQ — CONTACT FORM (PLACEHOLDER, FAQ page only) ── */
function handleContactSubmit(e) {
  e.preventDefault();
  const note = document.getElementById('formNote');
  note.textContent = "Thanks! This prototype form doesn't send messages yet — in the live site this will reach admin@siaff.org directly.";
  note.style.color = 'var(--red)';
  document.getElementById('contactForm').reset();
  return false;
}
