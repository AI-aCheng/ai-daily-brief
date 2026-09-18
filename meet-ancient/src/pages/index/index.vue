<template>
  <view class="page">
    <view class="hero">
      <text class="hero-title">遇 见 古 人</text>
      <text class="hero-sub">测一测，你像历史上的谁？</text>
      <view class="hero-line"></view>
    </view>

    <view class="intro-card">
      <view class="intro-item">
        <text class="intro-num">30</text>
        <text class="intro-text">道情景选择题</text>
      </view>
      <view class="intro-item">
        <text class="intro-num">100</text>
        <text class="intro-text">位精选历史名人</text>
      </view>
      <view class="intro-item">
        <text class="intro-num">3</text>
        <text class="intro-text">分钟找到"另一个你"</text>
      </view>
    </view>

    <view class="desc-card">
      <text class="desc-title">📜 玩法</text>
      <text class="desc-text">回答 30 个贴近现实的选择题，系统将从 100 位家喻户晓的历史名人中，匹配出和你最像的那一位——你们的共同点、TA 的人生成败，以及你可以从 TA 身上学到或规避的东西。每次测试随机抽题，反复测都有新体验。</text>
    </view>

    <button class="start-btn" @tap="start">开始测试</button>
    <text class="footnote">答案没有对错，凭直觉选择即可</text>
  </view>
</template>

<script setup>
function start() {
  uni.navigateTo({ url: '/pages/quiz/quiz' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
  padding: 80rpx 48rpx 60rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60rpx;
}
.hero-title {
  font-size: 72rpx;
  font-weight: bold;
  color: #f5c76a;
  letter-spacing: 12rpx;
  text-shadow: 0 0 30rpx rgba(245, 199, 106, 0.4);
}
.hero-sub {
  margin-top: 24rpx;
  font-size: 30rpx;
  color: #94a3b8;
  letter-spacing: 4rpx;
}
.hero-line {
  margin-top: 30rpx;
  width: 160rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #f5c76a, transparent);
}
.intro-card {
  margin-top: 70rpx;
  width: 100%;
  background: rgba(30, 41, 59, 0.6);
  border: 1rpx solid rgba(245, 199, 106, 0.2);
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  display: flex;
  justify-content: space-around;
}
.intro-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.intro-num {
  font-size: 52rpx;
  font-weight: bold;
  color: #f5c76a;
}
.intro-text {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #cbd5e1;
}
.desc-card {
  margin-top: 40rpx;
  width: 100%;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 20rpx;
  padding: 36rpx;
  box-sizing: border-box;
}
.gender-card {
  margin-top: 40rpx;
  width: 100%;
  background: rgba(30, 41, 59, 0.6);
  border: 1rpx solid rgba(245, 199, 106, 0.2);
  border-radius: 20rpx;
  padding: 30rpx;
  box-sizing: border-box;
}
.gender-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #f5c76a;
  display: block;
  text-align: center;
}
.gender-options {
  margin-top: 24rpx;
  display: flex;
  justify-content: space-around;
}
.gender-option {
  width: 220rpx;
  padding: 24rpx 0;
  border-radius: 16rpx;
  border: 2rpx solid rgba(148, 163, 184, 0.3);
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s;
}
.gender-active {
  border-color: #f5c76a;
  background: rgba(245, 199, 106, 0.12);
}
.gender-icon {
  font-size: 44rpx;
  color: #cbd5e1;
}
.gender-active .gender-icon {
  color: #f5c76a;
}
.gender-label {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #cbd5e1;
}
.gender-active .gender-label {
  color: #f5c76a;
  font-weight: bold;
}
.desc-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #f5c76a;
}
.desc-text {
  display: block;
  margin-top: 20rpx;
  font-size: 27rpx;
  line-height: 1.8;
  color: #cbd5e1;
}
.start-btn {
  margin-top: 60rpx;
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 48rpx;
  background: linear-gradient(90deg, #f5c76a, #e6a84b);
  color: #0f172a;
  font-size: 34rpx;
  font-weight: bold;
  letter-spacing: 6rpx;
}
.footnote {
  margin-top: 30rpx;
  font-size: 24rpx;
  color: #64748b;
}
</style>
