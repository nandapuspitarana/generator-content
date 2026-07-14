import { Client } from '@elastic/elasticsearch'

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY || ''
  },
  requestTimeout: 60000,
  maxRetries: 3
})

export default esClient
