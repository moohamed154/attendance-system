# Static Asset Loading Audit

| Requested Asset | HTTP Status | Browser | Evidence (Failure Text) | Root Cause |
| --- | --- | --- | --- | --- |
| `/_next/static/chunks/19_vrvxcmkwib.css` | **-1** | Chromium | `net::ERR_ABORTED` | Next.js Standalone missing static directory |
| `/_next/static/media/83afe278b6a6bb3c-s.p.2bn3s6zvc0dyp.woff2` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/0rt56oa_51gg6.css` | **-1** | Chromium | `net::ERR_ABORTED` | Next.js Standalone missing static directory |
| `/_next/static/media/9ff27b8a0a8f3dc0-s.p.40_3w74kn95bo.woff2` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/1u82dd-v8mtzx.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/1tsb2lmii3g5i.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/0pj9ssblumbzq.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/34t_ebn2qbc2a.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/0g4supw5_gmz6.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/turbopack-14pw2dzjlvfge.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/2vkr9b92h1dx4.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/0ccyisuegtzyp.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/3cum_jtv38i3c.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/2yxbt-uuaq7zc.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/3vkturmgxw6lx.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/1n1y4sl9-rke0.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/1nvo3v1s86le9.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/3jqt86kl8_c-4.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/2tlw6lvcir3ir.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/2x_w9c1v756ed.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/0bkssqsvlh7s_.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/3izrg25xifhha.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/3y47rlx3yhj9x.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |
| `/_next/static/chunks/30d0asi4vped3.js` | **404** | Chromium | `Not Found` | Next.js Standalone missing static directory |

## Conclusion
The network audit confirms that all requests for static assets (`/_next/static/...`) return `404 Not Found` or `net::ERR_ABORTED` (due to the test aborting before the 404 completes).

Because the `.js` chunks and `.css` files are not served, React fails to hydrate. This directly causes the fallback to native HTML form submission, preventing `data-testid` interaction loops and client-side routing, exactly matching our root cause analysis.