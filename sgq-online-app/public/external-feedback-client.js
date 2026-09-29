window.feedbackRequest = async (kind, record, method = 'POST') => {
  const options = record ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) } : {};
  if (window.parent === window && record) {
    const bootstrap = await (await fetch('/api/bootstrap')).json();
    options.headers['X-CSRF-Token'] = bootstrap.csrfToken;
  }
  const response = await window.parent.fetch(`/api/external-feedback-requests?kind=${kind}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível registrar o envio.');
  return data;
};
window.feedbackFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, size: file.size, content: reader.result.split(',')[1] });
  reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
  reader.readAsDataURL(file);
});
window.feedbackDownload = file => {
  if (!file?.content) return;
  const bytes = Uint8Array.from(atob(file.content), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
  const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Refresh authoritative responses when the module is opened or receives focus.
let feedbackRefreshing = false;
async function refreshFeedbackRecords() {
  if (feedbackRefreshing) return;
  const survey = location.pathname.includes('satisfacao');
  if (survey && !satisfactionHydrated) return;
  feedbackRefreshing = true;
  try {
    const { records } = await feedbackRequest(survey ? 'survey' : 'supplier');
    const key = survey ? 'qps_sat_pesquisas' : 'qps_forn_acoes';
    const old = store.get(key) || [];
    const ids = new Set(records.map(r => r.id));
    const merged = [...old.filter(r => !r.emailDelivery && !ids.has(r.id)), ...records];
    if (JSON.stringify(old) !== JSON.stringify(merged)) {
      store.set(key, merged);
      renderKpis();
      if (currentTab === 'controle' || currentTab === 'acoes') renderTab();
    }
  } catch (error) { showToast(error.message); }
  finally { feedbackRefreshing = false; }
}
window.addEventListener('focus', refreshFeedbackRecords);
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === parent && event.data?.type === 'qualitypro:satisfacao:hydrate') refreshFeedbackRecords();
});
refreshFeedbackRecords();
