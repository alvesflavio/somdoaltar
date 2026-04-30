const tokenForm = document.getElementById('admin-token-form');
const tokenInput = document.getElementById('admin-token');
const statusEl = document.getElementById('admin-status');
const listEl = document.getElementById('admin-list');
const usersEl = document.getElementById('admin-users');
const refreshBtn = document.getElementById('admin-refresh');

let adminToken = localStorage.getItem('somdoaltar:admin-token') || '';
tokenInput.value = adminToken;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function adminHeaders() {
  return {
    Authorization: `Bearer ${adminToken}`,
    'x-admin-token': adminToken,
  };
}

function whatsappDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11) return `55${digits}`;
  if (digits.length === 13 && digits.startsWith('55')) return digits;
  return '';
}

function whatsappUrl(user) {
  const message = encodeURIComponent(`Ola, ${user.nome}! Aqui e a equipe do Som do Altar.`);
  return `https://wa.me/${whatsappDigits(user.whatsapp)}?text=${message}`;
}

async function readJsonResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(`${fallbackMessage} A API retornou ${response.status || 'uma resposta'} em formato inesperado.`);
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || fallbackMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}

function clearSavedToken() {
  adminToken = '';
  tokenInput.value = '';
  localStorage.removeItem('somdoaltar:admin-token');
  tokenInput.focus();
}

function renderTestimonials(testimonials) {
  if (!testimonials.length) {
    listEl.innerHTML = '<p class="admin-status">Nenhum testemunho recebido ainda.</p>';
    return;
  }

  listEl.innerHTML = testimonials.map((item) => `
    <article class="admin-card ${item.approved ? '' : 'pending'}">
      <header>
        <div>
          <strong>${escapeHtml(item.nome)}</strong>
          <div><time>${new Date(item.created_at).toLocaleString('pt-BR')}</time></div>
          ${item.whatsapp ? `<div>WhatsApp: ${escapeHtml(item.whatsapp)}</div>` : ''}
        </div>
        <span class="admin-badge">${item.approved ? 'Publicado' : 'Pendente'}</span>
      </header>
      <p>${escapeHtml(item.depoimento)}</p>
      <div class="admin-actions">
        ${item.approved ? '' : `<button type="button" data-approve="${item.id}">Aprovar</button>`}
        <button class="danger" type="button" data-delete="${item.id}">Remover</button>
      </div>
    </article>
  `).join('');
}

function renderUsers(testimonials) {
  const usersByPhone = new Map();

  testimonials.forEach((item) => {
    const digits = whatsappDigits(item.whatsapp);
    if (!digits || usersByPhone.has(digits)) return;
    usersByPhone.set(digits, {
      nome: item.nome,
      whatsapp: item.whatsapp,
      created_at: item.created_at,
    });
  });

  const users = Array.from(usersByPhone.values());

  if (!users.length) {
    usersEl.innerHTML = '<p class="admin-status">Nenhum usuario com WhatsApp informado ainda.</p>';
    return;
  }

  usersEl.innerHTML = users.map((user) => `
    <article class="admin-user-card">
      <div>
        <strong>${escapeHtml(user.nome)}</strong>
        <span>${escapeHtml(user.whatsapp)}</span>
      </div>
      <a class="contact-link" href="${whatsappUrl(user)}" target="_blank" rel="noopener">Entrar em contato</a>
    </article>
  `).join('');
}

async function loadTestimonials() {
  statusEl.textContent = 'Carregando testemunhos...';

  try {
    const testimonialsResponse = await fetch('/api/admin/testimonials', { headers: adminHeaders() });
    const data = await readJsonResponse(testimonialsResponse, 'Nao foi possivel carregar os testemunhos.');

    let users = data.testimonials || [];

    try {
      const usersResponse = await fetch('/api/admin/users', { headers: adminHeaders() });
      const usersData = await readJsonResponse(usersResponse, 'Nao foi possivel carregar os usuarios.');
      users = usersData.users || users;
    } catch (error) {
      statusEl.textContent = `${error.message} Exibindo usuarios encontrados nos testemunhos.`;
    }

    renderTestimonials(data.testimonials || []);
    renderUsers(users);
    if (!statusEl.textContent.includes('Exibindo usuarios')) {
      statusEl.textContent = 'Lista atualizada.';
    }
  } catch (error) {
    listEl.innerHTML = '';
    usersEl.innerHTML = '';
    if (error.status === 401) {
      clearSavedToken();
    }
    statusEl.textContent = error.message;
  }
}

tokenForm.addEventListener('submit', (event) => {
  event.preventDefault();
  adminToken = tokenInput.value.trim();
  localStorage.setItem('somdoaltar:admin-token', adminToken);
  loadTestimonials();
});

refreshBtn.addEventListener('click', loadTestimonials);

listEl.addEventListener('click', async (event) => {
  const approveId = event.target.dataset.approve;
  const deleteId = event.target.dataset.delete;

  if (!approveId && !deleteId) return;

  const action = approveId
    ? fetch(`/api/admin/testimonials/${approveId}/approve`, { method: 'PATCH', headers: adminHeaders() })
    : fetch(`/api/admin/testimonials/${deleteId}`, { method: 'DELETE', headers: adminHeaders() });

  try {
    const response = await action;
    await readJsonResponse(response, 'Acao nao concluida.');

    await loadTestimonials();
  } catch (error) {
    statusEl.textContent = error.message;
  }
});

if (adminToken) {
  loadTestimonials();
}
