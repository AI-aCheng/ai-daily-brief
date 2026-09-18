<template>
  <view class="page">
    <!-- 匹配动画 -->
    <view v-if="loading" class="loading">
      <view class="loading-ring"></view>
      <text class="loading-text">正在穿越时空，寻找与你最像的古人…</text>
    </view>

    <!-- 结果 -->
    <view v-else class="result">
      <!-- 作答可信度提示 -->
      <view v-if="attentionMiss > 0" class="attention-warn">
        <text class="attention-text">⚠️ 检测到 {{ attentionMiss }} 道注意力检测题回答不一致，结果可能不完全准确，建议重新测一次</text>
      </view>

      <view class="result-head">
        <text class="result-label">与你最像的古人</text>
        <view class="type-badge"><text class="type-badge-text">{{ top.ancient.title }}</text></view>
        <text class="result-name">{{ top.ancient.name }}</text>
        <text class="result-role">{{ top.ancient.era }} · {{ top.ancient.region }} · {{ top.ancient.role }}</text>
        <view class="match-badge">
          <text class="match-pct">匹配度 {{ matchPct }}%</text>
        </view>
        <text class="result-summary">{{ top.ancient.summary }}</text>
      </view>

      <!-- 共同点 -->
      <view class="section">
        <text class="section-title">🤝 你们的共同点</text>
        <view v-for="(c, i) in top.ancient.common" :key="i" class="line-item">
          <text class="line-num">{{ i + 1 }}</text>
          <text class="line-text">{{ c }}</text>
        </view>
      </view>

      <!-- 成败分析 -->
      <view class="section">
        <text class="section-title">{{ analysisTitle }}</text>
        <text class="analysis-text">{{ top.ancient.analysis }}</text>
      </view>

      <!-- 启示 -->
      <view class="section">
        <text class="section-title">💡 给你的启示</text>
        <view v-for="(l, i) in top.ancient.lesson" :key="i" class="line-item">
          <text class="line-num">{{ i + 1 }}</text>
          <text class="line-text">{{ l }}</text>
        </view>
      </view>

      <!-- 相似古人 -->
      <view class="section" v-if="others.length">
        <text class="section-title">🧭 还有谁与你相似（点开看看）</text>
        <view class="other-row" v-for="(o, i) in others" :key="i" @tap="showOther(i)">
          <text class="other-name">{{ o.ancient.name }}</text>
          <text class="other-info">{{ o.ancient.era }} · {{ o.ancient.title }}</text>
          <text class="other-pct">{{ otherPct(o, i) }}%</text>
          <text class="other-arrow">›</text>
        </view>
      </view>

      <view class="actions">
        <button class="btn-primary" @tap="drawCard">生成分享卡片</button>
        <button class="btn-primary" open-type="share">分享我的古人</button>
        <button class="btn-ghost" @tap="restart">再测一次</button>
      </view>
    </view>

    <!-- 分享海报 canvas (屏幕外隐藏) -->
    <canvas canvas-id="shareCard" class="share-canvas" :style="{ width: '750px', height: '1334px' }"></canvas>

    <!-- 海报弹层 -->
    <view class="modal-mask" v-if="cardShow" @tap="closeCard">
      <view class="card-modal" @tap.stop>
        <image class="card-img" :src="cardPath" mode="widthFix"></image>
        <button class="btn-primary card-btn" @tap="saveCard">保存到相册</button>
        <text class="card-tip">保存后发朋友圈/群，让朋友也测测</text>
      </view>
    </view>

    <!-- 相似古人详情弹层 -->
    <view class="modal-mask" v-if="detailShow" @tap="closeOther">
      <view class="modal-card" @tap.stop>
        <view class="modal-head">
          <text class="d-name">{{ detail.ancient.name }}</text>
          <text class="d-role">{{ detail.ancient.era }} · {{ detail.ancient.region }} · {{ detail.ancient.role }}</text>
          <view class="d-pct-wrap">
            <text class="d-pct">匹配度 {{ detailPct }}%</text>
          </view>
          <text class="d-summary">{{ detail.ancient.summary }}</text>
        </view>
        <view class="section">
          <text class="section-title">🤝 你们的共同点</text>
          <view v-for="(c, i) in detail.ancient.common" :key="'dc' + i" class="line-item">
            <text class="line-num">{{ i + 1 }}</text>
            <text class="line-text">{{ c }}</text>
          </view>
        </view>
        <view class="section">
          <text class="section-title">{{ detailAnalysisTitle }}</text>
          <text class="analysis-text">{{ detail.ancient.analysis }}</text>
        </view>
        <view class="section">
          <text class="section-title">💡 给你的启示</text>
          <view v-for="(l, i) in detail.ancient.lesson" :key="'dl' + i" class="line-item">
            <text class="line-num">{{ i + 1 }}</text>
            <text class="line-text">{{ l }}</text>
          </view>
        </view>
        <button class="btn-ghost" @tap="closeOther">关 闭</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { ancients } from '@/data/ancients.js'
