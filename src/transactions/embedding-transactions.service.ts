import _ from 'lodash';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';
import { TipoCategoria, TipoTransacao, Transacoes, TransacoesCartaoCredito } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import type { Document } from "@langchain/core/documents";
import {
  PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { v4 as uuidv4 } from "uuid";
import { config, embeddings } from '@infra/embeddings';

@Injectable()
export class EmbeddingTransactionsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingTransactionsService.name);
  private vectorStore: PGVectorStore;
  constructor(
    readonly prismaService: PrismaService,
  ) { }

  async onModuleInit() {
    this.logger.debug('Inicializando o serviço de embeddings para transações...');
    this.vectorStore = await PGVectorStore.initialize(embeddings, config);
    this.logger.debug('Serviço de embeddings para transações inicializado com sucesso.');
  }

  @OnEvent('transaction.created', { async: true })
  async handleOrderCreatedEvent(payload: Transacoes) {
    this.logger.debug(`Recebido evento 'transaction.created' para tenantId: ${payload.tenantId}, id: ${payload.id}`);
    const document: Document = {
      pageContent: `No dia ${payload.data.toISOString().split('T')[0]}, foi registrada a transação "${payload.descricao}" no banco "${payload.banco}". O valor da transação foi de R$${payload.valor.toFixed(2)}.`,
      metadata: {
        id: payload.id,
        tenantId: payload.tenantId,
        mode: "Transacoes",
        categoria: payload.categoria || TipoCategoria.OUTROS,
        type: payload.tipo
      },
    }
    this.logger.debug(`Adicionando documento ao vector store: ${JSON.stringify(document)}`);
    await this.vectorStore.addDocuments([document], { ids: [uuidv4()] });
    this.logger.debug('Documento adicionado ao vector store com sucesso.');
  }

  @OnEvent('transactionCreditCard.created', { async: true })
  async handleCreditCardTransactionCreatedEvent(payload: TransacoesCartaoCredito) {
    this.logger.debug(`Recebido evento 'transactionCreditCard.created' para tenantId: ${payload.tenantId}, id: ${payload.id}`);
    const document: Document = {
      pageContent: `No dia ${payload.data.toISOString().split('T')[0]}, foi registrada a transação de cartão de crédito "${payload.descricao}" no banco "${payload.banco}". O valor da transação foi de R$${payload.valor.toFixed(2)}.`,
      metadata: {
        id: payload.id,
        tenantId: payload.tenantId,
        mode: "TransacoesCartaoCredito",
        categoria: payload.categoria || TipoCategoria.OUTROS,
        type: TipoTransacao.DESPESA
      },
    }
    this.logger.debug(`Adicionando documento ao vector store: ${JSON.stringify(document)}`);
    await this.vectorStore.addDocuments([document], { ids: [uuidv4()] });
    this.logger.debug('Documento de cartão de crédito adicionado ao vector store com sucesso.');
  }

  async search(query: string, tenantId: number): Promise<Document[]> {
    this.logger.debug(`Buscando transações para a consulta: ${query}`);
    const retriever = this.vectorStore.asRetriever({
      filter: { tenantId },
    });
    const results = await retriever.invoke(query);
    this.logger.debug(`Resultados encontrados: ${results.length}`);
    return results;
  }

}
