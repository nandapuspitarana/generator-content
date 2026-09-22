import { Client } from '@elastic/elasticsearch'

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_API_KEY ? {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  } : undefined,
  requestTimeout: 3000,
  maxRetries: 0
})

export async function isElasticsearchAlive(): Promise<boolean> {
  try {
    const health = await esClient.ping()
    return health
  } catch {
    return false
  }
}

export default esClient
