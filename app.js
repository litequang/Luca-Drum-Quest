import { stages, skills, skillGroups, entries } from './data.js';

// Frontend demo only. No authentication, backend, video storage or payment processing.
// Backend Codex handoff: see docs/BACKEND_HANDOFF.md.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[character]));
const pages = new Set(['home', 'learning', 'journal', 'funding']);
let currentStage = 1;
let currentGroup = 'all';
let currentJournalFilter = 'all';

function navigate(page, updateHash = true) {
  const next = pages.has(page) ? page : 'home';
  $$('.view').forEach(view => {
    const active = view.dataset.view === next;
    view.hidden = !active;
    view.classList.toggle('is-visible', active);
  });
  $$('[data-route]').forEach(control => {
    const active = control.dataset.route === next;
    control.classList.toggle('is-active', active);
    // Both desktop and bottom touch navigation expose the selected page.
    if (control.closest('nav')) {
      if (active) control.setAttribute('aria-current', 'page');
      else control.removeAttribute('aria-current');
    }
  });
  if (updateHash && window.location.hash !== '#' + next) {
    history.replaceState(null, '', '#' + next);
  }
  window.scrollTo({top:0,behavior:'auto'});
  document.title = (next === 'home' ? 'Luca Drum Quest' :
    {learning:'Giáo trình',journal:'Nhật ký',funding:'Quỹ Luca'}[next] + ' · Luca Drum Quest');
}
$$('[data-route]').forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  navigate(button.dataset.route);
}));
window.addEventListener('hashchange', () => navigate(location.hash.slice(1), false));
navigate(location.hash.slice(1), false);

function renderHomeStages() {
  $('#home-stage-list').innerHTML = stages.filter(stage => [1, 2, 4, 8].includes(stage.id)).map(stage =>
    '<div class="mini-stage">' +
      '<span class="mini-stage-index">0' + stage.id + '</span>' +
      '<span class="mini-stage-icon" aria-hidden="true">' + escapeHtml(stage.icon) + '</span>' +
      '<div class="mini-stage-copy"><strong>' + escapeHtml(stage.title) +
      '</strong><small>' + escapeHtml(stage.short) + '</small></div>' +
      '<span class="mini-stage-date">' + escapeHtml(stage.period) + '</span>' +
    '</div>'
  ).join('');
}

function renderStages() {
  $('#stage-grid').innerHTML = stages.map(stage =>
    '<button type="button" class="stage-card' + (stage.id === currentStage ? ' is-active' : '') +
    '" data-stage="' + stage.id + '" aria-pressed="' + String(stage.id === currentStage) + '">' +
      '<span class="stage-number">CHẶNG 0' + stage.id + '<span aria-hidden="true">' +
      escapeHtml(stage.icon) + '</span></span>' +
      '<strong>' + escapeHtml(stage.title) + '</strong>' +
      '<small>' + escapeHtml(stage.period) + '</small>' +
    '</button>'
  ).join('');
  const stage = stages.find(s => s.id === currentStage);
  $('#stage-detail').innerHTML =
    '<div><span class="aside-kicker">CHẶNG 0' + stage.id + ' · ' + escapeHtml(stage.period) +
    '</span><h3>' + escapeHtml(stage.title) + '</h3><p>' + escapeHtml(stage.goal) + '</p></div>' +
    '<div><strong style="font-size:12px">Điểm học trọng tâm</strong><ul>' +
    stage.activities.map(activity => '<li>' + escapeHtml(activity) + '</li>').join('') +
    '</ul><p class="checkpoint"><strong>Minh chứng tham khảo:</strong> ' +
    escapeHtml(stage.checkpoint) + '</p></div>';
}
$('#stage-grid').addEventListener('click', event => {
  const card = event.target.closest('[data-stage]');
  if (!card) return;
  currentStage = Number(card.dataset.stage);
  renderStages();
});

