from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import proposals, financial, webhooks, files, technical, dashboard, integrations, projects, events, categories

app = FastAPI(
    title="InfraReport API",
    description="Backend para automação de propostas, financeiro e WhatsApp.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ajuste para domínio real em produção
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proposals.router)
app.include_router(financial.router)
app.include_router(webhooks.router)
app.include_router(files.router)
app.include_router(technical.router)
app.include_router(dashboard.router)
app.include_router(integrations.router)
app.include_router(projects.router)
app.include_router(events.router)
app.include_router(categories.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "infrareport-api"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "infrareport-api"}
