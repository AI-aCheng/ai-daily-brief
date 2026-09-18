/**
 * ancients.js — 「遇见古人」古人库聚合入口
 * 精选 100 位高知名度古人 (中国 75 + 外国 25)
 * 标准: 历史知名度金字塔顶端 + 彼此差异大 + 中国为主
 */
import { ancients as cn1 } from './ancients_cn1.js'
import { ancients as cn2 } from './ancients_cn2.js'
import { ancients as foreign } from './ancients_foreign.js'
import { ancients as female } from './ancients_female.js'
import { ancients as femaleCn } from './ancients_female_cn.js'
import { ancients as femaleForeign } from './ancients_female_foreign.js'
import { ancients as extra } from './ancients_extra.js'

/** 精选名单: 顶级知名度 + 代表性 (中国 75 + 外国 25) */
const CURATED_NAMES = [
  // === 中国 (75) ===
  // 先秦
  "老子", "孔子", "庄子", "屈原", "项羽", "刘邦", "韩信", "张良", "范蠡", "商鞅", "秦始皇",
  // 两汉三国
  "苏武", "司马迁", "霍去病", "王昭君", "曹操", "刘备", "诸葛亮", "关羽", "周瑜", "司马懿",
  // 魏晋南北朝
  "嵇康", "陶渊明", "王羲之",
  // 隋唐
  "李白", "杜甫", "白居易", "玄奘", "武则天", "李世民", "杨贵妃",
  // 宋
  "赵匡胤", "范仲淹", "王安石", "司马光", "苏轼", "李清照", "岳飞", "秦桧", "辛弃疾", "陆游", "文天祥", "包拯",
  // 元明清
  "成吉思汗", "忽必烈", "朱元璋", "朱棣", "郑和", "王阳明", "唐寅", "李时珍", "戚继光", "康熙", "乾隆", "和珅", "林则徐", "曾国藩", "李鸿章", "左宗棠", "慈禧", "康有为", "梁启超",
  // 近现代
  "孙中山", "鲁迅", "秋瑾", "宋庆龄",
  // 女性名人 (中国)
  "卓文君", "蔡文姬", "花木兰", "穆桂英", "梁红玉", "吕后", "孝庄太后", "林徽因", "张爱玲",
  // === 外国 (25) ===
  "苏格拉底", "柏拉图", "亚里士多德", "亚历山大大帝", "凯撒", "拿破仑",
  "释迦牟尼", "耶稣", "穆罕默德", "达·芬奇", "哥伦布", "伽利略", "牛顿",
  "达尔文", "马克思", "爱迪生", "爱因斯坦", "特斯拉", "居里夫人",
  "华盛顿", "林肯", "丘吉尔", "甘地", "圣女贞德", "莎士比亚",
]

/** 八大类型称号 */
export const TYPE_TITLES = {
  枭雄: '执掌乾坤的枭雄',
  谋主: '运筹帷幄的谋主',
  名将: '驰骋沙场的名将',
  文宗: '名垂青史的文宗',
  隐士: '独善其身的隐士',
  革新者: '开风气的革新者',
  守成者: '稳守基业的守成者',
  风流: '惊才绝艳的风流人物',
}

export const TYPES = Object.keys(TYPE_TITLES)

/** 按历史共识归类 (role 关键词 + 少量特判) */
export function classify(role = '', name = '') {
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
  if (/诗人|文学家|词人|作家|才女|才子|史学家|书法家|学者|评论家|思想家|哲学家|教育家|画家|音乐家|艺术家|剧作家/.test(r)) return '文宗'
  if (/舞蹈家|设计师|歌妓|乐伎|影星/.test(r)) return '风流'
  return '守成者'
}

/** 注入 type/title */
function enrich(list) {
  return list.map((a) => {
    const main = (a.name || '').split('（')[0].split('(')[0].trim()
    const type = classify(a.role || '', main)
    return { ...a, type, title: TYPE_TITLES[type] }
  })
}

/** 按精选名单过滤 */
const all = [
  ...enrich(cn1), ...enrich(cn2), ...enrich(foreign),
  ...enrich(female), ...enrich(femaleCn), ...enrich(femaleForeign), ...enrich(extra),
]

const byMainName = {}
for (const a of all) {
  const main = (a.name || '').split('（')[0].split('(')[0].trim()
  if (!byMainName[main]) byMainName[main] = a
}

export const ancients = CURATED_NAMES
  .map((n) => byMainName[n])
  .filter(Boolean)

/** 检查名单是否有缺失 (调试用) */
export const missingNames = CURATED_NAMES.filter((n) => !byMainName[n])