import { matchAncients } from '@/utils/matcher.js'
import { ta } from '@/utils/genderNote.js'

const loading = ref(true)
const matches = ref([])
const detailShow = ref(false)
const detail = ref(null)
const attentionMiss = ref(0)

const top = computed(() => matches.value[0] || { ancient: {}, score: 0, matchedTags: [] })
const others = computed(() => matches.value.slice(1))
/**
 * 匹配度展示换算 (排名降档制, 体现差异)
 * 档位: Top1 95-98 / Top2 84-89 / Top3 75-80 / 其余 70
 * 分数接近上限时档内微调, 但名次间的差距始终明显
 */
function calcPct(score, maxScore, rank) {
  if (!maxScore) return 90
  const ratio = score / maxScore
  const base = [95, 86, 77][rank] || 70
  const adj = Math.round((ratio - 0.8) * 12)
  return Math.min(98, Math.max(60, base + adj))
}
const matchPct = computed(() => calcPct(top.value.score, matches.value[0]?.score || 1, 0))
function otherPct(o, i) {
  return calcPct(o.score, matches.value[0]?.score || 1, i + 1)
}

// 相似古人详情
const detailPct = computed(() => (detail.value ? calcPct(detail.value.score, matches.value[0]?.score || 1, 1) : 88))
const detailAnalysisTitle = computed(() => {
  const o = detail.value?.ancient?.outcome
  return outcomeTitle(o, detail.value?.ancient?.gender)
})
function showOther(i) {
  detail.value = matches.value[i]
  detailShow.value = true
}
function closeOther() {
  detailShow.value = false
}

// ===== 分享海报 (裂变卡片) =====
const cardShow = ref(false)
const cardPath = ref('')

function drawCard() {
  const ctx = uni.createCanvasContext('shareCard')
  const W = 750
  const H = 1334
  const a = top.value.ancient || {}
  const name = a.name || '古人'
  const title = a.title || ''
  const era = a.era || ''
  const pct = matchPct.value
  const summary = a.summary || ''

  // 背景渐变 (深色科技风)
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0f172a')
  grad.addColorStop(0.6, '#1e293b')
  grad.addColorStop(1, '#0f172a')
  ctx.setFillStyle(grad)
  ctx.fillRect(0, 0, W, H)

  // 鎏金边框
  ctx.setStrokeStyle('rgba(245,199,106,0.7)')
  ctx.setLineWidth(4)
  ctx.strokeRect(26, 26, W - 52, H - 52)

  ctx.setTextAlign('center')

  // 顶部
  ctx.setFillStyle('#94a3b8')
  ctx.setFontSize(30)
  ctx.fillText('遇 见 古 人', W / 2, 130)
  ctx.setStrokeStyle('rgba(245,199,106,0.4)')
  ctx.setLineWidth(2)
  ctx.beginPath()
  ctx.moveTo(W / 2 - 110, 160)
  ctx.lineTo(W / 2 + 110, 160)
  ctx.stroke()

  // 称号 (鎏金)
  ctx.setFillStyle('#f5c76a')
  ctx.setFontSize(54)
  ctx.fillText(title, W / 2, 400)

  // 古人名 (白色大号)
  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(92)
  ctx.fillText(name, W / 2, 540)

  // 时代
  ctx.setFillStyle('#94a3b8')
  ctx.setFontSize(32)
  ctx.fillText(era, W / 2, 610)

  // 匹配度
  ctx.setFillStyle('#f5c76a')
  ctx.setFontSize(42)
  ctx.fillText('匹配度 ' + pct + '%', W / 2, 690)

  // 一句话简介 (最多3行)
  ctx.setFillStyle('#cbd5e1')
  ctx.setFontSize(28)
  const lines = wrapText(summary, 22)
  lines.slice(0, 3).forEach((l, i) => {
    ctx.fillText(l, W / 2, 790 + i * 48)
  })

  // 中部金线
  ctx.setStrokeStyle('rgba(245,199,106,0.5)')
  ctx.setLineWidth(2)
  ctx.beginPath()
  ctx.moveTo(W / 2 - 170, 990)
  ctx.lineTo(W / 2 + 170, 990)
  ctx.stroke()

  // 引导关注
  ctx.setFillStyle('#94a3b8')
  ctx.setFontSize(26)
  ctx.fillText('长按识别 · 测测你像哪位古人', W / 2, 1050)
  ctx.setFillStyle('#64748b')
  ctx.setFontSize(22)
  ctx.fillText('关注公众号「AI阿程Harness实录」', W / 2, 1090)

  // 小程序码
  const codeSize = 210
  uni.getImageInfo({
    src: '/static/mini_code.png',
    success: () => {
      ctx.drawImage('/static/mini_code.png', W / 2 - codeSize / 2, H - codeSize - 70, codeSize, codeSize)
      flushCanvas(ctx)
    },
    fail: () => {
      // 图片加载失败也尝试直接画
      ctx.drawImage('/static/mini_code.png', W / 2 - codeSize / 2, H - codeSize - 70, codeSize, codeSize)
      flushCanvas(ctx)
    }
  })
}

