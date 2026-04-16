---
slug: http-vs-https
title: What is the difference between HTTP and HTTPS? What is the TLS handshake?
category: http
tags: [http, https, tls, security, network]
difficulty: intermediate
---

## HTTP vs HTTPS

| Feature | HTTP | HTTPS |
|---|---|---|
| Full name | HyperText Transfer Protocol | HTTP + TLS/SSL |
| Default port | 80 | 443 |
| Encryption | None | TLS encryption |
| Data integrity | Unprotected | MAC verification |
| Authentication | None | Certificate verification |
| SEO | Lower ranking | Google bonus |

## TLS Handshake (TLS 1.3 simplified)

1. **Client Hello**: Client sends supported TLS versions and cipher suites
2. **Server Hello**: Server selects cipher suite and sends its certificate (public key)
3. **Key Exchange**: Both parties establish a shared secret via ECDHE
4. **Finished**: Both parties confirm the handshake; encrypted communication begins

TLS 1.3 reduces the handshake by one round trip compared to TLS 1.2, enabling 0-RTT session resumption.
