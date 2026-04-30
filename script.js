const eventDate = new Date('2026-05-06T18:30:00-03:00');
const locationReleaseDate = new Date('2026-05-06T12:00:00-03:00');
const entryScreen = document.getElementById('entry-screen');
const enterExperience = document.getElementById('enter-experience');
const skipExperience = document.getElementById('skip-experience');
const entryAudio = document.getElementById('entry-audio');
const entryProgressBar = document.getElementById('entry-progress-bar');
const entryProgressPercent = document.getElementById('entry-progress-percent');
const musicToggle = document.getElementById('music-toggle');
const locationSection = document.getElementById('local');
const introDuration = 55000;
let introAnimationFrame;
let introStartedAt = 0;

if (sessionStorage.getItem('somdoaltar:entered') === 'true') {
  document.body.classList.add('experience-started');
  document.body.classList.remove('prelude-open');
  entryScreen.hidden = true;
  entryScreen.setAttribute('aria-hidden', 'true');
}

function updateCountdown() {
  const diff = eventDate - new Date();
  if (diff <= 0) return;
  document.getElementById('days').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
  document.getElementById('hours').textContent = String(Math.floor((diff / 3600000) % 24)).padStart(2, '0');
  document.getElementById('minutes').textContent = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
  document.getElementById('seconds').textContent = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

function updateLocationLock() {
  if (!locationSection) return;

  const locked = new Date() < locationReleaseDate;
  locationSection.classList.toggle('location-locked', locked);
  locationSection.querySelectorAll('.route-actions a').forEach((link) => {
    if (locked) {
      if (!link.dataset.href) link.dataset.href = link.href;
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
    } else if (link.dataset.href) {
      link.href = link.dataset.href;
      link.removeAttribute('aria-disabled');
      link.removeAttribute('tabindex');
    }
  });
}

updateLocationLock();
setInterval(updateLocationLock, 60000);

function updateMusicToggle() {
  const isPlaying = entryAudio && !entryAudio.paused;
  musicToggle.classList.toggle('is-playing', isPlaying);
  musicToggle.setAttribute('aria-pressed', String(isPlaying));
  musicToggle.setAttribute('aria-label', isPlaying ? 'Pausar música' : 'Começar música');
  musicToggle.querySelector('.music-toggle-icon').textContent = isPlaying ? 'Ⅱ' : '♪';
  musicToggle.querySelector('.music-toggle-text').textContent = isPlaying ? 'Pausar' : 'Tocar';
}

entryAudio.addEventListener('play', updateMusicToggle);
entryAudio.addEventListener('pause', updateMusicToggle);
entryAudio.addEventListener('ended', updateMusicToggle);

musicToggle.addEventListener('click', async () => {
  if (entryAudio.paused) {
    try {
      await entryAudio.play();
    } catch (error) {
      updateMusicToggle();
    }
    return;
  }

  entryAudio.pause();
});

updateMusicToggle();

function finishIntro({ stopAudio = false } = {}) {
  window.cancelAnimationFrame(introAnimationFrame);
  entryProgressBar.style.width = '100%';
  entryProgressPercent.textContent = '100%';
  entryScreen.style.setProperty('--entry-image-blur', '0px');
  entryScreen.style.setProperty('--entry-image-brightness', '.66');
  entryScreen.style.setProperty('--entry-image-opacity', '.92');
  sessionStorage.setItem('somdoaltar:entered', 'true');
  document.body.classList.add('experience-started');
  document.body.classList.remove('prelude-open');
  entryScreen.classList.remove('entry-loading');
  entryScreen.setAttribute('aria-hidden', 'true');

  if (stopAudio && entryAudio) {
    entryAudio.pause();
    entryAudio.currentTime = 0;
  }

  updateMusicToggle();

  window.setTimeout(() => {
    entryScreen.hidden = true;
  }, 900);
}

function updateIntroProgress(timestamp) {
  if (!introStartedAt) introStartedAt = timestamp;
  const elapsed = timestamp - introStartedAt;
  const percent = Math.min(100, Math.round((elapsed / introDuration) * 100));
  const progress = percent / 100;

  entryProgressBar.style.width = `${percent}%`;
  entryProgressPercent.textContent = `${percent}%`;
  entryScreen.style.setProperty('--entry-image-blur', `${3 - (progress * 3)}px`);
  entryScreen.style.setProperty('--entry-image-brightness', String(.48 + (progress * .18)));
  entryScreen.style.setProperty('--entry-image-opacity', String(.76 + (progress * .16)));

  if (elapsed >= introDuration) {
    finishIntro();
    return;
  }

  introAnimationFrame = window.requestAnimationFrame(updateIntroProgress);
}

enterExperience.addEventListener('click', async () => {
  entryScreen.classList.add('entry-loading');
  enterExperience.setAttribute('disabled', 'true');
  introStartedAt = 0;
  entryProgressBar.style.width = '0%';
  entryProgressPercent.textContent = '0%';

  try {
    entryAudio.currentTime = 0;
    await entryAudio.play();
  } catch (error) {
    entryProgressPercent.textContent = '0%';
  }

  introAnimationFrame = window.requestAnimationFrame(updateIntroProgress);
});

skipExperience.addEventListener('click', () => {
  sessionStorage.setItem('somdoaltar:entered', 'true');
  finishIntro({ stopAudio: true });
});

const menuBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const repertoireToggle = document.querySelector('.repertoire-toggle');
const navDropdown = document.querySelector('.nav-dropdown');
menuBtn.addEventListener('click', () => {
  const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('open');
});

repertoireToggle.addEventListener('click', () => {
  const expanded = repertoireToggle.getAttribute('aria-expanded') === 'true';
  repertoireToggle.setAttribute('aria-expanded', String(!expanded));
  navDropdown.classList.toggle('open');
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuBtn.setAttribute('aria-expanded', 'false');
  repertoireToggle.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
  navDropdown.classList.remove('open');
}));

