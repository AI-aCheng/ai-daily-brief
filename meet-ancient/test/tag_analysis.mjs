/** 标签分布诊断: 为什么大家都匹配到陶渊明/庄子 */
import { questions } from "../src/data/questions.js"
import { ancients } from "../src/data/ancients.js"

// 1. 题库选项标签频率统计
const tagScore = {}
let totalOpt = 0
for (const q of questions) {
  for (const o of q.options) {
    totalOpt++
    for (const [t, s] of Object.entries(o.tags)) {
      tagScore[t] = (tagScore[t] || 0) + s
    }
  }
}
console.log("=== 题库标签总分 TOP15 (30题×4选项) ===")
Object.entries(tagScore).sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([t, s]) => console.log(`  ${t}: ${s}`))
console.log(`  选项总数: ${totalOpt} | 标签种类: ${Object.keys(tagScore).length}/39\n`)

// 2. 古人标签画像频率
const ancientTagFreq = {}
for (const a of ancients) {
  for (const t of Object.keys(a.tags)) {
    ancientTagFreq[t] = (ancientTagFreq[t] || 0) + 1
  }
}
console.log("=== 古人画像标签频次 TOP15 ===")
Object.entries(ancientTagFreq).sort((a, b) => b[1] - a[1]).slice(0, 15)
  .forEach(([t, s]) => console.log(`  ${t}: ${s} 人`))
console.log()

// 3. 陶渊明/庄子的标签画像
for (const name of ["陶渊明", "庄子", "苏轼", "李白"]) {
  const a = ancients.find(x => x.name === name)
  if (a) console.log(`${name}: ${JSON.stringify(a.tags)}`)
}
console.log()

// 4. 模拟: 500 次随机作答, 用归一化 + IDF 匹配, 统计 Top1 分布
import { buildIdf, buildQuestionNorm, normalizeTags } from "../src/utils/matcher.js"
const idf = buildIdf(ancients)
const norm = buildQuestionNorm(questions)
const freq = {}
const N = 500
for (let run = 0; run < N; run++) {
  let raw = {}
  for (const q of questions) {
    const i = Math.floor(Math.random() * q.options.length)
    for (const [tag, s] of Object.entries(q.options[i].tags)) {
      raw[tag] = (raw[tag] || 0) + s
    }
  }
  const t = normalizeTags(raw, norm)
  // 简易匹配 (点积 + IDF)
  let best = null, bestScore = -1
  for (const a of ancients) {
    let s = 0
    for (const [tag, w] of Object.entries(a.tags)) s += (t[tag] || 0) * w * (idf[tag] || 1)
    if (s > bestScore) { bestScore = s; best = a.name }
  }
  freq[best] = (freq[best] || 0) + 1
}
console.log(`=== 500次随机作答 Top1 分布 (归一化+IDF, 前10) ===`)
Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
  .forEach(([n, c]) => console.log(`  ${n}: ${c} 次 (${(c / N * 100).toFixed(0)}%)`))
console.log(`  命中不同古人: ${Object.keys(freq).length} 个`)
