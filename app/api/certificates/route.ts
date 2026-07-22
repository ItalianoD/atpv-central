import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { isLocalRequest, localOnlyResponse } from "../local-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

type WindowsCertificate = {
  Thumbprint: string;
  Subject: string;
  Issuer: string;
  NotAfter: string;
  FriendlyName?: string;
};

function commonName(subject: string) {
  return subject.match(/(?:^|,\s*)CN=([^,]+)/i)?.[1]?.trim() || subject;
}

export async function GET(request: Request) {
  if (!isLocalRequest(request)) return localOnlyResponse();

  try {
    const script = path.join(process.cwd(), "scripts", "list-certificates.ps1");
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script],
      { windowsHide: true, encoding: "utf8", maxBuffer: 1024 * 1024 },
    );

    const parsed = stdout.trim() ? JSON.parse(stdout) : [];
    const records: WindowsCertificate[] = Array.isArray(parsed) ? parsed : [parsed];
    const certificates = records.map((item) => ({
      thumbprint: item.Thumbprint,
      name: commonName(item.Subject),
      subject: item.Subject,
      issuer: item.Issuer,
      expiresAt: item.NotAfter,
    }));

    return Response.json(
      { certificates },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch {
    return Response.json(
      { message: "Não foi possível acessar os certificados instalados no Windows." },
      { status: 500 },
    );
  }
}
