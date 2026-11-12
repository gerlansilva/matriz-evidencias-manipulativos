async function main() {
  const res = await fetch('data.json');
  const data = await res.json();

  const els = {
    q: document.getElementById('q'),
    programa: document.getElementById('programa'),
    volume: document.getElementById('volume'),
    sort: document.getElementById('sort'),
    clear: document.getElementById('clear'),
    cards: document.getElementById('cards'),
    count: document.getElementById('count'),
    empty: document.getElementById('empty'),
  };

  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a,b) => a.localeCompare(b, 'pt-BR', {numeric:true}));
  const programas = uniq(data.map(d => d['Programa']));
  for (const p of programas) els.programa.add(new Option(p, p));

  function updateVolumeOptions() {
    const prog = els.programa.value;
    const vols = uniq(data.filter(d => !prog || d['Programa'] === prog).map(d => d['Volume']));
    const current = els.volume.value;
    els.volume.innerHTML = '<option value="">Todos</option>';
    for (const v of vols) els.volume.add(new Option(v, v));
    if (vols.includes(current)) els.volume.value = current;
  }
  updateVolumeOptions();

  const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  function matches(row, q) {
    if (!q) return true;
    const hay = norm(Object.values(row).join(' '));
    return q.split(/\s+/).filter(Boolean).every(t => hay.includes(t));
  }

  function esc(s) {
    return (s || '').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function linkify(url) {
    if (!url) return '';
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) return esc(u);
    return `<a href="${esc(u)}" target="_blank" rel="noopener">Abrir fonte</a>`;
  }

  function field(label, value) {
    if (!value || !String(value).trim()) return '';
    return `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
  }

  function card(row) {
    const id = esc(row['Identificador']);
    const prog = esc(row['Programa']);
    const vol = esc(row['Volume']);
    const sec = esc(row['Seção ou atividade']);
    const mat = esc(row['Material']);
    const conhec = esc(row['Conhecimento matemático']);
    const acao = esc(row['Ação da criança']);
    const pImp = esc(row['Página impressa']);
    const pPdf = esc(row['Página do PDF']);
    const fonte = row['Fonte'];
    const pages = [pImp && `imp. ${esc(pImp)}`, pPdf && `PDF ${esc(pPdf)}`].filter(Boolean).join(' · ');
    return `<article class="card">
      <div class="card-header">
        <span class="badge id">${id}</span>
        <span class="badge">${prog}</span>
        <span class="badge vol">${vol}</span>
      </div>
      <h3>${sec || '(Sem título de seção)'}</h3>
      <p class="meta">${pages}${pages && mat ? ' · ' : ''}${esc(mat)}</p>
      <dl>
        ${field('Conhecimento matemático', conhec)}
        ${field('Ação da criança', acao)}
      </dl>
      <details>
        <summary>Detalhes do registro</summary>
        <div class="extra">
          <dl>
            ${field('Trecho de localização', row['Trecho de localização'])}
            ${field('Mediação docente', row['Mediação docente'])}
            ${field('Explicação, registro e sistematização', row['Explicação, registro e sistematização'])}
            ${field('Tarefa ou oportunidade do cursista', row['Tarefa ou oportunidade do cursista'])}
            ${field('Interpretação e limites', row['Interpretação e limites'])}
          </dl>
        </div>
      </details>
      ${fonte ? `<div class="source-link">${linkify(fonte)}</div>` : ''}
    </article>`;
  }

  function render() {
    const q = norm(els.q.value);
    const prog = els.programa.value;
    const vol = els.volume.value;
    let rows = data.filter(r =>
      (!prog || r['Programa'] === prog) &&
      (!vol || r['Volume'] === vol) &&
      matches(r, q)
    );
    if (els.sort.value === 'programa') {
      rows = rows.slice().sort((a,b) =>
        (a['Programa']||'').localeCompare(b['Programa']||'', 'pt-BR', {numeric:true}) ||
        (a['Volume']||'').localeCompare(b['Volume']||'', 'pt-BR', {numeric:true}) ||
        (a['Identificador']||'').localeCompare(b['Identificador']||'', 'pt-BR', {numeric:true})
      );
    } else {
      rows = rows.slice().sort((a,b) => (a['Identificador']||'').localeCompare(b['Identificador']||'', 'pt-BR', {numeric:true}));
    }
    els.cards.innerHTML = rows.map(card).join('');
    els.count.textContent = `${rows.length} de ${data.length} registros`;
    els.empty.hidden = rows.length !== 0;
  }

  let t;
  els.q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 120); });
  els.programa.addEventListener('change', () => { updateVolumeOptions(); render(); });
  els.volume.addEventListener('change', render);
  els.sort.addEventListener('change', render);
  els.clear.addEventListener('click', () => {
    els.q.value = ''; els.programa.value = ''; updateVolumeOptions(); els.volume.value = ''; els.sort.value = 'id'; render();
  });

  render();
}
main().catch(err => {
  document.getElementById('count').textContent = 'Erro ao carregar os dados.';
  console.error(err);
});
