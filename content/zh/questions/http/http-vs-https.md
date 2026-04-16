---
slug: http-vs-https
title: HTTP 與 HTTPS 的差異為何？TLS 握手流程是什麼？
category: http
tags: [http, https, tls, security, network]
difficulty: intermediate
---

## HTTP vs HTTPS

| 特性 | HTTP | HTTPS |
|---|---|---|
| 全名 | HyperText Transfer Protocol | HTTP + TLS/SSL |
| 預設埠 | 80 | 443 |
| 加密 | 無 | TLS 加密 |
| 資料完整性 | 無保護 | MAC 驗證 |
| 身份驗證 | 無 | 憑證驗證 |
| SEO | 較低排名 | Google 給予加分 |

## TLS 握手（TLS 1.3 簡化版）

1. **Client Hello**：Client 發送支援的 TLS 版本、加密套件清單
2. **Server Hello**：Server 選擇加密套件，回傳憑證（公鑰）
3. **Key Exchange**：雙方透過 ECDHE 協議建立共享金鑰
4. **Finished**：雙方確認握手完成，開始加密通訊

TLS 1.3 相較 1.2 減少了一個 Round Trip，握手更快（0-RTT 支援恢復連線）。
