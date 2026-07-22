const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isLocalRequest(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    if (!LOCAL_HOSTS.has(requestUrl.hostname)) return false;

    const origin = request.headers.get("origin");
    if (!origin) return true;

    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export function localOnlyResponse() {
  return Response.json(
    { message: "Por segurança, o ATPV Central aceita somente acessos feitos neste computador." },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
