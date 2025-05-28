import { DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PoolConfig } from "pg";

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env['OPENAI_API_KEY'],
  model: "text-embedding-3-small",
});

const config  = {
  postgresConnectionOptions: {
    type: "postgres",
    host: process.env['PG_HOST'],
    port: 5492,
    user: process.env['PG_USER'],
    password: process.env['PG_PASSWORD'],
    database: process.env['PG_DATABASE'],
    connectionTimeoutMillis: 10000,
    max: 30, // número máximo de conexões no pool
    keepAlive: true, // manter a conexão viva
  } as PoolConfig,
  tableName: "document_vectors",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  distanceStrategy: "cosine" as DistanceStrategy,
};

export {
    embeddings,
    config,

}