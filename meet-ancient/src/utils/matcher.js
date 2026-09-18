/**
 * matcher.js — 「遇见古人」规则引擎
 * 标签画像匹配：用户答题得到标签分布 → 与古人标签画像算相似度 → Top3
 */

/** 余弦相似度: 两个标签分布 {tag: score} (仅用于参考展示) */
export function cosineSimilarity(a, b) {
  const tags = new Set([...Object.keys(a), ...Object.keys(b)])
  let dot = 0, na = 0, nb = 0
  for (const t of tags) {
    const va = a[t] || 0
    const vb = b[t] || 0
    dot += va * vb
    na += va * va
    nb += vb * vb
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/**
 * 构建标签稀有度权重 (IDF): 古人库里越稀有的标签权重越高
 * 解决"坚韧/务实"等万金油标签主导匹配、结果过于集中的问题
 */
export function buildIdf(ancients) {
  const N = ancients.length
  const df = {}
  for (const a of ancients) {
    for (const t of Object.keys(a.tags || {})) df[t] = (df[t] || 0) + 1
  }
  const idf = {}
  for (const [t, c] of Object.entries(df)) {
    idf[t] = Math.log(N / (1 + c)) + 1
  }
  return idf
}

/**
 * 加权点积评分（主匹配算法, 支持 IDF 稀有度加权）
 * 用户 30 题总分恒定, 点积 = 古人标签在用户画像上的加权命中
 */
export function dotScore(userTags, ancientTags, idf) {
  let s = 0
  for (const [t, a] of Object.entries(ancientTags || {})) {
    s += (userTags[t] || 0) * a * (idf?.[t] || 1)
  }
  return s
}

/**
 * 构建题库标签总分 (归一化分母): 每个标签在题库里的总可用分
 */
export function buildQuestionNorm(questions) {
  const total = {}
  for (const q of questions) {
    for (const o of q.options) {
      for (const [t, s] of Object.entries(o.tags)) total[t] = (total[t] || 0) + s
    }
  }
  return total
}

/**
 * 归一化用户画像: 每个标签分 ÷ 题库该标签总可用分 × 10
 * 解决"谨慎/务实"等高频标签因选项多而得分虚高的问题——
 * 用户答了多少分不重要, 重要的是相对题库可用分的占比 (相对偏好)
 */
export function normalizeTags(userTags, norm) {
  const out = {}
  for (const [t, s] of Object.entries(userTags)) {
    out[t] = (s / (norm[t] || 1)) * 10
  }
  return out
}

/**
 * 匹配古人 (全局最优: 不限性别, 惊喜感最大化)
 * @param {Object} userTags 用户标签分布 {tag: score}
 * @param {Array} ancients 古人数组 [{id,name,gender,type,tags:{...}}]
 * @param {Number} topN 返回数量
 * @param {Object} idf 可选, 稀有度加权
 * @returns {Array} [{ancient, score, matchedTags}]
 */
export function matchAncients(userTags, ancients, topN = 3, idf) {
  const scored = ancients.map((a) => {
    const score = dotScore(userTags, a.tags || {}, idf)
    // 共同标签: 用户和古人都有的标签, 按用户分数排序
    const matchedTags = Object.keys(userTags)
      .filter((t) => (a.tags || {})[t] && userTags[t] > 0)
      .sort((x, y) => userTags[y] - userTags[x])
    return { ancient: a, score, matchedTags }
  })
  scored.sort((x, y) => y.score - x.score)
  return scored.slice(0, topN)
}

/**
 * 带性别参考的匹配 (爆款逻辑: 不强制性别, 提供同性参考)
 * @returns {{matches: Array, sameGender: Object|null}}
 *   matches: 全局 Top3 (可能含异性)
 *   sameGender: 全局匹配中同性得分最高者 (主结果异性的代入感补充)
 */
export function matchWithGender(userTags, ancients, topN = 3, idf, gender) {
  const global = matchAncients(userTags, ancients, topN + 3, idf)
  const main = global[0]
  const mainId = main?.ancient?.id
  const matches = global.slice(0, topN)
  const usedIds = new Set(matches.map((r) => r.ancient.id))
  let sameGender = null
  // 仅当主结果与用户异性时, 提供同性参考; 且必须不在 TopN 里 (去重, 防重复展示)
  if (gender && main?.ancient?.gender && main.ancient.gender !== gender) {
    sameGender = global.find((r) => r.ancient.gender === gender && !usedIds.has(r.ancient.id)) || null
    // 全局 Top 里找不到同性 (平均画像下男性古人更占优), 专门算同性最高分
    if (!sameGender) {
      const scored = ancients.map((a) => {
        const score = dotScore(userTags, a.tags || {}, idf)
        const matchedTags = Object.keys(userTags)
          .filter((t) => (a.tags || {})[t] && userTags[t] > 0)
          .sort((x, y) => userTags[y] - userTags[x])
        return { ancient: a, score, matchedTags }
      })
      scored.sort((x, y) => y.score - x.score)
      sameGender = scored.find((r) => r.ancient.gender === gender && !usedIds.has(r.ancient.id)) || null
    }
  }
  return { matches, sameGender }
}

/** 答题累加: 把选项的标签加分累进用户画像 */
export function accumulateTags(userTags, optionTags) {
  const out = { ...userTags }
  for (const [tag, score] of Object.entries(optionTags || {})) {
    out[tag] = (out[tag] || 0) + score
  }
  return out
}
