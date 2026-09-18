/**
 * 性别代词工具: 统一"他/她", 防止模板手写出错
 * 所有涉及古人的文案一律用 ta(gender) 生成代词
 */
export function ta(gender) {
  return gender === 'female' ? '她' : '他'
}

/**
 * 性别滤镜对照文案生成器
 * 核心洞察: 同样的性格特质, 在不同性别下受社会地位/分工/礼教约束, 命运路径完全不同
 * 用户性格最像的古人可能是异性 → 展示"如果换个性别"的人生对照
 */

const MALE_ANCIENT_TEMPLATE = (a, tags, userGender) =>
  `你性格上其实最像【${a.name}】——同有「${tags}」的底色。TA 生于${a.era}，作为男性，得以${describeMalePath(a)}。` +
  `但若你生在那个时代，作为女性，同样的性格很难走 TA 的路：那个年代的女性，多数被礼教与家庭束缚在深闺与内宅，` +
  `纵有雄心也只能借他人之手实现，除非像武则天那样以非常手段突破。不过换个角度看：` +
  `你的「性别天花板」也是你的「保护色」——你不必用 TA 那样刀光剑影的方式，也能活出 TA 的底色。`

const FEMALE_ANCIENT_TEMPLATE = (a, tags, userGender) =>
  `你性格上其实最像【${a.name}】——同有「${tags}」的底色。TA 生于${a.era}，作为女性，只能在${describeFemalePath(a)}中施展才华。` +
  `若你生在那个时代，作为男性，同样的性格可以更直接地入仕掌权、建功立业——` +
  `TA 要用十年迂回才能抵达的位置，你也许三年就能走到。所以别浪费你的性别红利：` +
  `TA 替你验证了性格的底色，而你拥有 TA 没有的直路。`

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

/**
 * 生成性别对照文案
 * @param {Object} ancient 匹配到的异性古人
 * @param {Array} tags 共同标签数组 (matchedTags)
 * @param {String} userGender 用户性别 male/female
 * @returns {String} 文案, 同性或无效时返回空串
 */
export function genderContrastNote(ancient, tags = [], userGender = "") {
  if (!ancient || !userGender || ancient.gender === userGender) return ""
  const tagStr = tags.slice(0, 2).join("」「")
  const wrapped = tagStr ? `「${tagStr}」` : "相似"
  return ancient.gender === "male"
    ? MALE_ANCIENT_TEMPLATE(ancient, wrapped, userGender)
    : FEMALE_ANCIENT_TEMPLATE(ancient, wrapped, userGender)
}
