import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { isLocalRequest, localOnlyResponse } from "../local-request";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const PLATE = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
const RENAVAM = /^\d{9,11}$/;
const CHASSIS = /^[A-HJ-NPR-Z0-9]{17,21}$/;

type RequestBody = {
  thumbprint?: string;
  mode?: "placa" | "chassi";
  placa?: string;
  renavam?: string;
  chassi?: string;
};

type RenavePdf = {
  numeroAtpv?: string;
  pdfAtpvBase64?: string;
  mensagemParaUsuarioFinal?: string;
  detalhe?: string;
};

function parseRenaveMessage(value: string) {
  try {
    const payload = JSON.parse(value) as RenavePdf;
    return payload.mensagemParaUsuarioFinal || payload.detalhe || "A consulta foi recusada pelo RENAVE.";
  } catch {
    return "O RENAVE não concluiu a consulta. Verifique o certificado e os dados do veículo.";
  }
}

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return localOnlyResponse();

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Dados da consulta inválidos." }, { status: 400 });
  }

  const thumbprint = body.thumbprint?.replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
  if (!thumbprint) return Response.json({ message: "Selecione um certificado digital." }, { status: 400 });

  let endpoint: string;
  if (body.mode === "chassi") {
    const chassi = body.chassi?.trim().toUpperCase() || "";
    if (!CHASSIS.test(chassi)) {
      return Response.json({ message: "Informe um chassi válido, com 17 a 21 caracteres." }, { status: 400 });
    }
    endpoint = `/api/pdf-atpv?chassi=${encodeURIComponent(chassi)}`;
  } else {
    const placa = body.placa?.trim().toUpperCase() || "";
    const renavam = body.renavam?.replace(/\D/g, "") || "";
    if (!PLATE.test(placa)) {
      return Response.json({ message: "Informe uma placa válida no padrão ABC1D23." }, { status: 400 });
    }
    if (!RENAVAM.test(renavam)) {
      return Response.json({ message: "O Renavam deve possuir de 9 a 11 números." }, { status: 400 });
    }
    endpoint = `/api/pdf-atpv/${encodeURIComponent(placa)}/${encodeURIComponent(renavam)}`;
  }

  const baseUrl = (process.env.RENAVE_BASE_URL || "https://renave.estaleiro.serpro.gov.br/renave-ws").replace(/\/$/, "");
  const script = path.join(process.cwd(), "scripts", "renave-request.ps1");

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-BaseUrl", baseUrl, "-Endpoint", endpoint, "-Thumbprint", thumbprint],
      { windowsHide: true, encoding: "utf8", maxBuffer: 30 * 1024 * 1024, timeout: 60_000 },
    );

    const payload = JSON.parse(stdout.trim()) as RenavePdf;
    if (!payload.pdfAtpvBase64) {
      return Response.json({ message: parseRenaveMessage(stdout) }, { status: 422 });
    }

    const pdf = Buffer.from(payload.pdfAtpvBase64, "base64");
    const safeNumber = (payload.numeroAtpv || "documento").replace(/[^A-Za-z0-9_-]/g, "");
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="ATPV-e-${safeNumber}.pdf"`,
        "Cache-Control": "no-store, private",
        "X-ATPV-Number": safeNumber,
      },
    });
  } catch (caught) {
    const error = caught as { stdout?: string; stderr?: string; killed?: boolean };
    const raw = error.stdout?.trim() || error.stderr?.trim() || "";
    return Response.json(
      { message: error.killed ? "A consulta demorou além do limite. Tente novamente." : parseRenaveMessage(raw) },
      { status: 502 },
    );
  }
}
