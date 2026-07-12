(() => {
  const content = window.POCKET_CONTENT
  const app = document.querySelector('#app')
  const storageKey = `career-pocket:${content?.company || 'unknown'}:v1`
  const read = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') }
    catch { return {} }
  }
  const saved = read()
  const state = {
    section: saved.section === 'cases' ? 'cases' : 'qa',
    activeId: saved.activeId || content?.questions?.[0]?.id,
    activeCaseId: saved.activeCaseId || content?.cases?.[0]?.id,
    views: saved.views || {},
    caseViews: saved.caseViews || {},
    scrolls: saved.scrolls || {},
    theme: saved.theme || 'light',
  }

  const escape = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]))
  const persist = () => localStorage.setItem(storageKey, JSON.stringify(state))
  const current = () => content.questions.find((question) => question.id === state.activeId) || content.questions[0]
  const currentCase = () => content.cases.find((item) => item.id === state.activeCaseId) || content.cases[0]
  const scrollKey = () => state.section === 'cases' ? `case:${state.activeCaseId}` : `qa:${state.activeId}`
  const scriptHtml = (script) => script
    .replace(/^>\s?/gm, '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escape(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')

  function saveScroll() {
    const reader = document.querySelector('.reader')
    if (reader) {
      state.scrolls[scrollKey()] = reader.scrollTop
      persist()
    }
  }

  function render() {
    if (!content?.questions?.length) {
      app.innerHTML = '<section class="empty"><strong>还没有可离线使用的讲稿。</strong><span>请重新生成随身背稿包。</span></section>'
      return
    }
    const question = current()
    const isScript = state.views[question.id] === 'script'
    const caseItem = currentCase()
    const isCase = state.section === 'cases'
    const isDeep = state.caseViews[caseItem?.id] === 'deep'
    document.documentElement.dataset.theme = state.theme
    document.title = `${question.question} · ${content.company} 面试背稿`
    app.innerHTML = `
      <header class="topbar">
        <div>
          <span class="eyebrow">离线随身版</span>
          <strong>${escape(content.company)} 面试背稿</strong>
        </div>
        <div class="top-actions">
          <span class="network ${navigator.onLine ? 'online' : 'offline'}">${navigator.onLine ? '可同步' : '离线中'}</span>
          <button class="icon-button" type="button" data-theme aria-label="切换夜间模式">${state.theme === 'dark' ? '☀︎' : '☾'}</button>
        </div>
      </header>
      <nav class="question-tabs" aria-label="问题导航">
        <button type="button" data-section="qa" class="${!isCase ? 'active' : ''}"><span>01</span>回答讲稿</button>
        <button type="button" data-section="cases" class="${isCase ? 'active' : ''}"><span>02</span>案例库</button>
      </nav>
      <nav class="item-tabs" aria-label="${isCase ? '案例导航' : '问题导航'}">
        ${(isCase ? content.cases : content.questions).map((item, index) => `<button type="button" data-${isCase ? 'case' : 'question'}="${escape(item.id)}" class="${item.id === (isCase ? caseItem.id : question.id) ? 'active' : ''}"><span>${String(index + 1).padStart(2, '0')}</span>${escape(isCase ? item.title : item.question)}</button>`).join('')}
      </nav>
      <section class="reader">
        ${isCase ? `
          <div class="question-head">
            <span class="category">案例 · ${'★'.repeat(caseItem.strength)}</span>
            <button type="button" class="view-toggle" data-case-view aria-pressed="${isDeep}"><span>${isDeep ? '↗' : '⌁'}</span>${isDeep ? '短版' : '深挖'}</button>
          </div>
          <h1>${escape(caseItem.title)}</h1>
          <div class="case-tags"><span>${escape(caseItem.status)}</span>${caseItem.signals.map((signal) => `<span>${escape(signal)}</span>`).join('')}</div>
          ${isDeep && caseItem.detail.length ? `<section class="case-detail">${caseItem.detail.map((section) => `<article><h2>${escape(section.heading)}</h2><div class="detail-copy">${escape(section.body).replace(/\*\*/g, '').replace(/`/g, '')}</div></article>`).join('')}</section>` : `
            <section class="case-hook"><span class="section-label">30 秒钩子</span><div>${scriptHtml(caseItem.hook || '该案例尚未整理出 30 秒钩子。')}</div></section>
            ${caseItem.notes ? `<details open><summary>使用要点</summary><div class="notes">${scriptHtml(caseItem.notes)}</div></details>` : ''}
            ${caseItem.detail.length ? '<p class="map-hint">需要追问细节时，点右上角「深挖」。</p>' : ''}
          `}
        ` : `
          <div class="question-head">
            <span class="category">${escape(question.category)}</span>
            <button type="button" class="view-toggle" data-view aria-pressed="${isScript}"><span>${isScript ? '⌁' : '文'}</span>${isScript ? '思维图' : '原文'}</button>
          </div>
          <h1 lang="ja">${escape(question.question)}</h1>
          ${isScript ? `<section class="script" lang="ja">${scriptHtml(question.script)}</section>` : `
            <section class="map" aria-label="思维图">
              <span class="section-label">思维路线</span>
              <ol>${question.structure.map((step) => `<li>${escape(step)}</li>`).join('')}</ol>
            </section>
            <p class="map-hint">需要完整措辞时，点右上角「原文」。</p>
          `}
          ${question.notes ? `<details><summary>准备提示</summary><div class="notes">${scriptHtml(question.notes)}</div></details>` : ''}
        `}
      </section>
      <footer>内容快照：${new Date(content.generatedAt).toLocaleDateString('zh-CN')} · 更新后重新打开在线页面即可缓存新版</footer>
    `
    const reader = document.querySelector('.reader')
    reader.scrollTop = state.scrolls[scrollKey()] || 0
  }

  document.addEventListener('click', (event) => {
    const questionButton = event.target.closest('[data-question]')
    if (questionButton) {
      saveScroll()
      state.activeId = questionButton.dataset.question
      persist()
      render()
      return
    }
    const caseButton = event.target.closest('[data-case]')
    if (caseButton) {
      saveScroll()
      state.activeCaseId = caseButton.dataset.case
      persist()
      render()
      return
    }
    const sectionButton = event.target.closest('[data-section]')
    if (sectionButton) {
      saveScroll()
      state.section = sectionButton.dataset.section
      persist()
      render()
      return
    }
    if (event.target.closest('[data-view]')) {
      const question = current()
      state.views[question.id] = state.views[question.id] === 'script' ? 'map' : 'script'
      persist()
      render()
      return
    }
    if (event.target.closest('[data-case-view]')) {
      const item = currentCase()
      state.caseViews[item.id] = state.caseViews[item.id] === 'deep' ? 'hook' : 'deep'
      persist()
      render()
      return
    }
    if (event.target.closest('[data-theme]')) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      persist()
      render()
    }
  })
  window.addEventListener('online', render)
  window.addEventListener('offline', render)

  render()
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'))
})()
