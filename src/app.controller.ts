import { MemorySaver, StateGraph } from '@langchain/langgraph';
import { Body, Controller, Post } from '@nestjs/common';
import { StateAnnotation } from '@infra/graph/graph-state-annotation';
import { FinancialServiceAgent } from '@agents/FinancialServiceAgent';
import { PrismaService } from '@infra/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Public } from '@decorators/public.decorator';

const checkpointer = new MemorySaver();
const serviceAgent = FinancialServiceAgent.createAgent();
const builder = new StateGraph(StateAnnotation);
builder
  .addNode(FinancialServiceAgent.name, serviceAgent.invoke.bind(serviceAgent))
  .addEdge("__start__", FinancialServiceAgent.name)
  .addEdge(FinancialServiceAgent.name, "__end__");

@Controller()
export class AppController {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async seed(){
    const transactionCard = await this.prisma.transacoesCartaoCredito.findMany()
    console.log('transactionCard', transactionCard.length)
    for (const transaction of transactionCard) {
      // this.eventEmitter.emit('transactionCreditCard.created', transaction);
    }
  }

  @Public()
  @Post('/receiver')
  async chat(
    @Body('chatInput') chatInput: string,
  ) {
    const graph = builder.compile({ checkpointer });
    const conversationalStream = await graph.invoke({
      input: chatInput,
      tenantId: 1
    }, {
      configurable: {
        thread_id: 1
      }
    });
    console.log('conversationalStream', conversationalStream);
    return conversationalStream['output'];
  }
}
