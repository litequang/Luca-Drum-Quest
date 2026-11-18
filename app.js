import { skillGroups } from './data.js';
import { api } from './apiClient.js';
import { youtubeMarkup, installYouTubeEmbeds, stopYouTubeEmbeds } from './youtube.js';
installYouTubeEmbeds(document);
let stages = [], skills = [], entries = [], publicProject = null, publicBudget = null;
let apiUnavailable = false;
try {
  const [project, catalogue, journal, budget] = await Promise.all([api('/public/project'), api('/public/catalogue'), api('/public/journal'), api('/public/budget')]);
  publicProject = project; publicBudget = budget;
  stages = catalogue.stages.map(s => ({...s, recordId:s.id, id:s.order}));
  const codes = new Map(catalogue.skills.map(s => [s.id,s.code]));
  skills = catalogue.skills.map(s => ({...s,id:s.code,prerequisites:s.prerequisites.map(id=>codes.get(id)).join(', ')||'Không'}));
  entries = journal.map(p => ({...p,caption:p.description,tag:p.tags.join(' · '),symbol:'♪',color:'peach'}));
} catch { apiUnavailable = true; }
// Live data has no demo fallback. Draft curriculum is separate from recorded progress.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[character]));
const pages = new Set(['home', 'learning', 'journal', 'funding']);
let currentStage = stages[0]?.id ?? 1;
let currentGroup = 'all';
let currentJournalFilter = 'all';

function navigate(page, updateHash = true) {
  const next = pages.has(page) ? page : 'home';
  if (next !== 'journal') stopYouTubeEmbeds($('#journal-grid'));
  $('.view').forEach(view => {
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
  $('#home-stage-list').innerHTML = (publicProject?.season?.ordinal === 1 ? stages.filter(stage => [1, 2, 4, 8].includes(stage.id)) : stages.slice(0, 4)).map(stage =>
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
  if (!stage) { $('#stage-detail').textContent = 'Giáo trình chưa khả dụng.'; return; }
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
  const grid = $('#stage-grid');
  const previousScroll = grid.scrollLeft;
  currentStage = Number(card.dataset.stage);
  renderStages();
  // On phones the 8 stages are a horizontally scrollable rail.
  // Preserve its position when the selected card list is re-rendered.
  grid.scrollLeft = previousScroll;
  if (window.matchMedia('(max-width: 680px)').matches) {
    const detail = $('#stage-detail');
    detail.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest'
    });
  }
});

function renderSkillFilters() {
  const options = [{id:'all',label:'Tất cả'}].concat(skillGroups);
  $('#skill-filters').innerHTML = options.map(group =>
    '<button type="button" class="filter-button' +
    (currentGroup === group.id ? ' is-active' : '') +
    '" data-skill-filter="' + escapeHtml(group.id) +
    '" aria-pressed="' + String(currentGroup === group.id) + '">' +
    escapeHtml(group?.label || '') + '</button>'
  ).join('');
}
function renderSkills() {
  const filtered = currentGroup === 'all' ? skills : skills.filter(skill => skill.group === currentGroup);
  $('#skill-grid').innerHTML = filtered.map(skill => {
    const group = skillGroups.find(g => g.id === skill.group);
    return '<button type="button" class="skill-card" data-skill="' + escapeHtml(skill.id) + '">' +
    '<span class="skill-card-top"><span class="skill-id">' + escapeHtml(skill.id) +
    ' · ' + escapeHtml(group?.label || '') + '</span><span class="skill-state">DỰ THẢO</span></span>' +
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
    '<span class="aside-kicker">SKILL ' + escapeHtml(skill.id) + ' · ' + escapeHtml(group?.label || '') +
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
dialog.addEventListener('close', () => stopYouTubeEmbeds($('#dialog-body')));

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
  $('#journal-grid').innerHTML = filtered.map(entry => {
    const id = escapeHtml(entry.id);
    const video = youtubeMarkup(entry.youtubeUrl);
    const content = '<small>' + escapeHtml(entry.tag) + '</small><span class="journal-title">' +
      escapeHtml(entry.title) + '</span><span class="journal-caption">' + escapeHtml(entry.caption) +
      '</span><span class="journal-date">' + escapeHtml(entry.date) + '</span>';
    if (video) return '<article class="journal-card journal-card--video">' + video +
      '<div class="journal-video-content"><button type="button" class="journal-content journal-open" data-entry="' +
      id + '">' + content + '<span class="journal-detail-action">Xem nhật ký <span aria-hidden="true">→</span></span></button></div></article>';
    return '<button type="button" class="journal-card" data-entry="' + id + '">' +
      '<span class="journal-art ' + escapeHtml(entry.color) + '"><span class="journal-art-symbol">' +
      escapeHtml(entry.symbol) + '</span><span class="play-bubble" aria-hidden="true">↗</span></span>' +
      '<span class="journal-content">' + content + '</span></button>';
  }).join('');
}
$('#journal-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-journal-filter]');
  if (!button) return;
  currentJournalFilter = button.dataset.journalFilter;
  renderJournalFilters();
  renderJournal();
});
$('#journal-grid').addEventListener('click', async event => {
  const card = event.target.closest('[data-entry]');
  if (!card) return;
  const entry = entries.find(item => item.id === card.dataset.entry);
  if (!entry) return;
  stopYouTubeEmbeds($('#journal-grid'));
  let media = [];
  try { media = await api('/journal/' + entry.id + '/media'); } catch { /* Post may have been unpublished. */ }
  showDialog('<span class="aside-kicker">NHẬT KÝ · ' + escapeHtml(entry.date) + '</span>' +
    '<h2 id="dialog-title">' + escapeHtml(entry.title) + '</h2><p>' + escapeHtml(entry.caption) + '</p>' + youtubeMarkup(entry.youtubeUrl) +
    media.map(m => '<img src="/api/v1/media/' + escapeHtml(m.id) + '" alt="Ảnh đính kèm" style="max-width:100%">').join(''));

});

