const eventDate = new Date('2026-05-06T18:30:00');
const whatsappNumber = '5500000000000';
const contactEmail = 'contato@somdoaltar.com';

function updateCountdown() {
  const diff = eventDate - new Date();
  if (diff <= 0) return;
  document.getElementById('days').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
  document.getElementById('hours').textContent = String(Math.floor((diff / 3600000) % 24)).padStart(2, '0');
  document.getElementById('minutes').textContent = String(Math.floor((diff / 60000) % 60)).padStart(2, '0');
}
setInterval(updateCountdown, 1000); updateCountdown();

const menuBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuBtn.addEventListener('click', () => {
  const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('open');
});

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  const parent = tab.closest('.card');
  parent.querySelectorAll('.tab,.tab-content').forEach((el) => el.classList.remove('active'));
  tab.classList.add('active');
  parent.querySelector(`#${tab.dataset.target}`).classList.add('active');
}));

document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const mensagem = document.getElementById('mensagem').value.trim();
  const text = encodeURIComponent(`Olá, sou ${nome}.\nE-mail: ${email}\nMensagem: ${mensagem}`);
  window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  document.getElementById('email-link').href = `mailto:${contactEmail}?subject=Interesse%20-%20Som%20do%20Altar&body=${text}`;
});

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible')), { threshold: .2 });
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
