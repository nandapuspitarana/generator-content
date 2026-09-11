const payload = {
  title: "[Podcast] Artificial Intelligence: A Modern Approach",
  author: "Host Nanda V3",
  notes: "",
  length: "SHORT",
  articleId: "bf211a75-1699-4a00-b34c-d842f3ee1cd4"
};

async function test() {
  console.log("Sending POST request to /api/podcast/generate...");
  const start = Date.now();
  try {
    const res = await fetch("http://localhost:3300/api/podcast/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const duration = (Date.now() - start) / 1000;
    console.log(`Response status: ${res.status} ${res.statusText} in ${duration}s`);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (err) {
    const duration = (Date.now() - start) / 1000;
    console.error(`Request failed in ${duration}s:`, err);
  }
}

test();