const formatter = new Intl.NumberFormat('vi-VN');
const moneyMillions = amount => (amount / 1_000_000).toLocaleString('vi-VN', {maximumFractionDigits: 2}) + ' triệu';
function renderBudget() {
  const season = publicProject?.season;
  $('#funding-goal').textContent = season?.fundingGoal == null ? 'Chưa chốt' : moneyMillions(season.fundingGoal);
  $('#funding-goal-detail').textContent = season ? 'Mục tiêu đã lưu của ' + season.title + ' · bảng bên dưới chỉ là phép tính thử.' : 'Chưa khả dụng';
  if (!season || season.plannedLessons == null || season.lessonLow == null || season.lessonHigh == null) {
    for (const id of ['budget-total','equipment-total','budget-full-total']) $('#' + id).textContent = 'Chờ xác nhận dự toán';
    $('#lesson-cost').disabled = true; $('#equipment-budget').disabled = true;
    $('.budget-rows > div:first-child strong').textContent = 'Chờ xác nhận';
    $('.budget-rows > div:nth-child(3) strong').textContent = 'Chờ xác nhận';
    return;
  }
  const unitCost = Number($('#lesson-cost').value) * 1000;
  const tuitionTotal = (publicProject?.season?.plannedLessons ?? 0) * unitCost;
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
  $('#funding-goal').textContent = publicProject?.season?.fundingGoal == null ? 'Chưa chốt' : moneyMillions(publicProject.season.fundingGoal);
  $('#budget-full-total').textContent = hasEquipment ? moneyMillions(tuitionTotal + equipment) + ' (tính thử)' : 'Chờ báo giá thiết bị';
  $('#funding-goal-detail').textContent = 'Mục tiêu đã lưu của ' + (publicProject?.season?.title || 'vòng chưa chọn') + ' · bảng bên dưới chỉ là phép tính thử.';
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

if (publicProject) {
  $('.hero-description').textContent = publicProject.description;
  $('.fundraiser-summary > div:last-child > p').textContent = publicProject.intro;
  if (publicProject.season) {
    const season = publicProject.season;
    $('.hero-copy .eyebrow').innerHTML = '<span class="eyebrow-line"></span>' + escapeHtml(season.title) + ' · VÒNG ' + season.ordinal;
    $('.fundraiser-summary .eyebrow').textContent = 'CHIẾN DỊCH GÂY QUỸ · ' + season.title;
    $('.view[data-view="funding"] .eyebrow').textContent = season.title + ' / ' + (season.durationMonths ?? 'Chờ chốt') + ' THÁNG';
    $('.finance-title .aside-kicker').textContent = 'MỤC TIÊU QUỸ · ' + season.title + ' · ' + (season.durationMonths ?? 'Chờ chốt') + ' THÁNG';
    $('.stats-strip > div:first-child strong').innerHTML = (season.durationMonths ?? 'Chờ chốt') + ' <small>tháng</small>';
    $('.stats-strip > div:first-child > span').textContent = season.title;
    $('.stats-strip > div:nth-child(2) > span').textContent = 'Dự kiến học cùng thầy';
    $('.journey-teaser .eyebrow').textContent = (season.durationMonths ?? 'Chờ chốt') + ' THÁNG · ' + stages.length + ' CHẶNG DỰ THẢO';
    $('.footer-meta > span').textContent = season.title + ' · ' + (season.durationMonths ?? 'Chờ chốt') + ' tháng';
    $('.view[data-view="funding"] .disclaimer').textContent = 'Ghi nhận quà tặng thủ công; không có thanh toán qua website. Các con số dự toán không phải cam kết lịch học.';
    if (season.ordinal !== 1) {
      $('.fundraiser-summary h2').textContent = season.title + ' · ' + (season.durationMonths ?? 'Chờ chốt') + ' tháng';
      $('.view[data-view="funding"] .page-intro').textContent = season.objective + ' Đây là quà tặng tự nguyện, không phải đầu tư hoặc vốn hoàn lại. Lịch sử Vòng 1 vẫn được lưu riêng.';
      $('.closing-grid .eyebrow').textContent = 'CÙNG ĐỒNG HÀNH · ' + season.title;
      $('.closing-grid h2').textContent = season.title + ' · Đồng hành qua từng nhịp trống.';
      $('.closing-grid > div:last-child > p').textContent = publicProject.intro;
      $('.support-panel h2').textContent = season.title + ': một mục tiêu và quỹ riêng.';
      $('.support-steps > div:first-child > span').textContent = (season.plannedLessons ?? 'Chờ chốt số') + ' buổi học dự toán, cần xác nhận lịch và chi phí thực tế.';
      $('.support-notice p').textContent = 'Quà tặng tự nguyện, không có nghĩa vụ đóng góp. Thu chi được ghi nhận riêng cho từng vòng.';
      $('.stats-strip > div:nth-child(2) strong').textContent = 'Chờ chốt lịch';
    }

    if (season.plannedLessons != null && season.lessonLow != null && season.lessonHigh != null) {
    $('#lesson-cost').min = season.lessonLow / 1000;
    $('#lesson-cost').max = season.lessonHigh / 1000;
    $('#lesson-cost').value = (season.lessonLow + season.lessonHigh) / 2000;
    $('.slider-labels').innerHTML = '<span>' + formatter.format(season.lessonLow) + 'đ</span><span>' + formatter.format(season.lessonHigh) + 'đ</span>';
    $('#equipment-budget').value = season.equipmentBudget ?? '';
    $('.budget-rows > div:first-child strong').textContent = season.plannedLessons + ' buổi / ' + (season.durationMonths ?? 'Chờ chốt') + ' tháng';
    $('.budget-rows > div:nth-child(3) strong').textContent = moneyMillions(season.plannedLessons * season.lessonLow) + ' – ' + moneyMillions(season.plannedLessons * season.lessonHigh);
    }
    renderBudget();
  }
}
const financialRows = [['Quà tặng tiền mặt đã xác nhận','received'],['Đã chi','spent'],['Số dư hiện tại','balance'],['Còn cần gây quỹ','unfunded']];
for (const [label,key] of financialRows) {
  const row = document.createElement('div');
  row.innerHTML = '<span>' + label + '</span><strong>' + (publicBudget?.available && publicBudget[key] !== null ? moneyMillions(publicBudget[key]) : 'Chưa công bố') + '</strong>';
  $('.budget-rows').append(row);
}
$('.view[data-view="journal"] .disclaimer').textContent = 'Chỉ các bài đã xuất bản công khai xuất hiện ở đây. Nội dung gia đình cần đăng nhập và được cấp quyền.';
if (!entries.length) $('#journal-grid').textContent = apiUnavailable ? 'Nhật ký tạm chưa khả dụng.' : 'Chưa có bài công khai.';
if (apiUnavailable) {
  $('.hero-description').textContent = 'Thông tin dự án tạm chưa khả dụng. Vui lòng thử lại sau.';
  $('.fundraiser-summary > div:last-child > p').textContent = 'Dữ liệu chưa khả dụng.';
  $('.preview-chip').textContent = 'Dữ liệu chưa khả dụng';
}
