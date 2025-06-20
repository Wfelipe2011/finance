/* eslint-disable */
export default async () => {
    const t = {};
    return { "@nestjs/swagger": { "models": [[import("./transactions/dto/create-transaction.dto"), { "CreateTransactionDto": {} }], [import("./transactions/dto/update-transaction.dto"), { "UpdateTransactionDto": {} }]], "controllers": [[import("./app.controller"), { "AppController": { "chat": { type: String } } }], [import("./auth/auth.controller"), { "AuthController": { "login": {}, "register": {} } }], [import("./transactions/transactions.controller"), { "TransactionsController": { "create": { type: String }, "findAll": { type: String }, "findOne": { type: String }, "update": { type: String }, "uploadCurrentAccount": {}, "uploadCreditCard": {} } }]] } };
};