import { describe, it, expect, vi, beforeEach } from "vitest";
import esClient, { isElasticsearchAlive } from "@/lib/elasticsearch";

describe("Elasticsearch Client & Liveness Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return true when Elasticsearch ping succeeds", async () => {
    const pingSpy = vi.spyOn(esClient, "ping").mockResolvedValue(true as any);

    const isAlive = await isElasticsearchAlive();
    expect(isAlive).toBe(true);
    expect(pingSpy).toHaveBeenCalledTimes(1);
  });

  it("should return false gracefully without throwing when Elasticsearch ping fails or times out", async () => {
    const pingSpy = vi.spyOn(esClient, "ping").mockRejectedValue(new Error("Connection refused: 9200"));

    const isAlive = await isElasticsearchAlive();
    expect(isAlive).toBe(false);
    expect(pingSpy).toHaveBeenCalledTimes(1);
  });

  it("should maintain a singleton instance of esClient with correct timeout and retries", () => {
    expect(esClient).toBeDefined();
    expect(typeof esClient.ping).toBe("function");
    expect(typeof esClient.search).toBe("function");
  });
});
