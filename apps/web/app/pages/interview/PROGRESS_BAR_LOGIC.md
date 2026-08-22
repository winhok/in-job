# 简历押题进度条实现逻辑

## 概述

进度条根据服务端 SSE 返回的数据实时更新，特别针对 Step 5（AI 生成阶段）做了优化，提供平滑的进度感知。

## 服务端数据格式

### 进度更新消息

```json
{
  "type": "progress",
  "step": 1,
  "label": "正在分析简历亮点",
  "progress": 20,
  "message": "正在分析简历亮点"
}
```

**字段说明**：
- `type`: 消息类型，固定为 `"progress"`
- `step`: 当前步骤编号（1-5）
- `label`: 步骤显示标签（可选，用于覆盖前端默认标签）
- `progress`: 当前进度百分比（0-100）
- `message`: 进度消息（可选）

### 题目数据消息

```json
{
  "type": "question",
  "question": "题目内容",
  "answer": "参考答案"
}
```

## 进度步骤

| Step | 默认标签 | 预期进度范围 | 说明 |
|------|---------|------------|------|
| 1 | 正在分析简历亮点 | 0-20% | 快速完成 |
| 2 | 正在深度解析岗位 JD | 20-40% | 快速完成 |
| 3 | 正在检索行业历史面试数据 | 40-60% | 中等速度 |
| 4 | 正在构建能力评估模型 | 60-80% | 中等速度 |
| 5 | 正在生成针对性押题结果 | 80-99% | **慢速，需要特殊处理** |

## Step 5 特殊处理

### 为什么需要特殊处理？

Step 5 是 AI 生成阶段，特点：
- ⏱️ **耗时长**：可能需要 10-30 秒甚至更长
- 📡 **服务端更新慢**：AI 生成期间，服务端可能长时间不发送进度更新
- 👤 **用户体验**：如果进度条长时间不动，用户会以为卡住了

### 解决方案：平滑进度动画

```javascript
// 当收到 step 5 的进度更新时
if (currentStep === 5) {
  // 启动平滑动画，从当前进度平滑过渡到服务端进度
  startStep5ProgressAnimation(currentProgress, serverProgress)
}
```

### 动画逻辑

1. **自适应速度**：根据进度差异调整动画速度
   ```javascript
   if (totalIncrease > 10) {
     // 大跨度：每 200ms 增加 0.5%（较快）
   } else if (totalIncrease > 5) {
     // 中等跨度：每 300ms 增加 0.3%（中速）
   } else {
     // 小跨度：每 500ms 增加 0.2%（慢速，持续感）
   }
   ```

2. **持续增长**：达到服务端进度后，继续缓慢增长
   ```javascript
   // 达到目标后，继续以 0.1%/500ms 的速度增长
   // 但不超过 99%（等待服务端完成信号）
   ```

3. **动态更新**：收到新的服务端进度时，重启动画
   ```javascript
   // 清除旧动画
   clearInterval(step5ProgressInterval)
   // 启动新动画，从当前进度到新的服务端进度
   step5ProgressInterval = startStep5ProgressAnimation(current, newTarget)
   ```

## 实现示例

### 场景 1：正常流程

```
服务端推送：
→ {"type":"progress","step":1,"progress":10}   // 立即更新到 10%
→ {"type":"progress","step":1,"progress":20}   // 立即更新到 20%
→ {"type":"progress","step":2,"progress":30}   // 立即更新到 30%
→ {"type":"progress","step":2,"progress":40}   // 立即更新到 40%
→ {"type":"progress","step":3,"progress":50}   // 立即更新到 50%
→ {"type":"progress","step":3,"progress":60}   // 立即更新到 60%
→ {"type":"progress","step":4,"progress":70}   // 立即更新到 70%
→ {"type":"progress","step":4,"progress":80}   // 立即更新到 80%
→ {"type":"progress","step":5,"progress":85}   // 进入 Step 5，启动平滑动画
```

### 场景 2：Step 5 长时间无更新

