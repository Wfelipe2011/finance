import { StateAnnotation } from "@infra/graph/graph-state-annotation";
import { AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ToolSchemaBase } from "@langchain/core/tools";
import { ChatDeepSeek } from "@langchain/deepseek";
import { Logger } from "@nestjs/common";
import { DateTimeParserTool } from "@tools/DateTimeParserTool";
import { FinancialAnalystTool } from "@tools/FinancialAnalystTool";
import { StatementCreditCardRetrievalTool } from "@tools/StatementCreditCardRetrievalTool";
import { StatementRetrievalTool } from "@tools/StatementRetrievalTool";
import { TranslationTool } from "@tools/TranslationTool";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { StructuredTool } from "langchain/tools";

export class FinancialServiceAgent {
    name = "financial_service_agent";
    model: ChatDeepSeek;
    tools: StructuredTool<ToolSchemaBase, any, any, any>[];
    systemPrompt: string;
    executor: AgentExecutor;
    logger = new Logger(FinancialServiceAgent.name);

    static createAgent(): AgentExecutor {

        const tools = [
            DateTimeParserTool,
            StatementRetrievalTool,
            FinancialAnalystTool,
            TranslationTool,
            StatementCreditCardRetrievalTool
        ]

        const model = new ChatDeepSeek({
            apiKey: process.env["DEEPSEEK_API_KEY"]!,
            model: 'deepseek-chat',
        });
        
        const systemPrompt = `
        # Especialista em Serviços Financeiros - ${new Date().toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })}

        Você é um especialista em serviços financeiros, como um gerente de banco experiente. Você tem acesso a todos os lançamentos de extratos bancários e faturas de cartão de crédito do cliente através das ferramentas disponíveis.

        ## Suas Capacidades
        - Analisar extratos bancários e faturas de cartão de crédito
        - Responder perguntas sobre gastos, receitas e padrões financeiros
        - Oferecer insights sobre o comportamento financeiro do cliente
        - Manipular datas e períodos para análises temporais precisas
        - Traduzir conteúdo quando necessário para melhorar a precisão das ferramentas

        ## Ferramentas Disponíveis
        - **${StatementRetrievalTool.name}**: Recupera extratos bancários relevantes com base na pergunta
        - **${StatementCreditCardRetrievalTool.name}**: Recupera faturas de cartão de crédito relevantes com base na pergunta
        - **${FinancialAnalystTool.name}**: Analisa extratos e responde perguntas específicas sobre finanças
        - **${DateTimeParserTool.name}**: Interpreta e manipula datas e períodos mencionados nas perguntas
        - **${TranslationTool.name}**: Traduz conteúdo entre português e inglês quando necessário

        ## Fluxo de Trabalho Inteligente
        1. **Compreenda a Intenção**: Analise cuidadosamente a pergunta do usuário para identificar:
           - Qual informação financeira está sendo solicitada
           - Qual período de tempo está sendo considerado (se aplicável)
           - Quais categorias ou tipos de transações são relevantes

        2. **Manipule Datas Quando Necessário**: Se a pergunta envolver períodos específicos, use o ${DateTimeParserTool.name} para interpretar e formatar as datas corretamente.

        3. **Recupere os Dados Relevantes**: Use o ${StatementRetrievalTool.name} ou ${StatementCreditCardRetrievalTool.name} para buscar os extratos e faturas mais relevantes para a pergunta, filtrando pelo tenantId do cliente.

        4. **Analise os Dados**: Passe os extratos recuperados e a pergunta original para o ${FinancialAnalystTool.name} para obter uma análise detalhada.

        5. **Use Tradução Estrategicamente**: 
           - Traduza para inglês apenas quando necessário para melhorar a precisão das ferramentas
           - Sempre responda ao usuário em português fluente e natural
           - Considere traduzir termos técnicos ou específicos para melhorar a recuperação de informações

        6. **Responda com Expertise**: Forneça respostas claras, precisas e contextualizadas, como um verdadeiro especialista financeiro faria.

        ## Diretrizes de Comunicação
        - Use linguagem profissional mas acessível, evitando jargões desnecessários
        - Seja detalhado e preciso nas análises financeiras
        - Ofereça insights além dos dados brutos quando apropriado
        - Mantenha um tom cordial e prestativo, como um gerente de banco atencioso

        ## Importante
        - O tenantId do cliente atual é: {tenantId}
        - Sempre verifique se os dados recuperados são suficientes antes de fazer análises
        - Se os dados forem insuficientes, informe o usuário e solicite mais informações
        - Priorize a precisão financeira acima de tudo
        `;
        
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            ["human", "{input}"],
            ["placeholder", "{agent_scratchpad}"],
        ]);
        
        const agent = createToolCallingAgent({
            llm: model,
            tools: tools,
            prompt,
        });
        
       return new AgentExecutor({
            agent,
            tools,
            verbose: false,
        });
    }

    async invoke(state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State> {
        const inputMessage = state.messages[0]?.content ?? "";
        
        try {
            this.logger.log('Processando consulta financeira do cliente...');
            
            const response = await this.executor.invoke({
                input: inputMessage,
                tenantId: state.tenantId, // Poderia ser dinâmico baseado no estado ou contexto
            });

            this.logger.log('Resposta da análise financeira gerada com sucesso.');
            this.logger.debug('Conteúdo da resposta:', response["output"]);
            
            // Adiciona a resposta ao estado
            state.messages.push(new AIMessage({ content: response["output"] }));
            
            return state;
        } catch (error) {
            this.logger.error('Erro ao processar consulta financeira:', error);
            
            // Adiciona uma mensagem de erro amigável ao estado
            state.messages.push(new AIMessage({ 
                content: "Desculpe, encontrei um problema ao analisar suas informações financeiras. " +
                         "Poderia reformular sua pergunta ou fornecer mais detalhes sobre o que deseja saber?" 
            }));
            
            return state;
        }
    }
}
