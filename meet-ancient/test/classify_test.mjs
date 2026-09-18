#!/usr/bin/env node
/** 测试八大类型分类逻辑 */
import { ancients } from '../src/data/ancients.js'

const TYPE_TITLES = {
  枭雄: '执掌乾坤的枭雄',
  谋主: '运筹帷幄的谋主',
  名将: '驰骋沙场的名将',
  文宗: '名垂青史的文宗',
  隐士: '独善其身的隐士',
  革新者: '开风气的革新者',
  守成者: '稳守基业的守成者',
  风流: '惊才绝艳的风流人物',
}

function classify(role = '', name = '') {
  // 特判: 少量人物按历史共识归类
  const OVERRIDES = {
    庄子: '隐士', 老子: '隐士', 嵇康: '隐士',
    唐寅: '风流',
    孔子: '守成者',
    鲁迅: '文宗',
  }
  if (OVERRIDES[name]) return OVERRIDES[name]
  const r = role
  if (/皇帝|帝王|君主|女皇|沙皇|国王|女王|可汗|霸主|领袖|总统|首相|总理|掌权者/.test(r)) return '枭雄'
  if (/谋士|军师|宰相|相国|政治家|名臣|重臣|权臣/.test(r)) return '谋主'
  if (/将军|将领|元帅|军事家|武将|女将|统帅/.test(r)) return '名将'
  if (/革命家|发明家|科学家|物理学家|化学家|数学家|生物学家|实业家|传教士|探险家|飞行员|工程师|改革家/.test(r)) return '革新者'
  if (/隐士|道士|僧|修士|修女/.test(r)) return '隐士'
  if (/诗人|文学家|词人|作家|才女|才子|史学家|书法家|学者|评论家|思想家|哲学家|教育家|画家|音乐家|艺术家/.test(r)) return '文宗'
  if (/舞蹈家|设计师|歌妓|乐伎|影星/.test(r)) return '风流'
  return '守成者'
}

// 分类统计
const dist = {}
for (const a of ancients) {
  const t = classify(a.role || '', a.name)
  a._type = t
  dist[t] = (dist[t] || 0) + 1
}
console.log('=== 分类分布 ===')
for (const [t, c] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t}: ${c} 人`)
}

// 抽查: 打印每个分类的前几个 + 可疑项
console.log('\n=== 抽查 ===')
const samples = {
  枭雄: ['武则天', '秦始皇', '慈禧', '忽必烈'],
  谋主: ['诸葛亮', '张良', '王安石', '和珅'],
  名将: ['霍去病', '岳飞', '戚继光', '梁红玉'],
  文宗: ['李白', '苏轼', '李清照', '鲁迅'],
  隐士: ['陶渊明', '庄子', '嵇康'],
  革新者: ['商鞅', '孙中山', '居里夫人', '特斯拉'],
  守成者: ['长孙皇后', '孔子'],
  风流: ['唐寅', '弗里达·卡罗'],
}
for (const [type, names] of Object.entries(samples)) {
  for (const n of names) {
    const a = ancients.find(x => x.name.includes(n) || n.includes(x.name.split('（')[0]))
    if (a) {
      const t = classify(a.role || '', a.name)
      const mark = t === type ? '✅' : `❌ 应为${type}`
      console.log(`  ${a.name} (${a.role}) → ${t} ${mark}`)
    }
  }
}
