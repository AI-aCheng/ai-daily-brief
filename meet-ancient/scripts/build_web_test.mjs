#!/usr/bin/env node
/**
 * build_web_test.mjs — 生成「遇见古人」单文件网页测试版
 * 用法: node build_web_test.mjs  → 输出 /home/ubuntu/meet-ancient/web_test.html
 * 浏览器直接双击打开即可玩（数据全部内联, 无外部依赖）
 */
import { writeFileSync, readFileSync } from 'fs'
import { questions } from '../src/data/questions.js'
import { ancients } from '../src/data/ancients.js'

const MATCHER_SRC = `
function dotScore(userTags, ancientTags) {
  let s = 0
  for (const [t, a] of Object.entries(ancientTags || {})) s += (userTags[t] || 0) * a
  return s
}
function matchAncients(userTags, ancients, topN) {
  const scored = ancients.map((a) => {
    const score = dotScore(userTags, a.tags || {})
    const matchedTags = Object.keys(userTags)
      .filter((t) => (a.tags || {})[t] && userTags[t] > 0)
      .sort((x, y) => userTags[y] - userTags[x])
    return { ancient: a, score, matchedTags }
  })
  scored.sort((x, y) => y.score - x.score)
  return scored.slice(0, topN)
}
function matchWithGender(userTags, ancients, topN, gender) {
  const global = matchAncients(userTags, ancients, topN + 3)
  const main = global[0]
  const mainId = main ? main.ancient.id : null
  const matches = global.slice(0, topN)
  const usedIds = new Set(matches.map((r) => r.ancient.id))
  let sameGender = null
  if (gender && main && main.ancient.gender && main.ancient.gender !== gender) {
    sameGender = global.find((r) => r.ancient.gender === gender && !usedIds.has(r.ancient.id)) || null
    if (!sameGender) {
      const scored = ancients.map((a) => {
        const score = dotScore(userTags, a.tags || {})
        const matchedTags = Object.keys(userTags)
          .filter((t) => (a.tags || {})[t] && userTags[t] > 0)
          .sort((x, y) => userTags[y] - userTags[x])
        return { ancient: a, score, matchedTags }
      })
      scored.sort((x, y) => y.score - x.score)
      sameGender = scored.find((r) => r.ancient.gender === gender && !usedIds.has(r.ancient.id)) || null
    }
  }
  return { matches: matches, sameGender }
}
function accumulateTags(userTags, optionTags) {
  const out = { ...userTags }
  for (const [tag, score] of Object.entries(optionTags || {})) out[tag] = (out[tag] || 0) + score
  return out
}
function buildQuestionNorm(questions) {
  const total = {}
  for (const q of questions) {
    for (const o of q.options) {
      for (const [t, s] of Object.entries(o.tags)) total[t] = (total[t] || 0) + s
    }
  }
  return total
}
function normalizeTags(userTags, norm) {
  const out = {}
  for (const [t, s] of Object.entries(userTags)) out[t] = (s / (norm[t] || 1)) * 10
  return out
}
function describeMalePath(a) {
  const role = a.role || ""
  if (role.includes("皇帝") || role.includes("帝王") || role.includes("君主")) return "执掌天下、号令四方"
  if (role.includes("将") || role.includes("帅")) return "驰骋沙场、建功立业"
  if (role.includes("相") || role.includes("臣") || role.includes("政治家")) return "运筹帷幄、位列朝堂"
  if (role.includes("思想") || role.includes("哲") || role.includes("圣")) return "立言传道、教化天下"
  if (role.includes("文") || role.includes("诗") || role.includes("词")) return "以文章才情名动天下"
  if (role.includes("商") || role.includes("实业")) return "纵横商海、积累财富"
  return "在更大的舞台上施展抱负"
}
function describeFemalePath(a) {
  const role = a.role || ""
  if (role.includes("皇") || role.includes("后") || role.includes("女皇")) return "在后宫与朝堂的夹缝中运筹帷幄"
  if (role.includes("将") || role.includes("帅")) return "在男性主导的军阵中杀出血路"
  if (role.includes("作家") || role.includes("诗") || role.includes("才女")) return "在笔墨世界里安放才华"
  if (role.includes("科学") || role.includes("数学") || role.includes("发明")) return "在男性主导的学术圈里独自突围"
  if (role.includes("民权") || role.includes("革命")) return "在重重阻力中为理想发声"
  if (role.includes("设计") || role.includes("艺术") || role.includes("画家")) return "在艺术世界里证明自己"
  return "在有限的缝隙里撑开自己的天地"
}
function genderContrastNote(ancient, tags, userGender) {
  if (!ancient || !userGender || ancient.gender === userGender) return ""
  const tagStr = (tags || []).slice(0, 2).join("」「")
  const wrapped = tagStr ? "「" + tagStr + "」" : "相似"
  if (ancient.gender === "male") {
    return "你性格上其实最像【" + ancient.name + "】——同有" + wrapped + "的底色。TA 生于" + ancient.era + "，作为男性，得以" + describeMalePath(ancient) + "。但若你生在那个时代，作为女性，同样的性格很难走 TA 的路：那个年代的女性，多数被礼教与家庭束缚在深闺与内宅，纵有雄心也只能借他人之手实现，除非像武则天那样以非常手段突破。不过换个角度看：你的「性别天花板」也是你的「保护色」——你不必用 TA 那样刀光剑影的方式，也能活出 TA 的底色。"
  }
  return "你性格上其实最像【" + ancient.name + "】——同有" + wrapped + "的底色。TA 生于" + ancient.era + "，作为女性，只能在" + describeFemalePath(ancient) + "中施展才华。若你生在那个时代，作为男性，同样的性格可以更直接地入仕掌权、建功立业——TA 要用十年迂回才能抵达的位置，你也许三年就能走到。所以别浪费你的性别红利：TA 替你验证了性格的底色，而你拥有 TA 没有的直路。"
}
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function coverageScore(picked) {
  const cnt = {}
  for (const q of picked) for (const o of q.options) for (const t of Object.keys(o.tags)) cnt[t] = (cnt[t] || 0) + 1
  const vals = Object.values(cnt)
  if (vals.length < 25) return Infinity
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  return vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
}
function pickQuestions(all, count) {
  const attention = all.filter(q => q.attention)
  const normal = all.filter(q => !q.attention)
  const need = Math.max(0, count - attention.length)
  if (need >= normal.length) return shuffle([...attention, ...normal])
  let best = null, bestScore = Infinity
  for (let i = 0; i < 100; i++) {
    const picked = shuffle(normal).slice(0, need)
    const score = coverageScore(picked)
    if (score < bestScore) { bestScore = score; best = picked }
  }
  return shuffle([...attention, ...best])
}
`
const QUESTION_NORM = 'const QUESTION_NORM = buildQuestionNorm(QUESTIONS);\n'

