async function main() {
  const res = await fetch('data.json');
  const payload = await res.json();
  const data = payload.rows || payload;

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

  const get = (r, k) => (r[k] ?? '').toString().trim();
  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((a,b) => a.localeCompare(b, 'pt-BR', {numeric:true}));
  const programas = uniq(data.map(d => get(d, 'fonte.programa')));
  for (const p of programas) els.programa.add(new Option(p, p));

  function updateVolumeOptions() {
    const prog = els.programa.value;
    const vols = uniq(data.filter(d => !prog || get(d,'fonte.programa') === prog).map(d => get(d,'fonte.volume')));
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
  function field(label, value) {
    const v = (value || '').toString().trim();
    if (!v) return '';
    return `<div><dt>${label}</dt><dd>${esc(v)}</dd></div>`;
  }
  function sectionFields(title, pairs) {
    const items = pairs.map(([l,k]) => field(l, get(thisRow, k))).filter(Boolean).join('');
    return items ? `<div class="extra-group"><h4>${title}</h4><dl>${items}</dl></div>` : '';
  }

  let thisRow = {};
  function card(row) {
    thisRow = row;
    const id = esc(get(row,'id_orientacao'));
    const prog = esc(get(row,'fonte.programa'));
    const vol = esc(get(row,'fonte.volume'));
    const sec = esc(get(row,'fonte.secao'));
    const material = esc(get(row,'recurso_finalidade.material'));
    const prop = esc(get(row,'conhecimento_matematico.propriedade_relacao_procedimento'));
    const acao = esc(get(row,'recurso_finalidade.acao_de_manipulacao'));
    const finalidade = esc(get(row,'recurso_finalidade.finalidade_atribuida'));
    const p1 = get(row,'fonte.pagina_impressa_ini'), p2 = get(row,'fonte.pagina_impressa_fim');
    const pdf1 = get(row,'fonte.pdf_pagina_ini'), pdf2 = get(row,'fonte.pdf_pagina_fim');
    const pImp = p1 ? (p2 && p2!==p1 ? `${p1}–${p2}` : p1) : '';
    const pPdf = pdf1 ? (pdf2 && pdf2!==pdf1 ? `${pdf1}–${pdf2}` : pdf1) : '';
    const pages = [pImp && `imp. ${esc(pImp)}`, pPdf && `PDF ${esc(pPdf)}`].filter(Boolean).join(' · ');

    const extraHtml = [
      (()=>{ const items = [['Material', 'recurso_finalidade.material'], ['Ação de manipulação', 'recurso_finalidade.acao_de_manipulacao'], ['Finalidade atribuída', 'recurso_finalidade.finalidade_atribuida'], ['Tipo de objeto', 'recurso_finalidade.tipo_objeto'], ['Origem', 'recurso_finalidade.origem']].map(([l,k])=>field(l,get(row,k))).filter(Boolean).join(''); return items?`<h4>Recurso e finalidade</h4><dl>${items}</dl>`:''; })(),
      (()=>{ const items = [['Propriedade/relação/procedimento', 'conhecimento_matematico.propriedade_relacao_procedimento'], ['Correspondência ação-matemática', 'conhecimento_matematico.correspondencia_acao_matematica'], ['Convenções e limites', 'conhecimento_matematico.convencoes_e_limites']].map(([l,k])=>field(l,get(row,k))).filter(Boolean).join(''); return items?`<h4>Conhecimento matemático</h4><dl>${items}</dl>`:''; })(),
      (()=>{ const items = [['Ações esperadas das crianças', 'acoes_mediacao.acoes_esperadas_das_criancas'], ['Intervenções propostas ao professor', 'acoes_mediacao.intervencoes_propostas_ao_professor'], ['Tarefas do cursista', 'acoes_mediacao.tarefas_do_cursista'], ['Estratégias ou dificuldades previstas', 'acoes_mediacao.estrategias_ou_dificuldades_previstas']].map(([l,k])=>field(l,get(row,k))).filter(Boolean).join(''); return items?`<h4>Ações e mediação</h4><dl>${items}</dl>`:''; })(),
      (()=>{ const items = [['Registro', 'representacoes_sistematizacao.registro'], ['Discussão ou justificativa', 'representacoes_sistematizacao.discussao_ou_justificativa'], ['Formulação geral', 'representacoes_sistematizacao.formulacao_geral'], ['Relação manipulação-fala-desenho-tabela-símbolo', 'representacoes_sistematizacao.relacao_manipulacao_fala_desenho_tabela_simbolo']].map(([l,k])=>field(l,get(row,k))).filter(Boolean).join(''); return items?`<h4>Representações e sistematização</h4><dl>${items}</dl>`:''; })(),
      (()=>{ const items = [['Explícito', 'interpretacao_fundamentada.explicito'], ['Inferido', 'interpretacao_fundamentada.inferido'], ['Em aberto para o professor', 'interpretacao_fundamentada.em_aberto_para_o_professor'], ['Critério teórico', 'interpretacao_fundamentada.criterio_teorico']].map(([l,k])=>field(l,get(row,k))).filter(Boolean).join(''); return items?`<h4>Interpretação fundamentada</h4><dl>${items}</dl>`:''; })(),
      (()=>{ const items = [['Evidência', 'fonte.evidencia'], ['Arquivo/PDF', 'fonte.arquivo_pdf'], ['Páginas citadas', 'fonte.paginas_citadas']].map(([l,k])=>field(l,get(row,k))).filter(Boolean).join(''); return items?`<h4>Fonte</h4><dl>${items}</dl>`:''; })(),
    ].filter(Boolean).join('');

    return `<article class="card">
      <div class="card-header">
        <span class="badge id">${id}</span>
        ${prog?`<span class="badge">${prog}</span>`:''}
        ${vol?`<span class="badge vol">${vol}</span>`:''}
      </div>
      <h3>${sec || '(Sem seção)'}</h3>
      <p class="meta">${pages}${pages && material ? ' · ' : ''}${material}</p>
      <dl>
        ${field('Conhecimento matemático', prop)}
        ${field('Ação de manipulação', acao)}
        ${field('Finalidade atribuída', finalidade)}
      </dl>
      <details>
        <summary>Detalhes do registro</summary>
        <div class="extra">${extraHtml}</div>
      </details>
    </article>`;
  }

  function render() {
    const q = norm(els.q.value);
    const prog = els.programa.value;
    const vol = els.volume.value;
    let rows = data.filter(r =>
      (!prog || get(r,'fonte.programa') === prog) &&
      (!vol || get(r,'fonte.volume') === vol) &&
      matches(r, q)
    );
    if (els.sort.value === 'fonte') {
      rows = rows.slice().sort((a,b) =>
        get(a,'fonte.programa').localeCompare(get(b,'fonte.programa'), 'pt-BR', {numeric:true}) ||
        get(a,'fonte.volume').localeCompare(get(b,'fonte.volume'), 'pt-BR', {numeric:true}) ||
        get(a,'fonte.secao').localeCompare(get(b,'fonte.secao'), 'pt-BR', {numeric:true}) ||
        get(a,'id_orientacao').localeCompare(get(b,'id_orientacao'), 'pt-BR', {numeric:true})
      );
    } else {
      rows = rows.slice().sort((a,b) => get(a,'id_orientacao').localeCompare(get(b,'id_orientacao'), 'pt-BR', {numeric:true}));
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
