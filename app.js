  // ============================================================
  //  EDUPRO — LÓGICA PRINCIPAL
  //  Firebase + Anthropic IA + SheetJS Export
  // ============================================================

  // ── Estado global ────────────────────────────────────────────
  let db, auth;
  let currentUser   = null;
  let currentProfile= null;
  let turmasCache   = [];
  let alunosCache   = {};   // turmaId → []
  let chamadaAtual  = {};   // alunoId → status
  let chatHistory   = [];
  let notasCache    = [];
  let currentTurmaId= null;

  // ── Init ─────────────────────────────────────────────────────
  (function init() {
    // Aguarda Firebase module ser carregado
    const tryInit = setInterval(() => {
      if (!window._firebase) return;
      clearInterval(tryInit);

      const F = window._firebase;
      const app = F.initializeApp(firebaseConfig);
      auth = F.getAuth(app);
      db   = F.getFirestore(app);
      window._db   = db;
      window._auth = auth;

      // Data padrão hoje
      const hoje = new Date().toISOString().slice(0,10);
      document.getElementById('chamada-data').value = hoje;

      F.onAuthStateChanged(auth, async user => {
        if (user) {
          currentUser = user;
          await carregarPerfil(user.uid);
          mostrarApp();
        } else {
          currentUser = null;
          mostrarAuth();
        }
      });
    }, 100);
  })();

  // ── Auth helpers ─────────────────────────────────────────────
  function mostrarAuth() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display  = 'none';
  }

  function mostrarApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display  = 'block';
    atualizarSidebar();
    carregarDashboard();
    carregarTurmasGlobal();
  }

  function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t,i) => {
      t.classList.toggle('active', (i===0 && tab==='login') || (i===1 && tab==='register'));
    });
    document.getElementById('form-login').classList.toggle('hidden', tab!=='login');
    document.getElementById('form-register').classList.toggle('hidden', tab!=='register');
  }

  async function doLogin() {
    const F = window._firebase;
    const email = v('login-email'), pass = v('login-password');
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';
    try {
      await F.signInWithEmailAndPassword(auth, email, pass);
    } catch(e) {
      errEl.style.display = 'block';
      errEl.textContent = traduzirErroFirebase(e.code);
    }
  }

  async function doRegister() {
    const F = window._firebase;
    const name  = v('reg-name'), email = v('reg-email'),
          pass  = v('reg-password'), role = v('reg-role'),
          code  = v('reg-code').trim().toUpperCase();
    const errEl = document.getElementById('reg-error');
    errEl.style.display = 'none';

    if (code !== CODIGO_CONVITE.toUpperCase()) {
      errEl.style.display = 'block';
      errEl.textContent = 'Código de convite inválido.';
      return;
    }
    if (!name || !email || !pass) {
      errEl.style.display = 'block';
      errEl.textContent = 'Preencha todos os campos.';
      return;
    }
    try {
      const cred = await F.createUserWithEmailAndPassword(auth, email, pass);
      await F.updateProfile(cred.user, { displayName: name });
      const F2 = window._firebase;
      await F2.setDoc(F2.doc(db, 'usuarios', cred.user.uid), {
        nome: name, email, role,
        escola: ESCOLA_PADRAO,
        createdAt: F2.serverTimestamp()
      });
      toast('Conta criada com sucesso! Bem-vindo(a)!', 'success');
    } catch(e) {
      errEl.style.display = 'block';
      errEl.textContent = traduzirErroFirebase(e.code);
    }
  }

  async function doLogout() {
    await window._firebase.signOut(auth);
    chatHistory = [];
    toast('Até logo!', 'info');
  }

  async function carregarPerfil(uid) {
    const F = window._firebase;
    try {
      const snap = await F.getDoc(F.doc(db, 'usuarios', uid));
      if (snap.exists()) currentProfile = snap.data();
      else currentProfile = { nome: currentUser.displayName || 'Usuário', role: 'professor', escola: ESCOLA_PADRAO };
    } catch(e) {
      currentProfile = { nome: currentUser.displayName || 'Usuário', role: 'professor', escola: ESCOLA_PADRAO };
    }
  }

  function traduzirErroFirebase(code) {
    const map = {
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/email-already-in-use': 'E-mail já está em uso.',
      'auth/weak-password': 'Senha muito fraca (mín. 6 caracteres).',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/network-request-failed': 'Erro de rede. Verifique sua conexão.',
    };
    return map[code] || 'Erro: ' + code;
  }

  // ── Sidebar & Nav ─────────────────────────────────────────────
  function atualizarSidebar() {
    if (!currentProfile) return;
    const role  = currentProfile.role || 'professor';
    const nome  = currentProfile.nome || currentUser?.displayName || '?';
    const escola= currentProfile.escola || ESCOLA_PADRAO;

    document.getElementById('school-name').textContent   = escola;
    document.getElementById('user-name-display').textContent = nome;
    document.getElementById('user-role-display').textContent = role === 'direcao' ? '👑 Direção' : '👩‍🏫 Professor';
    document.getElementById('user-avatar').textContent   = nome.charAt(0).toUpperCase();
  }

  function navTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page)?.classList.add('active');

    const titles = {
      dashboard: 'Dashboard', chamada: 'Chamada Digital',
      frequencia: 'Frequência', planos: 'Planos de Aula',
      anotacoes: 'Anotações', chat: 'Assistente IA',
      turmas: 'Turmas & Alunos', exportar: 'Exportar Excel'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.getAttribute('onclick')?.includes("'"+page+"'")) n.classList.add('active');
    });

    closeSidebar();

    // Page-specific load
    if (page === 'chamada')   popularSelectTurmas('chamada-turma-sel');
    if (page === 'frequencia') popularSelectTurmas('freq-turma-sel');
    if (page === 'anotacoes') { carregarNotas(); popularSelectTurmas('nota-turma-sel'); }
    if (page === 'planos')    carregarPlanosSalvos();
    if (page === 'turmas')    renderizarTurmas();
    if (page === 'dashboard') carregarDashboard();
  }

  function openSidebar()  { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').classList.add('open'); }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('open'); }

  // ── Turmas ────────────────────────────────────────────────────
  async function carregarTurmasGlobal() {
    const F = window._firebase;
    try {
      const q = currentProfile?.role === 'direcao'
        ? F.collection(db, 'turmas')
        : F.query(F.collection(db, 'turmas'), F.where('prof_id', '==', currentUser.uid));
      const snap = await F.getDocs(q);
      turmasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) { turmasCache = []; }
  }

  async function salvarTurma() {
    const F = window._firebase;
    const nome   = v('nova-turma-nome');
    const serie  = v('nova-turma-serie');
    const turno  = v('nova-turma-turno');
    if (!nome) { toast('Informe o nome da turma.', 'error'); return; }
    try {
      await F.addDoc(F.collection(db, 'turmas'), {
        nome, serie, turno,
        prof_id: currentUser.uid,
        prof_nome: currentProfile?.nome || '',
        escola: currentProfile?.escola || ESCOLA_PADRAO,
        createdAt: F.serverTimestamp()
      });
      toast('Turma criada!', 'success');
      closeModal('modal-nova-turma');
      sv('nova-turma-nome',''); sv('nova-turma-serie','');
      await carregarTurmasGlobal();
      renderizarTurmas();
    } catch(e) { toast('Erro ao criar turma.', 'error'); }
  }

  function renderizarTurmas() {
    const el = document.getElementById('turmas-lista');
    if (!turmasCache.length) {
      el.innerHTML = '<p style="color:var(--text3);font-size:14px">Nenhuma turma cadastrada. Crie sua primeira turma!</p>';
      return;
    }
    el.innerHTML = turmasCache.map(t => `
      <div class="plan-item" onclick="selecionarTurma('${t.id}','${esc(t.nome)}')">
        <div class="plan-item-header">
          <div class="plan-item-title">🏫 ${esc(t.nome)}</div>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deletarTurma('${t.id}')">🗑️</button>
        </div>
        <div class="plan-item-meta">Série: ${esc(t.serie||'—')} · Turno: ${esc(t.turno||'—')}</div>
      </div>
    `).join('');
  }

  async function selecionarTurma(id, nome) {
    currentTurmaId = id;
    document.getElementById('turma-selecionada-title').textContent = `🎓 Alunos — ${nome}`;
    document.getElementById('section-alunos').style.display = 'block';
    document.getElementById('modal-novo-aluno').dataset.turma = id;
    await carregarAlunos(id);
  }

  async function carregarAlunos(turmaId) {
    const F = window._firebase;
    try {
      const q = F.query(F.collection(db, 'alunos'), F.where('turma_id', '==', turmaId));
      const snap = await F.getDocs(q);
      alunosCache[turmaId] = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => a.nome.localeCompare(b.nome));
      renderizarAlunos(turmaId);
    } catch(e) { alunosCache[turmaId] = []; }
  }

  function renderizarAlunos(turmaId) {
    const el  = document.getElementById('alunos-lista');
    const lst = alunosCache[turmaId] || [];
    if (!lst.length) {
      el.innerHTML = '<p style="color:var(--text3);font-size:14px">Nenhum aluno nesta turma.</p>';
      return;
    }
    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Matrícula</th><th>Ação</th></tr></thead>
          <tbody>
            ${lst.map((a,i) => `
              <tr>
                <td>${i+1}</td>
                <td>${esc(a.nome)}</td>
                <td>${esc(a.matricula||'—')}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deletarAluno('${a.id}','${turmaId}')">🗑️</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }

  async function salvarAluno() {
    const F = window._firebase;
    const turmaId = document.getElementById('modal-novo-aluno').dataset.turma || currentTurmaId;
    const nome = v('novo-aluno-nome');
    const mat  = v('novo-aluno-matricula');
    if (!nome || !turmaId) { toast('Informe o nome do aluno.', 'error'); return; }
    try {
      await F.addDoc(F.collection(db, 'alunos'), {
        nome, matricula: mat, turma_id: turmaId,
        prof_id: currentUser.uid,
        createdAt: F.serverTimestamp()
      });
      toast('Aluno adicionado!', 'success');
      closeModal('modal-novo-aluno');
      sv('novo-aluno-nome',''); sv('novo-aluno-matricula','');
      await carregarAlunos(turmaId);
    } catch(e) { toast('Erro ao salvar aluno.', 'error'); }
  }

  async function deletarTurma(id) {
    if (!confirm('Deletar esta turma? Os alunos associados não serão deletados.')) return;
    const F = window._firebase;
    try {
      await F.deleteDoc(F.doc(db, 'turmas', id));
      await carregarTurmasGlobal();
      renderizarTurmas();
      document.getElementById('section-alunos').style.display = 'none';
      toast('Turma deletada.', 'info');
    } catch(e) { toast('Erro ao deletar.', 'error'); }
  }

  async function deletarAluno(id, turmaId) {
    if (!confirm('Deletar este aluno?')) return;
    const F = window._firebase;
    try {
      await F.deleteDoc(F.doc(db, 'alunos', id));
      await carregarAlunos(turmaId);
      toast('Aluno removido.', 'info');
    } catch(e) { toast('Erro ao deletar.', 'error'); }
  }

  function popularSelectTurmas(selId) {
    const sel = document.getElementById(selId);
    if (!sel) return;
    const curr = sel.value;
    sel.innerHTML = '<option value="">Selecione a turma...</option>' +
      turmasCache.map(t => `<option value="${t.id}" ${t.id===curr?'selected':''}>${esc(t.nome)}</option>`).join('');
  }

  // ── Chamada ───────────────────────────────────────────────────
  async function carregarChamada() {
    const turmaId = v('chamada-turma-sel');
    if (!turmaId) return;
    const F = window._firebase;
    chamadaAtual = {};

    if (!alunosCache[turmaId]) await carregarAlunos(turmaId);
    const alunos = alunosCache[turmaId] || [];
    alunos.forEach(a => chamadaAtual[a.id] = 'pendente');

    const turma = turmasCache.find(t => t.id === turmaId);
    document.getElementById('chamada-titulo').textContent = `📋 ${turma?.nome || 'Turma'} — ${alunos.length} alunos`;

    await verificarChamadaExistente();
    renderizarChamadaGrid(alunos);
  }

  async function verificarChamadaExistente() {
    const turmaId = v('chamada-turma-sel');
    const data    = v('chamada-data');
    if (!turmaId || !data) return;
    const F = window._firebase;
    try {
      const snap = await F.getDocs(F.query(F.collection(db, 'chamadas'),
        F.where('turma_id','==',turmaId), F.where('data','==',data)));
      if (!snap.empty) {
        const chamada = snap.docs[0].data();
        chamadaAtual = chamada.registros || {};
        const alunos = alunosCache[turmaId] || [];
        renderizarChamadaGrid(alunos);
        toast('Chamada deste dia carregada!', 'info');
      }
    } catch(e) {}
  }

  function renderizarChamadaGrid(alunos) {
    const grid = document.getElementById('chamada-grid');
    if (!alunos.length) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🎓</div><h3>Sem alunos</h3><p>Cadastre alunos nesta turma</p></div>';
      return;
    }
    grid.innerHTML = alunos.map(a => {
      const st = chamadaAtual[a.id] || 'pendente';
      const icons = { presente:'✅', falta:'❌', justificado:'📋', pendente:'⬜' };
      const labels = { presente:'Presente', falta:'Falta', justificado:'Justificado', pendente:'—' };
      return `
        <div class="aluno-card ${st}" id="card-${a.id}" onclick="toggleStatus('${a.id}')">
          <div class="card-avatar">${icons[st]}</div>
          <div class="card-name">${esc(a.nome)}</div>
          <span class="status-badge badge-${st}">${labels[st]}</span>
        </div>`;
    }).join('');
    atualizarResumo(alunos);
  }

  function toggleStatus(alunoId) {
    const ordem = ['pendente','presente','falta','justificado'];
    const curr  = chamadaAtual[alunoId] || 'pendente';
    const next  = ordem[(ordem.indexOf(curr)+1) % ordem.length];
    chamadaAtual[alunoId] = next;
    const turmaId = v('chamada-turma-sel');
    const alunos  = alunosCache[turmaId] || [];
    renderizarChamadaGrid(alunos);
  }

  function atualizarResumo(alunos) {
    const counts = { presente:0, falta:0, justificado:0, pendente:0 };
    alunos.forEach(a => counts[chamadaAtual[a.id] || 'pendente']++);
    document.getElementById('chamada-resumo').innerHTML = `
      <span class="chip">✅ ${counts.presente}</span>
      <span class="chip">❌ ${counts.falta}</span>
      <span class="chip">📋 ${counts.justificado}</span>
      <span class="chip">⬜ ${counts.pendente}</span>`;
  }

  async function salvarChamada() {
    const turmaId = v('chamada-turma-sel');
    const data    = v('chamada-data');
    if (!turmaId) { toast('Selecione uma turma.', 'error'); return; }
    if (!data)    { toast('Selecione a data.', 'error'); return; }
    const F = window._firebase;
    try {
      // Busca e sobrescreve ou cria
      const q    = F.query(F.collection(db,'chamadas'), F.where('turma_id','==',turmaId), F.where('data','==',data));
      const snap = await F.getDocs(q);
      const turma = turmasCache.find(t => t.id === turmaId);
      const payload = { turma_id: turmaId, turma_nome: turma?.nome||'', data, registros: chamadaAtual,
        prof_id: currentUser.uid, updatedAt: F.serverTimestamp() };
      if (!snap.empty) {
        await F.updateDoc(F.doc(db,'chamadas',snap.docs[0].id), payload);
      } else {
        await F.addDoc(F.collection(db,'chamadas'), { ...payload, createdAt: F.serverTimestamp() });
      }
      toast('Chamada salva com sucesso!', 'success');
      carregarDashboard();
    } catch(e) { toast('Erro ao salvar chamada: '+e.message, 'error'); }
  }

  // ── Frequência ────────────────────────────────────────────────
  async function carregarFrequencia() {
    const turmaId = v('freq-turma-sel');
    if (!turmaId) return;
    const F = window._firebase;

    if (!alunosCache[turmaId]) await carregarAlunos(turmaId);
    const alunos = alunosCache[turmaId] || [];
    if (!alunos.length) {
      document.getElementById('freq-tabela').innerHTML = '<p style="color:var(--text3);font-size:14px">Sem alunos nesta turma.</p>';
      return;
    }

    const snap = await F.getDocs(F.query(F.collection(db,'chamadas'), F.where('turma_id','==',turmaId)));
    const chamadas = snap.docs.map(d => d.data());
    const total = chamadas.length;

    const dados = alunos.map(a => {
      const p = chamadas.filter(c => c.registros?.[a.id] === 'presente').length;
      const j = chamadas.filter(c => c.registros?.[a.id] === 'justificado').length;
      const f = chamadas.filter(c => c.registros?.[a.id] === 'falta').length;
      const pct = total > 0 ? Math.round(((p+j)/total)*100) : null;
      const cls = pct === null ? '' : pct >= 75 ? 'ok' : pct >= 60 ? 'alerta' : 'critico';
      const status = pct === null ? '—' : pct >= 75 ? '✅ Regular' : pct >= 60 ? '⚠️ Alerta' : '🚨 Crítico';
      return { ...a, p, j, f, pct, cls, status };
    }).sort((a,b) => (a.pct??101) - (b.pct??101));

    document.getElementById('freq-tabela').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Aluno</th><th>Presenças</th><th>Faltas</th><th>Justif.</th><th>Frequência</th><th>Status</th></tr></thead>
          <tbody>
            ${dados.map(a => `
              <tr>
                <td><strong>${esc(a.nome)}</strong></td>
                <td>${a.p}</td>
                <td>${a.f}</td>
                <td>${a.j}</td>
                <td>
                  ${a.pct !== null ? `
                    <div class="progress-bar"><div class="progress-fill ${a.cls}" style="width:${a.pct}%"></div></div>
                    <span style="font-size:12px;font-weight:600">${a.pct}%</span>
                  ` : '<span style="color:var(--text3)">Sem chamadas</span>'}
                </td>
                <td>${a.status}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:14px;font-size:12px;color:var(--text3)">${total} chamada(s) registrada(s)</div>`;
  }

  // ── Planos de Aula ────────────────────────────────────────────
  async function gerarPlano() {
    const disc  = v('plan-disciplina');
    const turma = v('plan-turma');
    const dur   = v('plan-duracao');
    const tema  = v('plan-tema');
    const obs   = v('plan-obs');

    if (!disc || !tema) { toast('Preencha disciplina e tema.', 'error'); return; }

    const prompt = `Você é um especialista em educação. Crie um plano de aula detalhado e prático com a seguinte estrutura:

  **PLANO DE AULA**
  Disciplina: ${disc}
  Turma/Série: ${turma || 'Não especificado'}
  Duração: ${dur || '50 minutos'}
  Tema: ${tema}
  ${obs ? 'Observações: '+obs : ''}

  Estruture o plano com:
  1. Objetivos de aprendizagem (3-4 objetivos)
  2. Materiais necessários
  3. Desenvolvimento da aula (introdução, desenvolvimento, conclusão com tempos estimados)
  4. Atividades práticas
  5. Avaliação
  6. Tarefa para casa (se aplicável)

  Seja específico, prático e use linguagem clara.`;

    document.getElementById('section-plano-resultado').style.display = 'block';
    document.getElementById('plan-resultado').value = '⏳ Gerando plano com IA...';

    try {
      const text = await chamarAnthropicAPI(prompt);
      document.getElementById('plan-resultado').value = text;
      toast('Plano gerado!', 'success');
    } catch(e) {
      document.getElementById('plan-resultado').value = 'Erro ao gerar plano: ' + e.message + '\n\nVerifique se a chave API está correta no config.js';
      toast('Erro na IA: '+e.message, 'error');
    }
  }

  async function salvarPlano() {
    const F = window._firebase;
    const conteudo = v('plan-resultado');
    if (!conteudo || conteudo.startsWith('⏳')) { toast('Nenhum plano para salvar.', 'error'); return; }
    const titulo = `${v('plan-disciplina')||'Plano'} — ${v('plan-tema')||'Sem título'}`;
    try {
      await F.addDoc(F.collection(db,'planos'), {
        titulo, conteudo,
        disciplina: v('plan-disciplina'),
        turma: v('plan-turma'),
        tema: v('plan-tema'),
        prof_id: currentUser.uid,
        createdAt: F.serverTimestamp()
      });
      toast('Plano salvo!', 'success');
      carregarPlanosSalvos();
    } catch(e) { toast('Erro ao salvar: '+e.message, 'error'); }
  }

  async function carregarPlanosSalvos() {
    const F = window._firebase;
    try {
      const snap = await F.getDocs(F.query(F.collection(db,'planos'), F.where('prof_id','==',currentUser.uid)));
      const planos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      const el = document.getElementById('planos-salvos-lista');
      if (!planos.length) { el.innerHTML = '<p style="color:var(--text3);font-size:14px">Nenhum plano salvo ainda.</p>'; return; }
      el.innerHTML = planos.map(p => `
        <div class="plan-item" onclick="verPlano('${p.id}','${esc(p.titulo)}','${encodeURIComponent(p.conteudo||'')}')">
          <div class="plan-item-header">
            <div class="plan-item-title">${esc(p.titulo)}</div>
            <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deletarPlano('${p.id}')">🗑️</button>
          </div>
          <div class="plan-item-meta">${p.disciplina||''} ${p.turma?'· '+p.turma:''}</div>
          <div class="plan-item-preview">${esc((p.conteudo||'').slice(0,120))}...</div>
        </div>`).join('');
    } catch(e) { console.error(e); }
  }

  function verPlano(id, titulo, conteudoEnc) {
    document.getElementById('ver-plano-titulo').textContent = titulo;
    document.getElementById('ver-plano-conteudo').value = decodeURIComponent(conteudoEnc);
    openModal('modal-ver-plano');
  }

  async function deletarPlano(id) {
    if (!confirm('Deletar este plano?')) return;
    const F = window._firebase;
    await F.deleteDoc(F.doc(db,'planos',id));
    toast('Plano deletado.', 'info');
    carregarPlanosSalvos();
  }

  // ── Anotações ─────────────────────────────────────────────────
  async function carregarAlunosNota() {
    const turmaId = v('nota-turma-sel');
    if (!turmaId) return;
    if (!alunosCache[turmaId]) await carregarAlunos(turmaId);
    const sel = document.getElementById('nota-aluno-sel');
    sel.innerHTML = '<option value="">Selecione o aluno...</option>' +
      (alunosCache[turmaId]||[]).map(a => `<option value="${a.id}|${esc(a.nome)}">${esc(a.nome)}</option>`).join('');
  }

  async function sugestaoIA() {
    const alunoVal = v('nota-aluno-sel');
    const texto    = v('nota-texto');
    if (!alunoVal || !texto) { toast('Selecione o aluno e escreva uma observação.', 'error'); return; }
    const nome = alunoVal.split('|')[1] || 'aluno';
    const prompt = `Sou professor(a) e fiz esta anotação sobre ${nome}: "${texto}"\n\nComo especialista em pedagogia, sugira:\n1. Uma análise breve do que essa observação revela\n2. 3 estratégias pedagógicas específicas para ajudar este aluno\n3. Uma sugestão de como comunicar isso para os pais\n\nSeja prático e empático.`;
    const box = document.getElementById('nota-sugestao');
    box.style.display = 'block';
    box.textContent = '⏳ Gerando sugestão...';
    try {
      const text = await chamarAnthropicAPI(prompt);
      box.textContent = text;
    } catch(e) {
      box.textContent = 'Erro: ' + e.message;
    }
  }

  async function salvarNota() {
    const F = window._firebase;
    const alunoVal = v('nota-aluno-sel');
    const texto    = v('nota-texto');
    if (!alunoVal || !texto) { toast('Selecione o aluno e escreva a anotação.', 'error'); return; }
    const [alunoId, alunoNome] = alunoVal.split('|');
    const turmaId = v('nota-turma-sel');
    const turma   = turmasCache.find(t => t.id === turmaId);
    try {
      await F.addDoc(F.collection(db,'anotacoes'), {
        aluno_id: alunoId, aluno_nome: alunoNome,
        turma_id: turmaId, turma_nome: turma?.nome||'',
        texto, prof_id: currentUser.uid,
        data: new Date().toISOString().slice(0,10),
        createdAt: F.serverTimestamp()
      });
      toast('Anotação salva!', 'success');
      sv('nota-texto','');
      document.getElementById('nota-sugestao').style.display = 'none';
      carregarNotas();
    } catch(e) { toast('Erro ao salvar: '+e.message, 'error'); }
  }

  async function carregarNotas() {
    const F = window._firebase;
    try {
      const snap = await F.getDocs(F.query(F.collection(db,'anotacoes'), F.where('prof_id','==',currentUser.uid)));
      notasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      renderizarNotas(notasCache);
    } catch(e) { console.error(e); }
  }

  function filtrarNotas() {
    const q = v('nota-search').toLowerCase();
    renderizarNotas(notasCache.filter(n => n.aluno_nome?.toLowerCase().includes(q)));
  }

  function renderizarNotas(lista) {
    const el = document.getElementById('notas-lista');
    if (!lista.length) {
      el.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🗒️</div><h3>Sem anotações</h3></div>';
      return;
    }
    el.innerHTML = lista.map(n => `
      <div class="nota-card">
        <div class="nota-card-header">
          <div class="nota-card-name">🎓 ${esc(n.aluno_nome||'')}</div>
          <button class="btn btn-danger btn-sm" onclick="deletarNota('${n.id}')">🗑️</button>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:8px">${esc(n.turma_nome||'')} · ${n.data||''}</div>
        <div class="nota-card-text">${esc(n.texto||'')}</div>
      </div>`).join('');
  }

  async function deletarNota(id) {
    if (!confirm('Deletar esta anotação?')) return;
    const F = window._firebase;
    await F.deleteDoc(F.doc(db,'anotacoes',id));
    toast('Anotação deletada.', 'info');
    carregarNotas();
  }

  // ── Chat IA ───────────────────────────────────────────────────
  function chatEnter(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarChat(); }
  }

  async function enviarChat() {
    const input = document.getElementById('chat-input');
    const msg   = input.value.trim();
    if (!msg) return;
    input.value = '';

    appendChatMsg('user', msg);
    chatHistory.push({ role:'user', content: msg });

    const loadId = appendChatLoading();
    try {
      const resp = await chamarAnthropicAPIChat(chatHistory);
      removeChatLoading(loadId);
      appendChatMsg('ai', resp);
      chatHistory.push({ role:'assistant', content: resp });
    } catch(e) {
      removeChatLoading(loadId);
      appendChatMsg('ai', '❌ Erro: '+e.message+'. Verifique a chave API no config.js');
    }
  }

  function appendChatMsg(role, text) {
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = `
      <div class="msg-avatar">${role==='user'?'👤':'🤖'}</div>
      <div class="msg-bubble">${esc(text).replace(/\n/g,'<br>')}</div>`;
    const box = document.getElementById('chat-messages');
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
  }

  function appendChatLoading() {
    const id  = 'load-'+Date.now();
    const div = document.createElement('div');
    div.className = 'chat-msg ai';
    div.id = id;
    div.innerHTML = `<div class="msg-avatar">🤖</div><div class="msg-bubble"><div class="loading-dots"><span></span><span></span><span></span></div></div>`;
    document.getElementById('chat-messages').appendChild(div);
    document.getElementById('chat-messages').scrollTop = 9999;
    return id;
  }

  function removeChatLoading(id) {
    document.getElementById(id)?.remove();
  }

  // ── Dashboard ─────────────────────────────────────────────────
  async function carregarDashboard() {
    if (!currentUser || !db) return;
    const F = window._firebase;
    try {
      // Turmas
      await carregarTurmasGlobal();
      document.getElementById('kpi-turmas').textContent = turmasCache.length;

      // Alunos
      let totalAlunos = 0;
      for (const t of turmasCache) {
        const snap = await F.getDocs(F.query(F.collection(db,'alunos'), F.where('turma_id','==',t.id)));
        totalAlunos += snap.size;
        alunosCache[t.id] = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.nome.localeCompare(b.nome));
      }
      document.getElementById('kpi-alunos').textContent = totalAlunos;

      // Planos
      const planSnap = await F.getDocs(F.query(F.collection(db,'planos'), F.where('prof_id','==',currentUser.uid)));
      document.getElementById('kpi-planos').textContent = planSnap.size;

      // Frequência média geral
      const chamSnap = await F.getDocs(F.query(F.collection(db,'chamadas'), F.where('prof_id','==',currentUser.uid)));
      const chamadas = chamSnap.docs.map(d=>d.data());
      if (chamadas.length) {
        let p=0, t=0;
        chamadas.forEach(c => {
          Object.values(c.registros||{}).forEach(s => {
            t++;
            if (s==='presente'||s==='justificado') p++;
          });
        });
        document.getElementById('kpi-freq').textContent = t>0 ? Math.round(p/t*100)+'%' : '—';
      } else {
        document.getElementById('kpi-freq').textContent = '—';
      }

      // Últimas chamadas
      const ultimas = chamadas.sort((a,b)=>(b.data||'').localeCompare(a.data||'')).slice(0,5);
      const el = document.getElementById('dash-chamadas-lista');
      if (!ultimas.length) {
        el.innerHTML = '<p style="color:var(--text3);font-size:14px">Nenhuma chamada registrada ainda.</p>';
      } else {
        el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Turma</th><th>Presentes</th><th>Faltas</th></tr></thead><tbody>
          ${ultimas.map(c => {
            const regs = Object.values(c.registros||{});
            const pres = regs.filter(s=>s==='presente'||s==='justificado').length;
            const falt = regs.filter(s=>s==='falta').length;
            return `<tr><td>${c.data||'—'}</td><td>${esc(c.turma_nome||'')}</td><td><span class="chip">✅ ${pres}</span></td><td><span class="chip">❌ ${falt}</span></td></tr>`;
          }).join('')}
        </tbody></table></div>`;
      }
    } catch(e) { console.error('Dashboard:', e); }
  }

  // ── Exportar Excel ────────────────────────────────────────────
  async function exportarFrequencia() {
    const F = window._firebase;
    toast('Preparando exportação...', 'info');
    try {
      const rows = [['Turma','Aluno','Presenças','Faltas','Justificadas','Total Aulas','% Frequência']];
      for (const t of turmasCache) {
        const alunos = alunosCache[t.id] || [];
        const snap   = await F.getDocs(F.query(F.collection(db,'chamadas'), F.where('turma_id','==',t.id)));
        const chamadas = snap.docs.map(d=>d.data());
        for (const a of alunos) {
          const p = chamadas.filter(c=>c.registros?.[a.id]==='presente').length;
          const j = chamadas.filter(c=>c.registros?.[a.id]==='justificado').length;
          const f = chamadas.filter(c=>c.registros?.[a.id]==='falta').length;
          const tot = chamadas.length;
          rows.push([t.nome, a.nome, p, f, j, tot, tot>0?((p+j)/tot*100).toFixed(1)+'%':'—']);
        }
      }
      xlsxDownload(rows, 'frequencia');
      toast('Excel gerado!', 'success');
    } catch(e) { toast('Erro: '+e.message,'error'); }
  }

  async function exportarAnotacoes() {
    const F = window._firebase;
    toast('Preparando exportação...', 'info');
    try {
      const snap = await F.getDocs(F.query(F.collection(db,'anotacoes'), F.where('prof_id','==',currentUser.uid)));
      const rows = [['Data','Aluno','Turma','Anotação']];
      snap.docs.forEach(d => {
        const n = d.data();
        rows.push([n.data||'', n.aluno_nome||'', n.turma_nome||'', n.texto||'']);
      });
      xlsxDownload(rows, 'anotacoes');
      toast('Excel gerado!', 'success');
    } catch(e) { toast('Erro: '+e.message,'error'); }
  }

  async function exportarPlanos() {
    const F = window._firebase;
    toast('Preparando exportação...', 'info');
    try {
      const snap = await F.getDocs(F.query(F.collection(db,'planos'), F.where('prof_id','==',currentUser.uid)));
      const rows = [['Título','Disciplina','Turma','Tema','Conteúdo']];
      snap.docs.forEach(d => {
        const p = d.data();
        rows.push([p.titulo||'', p.disciplina||'', p.turma||'', p.tema||'', p.conteudo||'']);
      });
      xlsxDownload(rows, 'planos_de_aula');
      toast('Excel gerado!', 'success');
    } catch(e) { toast('Erro: '+e.message,'error'); }
  }

  function xlsxDownload(rows, filename) {
    const ws  = XLSX.utils.aoa_to_sheet(rows);
    const wb  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, `edupro_${filename}_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  // ── Anthropic API ─────────────────────────────────────────────
  async function chamarAnthropicAPI(prompt) {
  const url = "/api/claude";
    const body = {
     model: "claude-3-haiku-20240307"
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
      system: "Você é um assistente pedagógico especialista em educação brasileira. Responda sempre em português do Brasil de forma prática e objetiva."
    };
    const resp = await fetch("/api/claude", {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`API ${resp.status}: ${err.slice(0,200)}`);
    }
    const data = await resp.json();
    return data.content?.[0]?.text || 'Sem resposta.';
  }

async function chamarAnthropicAPIChat(history) {
  const body = {
    model: "claude-3-haiku-20240307",
    max_tokens: 1000,
    system: "Você é um assistente pedagógico especialista em educação brasileira. Ajude professores e gestores escolares com estratégias de ensino, planejamento, gestão de sala de aula e questões pedagógicas. Responda sempre em português do Brasil.",
    messages: history.slice(-20)
  };

  const resp = await fetch("/api/claude", {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`API ${resp.status}: ${err.slice(0,200)}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text || 'Sem resposta.';
}

  // ── Modais ────────────────────────────────────────────────────
  function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
  });

  // ── Toast ─────────────────────────────────────────────────────
  function toast(msg, type='info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success:'✅', error:'❌', info:'ℹ️' };
    el.textContent = (icons[type]||'') + ' ' + msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ── Helpers ───────────────────────────────────────────────────
  const v   = id => document.getElementById(id)?.value || '';
  const sv  = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val; };
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
