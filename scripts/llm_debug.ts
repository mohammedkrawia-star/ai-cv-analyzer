import "./load-env.js";

const url = `${process.env.BUILT_IN_FORGE_API_URL?.replace(/\/$/, "")}/v1/chat/completions`;
const key = process.env.BUILT_IN_FORGE_API_KEY;
console.log("URL:", url, "KEY SET:", !!key);

async function call(body: Record<string, unknown>, label: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Record<string, unknown>;
  const ch = (data.choices as unknown[])?.[0] as Record<string, unknown> | undefined;
  console.log(`--- ${label} status=${res.status}`);
  console.log("MSG KEYS:", ch?.message ? Object.keys(ch.message as object) : "none");
  const msg = ch?.message as Record<string, unknown> | undefined;
  console.log("CONTENT:", JSON.stringify(msg?.content)?.slice(0, 600));
  console.log("FINISH:", ch?.finish_reason);
}

async function main() {
  const msgs = [{ role: "user", content: "Return JSON: {\"overallScore\": 72}" }];
  await call({ messages: msgs, response_format: { type: "json_object" } }, "with json_object");
  await call({ messages: msgs }, "without response_format");
  process.exit(0);
}
main();
