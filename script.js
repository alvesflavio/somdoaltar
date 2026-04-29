const eventDate = new Date('2026-05-06T18:30:00');
const entryScreen = document.getElementById('entry-screen');
const enterExperience = document.getElementById('enter-experience');

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

enterExperience.addEventListener('click', () => {
  sessionStorage.setItem('somdoaltar:entered', 'true');
  document.body.classList.add('experience-started');
  document.body.classList.remove('prelude-open');
  entryScreen.setAttribute('aria-hidden', 'true');

  window.setTimeout(() => {
    entryScreen.hidden = true;
  }, 900);
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
    testimonialsList.innerHTML = '<p class="form-status">Os depoimentos aparecerão aqui depois da gravação.</p>';
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
    testimonialsList.innerHTML = '<p class="form-status">Não foi possível carregar os depoimentos agora.</p>';
  }
}

testimonialForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  testimonialStatus.textContent = 'Enviando depoimento...';

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
      throw new Error(data.error || 'Erro ao enviar depoimento.');
    }

    testimonialForm.reset();
    testimonialStatus.textContent = 'Depoimento enviado. Obrigado por compartilhar.';
    await loadTestimonials();
  } catch (error) {
    testimonialStatus.textContent = error.message;
  }
});

loadTestimonials();

function scrollTestimonials(direction) {
  const card = testimonialsList.querySelector('.testimonial-card');
  const distance = card ? card.getBoundingClientRect().width + 14 : testimonialsList.clientWidth * .85;
  testimonialsList.scrollBy({ left: distance * direction, behavior: 'smooth' });
}

testimonialPrev.addEventListener('click', () => scrollTestimonials(-1));
testimonialNext.addEventListener('click', () => scrollTestimonials(1));

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: .2 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
