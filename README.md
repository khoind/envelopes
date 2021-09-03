# APIs
[vv] GET `/total`: return total limit, total balance, summary of transactions
[vv] GET `/cards` : return all cards (card name, card number, limit, balance, transactions)
[v] GET `/cards/:id`: return one card (card name, card number, limit, balance, transactions)
[vv] GET `/transactions`: return all transactions
[vv] POST `/total/:limit`: issue a total limit for user
[vv] POST `/cards`: issue a new card, return new card (card name, card number, limit). Request body:= {name, limit}
[vv] POST `/cards/:id/transactions`: add a transaction on card. Request body:= {amount, purpose}
[v] PUT `/cards/:id/limit/:limit`: update card limit of a card
[v] PUT `/cards/:id`: update card name. Request body:= {name}
[v] DELETE `/cards/:id`: delete a card
[v] DELETE `/transactions/`: cancel a transaction within a given minute of posting. Request body := {duration}

[] fix choose card

# Front end

# Data schema
cardList := [
    {
        id: <string>
        name: <string>,
        limit: <number>,    
    }
]

transactionList:= [
    {
    transactionId: <string>
    cardId: <string>
    amount: <number>,
    timestamp: <date>,
    purpose: <string>
    }
] 