function flushCanvas(ctx) {
  ctx.draw(false, () => {
    setTimeout(() => {
      uni.canvasToTempFilePath({
        canvasId: 'shareCard',
        success: (res) => {
          cardPath.value = res.tempFilePath
          cardShow.value = true
        },
        fail: (e) => {
          console.log('canvasToTempFilePath fail', e)
          uni.showToast({ title: '生成失败，请重试', icon: 'none' })
        }
      })
    }, 400)
  })
}

function wrapText(text, charsPerLine) {
  if (!text) return []
  const lines = []
  for (let i = 0; i < text.length; i += charsPerLine) {
    lines.push(text.slice(i, i + charsPerLine))
  }
  return lines
}

function saveCard() {
  uni.saveImageToPhotosAlbum({
    filePath: cardPath.value,
    success: () => {
      uni.showToast({ title: '已保存到相册', icon: 'success' })
      cardShow.value = false
    },
    fail: (err) => {
      if (err.errMsg && err.errMsg.indexOf('auth') > -1) {
        uni.showModal({
          title: '需要相册权限',
          content: '请在设置中开启相册权限后重试',
          success: (r) => {
            if (r.confirm) uni.openSetting()
          }
        })
      } else {
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    }
  })
}

function closeCard() {
  cardShow.value = false
}

// 结局标题: 根据古人性别自动用"他/她" (统一走 ta(), 防止手写错)
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
const analysisTitle = computed(() => outcomeTitle(top.value.ancient?.outcome, top.value.ancient?.gender))

function doMatch() {
  const userTags = uni.getStorageSync('userTags') || {}
  attentionMiss.value = uni.getStorageSync('attentionMiss') || 0
  matches.value = matchAncients(userTags, ancients, 3)
  setTimeout(() => { loading.value = false }, 1600)
}

function restart() {
  uni.reLaunch({ url: '/pages/index/index' })
}

onLoad(() => {
  setTimeout(doMatch, 100)
})

onShareAppMessage(() => {
  const name = top.value.ancient?.name || '古人'
  return {
    title: `我测出了最像我的古人是「${name}」，你也来试试`,
    path: '/pages/index/index',
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
  padding: 40rpx 40rpx 80rpx;
  box-sizing: border-box;
}
/* 加载动画 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 300rpx;
}
.loading-ring {
  width: 100rpx;
  height: 100rpx;
  border: 8rpx solid rgba(245, 199, 106, 0.2);
  border-top-color: #f5c76a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  margin-top: 40rpx;
  font-size: 28rpx;
  color: #94a3b8;
}
/* 结果 */
.attention-warn {
  margin-bottom: 20rpx;
  background: rgba(245, 158, 11, 0.12);
  border: 1rpx solid rgba(245, 158, 11, 0.4);
  border-radius: 14rpx;
  padding: 20rpx 24rpx;
}
.attention-text {
  font-size: 24rpx;
  line-height: 1.7;
  color: #fbbf24;
  display: block;
}
.result-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50rpx 0 40rpx;
  border-bottom: 1rpx solid rgba(148, 163, 184, 0.2);
}
.result-label {
  font-size: 26rpx;
  color: #94a3b8;
  letter-spacing: 4rpx;
}
.type-badge {
  margin-top: 18rpx;
  padding: 8rpx 30rpx;
  border-radius: 28rpx;
  background: rgba(59, 130, 246, 0.15);
  border: 1rpx solid rgba(96, 165, 250, 0.5);
}
.type-badge-text {
  font-size: 24rpx;
  color: #93c5fd;
  letter-spacing: 2rpx;
}
.main-note {
  margin-top: 24rpx;
  width: 100%;
  background: rgba(30, 41, 59, 0.7);
  border: 1rpx solid rgba(245, 199, 106, 0.25);
  border-radius: 14rpx;
  padding: 20rpx;
}
.main-note-text {
  font-size: 24rpx;
  line-height: 1.8;
  color: #cbd5e1;
  display: block;
  text-align: left;
}
.result-name {
  margin-top: 20rpx;
  font-size: 76rpx;
  font-weight: bold;
  color: #f5c76a;
  text-shadow: 0 0 40rpx rgba(245, 199, 106, 0.35);
}
.result-role {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #cbd5e1;
}
.match-badge {
  margin-top: 26rpx;
  padding: 12rpx 40rpx;
  border-radius: 30rpx;
  background: rgba(245, 199, 106, 0.15);
  border: 1rpx solid rgba(245, 199, 106, 0.4);
}
.match-pct {
  font-size: 30rpx;
  color: #f5c76a;
  font-weight: bold;
}
.result-summary {
  margin-top: 28rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: #e2e8f0;
  text-align: center;
  padding: 0 20rpx;
}
.section {
  margin-top: 40rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #f5c76a;
  display: block;
  margin-bottom: 24rpx;
}
.line-item {
  display: flex;
  margin-bottom: 18rpx;
}
.line-num {
  width: 44rpx;
  height: 44rpx;
  line-height: 44rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(245, 199, 106, 0.15);
  color: #f5c76a;
  font-size: 24rpx;
  font-weight: bold;
  margin-right: 20rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}
.line-text {
  font-size: 28rpx;
  color: #e2e8f0;
  line-height: 1.7;
  flex: 1;
}
.analysis-text {
  font-size: 28rpx;
  color: #e2e8f0;
  line-height: 1.9;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 16rpx;
  padding: 28rpx;
  display: block;
}
.other-row {
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 14rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
}
.other-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #f1f5f9;
  width: 160rpx;
}
.other-info {
  flex: 1;
  font-size: 24rpx;
  color: #94a3b8;
}
.other-pct {
  font-size: 26rpx;
  color: #f5c76a;
  font-weight: bold;
}
.other-arrow {
  color: #64748b;
  font-size: 36rpx;
  margin-left: 12rpx;
}
/* 详情弹层 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(2, 6, 23, 0.82);
  z-index: 100;
  padding: 80rpx 32rpx;
  overflow-y: auto;
}
.modal-card {
  background: #1e293b;
  border: 1rpx solid rgba(245, 199, 106, 0.3);
  border-radius: 24rpx;
  padding: 40rpx 32rpx 50rpx;
}
.modal-head {
  text-align: center;
  padding-bottom: 26rpx;
  border-bottom: 1rpx solid rgba(148, 163, 184, 0.2);
}
.d-name {
  display: block;
  font-size: 64rpx;
  font-weight: bold;
  color: #f5c76a;
}
.d-role {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #cbd5e1;
  display: block;
}
.d-pct-wrap {
  margin-top: 20rpx;
}
.d-pct {
  padding: 8rpx 30rpx;
  border-radius: 30rpx;
  background: rgba(245, 199, 106, 0.15);
  border: 1rpx solid rgba(245, 199, 106, 0.4);
  color: #f5c76a;
  font-size: 26rpx;
  font-weight: bold;
}
.d-summary {
  margin-top: 20rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #e2e8f0;
  display: block;
}
/* 另一个性别的你 */
.alt-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1rpx solid rgba(245, 199, 106, 0.3);
  border-radius: 16rpx;
  padding: 28rpx;
}
.alt-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 16rpx;
}
.alt-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #f5c76a;
  margin-right: 16rpx;
}
.alt-info {
  font-size: 24rpx;
  color: #94a3b8;
}
.alt-note {
  font-size: 27rpx;
  line-height: 1.9;
  color: #e2e8f0;
  display: block;
}
.actions {
  margin-top: 60rpx;
  display: flex;
  flex-direction: column;
}
.btn-primary {
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 46rpx;
  background: linear-gradient(90deg, #f5c76a, #e6a84b);
  color: #0f172a;
  font-size: 32rpx;
  font-weight: bold;
}
.btn-ghost {
  margin-top: 24rpx;
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 46rpx;
  background: transparent;
  border: 1rpx solid rgba(245, 199, 106, 0.4);
  color: #f5c76a;
  font-size: 30rpx;
}

/* ===== 分享海报 ===== */
.share-canvas {
  position: fixed;
  left: -9999px;
  top: 0;
}
.card-modal {
  width: 78%;
  background: #1e293b;
  border: 1rpx solid rgba(245, 199, 106, 0.3);
  border-radius: 24rpx;
  padding: 36rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.card-img {
  width: 100%;
  border-radius: 16rpx;
}
.card-btn {
  margin-top: 30rpx;
  width: 100%;
}
.card-tip {
  display: block;
  margin-top: 20rpx;
  color: #94a3b8;
  font-size: 24rpx;
  text-align: center;
}
</style>