```
时间轴：
00:00 → 收到 {"step":5,"progress":85}
        启动动画：85% → 85% (目标)
        
00:00-00:05 → 平滑增长到 85%
00:05-00:10 → 继续缓慢增长：85% → 86% → 87% ...
00:10-00:15 → 继续缓慢增长：88% → 89% → 90% ...

00:15 → 收到 {"step":5,"progress":95}
        重启动画：90% → 95% (新目标)
        
00:15-00:20 → 平滑增长到 95%
00:20-00:25 → 继续缓慢增长：95% → 96% → 97% ...

00:30 → 收到完成信号
        立即跳到 100%
```

### 场景 3：快速完成

```
服务端推送：
→ {"step":5,"progress":85}  // 启动动画：85% → 85%
→ {"step":5,"progress":90}  // 1秒后，重启：85% → 90%
→ {"step":5,"progress":95}  // 1秒后，重启：90% → 95%
→ 完成信号                  // 立即 → 100%
```

## 前端实现要点

### 1. 状态管理

```javascript
let step5ProgressInterval = null  // 动画定时器
let lastServerProgress = 0        // 上次服务端进度
let isInStep5 = false             // 是否在 Step 5
```

### 2. 进度更新逻辑

```javascript
if (data.type === 'progress') {
  const { step, progress } = data
  
  // 检测进入 Step 5
  if (step === 5 && !isInStep5) {
    isInStep5 = true
  }
  
  // Step 5：平滑动画
  if (isInStep5) {
    clearInterval(step5ProgressInterval)
    step5ProgressInterval = startStep5ProgressAnimation(
      progressPercentage.value,  // 当前进度
      progress                    // 目标进度
    )
  } 
  // 其他步骤：直接更新
  else {
    progressPercentage.value = progress
  }
}
```

### 3. 清理逻辑

```javascript
// 错误时清理
onError: () => {
  if (step5ProgressInterval) {
    clearInterval(step5ProgressInterval)
  }
}

// 完成时清理
onComplete: () => {
  if (step5ProgressInterval) {
    clearInterval(step5ProgressInterval)
  }
  progressPercentage.value = 100
}
```

## 用户体验优化

### ✅ 优点

1. **持续反馈**：即使服务端长时间无更新，进度条仍在缓慢移动
2. **平滑过渡**：避免进度条突然跳跃
3. **真实感知**：动画速度根据实际进度差异自适应
4. **不会卡在 99%**：达到目标后继续缓慢增长

### 🎯 关键指标

- **最小增量**：0.1%（持续增长时）
- **最大增量**：0.5%（大跨度时）
- **更新频率**：200-500ms
- **最大进度**：99%（等待完成信号才到 100%）

## 测试建议

### 测试场景

1. **正常流程**：所有步骤按顺序完成
2. **Step 5 慢速**：Step 5 持续 30 秒无更新
3. **快速完成**：Step 5 在 2 秒内完成
4. **网络波动**：中途断开重连
5. **错误处理**：服务端返回错误

### 验证点

- [ ] 进度条是否平滑移动
- [ ] Step 5 是否有持续的进度感知
- [ ] 进度是否会超过 100%
- [ ] 错误时是否正确清理定时器
- [ ] 完成时进度是否准确到达 100%

## 后端建议

### 推荐的进度推送策略

```typescript
// Step 1-4: 快速推送
for (let i = 1; i <= 4; i++) {
  await processStep(i)
  sendProgress(i, i * 20)  // 每步推送一次
}

// Step 5: 频繁推送（即使进度变化小）
let progress = 80
while (!completed) {
  await processChunk()
  progress += 1  // 每处理一小块，增加 1%
  sendProgress(5, progress)  // 频繁推送，让前端有更新
}

// 完成
sendComplete()
```

### 关键点

1. **Step 5 要频繁推送**：即使进度变化小，也要推送
2. **不要长时间无更新**：最长不超过 3-5 秒
3. **进度要递增**：不要出现进度倒退
4. **明确完成信号**：发送 `[DONE]` 或 `progress: 100`

