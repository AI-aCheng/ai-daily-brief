#!/usr/bin/env node
/** 给现有古人数据加 gender 字段 (女性标注, 其余 male) */
import { writeFileSync } from 'fs'
import { ancients as cn1 } from '../src/data/ancients_cn1.js'
import { ancients as cn2 } from '../src/data/ancients_cn2.js'
import { ancients as foreign } from '../src/data/ancients_foreign.js'

const FEMALE = new Set(['王昭君', '武则天', '李清照', '慈禧', '克娄巴特拉', '居里夫人', '圣女贞德'])

function rewrite(list, path) {
  const tagged = list.map((a) => {
    // 外国古人名字带括号(如"克娄巴特拉（Cleopatra）"), 取括号前主名匹配
    const main = a.name.split('（')[0].split('(')[0].trim()
    return { ...a, gender: FEMALE.has(main) ? 'female' : 'male' }
  })
  const content = `/**\n * ${path.split('/').pop()} — 古人数据 (含 gender 字段: male/female)\n */\nexport const ancients = ${JSON.stringify(tagged, null, 2)}\n`
  writeFileSync(path, content)
  const f = tagged.filter((a) => a.gender === 'female').length
  console.log(`${path}: ${tagged.length} 人 (女性 ${f})`)
}

rewrite(cn1, '/home/ubuntu/meet-ancient/src/data/ancients_cn1.js')
rewrite(cn2, '/home/ubuntu/meet-ancient/src/data/ancients_cn2.js')
rewrite(foreign, '/home/ubuntu/meet-ancient/src/data/ancients_foreign.js')
console.log('✅ gender 字段添加完成')
