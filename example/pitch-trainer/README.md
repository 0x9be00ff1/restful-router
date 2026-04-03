# Pitch Trainer Web Demo

这是一个可直接运行的 Web 音准测试 MVP：

- 实时麦克风音高检测（自相关算法）
- 内置 3 首简单歌曲（小星星、生日快乐、两只老虎）
- 按 cents 偏差打分并输出总分/稳定度/建议

## 本地预览

在仓库根目录执行：

```bash
python3 -m http.server 8080
```

打开：

```text
http://localhost:8080/example/pitch-trainer/
```

## GitHub Pages 自动部署

仓库已提供工作流：`.github/workflows/deploy-pitch-trainer.yml`。

首次使用请在 GitHub 仓库设置：

1. 进入 `Settings` -> `Pages`
2. 在 `Build and deployment` 里选择 `Source: GitHub Actions`
3. 推送到 `main` 分支后会自动部署 `example/pitch-trainer` 目录

部署成功后访问：

```text
https://<你的GitHub用户名>.github.io/<仓库名>/
```

## 迁移到微信小程序建议

当前 Demo 已按 “核心层 + 平台适配层” 分离：

- `core.js`：音高转换、误差计算、评分和歌曲数据（可复用）
- `web-adapter.js`：Web 麦克风接入（需替换成小程序录音接入）
- `app.js`：页面流程编排

迁移时优先复用 `core.js` 的纯算法逻辑，将 `web-adapter.js` 换成微信侧的音频输入适配器。