function renderSkillFilters() {
  const options = [{id:'all',label:'Tất cả'}].concat(skillGroups);
  $('#skill-filters').innerHTML = options.map(group =>
    '<button type="button" class="filter-button' +
    (currentGroup === group.id ? ' is-active' : '') +
    '" data-skill-filter="' + escapeHtml(group.id) +
    '" aria-pressed="' + String(currentGroup === group.id) + '">' +
    escapeHtml(group.label) + '</button>'
  ).join('');
}
function renderSkills() {
  const filtered = currentGroup === 'all' ? skills : skills.filter(skill => skill.group === currentGroup);
  $('#skill-grid').innerHTML = filtered.map(skill => {
    const group = skillGroups.find(g => g.id === skill.group);
    return '<button type="button" class="skill-card" data-skill="' + escapeHtml(skill.id) + '">' +
    '<span class="skill-card-top"><span class="skill-id">' + escapeHtml(skill.id) +
    ' · ' + escapeHtml(group.label) + '</span><span class="skill-state">DỰ THẢO</span></span>' +
    '<strong>' + escapeHtml(skill.title) + '</strong><p>' + escapeHtml(skill.goal) +
    '</p><span class="skill-card-bottom"><span>Chặng ' + skill.stage +
    ' · ' + escapeHtml(skill.duration) + '</span><span aria-hidden="true">↗</span></span></button>';
  }).join('');
}
$('#skill-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-skill-filter]');
  if (!button) return;
  currentGroup = button.dataset.skillFilter;
  renderSkillFilters();
  renderSkills();
});
$('#skill-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-skill]');
  if (!button) return;
  const skill = skills.find(item => item.id === button.dataset.skill);
  if (skill) openSkill(skill);
});

const dialog = $('#detail-dialog');
function showDialog(body) {
  $('#dialog-body').innerHTML = body;
  if (!dialog.open) dialog.showModal();
}
function openSkill(skill) {
  const group = skillGroups.find(g => g.id === skill.group);
  showDialog(
    '<span class="aside-kicker">SKILL ' + escapeHtml(skill.id) + ' · ' + escapeHtml(group.label) +
    ' · BẢN DỰ THẢO</span>' +
    '<h2 id="dialog-title">' + escapeHtml(skill.title) + '</h2>' +
    '<p>' + escapeHtml(skill.goal) + '</p>' +
    '<div class="dialog-section"><h4>Điều kiện trước khi học</h4><p>' +
    escapeHtml(skill.prerequisites) + '</p></div>' +
    '<div class="dialog-section"><h4>Trò chơi luyện tại nhà</h4><p>' +
    escapeHtml(skill.practice) + '</p></div>' +
    '<div class="dialog-section"><h4>Quan sát để xác nhận HOME READY</h4><p>' +
    escapeHtml(skill.pass) + '</p></div>' +
    '<div class="dialog-section"><h4>Phần giáo viên cần kiểm tra</h4><p>' +
    escapeHtml(skill.teacher) + '</p></div>' +
    '<p class="dialog-small" style="margin:18px 0 0">Lưu ý: tiêu chí này chỉ là gợi ý. Giáo viên phải xác nhận kỹ thuật, trẻ không bị ép PASS theo lịch cứng.</p>'
  );
}
$$('[data-dialog-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

function renderJournalFilters() {
  const filters = [{id:'all',label:'Tất cả'},{id:'Video luyện tập',label:'Video'},{id:'Bài học',label:'Bài học'},{id:'Cột mốc',label:'Cột mốc'}];
  $('#journal-filters').innerHTML = filters.map(filter =>
    '<button type="button" class="filter-button' +
    (currentJournalFilter === filter.id ? ' is-active' : '') + '" data-journal-filter="' +
    escapeHtml(filter.id) + '" aria-pressed="' + String(currentJournalFilter === filter.id) +
    '">' + escapeHtml(filter.label) + '</button>'
  ).join('');
}
function renderJournal() {
  const filtered = currentJournalFilter === 'all' ? entries :
    entries.filter(entry => entry.kind === currentJournalFilter);
  $('#journal-grid').innerHTML = filtered.map(entry =>
    '<button type="button" class="journal-card" data-entry="' + entry.id + '">' +
    '<div class="journal-art ' + escapeHtml(entry.color) + '"><span class="journal-art-symbol">' +
    escapeHtml(entry.symbol) + '</span><span class="play-bubble" aria-hidden="true">↗</span></div>' +
    '<div class="journal-content"><small>' + escapeHtml(entry.tag) + '</small><h3>' +
    escapeHtml(entry.title) + '</h3><p>' + escapeHtml(entry.caption) +
    '</p><span class="journal-date">' + escapeHtml(entry.date) + '</span></div></button>'
  ).join('');
}
$('#journal-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-journal-filter]');
  if (!button) return;
  currentJournalFilter = button.dataset.journalFilter;
  renderJournalFilters();
  renderJournal();
});
$('#journal-grid').addEventListener('click', event => {
  const card = event.target.closest('[data-entry]');
  if (!card) return;
  const entry = entries.find(item => item.id === Number(card.dataset.entry));
  if (!entry) return;
  showDialog('<span class="aside-kicker">NHẬT KÝ · DỮ LIỆU MINH HỌA</span>' +
    '<h2 id="dialog-title">' + escapeHtml(entry.title) + '</h2>' +
    '<p>' + escapeHtml(entry.caption) + '</p>' +
    '<div class="dialog-section"><h4>Chưa có video thật</h4>' +
    '<p>Đây là thẻ minh họa thiết kế. Video của Luca sẽ được lưu riêng tư khi backend có đăng nhập, phân quyền gia đình và cơ chế bảo vệ dữ liệu trẻ em.</p></div>');
});

