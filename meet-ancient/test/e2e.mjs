/** e2e 端到端测试: 模拟 50 次随机答题全流程 (node test/e2e.mjs) */
import { questions, pickQuestions } from "../src/data/questions.js"
import { ancients } from "../src/data/ancients.js"
import { matchAncients, accumulateTags, normalizeTags, buildQuestionNorm, buildIdf } from "../src/utils/matcher.js"

console.log(`题库: ${questions.length} 题 (含注意力 ${questions.filter(q => q.attention).length}) | 精选古人库: ${ancients.length} 人\n`)

// 性别分布
const females = ancients.filter(a => a.gender === "female")
const males = ancients.filter(a => a.gender === "male")
console.log(`性别分布: 男 ${males.length} / 女 ${females.length}\n`)
if (females.length < 15) console.log(`⚠️ 女性古人仅 ${females.length} 位, 女性用户匹配多样性受限`)

// 数据完整性校验
let errs = 0
for (const q of questions) {
  if (!q.scenario || q.options.length < 3) { console.log(`❌ 题${q.id} 缺选项`); errs++ }
  for (const o of q.options) {
    // 注意力检测题允许空标签(不计入画像), 普通题必须有关联标签
    if (!o.text) { console.log(`❌ 题${q.id} 选项缺文本`); errs++ }
    if (!q.attention && (!o.tags || Object.keys(o.tags).length === 0)) {
      console.log(`❌ 题${q.id} 选项缺标签: ${o.text}`); errs++
    }
  }
}
// 抽题引擎校验: 抽 30 题含注意力题 + 标签覆盖均衡
const sample = pickQuestions(questions, 30)
if (sample.length !== 30) { console.log(`❌ 抽题数量 ${sample.length}`); errs++ }
if (!sample.some((q) => q.attention)) { console.log("❌ 抽题缺注意力题"); errs++ }
const tagKinds = new Set()
for (const q of sample) for (const o of q.options) for (const t of Object.keys(o.tags)) tagKinds.add(t)
if (tagKinds.size < 35) { console.log(`❌ 抽题标签覆盖仅 ${tagKinds.size}/39`); errs++ }
const idSet = new Set()
for (const a of ancients) {
  if (!a.id || !a.name || !a.tags || !a.common || !a.analysis || !a.lesson) {
    console.log(`❌ 古人缺字段: ${a?.name}`); errs++
  }
  if (idSet.has(a.id)) { console.log(`❌ 重复 id: ${a.id}`); errs++ }
  idSet.add(a.id)
  if (!["success", "fail", "tragic", "retreat"].includes(a.outcome)) {
    console.log(`❌ ${a.name} outcome 非法: ${a.outcome}`); errs++
  }
  if (a.common.length < 3 || a.lesson.length < 3) {
    console.log(`❌ ${a.name} common/lesson 不足3条`); errs++
  }
}
console.log(errs === 0 ? "✅ 数据结构校验通过" : `❌ ${errs} 个数据问题`)

// 50 次随机答题模拟 (全局匹配 + 同性参考)
const idf = buildIdf(ancients)
const norm = buildQuestionNorm(questions)
const outcomes = {}
let top1Count = {}
for (let run = 0; run < 50; run++) {
  let raw = {}
  const quiz = pickQuestions(questions, 30)
  for (const q of quiz) {
    const i = Math.floor(Math.random() * q.options.length)
    if (q.attention) continue // 注意力题不计入画像
    raw = accumulateTags(raw, q.options[i].tags)
  }
  const tags = normalizeTags(raw, norm)
  const top = matchAncients(tags, ancients, 3, idf)
  if (!top[0]) { console.log(`❌ run${run} 无结果`); continue }
  outcomes[top[0].ancient.outcome] = (outcomes[top[0].ancient.outcome] || 0) + 1
  top1Count[top[0].ancient.name] = (top1Count[top[0].ancient.name] || 0) + 1
}

console.log("\n50 次随机答题 → Top1 古人结局分布:")
for (const [k, v] of Object.entries(outcomes)) console.log(`  ${k}: ${v} 次`)
console.log("\nTop1 古人命中分布(前5):")
Object.entries(top1Count).sort((a, b) => b[1] - a[1]).slice(0, 5)
  .forEach(([k, v]) => console.log(`  ${k}: ${v} 次`))

const distinct = Object.keys(top1Count).length
console.log(`\n共匹配到 ${distinct} 个不同古人 (多样性 ${(distinct / 100 * 100).toFixed(0)}%)`)
console.log(distinct >= 15 ? "✅ 匹配多样性良好" : "⚠️ 匹配过于集中, 需检查标签分布")
