(() => {
  const token = location.hash.slice(1) || sessionStorage.getItem('external-feedback-token') || '';
  if (token) sessionStorage.setItem('external-feedback-token', token);
  history.replaceState(null, '', location.pathname);
  window.addEventListener('hashchange', () => { if (location.hash) location.reload(); });
  const form = document.querySelector('form');
  const status = document.getElementById('status');
  let record;
  async function api(options = {}, suffix = '') {
    const response = await fetch('/api/external-feedback' + suffix, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    if (!response.ok) throw new Error((await response.json()).error || 'Não foi possível concluir.');
    return response;
  }
  async function filesToData(files) {
    if (files.length > 5 || Array.from(files).reduce((sum, f) => sum + f.size, 0) > 2 * 1024 * 1024) throw new Error('Selecione até cinco anexos, somando no máximo 2 MB.');
    return Promise.all(Array.from(files).map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, content: reader.result.split(',')[1] });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })));
  }
  api().then(r => r.json()).then(data => {
    record = data;
    document.getElementById('title').textContent = data.kind === 'survey' ? 'Pesquisa de satisfação' : 'Resposta ao comunicado';
    document.getElementById('description').textContent = [data.company, data.description, data.deadline ? `Prazo: ${data.deadline.split('-').reverse().join('/')}` : ''].filter(Boolean).join('\n');
    for (const file of data.files) {
      const button = document.createElement('button');
      button.textContent = `Baixar ${file.name}`;
      button.onclick = async () => {
        try {
          const blob = await (await api({}, `?file=${file.index}`)).blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) { status.textContent = error.message; }
      };
      document.getElementById('files').append(button);
    }
    if (data.responded) { status.textContent = 'Sua resposta já foi registrada. Obrigado!'; return; }
    const questions = data.kind === 'survey' ? data.questions : [{ id: 'actions', texto: 'Ações tomadas e considerações', tipo: 'texto' }];
    for (const q of questions) {
      const label = document.createElement('label'); label.textContent = q.texto;
      const input = document.createElement(q.tipo === 'texto' ? 'textarea' : 'select'); input.name = q.id;
      if (q.tipo !== 'texto') {
        input.append(new Option('Selecione uma nota', ''));
        for (let n = 0; n <= 10; n++) input.append(new Option(String(n), String(n)));
        input.required = true;
      } else { input.maxLength = data.kind === 'supplier' ? 10000 : 4000; input.required = data.kind === 'supplier'; }
      label.append(input); document.getElementById('fields').append(label);
    }
    if (data.kind === 'supplier') {
      const label = document.createElement('label'); label.textContent = 'Evidências (até 2 MB no total)';
      const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.name = 'files'; label.append(input); document.getElementById('fields').append(label);
    }
    form.hidden = false;
  }).catch(error => { document.getElementById('title').textContent = 'Resposta indisponível'; status.textContent = error.message; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button'); button.disabled = true;
    try {
      const fields = new FormData(form);
      const body = record.kind === 'survey' ? { answers: Object.fromEntries(record.questions.map(q => [q.id, q.tipo === 'texto' ? fields.get(q.id) : Number(fields.get(q.id))])) } : { actions: fields.get('actions'), files: await filesToData(form.elements.files.files) };
      await api({ method: 'POST', body: JSON.stringify(body) });
      form.hidden = true; status.textContent = 'Resposta enviada com sucesso. Obrigado!';
    } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
  });
})();
