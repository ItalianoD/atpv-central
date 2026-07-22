"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Certificate = {
  thumbprint: string;
  name: string;
  subject: string;
  issuer: string;
  expiresAt: string;
};

type SearchMode = "placa" | "chassi";

function formatExpiry(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR").format(date);
}

export default function Home() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificate, setCertificate] = useState("");
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [mode, setMode] = useState<SearchMode>("placa");
  const [placa, setPlaca] = useState("");
  const [renavam, setRenavam] = useState("");
  const [chassi, setChassi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [atpvNumber, setAtpvNumber] = useState("");

  const selectedCertificate = useMemo(
    () => certificates.find((item) => item.thumbprint === certificate),
    [certificate, certificates],
  );

  async function fetchCertificates(): Promise<Certificate[]> {
    const response = await fetch("/api/certificates", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Não foi possível ler os certificados.");
    return payload.certificates;
  }

  async function loadCertificates() {
    setLoadingCertificates(true);
    setError("");
    try {
      const items = await fetchCertificates();
      setCertificates(items);
      setCertificate((current) => current || items[0]?.thumbprint || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao carregar certificados.");
    } finally {
      setLoadingCertificates(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchCertificates()
      .then((items) => {
        if (cancelled) return;
        setCertificates(items);
        setCertificate(items[0]?.thumbprint || "");
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Erro ao carregar certificados.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCertificates(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (documentUrl) URL.revokeObjectURL(documentUrl);
    };
  }, [documentUrl]);

  function selectMode(nextMode: SearchMode) {
    setMode(nextMode);
    setError("");
    setAtpvNumber("");
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAtpvNumber("");
    setLoading(true);

    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl("");
    }

    try {
      const response = await fetch("/api/atpv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thumbprint: certificate,
          mode,
          placa: placa.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          renavam: renavam.replace(/\D/g, ""),
          chassi: chassi.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "A ATPV-e não pôde ser consultada.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
      setAtpvNumber(response.headers.get("X-ATPV-Number") || "Documento localizado");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro inesperado na consulta.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = certificate && (mode === "placa" ? placa && renavam : chassi);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="ATPV Central — início">
          <span className="brand-mark">A</span>
          <span>
            <strong>ATPV Central</strong>
            <small>Consulta RENAVE</small>
          </span>
        </a>
        <div className="connection-status">
          <span className="status-dot" aria-hidden="true" />
          Integração oficial
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="eyebrow"><span /> ACESSO SEGURO AO RENAVE</div>
        <h1>Sua ATPV-e, direto<br />do sistema oficial.</h1>
        <p>Selecione seu certificado, informe o veículo e baixe o PDF em poucos segundos.</p>
      </section>

      <section className="workspace" aria-label="Consulta de ATPV-e">
        <form className="search-card" onSubmit={handleSubmit}>
          <div className="card-heading">
            <div>
              <span className="step">01</span>
              <h2>Certificado digital</h2>
              <p>Use o mesmo certificado selecionado no Swagger do RENAVE.</p>
            </div>
            <button className="refresh-button" type="button" onClick={loadCertificates} disabled={loadingCertificates}>
              {loadingCertificates ? "Lendo…" : "Atualizar lista"}
            </button>
          </div>

          <label className="field-label" htmlFor="certificate">Certificado instalado no Windows</label>
          <select
            id="certificate"
            value={certificate}
            onChange={(event) => setCertificate(event.target.value)}
            disabled={loadingCertificates}
          >
            {!certificates.length && <option value="">Nenhum certificado encontrado</option>}
            {certificates.map((item) => (
              <option key={item.thumbprint} value={item.thumbprint}>
                {item.name} — vence em {formatExpiry(item.expiresAt)}
              </option>
            ))}
          </select>

          {selectedCertificate && (
            <div className="certificate-summary">
              <span className="shield-icon" aria-hidden="true">✓</span>
              <span><strong>Certificado pronto para uso</strong><small>Validade: {formatExpiry(selectedCertificate.expiresAt)}</small></span>
            </div>
          )}

          <div className="section-divider" />

          <div className="card-heading search-heading">
            <div>
              <span className="step">02</span>
              <h2>Localizar documento</h2>
              <p>Escolha uma das formas de identificação do veículo.</p>
            </div>
          </div>

          <div className="mode-tabs" role="tablist" aria-label="Forma de consulta">
            <button type="button" role="tab" aria-selected={mode === "placa"} onClick={() => selectMode("placa")}>Placa + Renavam</button>
            <button type="button" role="tab" aria-selected={mode === "chassi"} onClick={() => selectMode("chassi")}>Chassi</button>
          </div>

          {mode === "placa" ? (
            <div className="field-grid">
              <div>
                <label className="field-label" htmlFor="placa">Placa</label>
                <input id="placa" value={placa} onChange={(event) => setPlaca(event.target.value.toUpperCase())} placeholder="ABC1D23" maxLength={8} autoComplete="off" />
              </div>
              <div>
                <label className="field-label" htmlFor="renavam">Renavam</label>
                <input id="renavam" value={renavam} onChange={(event) => setRenavam(event.target.value.replace(/\D/g, ""))} placeholder="00000000000" maxLength={11} inputMode="numeric" autoComplete="off" />
              </div>
            </div>
          ) : (
            <div>
              <label className="field-label" htmlFor="chassi">Chassi</label>
              <input id="chassi" value={chassi} onChange={(event) => setChassi(event.target.value.toUpperCase())} placeholder="Informe os 17 a 21 caracteres" maxLength={21} autoComplete="off" />
            </div>
          )}

          {error && <div className="error-message" role="alert"><strong>Não foi possível concluir.</strong>{error}</div>}

          <button className="primary-button" type="submit" disabled={!canSubmit || loading}>
            {loading ? <><span className="spinner" /> Consultando RENAVE…</> : <>Consultar ATPV-e <span>→</span></>}
          </button>
        </form>

        <aside className="result-panel" aria-live="polite">
          <div className="document-preview">
            <div className="paper">
              <div className="paper-seal">BR</div>
              <div className="paper-lines"><span /><span /><span /><span /></div>
              <div className="paper-qr"><i /><i /><i /></div>
            </div>
            <div className="preview-shadow one" />
            <div className="preview-shadow two" />
          </div>

          {documentUrl ? (
            <div className="result-copy success-copy">
              <span className="result-kicker">DOCUMENTO ENCONTRADO</span>
              <h2>ATPV-e pronta.</h2>
              <p>Número: {atpvNumber}</p>
              <div className="result-actions">
                <a className="download-button" href={documentUrl} download={`ATPV-e-${atpvNumber}.pdf`}>Baixar PDF</a>
                <a className="open-button" href={documentUrl} target="_blank" rel="noreferrer">Visualizar</a>
              </div>
            </div>
          ) : (
            <div className="result-copy">
              <span className="result-kicker">DOCUMENTO DIGITAL</span>
              <h2>O PDF aparece aqui.</h2>
              <p>Após a consulta, você poderá visualizar ou baixar a ATPV-e oficial.</p>
            </div>
          )}

          <div className="privacy-note">
            <span aria-hidden="true">⌁</span>
            <p><strong>Processamento local</strong>O portal usa o certificado instalado no seu Windows e não envia a chave privada.</p>
          </div>
        </aside>
      </section>

      <footer>
        <span>ATPV Central</span>
        <p>Acesso restrito aos documentos vinculados ao estabelecimento credenciado.</p>
      </footer>
    </main>
  );
}
