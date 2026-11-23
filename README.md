# UpWell — website design preview

Static preview of the UpWell website design (desktop + mobile). Design only: no real orders, prices are samples.

## Pages
| Desktop | Phone |
|---|---|
| `/` homepage | `/m/` |
| `/product` | `/m/product` |
| `/box` build your box | `/m/box` |
| `/cart` cart & checkout | `/m/cart` |

Phones (screens up to 760px wide) are sent to the phone version automatically.
Force a version with `?view=desktop` or `?view=mobile` (remembered for the visit).

## Run locally
```
node server.js        # http://localhost:3000
```
No dependencies to install. Node 18+.

## Deploy on Railway
**From GitHub:** push this folder to a repo → Railway → New Project → Deploy from GitHub repo → open the service → Settings → Networking → **Generate Domain**.

**From your computer (CLI):**
```
npm i -g @railway/cli
railway login
railway init          # create a project
railway up            # upload and deploy this folder
railway domain        # generates the public *.up.railway.app address
```
Railway sets `PORT` automatically; `server.js` uses it.

The preview is marked `noindex` so search engines don't list it.

## Updating the design
Pages in `public/` are generated from the design canvas files by `build_pages.py`:
```
python3 build_pages.py <folder with the .dc.html files>
```
`public/js/runtime.js` renders the page templates; `public/js/morphdom.min.js` is morphdom (MIT).
