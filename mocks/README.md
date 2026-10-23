# Nordane back-office mocks

Static, clickable design prototypes with demo data only (Wirtschaft zur Linde, St. Gallen). Not linked from nordane.ch; they live on the `mock/backoffice` branch.

- `backoffice/`: merged direction (LINIE base + Linear details; glow and mountain backgrounds; palettes C/A/B). Open `backoffice/index.html`.
- `backoffice-stripe/`: Stripe-like variant ("Hell und grosszügig"). Open `backoffice-stripe/index.html` (starts on Heute; all pages linked from the sidebar, e.g. `app/requests.html?theme=light`).

Run locally from the repo root: `python3 -m http.server 8000`, then open `http://127.0.0.1:8000/mocks/`.