const formatter = new Intl.NumberFormat('vi-VN');
const moneyMillions = amount => (amount / 1_000_000).toLocaleString('vi-VN', {maximumFractionDigits: 2}) + ' triệu';
function renderBudget() {
  const unitCost = Number($('#lesson-cost').value) * 1000;
  const tuitionTotal = 104 * unitCost;
  const equipmentInput = $('#equipment-budget');
  const rawEquipment = equipmentInput.value.trim();
  // The campaign has one full two-year target; never show a seemingly final
  // funding goal until the household can estimate the drum + accessory costs.
  const equipment = rawEquipment === '' ? null : Number(rawEquipment);
  const hasEquipment = equipment !== null && Number.isFinite(equipment) && equipment > 0 && equipment <= 1_000_000_000;
  const invalidEquipment = rawEquipment !== '' && !hasEquipment;
  equipmentInput.setAttribute('aria-invalid', String(invalidEquipment));

  $('#lesson-cost-label').textContent = formatter.format(unitCost) + 'đ';
  $('#budget-total').textContent = moneyMillions(tuitionTotal);
  $('#equipment-total').textContent = hasEquipment ? moneyMillions(equipment) + ' (tính thử)' : 'Chờ báo giá';
  $('#funding-goal').textContent = hasEquipment ? moneyMillions(tuitionTotal + equipment) : 'Chưa chốt';
  $('#budget-full-total').textContent = hasEquipment ? moneyMillions(tuitionTotal + equipment) + ' (tính thử)' : 'Chờ báo giá thiết bị';
  $('#funding-goal-detail').textContent = hasEquipment
    ? 'Học phí ' + moneyMillions(tuitionTotal) + ' + thiết bị ' + moneyMillions(equipment) + ' · chỉ là phép tính thử'
    : 'Học phí dự tính ' + moneyMillions(tuitionTotal) + ' + bộ trống/phụ kiện chưa có báo giá';
}
$('#lesson-cost').addEventListener('input', renderBudget);
$('#equipment-budget').addEventListener('input', renderBudget);

renderHomeStages();
renderStages();
renderSkillFilters();
renderSkills();
renderJournalFilters();
renderJournal();
renderBudget();
