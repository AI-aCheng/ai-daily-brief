/** matcher 单元测试 (node --input-type=module test/matcher.test.mjs) */
import { cosineSimilarity, matchAncients, accumulateTags, matchWithGender } from "../src/utils/matcher.js"

let pass = 0, fail = 0
function assert(name, cond) {
  if (cond) { pass++; console.log(`✅ ${name}`) }
  else { fail++; console.log(`❌ ${name}`) }
}

// 1. 余弦相似度: 相同向量 = 1
assert("相同向量相似度=1", Math.abs(cosineSimilarity({a: 3, b: 4}, {a: 3, b: 4}) - 1) < 1e-9)

// 2. 正交向量 = 0
assert("正交向量相似度=0", cosineSimilarity({a: 5}, {b: 5}) === 0)

// 3. 部分重叠: 相似度在 (0,1)
const s = cosineSimilarity({a: 4, b: 2}, {a: 3, b: 1, c: 5})
assert("部分重叠 0<s<1", s > 0 && s < 1)

// 4. 匹配: 高分古人排第一
const ancients = [
  { id: "a", name: "甲", tags: {乐观: 5, 豪放: 4} },
  { id: "b", name: "乙", tags: {悲观: 5, 隐忍: 4} },
  { id: "c", name: "丙", tags: {乐观: 3, 豪放: 2, 随性: 1} },
]
const userTags = {乐观: 5, 豪放: 4, 随性: 1}
const top = matchAncients(userTags, ancients, 3)
assert("甲(最相似)排第一", top[0].ancient.id === "a")
assert("丙排第二", top[1].ancient.id === "c")
assert("乙排最后", top[2].ancient.id === "b")
assert("返回3个", top.length === 3)

// 5. matchedTags 按用户分数降序
assert("共同标签按用户分排序", top[0].matchedTags[0] === "乐观")

// 6. accumulateTags 累加正确
const acc = accumulateTags({乐观: 1}, {乐观: 2, 隐忍: 3})
assert("累加", acc.乐观 === 3 && acc.隐忍 === 3)

// 7. 边界: 空输入
assert("空用户标签不崩", matchAncients({}, ancients).length === 3)
assert("空古人库", matchAncients({a: 1}, []).length === 0)

// 8. 全选同一倾向: 极端画像也能匹配
const extreme = {乐观: 30, 豪放: 30, 随性: 30}
const t2 = matchAncients(extreme, ancients)
assert("极端画像匹配到甲", t2[0].ancient.id === "a")

// 9. 性别参考: 不强制性别, 提供同性参考
const gAncients = [
  { id: "m1", name: "男1", gender: "male", tags: {乐观: 5, 豪放: 4} },
  { id: "m2", name: "男2", gender: "male", tags: {乐观: 4, 豪放: 4} },
  { id: "f1", name: "女1", gender: "female", tags: {乐观: 5, 随性: 4} },
  { id: "f2", name: "女2", gender: "female", tags: {乐观: 3, 随性: 3} },
]
// 女性用户: 全局 Top1 是男1(最高分), 同性参考必须不在 Top3 里 (去重)
const gr = matchWithGender({乐观: 5, 豪放: 4, 随性: 2}, gAncients, 3, null, "female")
assert("女性用户全局 Top1 不强制同性", gr.matches[0].ancient.id === "m1")
assert("同性参考不与 Top3 重复", gr.sameGender && !gr.matches.some(m => m.ancient.id === gr.sameGender.ancient.id))
assert("同性参考是女2(女1在Top3被排除)", gr.sameGender.ancient.id === "f2")
// 男性用户: 全局 Top1 是男1, 同性参考应为 null (Top1 已是同性)
const gr2 = matchWithGender({乐观: 5, 豪放: 4, 随性: 2}, gAncients, 3, null, "male")
assert("男性用户同性参考为 null", gr2.sameGender === null)
// 无性别: sameGender null
const gr3 = matchWithGender({乐观: 5, 豪放: 4, 随性: 2}, gAncients, 3, null, "")
assert("无性别时同性参考 null", gr3.sameGender === null)

console.log(`\n结果: ${pass} 通过, ${fail} 失败`)
process.exit(fail > 0 ? 1 : 0)