document.addEventListener('click', (event) => {
  if (!navDropdown.contains(event.target)) {
    repertoireToggle.setAttribute('aria-expanded', 'false');
    navDropdown.classList.remove('open');
  }
});

const testimonialForm = document.getElementById('testimonial-form');
const testimonialsList = document.getElementById('testimonials-list');
const testimonialStatus = document.getElementById('testimonial-status');
const testimonialPrev = document.querySelector('[data-testimonial-prev]');
const testimonialNext = document.querySelector('[data-testimonial-next]');
const teamCarousel = document.getElementById('team-carousel');
const teamPrev = document.querySelector('[data-team-prev]');
const teamNext = document.querySelector('[data-team-next]');
const visitCounter = document.getElementById('visit-counter');
const visitCount = document.getElementById('visit-count');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function renderTestimonials(testimonials) {
  if (!testimonials.length) {
    testimonialsList.innerHTML = '<p class="form-status">Os testemunhos aparecerão aqui depois da gravação.</p>';
    return;
  }

  testimonialsList.innerHTML = testimonials.map((testimonial) => {
    return `
      <article class="testimonial-card">
        <blockquote>${escapeHtml(testimonial.depoimento)}</blockquote>
        <strong>${escapeHtml(testimonial.nome)}</strong>
      </article>
    `;
  }).join('');
}

async function loadTestimonials() {
  try {
    const response = await fetch('/api/testimonials');
    const data = await response.json();
    renderTestimonials(data.testimonials || []);
  } catch (error) {
    testimonialsList.innerHTML = '<p class="form-status">Não foi possível carregar os testemunhos agora.</p>';
  }
}

testimonialForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  testimonialStatus.textContent = 'Enviando testemunho...';

  const payload = {
    nome: document.getElementById('testimonial-name').value.trim(),
    depoimento: document.getElementById('testimonial-message').value.trim(),
  };

  try {
    const response = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao enviar testemunho.');
    }

    testimonialForm.reset();
    testimonialStatus.textContent = 'Testemunho enviado para validação. Obrigado por compartilhar.';
    await loadTestimonials();
  } catch (error) {
    testimonialStatus.textContent = error.message;
  }
});

loadTestimonials();

async function loadVisitCount() {
  if (!visitCounter || !visitCount) {
    return;
  }

  try {
    const alreadyCounted = sessionStorage.getItem('somdoaltar:visit-counted') === 'true';
    const response = await fetch('/api/visits', {
      method: alreadyCounted ? 'GET' : 'POST',
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar contador.');
    }

    sessionStorage.setItem('somdoaltar:visit-counted', 'true');
    visitCount.textContent = new Intl.NumberFormat('pt-BR').format(data.total || 0);
    visitCounter.hidden = false;
  } catch (error) {
    visitCounter.hidden = true;
  }
}

loadVisitCount();

function scrollTestimonials(direction) {
  const card = testimonialsList.querySelector('.testimonial-card');
  const distance = card ? card.getBoundingClientRect().width + 14 : testimonialsList.clientWidth * .85;
  testimonialsList.scrollBy({ left: distance * direction, behavior: 'smooth' });
}

testimonialPrev.addEventListener('click', () => scrollTestimonials(-1));
testimonialNext.addEventListener('click', () => scrollTestimonials(1));

function scrollTeam(direction) {
  const card = teamCarousel.querySelector('.team-card');
  const distance = card ? card.getBoundingClientRect().width + 12 : teamCarousel.clientWidth * .75;
  teamCarousel.scrollBy({ left: distance * direction, behavior: 'smooth' });
}

teamPrev.addEventListener('click', () => scrollTeam(-1));
teamNext.addEventListener('click', () => scrollTeam(1));

let teamCarouselTimer = window.setInterval(() => {
  const maxScroll = teamCarousel.scrollWidth - teamCarousel.clientWidth - 4;
  if (teamCarousel.scrollLeft >= maxScroll) {
    teamCarousel.scrollTo({ left: 0, behavior: 'smooth' });
    return;
  }
  scrollTeam(1);
}, 4200);

function pauseTeamCarousel() {
  window.clearInterval(teamCarouselTimer);
}

teamCarousel.addEventListener('pointerdown', pauseTeamCarousel, { once: true });
teamPrev.addEventListener('pointerdown', pauseTeamCarousel, { once: true });
teamNext.addEventListener('pointerdown', pauseTeamCarousel, { once: true });

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: .2 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
