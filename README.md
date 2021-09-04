Allo user to create a line of credit, issue cards, record transactions.
There is no database. State will be deleted when the app shuts down.
Included web frontend only implements some of the APIs.

# APIs
* GET `/total`: return total limit, total balance, summary of transactions
* GET `/cards` : return all cards (card name, card number, limit, balance, transactions)
* GET `/cards/:id`: return one card (card name, card number, limit, balance, transactions)
* GET `/transactions`: return all transactions
* GET `/unused`: return unused limit
* POST `/total/:limit`: issue a total limit for user
* POST `/cards`: issue a new card, return new card (card name, card number, limit). Request body = {name, limit}
* POST `/cards/:id/transactions`: add a transaction on card. Request body = {amount, purpose}
* PUT `/cards/:id/limit/:limit`: update card limit of a card* PUT `/cards/:id`: update card name. Request body:= {name}
* DELETE `/cards/:id`: delete a card
* DELETE `/transactions/`: cancel a transaction within a given minute of posting. Request body = {duration}
* DELETE `/total`: delete everything

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