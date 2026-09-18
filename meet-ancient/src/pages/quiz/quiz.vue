<template>
  <view class="page">
    <view class="progress-wrap">
      <text class="progress-text">{{ current + 1 }} / {{ total }}</text>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
      </view>
    </view>

    <view class="question-card" v-if="q">
      <text class="q-text">{{ q.scenario }}</text>
    </view>

    <view class="options">
      <view
        v-for="(opt, i) in q.options"
        :key="i"
        class="option"
        :class="{ 'option-chosen': chosenIdx === i }"
        @tap="choose(i)"
      >
        <text class="option-mark">{{ marks[i] }}</text>
        <text class="option-text">{{ opt.text }}</text>
      </view>
    </view>

    <view class="nav-row">
      <text v-if="current > 0" class="nav-link" @tap="goBack">‹ 上一题</text>
      <text v-else class="nav-link dim">‹ 上一题</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { questions, pickQuestions } from '@/data/questions.js'
import { accumulateTags, normalizeTags, buildQuestionNorm } from '@/utils/matcher.js'

// 每次测试随机抽 30 题 (45 题库, 标签均衡, 含 2 道注意力检测)
const quizQuestions = pickQuestions(questions, 30)
const norm = buildQuestionNorm(questions)

const marks = ['甲', '乙', '丙', '丁', '戊', '己']
const total = quizQuestions.length
const current = ref(0)
const chosenIdx = ref(-1)
const userTags = ref({})
const answers = ref([]) // 每题的选项索引
const attentionMiss = ref(0) // 注意力检测答错次数

const q = computed(() => quizQuestions[current.value])
const progress = computed(() => ((current.value) / total) * 100)

function choose(i) {
  if (chosenIdx.value !== -1) return // 已选, 防连点
  chosenIdx.value = i
  // 注意力检测: 答错计数, 但不影响标签画像
  if (q.value.attention) {
    if (i !== q.value.correctIndex) attentionMiss.value++
  } else {
    userTags.value = accumulateTags(userTags.value, q.value.options[i].tags)
  }
  answers.value.push(i)
  setTimeout(() => {
    if (current.value >= total - 1) {
      finish()
    } else {
      current.value++
      chosenIdx.value = -1
    }
  }, 250)
}

function goBack() {
  if (current.value === 0) return
  const lastOpt = answers.value.pop()
  const prevQ = quizQuestions[current.value - 1]
  if (!prevQ.attention) {
    const tags = prevQ.options[lastOpt].tags
    // 撤销上一题标签
    const rollback = { ...userTags.value }
    for (const [t, s] of Object.entries(tags)) {
      rollback[t] = (rollback[t] || 0) - s
      if (rollback[t] <= 0) delete rollback[t]
    }
    userTags.value = rollback
  } else {
    if (lastOpt !== prevQ.correctIndex) attentionMiss.value = Math.max(0, attentionMiss.value - 1)
  }
  current.value--
  chosenIdx.value = -1
}

function finish() {
  // 归一化用户画像: 高频标签(谨慎/务实等)因选项多而得分虚高, 归一化后反映相对偏好
  uni.setStorageSync('userTags', normalizeTags(userTags.value, norm))
  uni.setStorageSync('answerCount', answers.value.length)
  uni.setStorageSync('attentionMiss', attentionMiss.value)
  uni.redirectTo({ url: '/pages/result/result' })
}

onLoad(() => {
  // 重置状态
  userTags.value = {}
  answers.value = []
  current.value = 0
  chosenIdx.value = -1
  attentionMiss.value = 0
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
  padding: 40rpx 40rpx 60rpx;
  box-sizing: border-box;
}
.progress-wrap {
  padding: 20rpx 0;
}
.progress-text {
  font-size: 26rpx;
  color: #f5c76a;
}
.progress-bar {
  margin-top: 14rpx;
  height: 10rpx;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 5rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f5c76a, #e6a84b);
  border-radius: 5rpx;
  transition: width 0.3s;
}
.question-card {
  margin-top: 50rpx;
  background: rgba(30, 41, 59, 0.7);
  border: 1rpx solid rgba(245, 199, 106, 0.15);
  border-radius: 24rpx;
  padding: 48rpx 36rpx;
  min-height: 200rpx;
  display: flex;
  align-items: center;
}
.q-text {
  font-size: 34rpx;
  font-weight: bold;
  color: #f1f5f9;
  line-height: 1.7;
}
.options {
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
}
.option {
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.5);
  border: 1rpx solid rgba(148, 163, 184, 0.25);
  border-radius: 18rpx;
  padding: 30rpx 28rpx;
  margin-bottom: 24rpx;
  transition: all 0.2s;
}
.option-chosen {
  border-color: #f5c76a;
  background: rgba(245, 199, 106, 0.12);
}
.option-mark {
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(245, 199, 106, 0.15);
  color: #f5c76a;
  font-size: 28rpx;
  font-weight: bold;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.option-text {
  font-size: 29rpx;
  color: #e2e8f0;
  line-height: 1.6;
}
.nav-row {
  margin-top: 30rpx;
  text-align: center;
}
.nav-link {
  font-size: 28rpx;
  color: #94a3b8;
  padding: 20rpx 40rpx;
}
.nav-link.dim {
  opacity: 0.3;
}
</style>
