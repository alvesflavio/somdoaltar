const tokenForm = document.getElementById('admin-token-form');
const tokenInput = document.getElementById('admin-token');
const statusEl = document.getElementById('admin-status');
const listEl = document.getElementById('admin-list');
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
  return { 'x-admin-token': adminToken };
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

async function loadTestimonials() {
  statusEl.textContent = 'Carregando testemunhos...';

  try {
    const response = await fetch('/api/admin/testimonials', { headers: adminHeaders() });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Nao foi possivel carregar os testemunhos.');
    }

    renderTestimonials(data.testimonials || []);
    statusEl.textContent = 'Lista atualizada.';
  } catch (error) {
    listEl.innerHTML = '';
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
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Acao nao concluida.');
    }

    await loadTestimonials();
  } catch (error) {
    statusEl.textContent = error.message;
  }
});

if (adminToken) {
  loadTestimonials();
}
