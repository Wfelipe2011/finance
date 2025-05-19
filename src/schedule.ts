import {  PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient()
    const leads = await prisma.lead.findMany({
        where: {
            contacted: false,
            phone: {
                contains: '153'
            },
        }
    })
    for (const lead of leads) {
        const leadId = lead.id
        const leadName = lead.name
        const leadPhone = lead.phone
        const leadCategory = lead.category
        console.log(`Lead ID: ${leadId}, Name: ${leadName}, Phone: ${leadPhone}, Category: ${leadCategory}`)
        await prisma.lead.update({
            where: {
                id: leadId
            },
            data: {
                deleted: Boolean(lead.website),
                updatedAt: new Date()
            }
        })
        console.log(`Lead ID: ${leadId} deleted`)
    
    }
}

main()