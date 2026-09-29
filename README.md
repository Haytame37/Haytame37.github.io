# haytame37.github.io

Personal portfolio of **Haytame El Atraoui**, Industrial Digital Transformation engineering student (ENSA Beni Mellal), available for a final-year internship (PFE) from February 2027.

Live: https://haytame37.github.io/

## Stack

Static site with no build step: HTML, CSS and vanilla JavaScript. It is served as-is by GitHub Pages.

```
index.html              page content (EN/FR, switched client-side)
assets/css/style.css    design system and layout
assets/js/main.js       language toggle, navigation, scroll reveals, counters
assets/js/lab.js        "The Lab": six interactive engineering simulations
assets/img/             optimized photos (WebP) and social preview image
Haytame_El_Atraoui_CV_PORTFOLIO_2027_EN.pdf
```

## The Lab

Each module reproduces the logic of a real project from the CV, using synthetic data:

| Module | Mirrors |
| --- | --- |
| Cyber Risk Engine | ISO 27005 risk register → automated Jira tickets with duplicate prevention |
| SAP Data Pipeline | Safran internship: SAP export → configurable rules → standardized AD/SB output |
| Machine Alerting | n8n workflow: telemetry → threshold → SMTP alert / MongoDB log, with retry |
| Container Stack | Docker Compose (Nginx, API, PostgreSQL, pgAdmin), health checks and restart policy |
| Secure REST API | GMPP platform: JWT verification and role-based access control |
| Warehouse Optimizer | OptiStock: pick-route optimization (nearest neighbour + 2-opt) |

## Editing

- **Text:** every visible string exists twice in `index.html`, as `<span data-l="en">` and `<span data-l="fr">`. Update both.
- **CV:** replace the PDF and keep the same file name, so existing links keep working.
- **Local preview:** run `python -m http.server` in this folder, then open http://localhost:8000.