const PAGE_JS = `
// ===== 状态 =====
let quizQuestions = []
const total = 30 // 每次抽 30 题
let current = 0
let chosenIdx = -1
let userTags = {}
let answers = []
let matches = []
let attentionMiss = 0
const MARKS = ['甲', '乙', '丙', '丁', '戊', '己']
function ta(gender) { return gender === 'female' ? '她' : '他' }
function outcomeTitle(outcome, gender) {
  const p = ta(gender)
  const map = {
    success: '🏆 ' + p + '为什么成功',
    fail: '📉 ' + p + '为什么失败',
    tragic: '💔 ' + p + '为什么结局悲惨',
    retreat: '🍃 ' + p + '为什么选择归隐',
  }
  return map[outcome] || map.success
}

const $ = (id) => document.getElementById(id)

// ===== 视图切换 =====
function show(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  $(id).classList.add('active')
  window.scrollTo(0, 0)
}

// ===== 首页 =====
function start() {
  current = 0; userTags = {}; answers = []; chosenIdx = -1; attentionMiss = 0
  quizQuestions = pickQuestions(QUESTIONS, 30) // 随机抽题, 反复测不重复
  renderQ(); show('quiz')
}

// ===== 答题 =====
function renderQ() {
  const q = quizQuestions[current]
  $('q-progress').textContent = (current + 1) + ' / ' + total
  $('q-bar-fill').style.width = ((current) / total * 100) + '%'
  $('q-text').textContent = q.scenario
  const opts = $('q-options')
  opts.innerHTML = ''
  chosenIdx = -1
  q.options.forEach((opt, i) => {
    const el = document.createElement('div')
    el.className = 'option'
    el.innerHTML = '<span class="opt-mark">' + MARKS[i] + '</span><span class="opt-text">' + opt.text + '</span>'
    el.onclick = () => choose(i, el)
    opts.appendChild(el)
  })
  $('q-back').style.visibility = current === 0 ? 'hidden' : 'visible'
}

function choose(i, el) {
  if (chosenIdx !== -1) return
  chosenIdx = i
  el.classList.add('chosen')
  const q = quizQuestions[current]
  if (q.attention) {
    if (i !== q.correctIndex) attentionMiss++
  } else {
    userTags = accumulateTags(userTags, q.options[i].tags)
  }
  answers.push(i)
  setTimeout(() => {
    if (current >= total - 1) finish()
    else { current++; renderQ() }
  }, 260)
}

function goBack() {
  if (current === 0) return
  const last = answers.pop()
  const prevQ = quizQuestions[current - 1]
  if (prevQ.attention) {
    if (last !== prevQ.correctIndex) attentionMiss = Math.max(0, attentionMiss - 1)
  } else {
    const tags = prevQ.options[last].tags
    for (const [t, s] of Object.entries(tags)) {
      userTags[t] = (userTags[t] || 0) - s
      if (userTags[t] <= 0) delete userTags[t]
    }
  }
  current--
  renderQ()
}

function finish() {
  show('loading')
  // 归一化用户画像: 高频标签因选项多而得分虚高, 归一化后反映相对偏好
  userTags = normalizeTags(userTags, QUESTION_NORM)
  setTimeout(() => {
    matches = matchAncients(userTags, ANCIENTS, 3)
    renderResult()
    show('result')
  }, 1500)
}

// ===== 结果 =====
// 排名降档制: Top1 95-98 / Top2 84-89 / Top3 75-80, 体现差异
function pct(score, rank) {
  const max = matches[0] ? matches[0].score : 1
  if (!max) return 90
  const ratio = score / max
  const base = [95, 86, 77][rank] || 70
  const adj = Math.round((ratio - 0.8) * 12)
  return Math.min(98, Math.max(60, base + adj))
}

function renderResult() {
  const top = matches[0]
  if (!top) return
  const a = top.ancient
  // 作答可信度提示
  const warnBox = $('r-attention')
  if (attentionMiss > 0) {
    warnBox.textContent = '⚠️ 检测到 ' + attentionMiss + ' 道注意力检测题回答不一致，结果可能不完全准确，建议重新测一次'
    warnBox.style.display = 'block'
  } else {
    warnBox.style.display = 'none'
  }
  $('r-title').textContent = a.title || ''
  $('r-name').textContent = a.name
  $('r-role').textContent = a.era + ' · ' + a.region + ' · ' + a.role
  $('r-pct').textContent = '匹配度 ' + pct(top.score, 0) + '%'
  $('r-summary').textContent = a.summary
  // 共同点
  $('r-common').innerHTML = a.common.map((c, i) =>
    '<div class="line"><span class="ln">' + (i + 1) + '</span><span>' + c + '</span></div>').join('')
  // 成败分析
  $('r-analysis-title').textContent = outcomeTitle(a.outcome, a.gender)
  $('r-analysis').textContent = a.analysis
  // 启示
  $('r-lesson').innerHTML = a.lesson.map((l, i) =>
    '<div class="line"><span class="ln">' + (i + 1) + '</span><span>' + l + '</span></div>').join('')
  // 相似古人
  const others = matches.slice(1)
  $('r-others').innerHTML = others.length ? others.map((o, i) =>
    '<div class="other" onclick="showDetail(' + (i + 1) + ')"><span class="o-name">' + o.ancient.name + '</span><span class="o-info">' + o.ancient.era + ' · ' + (o.ancient.title || o.ancient.role) + '</span><span class="o-pct">' + pct(o.score, i + 1) + '%</span><span class="o-arrow">›</span></div>'
  ).join('') : '<div class="other">仅此一位，历史独一份</div>'
  $('r-share-text').textContent = '我测出了最像我的古人是「' + a.name + '」（' + (a.title || '') + '），你也来试试！'
}

function openSame() {
  if (sameGender) showDetailFor(sameGender)
}

// ===== 相似古人详情弹层 =====
function showDetail(idx) {
  showDetailFor(matches[idx])
}
function showDetailFor(m) {
  if (!m) return
  const a = m.ancient
  $('d-name').textContent = a.name
  $('d-role').textContent = a.era + ' · ' + a.region + ' · ' + a.role
  $('d-pct').textContent = '匹配度 ' + pct(m.score, 1) + '%'
  $('d-summary').textContent = a.summary
  $('d-common').innerHTML = a.common.map((c, i) =>
    '<div class="line"><span class="ln">' + (i + 1) + '</span><span>' + c + '</span></div>').join('')
  $('d-analysis-title').textContent = outcomeTitle(a.outcome, a.gender)
  $('d-analysis').textContent = a.analysis
  $('d-lesson').innerHTML = a.lesson.map((l, i) =>
    '<div class="line"><span class="ln">' + (i + 1) + '</span><span>' + l + '</span></div>').join('')
  $('modal').classList.add('show')
  document.body.style.overflow = 'hidden'
}

function closeDetail() {
  $('modal').classList.remove('show')
  document.body.style.overflow = ''
}
`

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>遇见古人 · 测试版</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
  min-height: 100vh; color: #e2e8f0;
  display: flex; justify-content: center;
}
#app { width: 100%; max-width: 480px; padding: 32px 20px 60px; }
.view { display: none; }
.view.active { display: block; }
/* 首页 */
.hero { text-align: center; margin-top: 40px; }
.hero h1 { font-size: 44px; color: #f5c76a; letter-spacing: 8px; text-shadow: 0 0 30px rgba(245,199,106,.4); }
.hero p { margin-top: 12px; color: #94a3b8; letter-spacing: 3px; font-size: 14px; }
.hero-line { margin: 24px auto 0; width: 120px; height: 2px; background: linear-gradient(90deg, transparent, #f5c76a, transparent); }
.stats { display: flex; justify-content: space-around; margin-top: 44px; padding: 24px 10px; background: rgba(30,41,59,.6); border: 1px solid rgba(245,199,106,.2); border-radius: 16px; }
.stat { text-align: center; }
.stat b { display: block; font-size: 30px; color: #f5c76a; }
.stat span { font-size: 12px; color: #cbd5e1; margin-top: 4px; display: block; }
.desc { margin-top: 28px; background: rgba(30,41,59,.6); border-radius: 16px; padding: 20px; font-size: 14px; line-height: 1.9; color: #cbd5e1; }
.desc b { color: #f5c76a; }
.gender-card { margin-top: 28px; background: rgba(30,41,59,.6); border: 1px solid rgba(245,199,106,.2); border-radius: 16px; padding: 18px; }
.gender-title { text-align: center; color: #f5c76a; font-weight: bold; font-size: 15px; }
.gender-opts { display: flex; justify-content: space-around; margin-top: 14px; }
.g-opt { width: 40%; padding: 12px 0; border-radius: 12px; border: 2px solid rgba(148,163,184,.3); background: rgba(15,23,42,.5); text-align: center; color: #cbd5e1; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all .2s; }
.g-opt.g-active { border-color: #f5c76a; background: rgba(245,199,106,.12); color: #f5c76a; font-weight: bold; }
.g-icon { font-size: 18px; }
.btn { display: block; width: 100%; margin-top: 36px; padding: 16px; border: none; border-radius: 50px; background: linear-gradient(90deg, #f5c76a, #e6a84b); color: #0f172a; font-size: 18px; font-weight: bold; letter-spacing: 4px; cursor: pointer; }
.foot { text-align: center; margin-top: 16px; font-size: 12px; color: #64748b; }
/* 答题 */
.topbar { display: flex; align-items: center; justify-content: space-between; }
.topbar .pct { color: #f5c76a; font-size: 14px; }
.bar { margin-top: 10px; height: 6px; background: rgba(148,163,184,.2); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; width: 0; background: linear-gradient(90deg, #f5c76a, #e6a84b); border-radius: 3px; transition: width .3s; }
.q-card { margin-top: 28px; background: rgba(30,41,59,.7); border: 1px solid rgba(245,199,106,.15); border-radius: 18px; padding: 28px 22px; min-height: 120px; display: flex; align-items: center; }
.q-card p { font-size: 17px; font-weight: bold; line-height: 1.7; color: #f1f5f9; }
.options { margin-top: 26px; }
.option { display: flex; align-items: center; background: rgba(30,41,59,.5); border: 1px solid rgba(148,163,184,.25); border-radius: 14px; padding: 15px 14px; margin-bottom: 14px; cursor: pointer; transition: all .2s; }
.option:hover { border-color: rgba(245,199,106,.5); }
.option.chosen { border-color: #f5c76a; background: rgba(245,199,106,.12); }
.opt-mark { width: 32px; height: 32px; line-height: 32px; text-align: center; border-radius: 50%; background: rgba(245,199,106,.15); color: #f5c76a; font-weight: bold; margin-right: 14px; flex-shrink: 0; font-size: 14px; }
.opt-text { font-size: 14.5px; line-height: 1.6; }
.back { text-align: center; margin-top: 14px; color: #94a3b8; font-size: 14px; cursor: pointer; visibility: hidden; }
/* 加载 */
.loading { text-align: center; padding-top: 180px; }
.ring { width: 60px; height: 60px; margin: 0 auto; border: 5px solid rgba(245,199,106,.2); border-top-color: #f5c76a; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading p { margin-top: 24px; color: #94a3b8; font-size: 14px; }
/* 结果 */
.attention-warn { display: none; margin-bottom: 20px; background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.4); border-radius: 12px; padding: 14px; font-size: 13px; line-height: 1.7; color: #fbbf24; }
.r-head { text-align: center; padding: 30px 0 24px; border-bottom: 1px solid rgba(148,163,184,.2); }
.r-label { font-size: 13px; color: #94a3b8; letter-spacing: 3px; }
.type-badge { display: inline-block; margin-top: 12px; padding: 4px 18px; border-radius: 20px; background: rgba(59,130,246,.15); border: 1px solid rgba(96,165,250,.5); color: #93c5fd; font-size: 13px; letter-spacing: 1px; }
.main-note { margin-top: 16px; width: 100%; background: rgba(30,41,59,.7); border: 1px solid rgba(245,199,106,.25); border-radius: 12px; padding: 14px; font-size: 12.5px; line-height: 1.8; color: #cbd5e1; text-align: left; display: none; }
.r-name { display: block; margin-top: 10px; font-size: 52px; font-weight: bold; color: #f5c76a; text-shadow: 0 0 40px rgba(245,199,106,.35); }
.r-role { margin-top: 8px; font-size: 13px; color: #cbd5e1; }
.r-pct { display: inline-block; margin-top: 14px; padding: 6px 22px; border-radius: 20px; background: rgba(245,199,106,.15); border: 1px solid rgba(245,199,106,.4); color: #f5c76a; font-weight: bold; font-size: 15px; }
.r-summary { margin-top: 14px; font-size: 14px; line-height: 1.7; color: #e2e8f0; padding: 0 10px; }
.section { margin-top: 28px; }
.section h3 { color: #f5c76a; font-size: 16px; margin-bottom: 14px; }
.line { display: flex; margin-bottom: 10px; }
.ln { width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 50%; background: rgba(245,199,106,.15); color: #f5c76a; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; margin-top: 3px; }
.line span:last-child { font-size: 14px; line-height: 1.7; flex: 1; }
.analysis { font-size: 14px; line-height: 1.9; background: rgba(30,41,59,.6); border-radius: 14px; padding: 16px; }
.other { display: flex; align-items: center; background: rgba(30,41,59,.5); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; cursor: pointer; transition: all .2s; }
.other:hover { border: 1px solid rgba(245,199,106,.4); background: rgba(30,41,59,.8); }
.o-name { font-weight: bold; width: 90px; color: #f1f5f9; }
.o-info { flex: 1; font-size: 12px; color: #94a3b8; }
.o-pct { color: #f5c76a; font-weight: bold; font-size: 13px; }
.o-arrow { color: #64748b; font-size: 18px; margin-left: 8px; }
.hint { font-size: 12px; color: #64748b; font-weight: normal; }
/* 详情弹层 */
.modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(2, 6, 23, .8); z-index: 100; justify-content: center; align-items: flex-start; overflow-y: auto; padding: 40px 16px; }
.modal.show { display: flex; }
.modal-card { background: #1e293b; border: 1px solid rgba(245,199,106,.3); border-radius: 18px; padding: 26px 20px 30px; max-width: 480px; width: 100%; }
.modal-head { text-align: center; padding-bottom: 16px; border-bottom: 1px solid rgba(148,163,184,.2); }
.d-name { display: block; font-size: 40px; font-weight: bold; color: #f5c76a; }
.d-role { margin-top: 6px; font-size: 13px; color: #cbd5e1; }
.d-pct { display: inline-block; margin-top: 10px; padding: 4px 18px; border-radius: 18px; background: rgba(245,199,106,.15); border: 1px solid rgba(245,199,106,.4); color: #f5c76a; font-size: 13px; font-weight: bold; }
.d-summary { margin-top: 10px; font-size: 13px; line-height: 1.7; color: #e2e8f0; }
.share-box { margin-top: 28px; background: rgba(30,41,59,.6); border: 1px dashed rgba(245,199,106,.3); border-radius: 14px; padding: 14px; font-size: 13px; color: #cbd5e1; text-align: center; }
/* 另一个性别的你 */
.alt-card { background: rgba(30,41,59,.6); border: 1px solid rgba(245,199,106,.3); border-radius: 14px; padding: 16px; }
.alt-head { display: flex; align-items: baseline; flex-wrap: wrap; margin-bottom: 10px; }
.alt-name { font-size: 18px; font-weight: bold; color: #f5c76a; margin-right: 10px; }
.alt-info { font-size: 12px; color: #94a3b8; }
.alt-note { font-size: 13.5px; line-height: 1.9; color: #e2e8f0; }
.actions { margin-top: 26px; }
.btn-ghost { display: block; width: 100%; margin-top: 12px; padding: 14px; border: 1px solid rgba(245,199,106,.4); border-radius: 50px; background: transparent; color: #f5c76a; font-size: 16px; cursor: pointer; }
</style>
</head>
<body>
<div id="app">
  <!-- 首页 -->
  <div id="home" class="view active">
    <div class="hero">
      <h1>遇 见 古 人</h1>
      <p>测一测，你像历史上的谁？</p>
      <div class="hero-line"></div>
    </div>
    <div class="stats">
      <div class="stat"><b>30</b><span>道情景选择题</span></div>
      <div class="stat"><b>100</b><span>位精选历史名人</span></div>
      <div class="stat"><b>3</b><span>分钟找到另一个你</span></div>
    </div>
    <div class="desc"><b>📜 玩法</b><br>回答 30 个贴近现实的选择题（每次随机抽题，反复测不重复），系统将从 <b>100 位家喻户晓的历史名人</b>中，匹配出和你最像的那一位——你们的共同点、TA 的人生成败，以及你可以学到或规避的东西。</div>
    <button class="btn" onclick="start()">开始测试</button>
    <div class="foot">答案没有对错，凭直觉选择即可</div>
  </div>

  <!-- 答题 -->
  <div id="quiz" class="view">
    <div class="topbar"><span class="pct" id="q-progress">1 / 30</span></div>
    <div class="bar"><div class="bar-fill" id="q-bar-fill"></div></div>
    <div class="q-card"><p id="q-text"></p></div>
    <div class="options" id="q-options"></div>
    <div class="back" id="q-back" onclick="goBack()">‹ 上一题</div>
  </div>

  <!-- 加载 -->
  <div id="loading" class="view">
    <div class="loading">
      <div class="ring"></div>
      <p>正在穿越时空，寻找与你最像的古人…</p>
    </div>
  </div>

  <!-- 结果 -->
  <div id="result" class="view">
    <div class="attention-warn" id="r-attention"></div>
    <div class="r-head">
      <div class="r-label">与你最像的古人</div>
      <div class="type-badge" id="r-title"></div>
      <span class="r-name" id="r-name"></span>
      <div class="r-role" id="r-role"></div>
      <div><span class="r-pct" id="r-pct"></span></div>
      <div class="r-summary" id="r-summary"></div>
    </div>
    <div class="section"><h3>🤝 你们的共同点</h3><div id="r-common"></div></div>
    <div class="section"><h3 id="r-analysis-title"></h3><div class="analysis" id="r-analysis"></div></div>
    <div class="section"><h3>💡 给你的启示</h3><div id="r-lesson"></div></div>
    <div id="r-same"></div>
    <div class="section"><h3>🧭 还有谁与你相似 <span class="hint">(点开看看)</span></h3><div id="r-others"></div></div>
    <div class="share-box" id="r-share-text"></div>
    <div class="actions">
      <button class="btn" onclick="drawCardH5()">生成分享卡片</button>
      <button class="btn" onclick="navigator.clipboard ? navigator.clipboard.writeText(document.getElementById('r-share-text').textContent).then(()=>alert('已复制分享文案！')) : alert(document.getElementById('r-share-text').textContent)">复制分享文案</button>
      <button class="btn-ghost" onclick="start()">再测一次</button>
    </div>
  </div>

  <!-- 分享海报弹层 (H5 测试版) -->
  <div id="cardModal" class="modal">
    <div class="modal-card">
      <img id="cardImg" style="width:100%;border-radius:10px;display:block" alt="分享卡片">
      <button class="btn" onclick="document.getElementById('cardModal').style.display='none'" style="margin-top:14px">关 闭</button>
    </div>
  </div>
  <canvas id="cardCanvas" width="750" height="1334" style="display:none"></canvas>

  <!-- 相似古人详情弹层 -->
  <div id="modal" class="modal">
    <div class="modal-card">
      <div class="modal-head">
        <span class="d-name" id="d-name"></span>
        <div class="d-role" id="d-role"></div>
        <span class="d-pct" id="d-pct"></span>
        <div class="d-summary" id="d-summary"></div>
      </div>
      <div class="section"><h3>🤝 你们的共同点</h3><div id="d-common"></div></div>
      <div class="section"><h3 id="d-analysis-title"></h3><div class="analysis" id="d-analysis"></div></div>
      <div class="section"><h3>💡 给你的启示</h3><div id="d-lesson"></div></div>
      <button class="btn-ghost" onclick="closeDetail()">关 闭</button>
    </div>
  </div>
</div>
<script>
const MINI_CODE_B64 = '__MINI_CODE_B64__';
function drawCardH5() {
  const top = matches[0]
  if (!top) { alert('请先完成测试'); return }
  const a = top.ancient
  const c = document.getElementById('cardCanvas')
  const ctx = c.getContext('2d')
  const W = 750, H = 1334
  // 背景渐变 (深色科技风)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, '#0f172a'); g.addColorStop(0.6, '#1e293b'); g.addColorStop(1, '#0f172a')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // 鎏金边框
  ctx.strokeStyle = 'rgba(245,199,106,0.7)'; ctx.lineWidth = 4
  ctx.strokeRect(26, 26, W - 52, H - 52)
  ctx.textAlign = 'center'
  // 顶部
  ctx.fillStyle = '#94a3b8'; ctx.font = '30px sans-serif'
  ctx.fillText('遇 见 古 人', W / 2, 130)
  ctx.strokeStyle = 'rgba(245,199,106,0.4)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(W / 2 - 110, 160); ctx.lineTo(W / 2 + 110, 160); ctx.stroke()
  // 称号
  ctx.fillStyle = '#f5c76a'; ctx.font = '54px sans-serif'
  ctx.fillText(a.title || '', W / 2, 400)
  // 古人名
  ctx.fillStyle = '#ffffff'; ctx.font = '92px sans-serif'
  ctx.fillText(a.name || '古人', W / 2, 540)
  // 时代
  ctx.fillStyle = '#94a3b8'; ctx.font = '32px sans-serif'
  ctx.fillText(a.era || '', W / 2, 610)
  // 匹配度
  ctx.fillStyle = '#f5c76a'; ctx.font = '42px sans-serif'
  ctx.fillText('匹配度 ' + pct(top.score, 0) + '%', W / 2, 690)
  // 简介 (最多3行)
  ctx.fillStyle = '#cbd5e1'; ctx.font = '28px sans-serif'
  const summary = a.summary || ''
  const lines = []
  for (let i = 0; i < summary.length; i += 22) lines.push(summary.slice(i, i + 22))
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 790 + i * 48))
  // 中部金线
  ctx.strokeStyle = 'rgba(245,199,106,0.5)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(W / 2 - 170, 990); ctx.lineTo(W / 2 + 170, 990); ctx.stroke()
  // 引导关注
  ctx.fillStyle = '#94a3b8'; ctx.font = '26px sans-serif'
  ctx.fillText('长按识别 · 测测你像哪位古人', W / 2, 1050)
  ctx.fillStyle = '#64748b'; ctx.font = '22px sans-serif'
  ctx.fillText('关注公众号「AI阿程Harness实录」', W / 2, 1090)
  // 小程序码
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, W / 2 - 105, H - 280, 210, 210)
    document.getElementById('cardImg').src = c.toDataURL('image/png')
    document.getElementById('cardModal').style.display = 'flex'
  }
  img.onerror = () => {
    document.getElementById('cardImg').src = c.toDataURL('image/png')
    document.getElementById('cardModal').style.display = 'flex'
  }
  img.src = 'data:image/png;base64,' + MINI_CODE_B64
}
const QUESTIONS = __QUESTIONS__;
const ANCIENTS = __ANCIENTS__;
__MATCHER__
const QUESTION_NORM = buildQuestionNorm(QUESTIONS);
__PAGEJS__
</script>
</body>
</html>
`

const miniCodeB64 = readFileSync('/home/ubuntu/meet-ancient/src/static/mini_code.png').toString('base64')

const out = HTML_TEMPLATE
  .replace('__QUESTIONS__', JSON.stringify(questions))
  .replace('__ANCIENTS__', JSON.stringify(ancients))
  .replace('__MATCHER__', MATCHER_SRC)
  .replace('__PAGEJS__', PAGE_JS)
  .replace('__MINI_CODE_B64__', miniCodeB64)

const path = '/home/ubuntu/meet-ancient/web_test.html'
writeFileSync(path, out, 'utf-8')
console.log(`✅ 已生成: ${path} (${(out.length / 1024).toFixed(0)} KB)`)
console.log(`   浏览器直接打开即可测试 (题库 ${questions.length} 题 / 古人 ${ancients.length} 人)`)
