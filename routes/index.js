const express = require('express');
const router = express.Router();
const {
    updateBalance,
    updateUnusedLimit,
    formatter,
    issueId,
    findCardById,
    checkTimeGap,
    reconstructCard
} = require('./helpers.js');

// Global variables
let activation = false;
let totalLimit = 0;
let totalBalance = 0;
let totalSpending = 0;
let cardList = [];
let transactionList = [];

// Validate data
const checkActivation = (req, res, next) => { //Validate incomming request
    if (!activation) {
        return res.status(400).send('No total limit has been set yet')
    }
    next()
}

const checkLimit = (req, res, next) => { //check if new limit request is valid
    const limit = Number(req.params.limit);
    if (limit < 5000000 || Number.isNaN(limit)) {
        return res.status(400).send('Card limit must be a number and at least VND 5,000,000')
    }
    req.limit = limit;
    next()
}

const checkLimitChangeRequest = (req, res, next) => { //Check if new limit request make the sum of all card limits exceed total limit
    const unusedLimit = updateUnusedLimit(cardList, totalLimit);
    if (unusedLimit < req.limit - req.card.limit) {
        return res.status(404).send('Unused limit not sufficient to fulfill new limit request')
    }
    next()
}

const checkUnusedLimit = (req, res, next) => { //Validate info used to create a new card
    const unusedLimit = updateUnusedLimit(cardList, totalLimit);
    if (unusedLimit <= 0) {
        return res.status(404).send('Unused limit not sufficient to allocate to a new card')
    }
    req.unusedLimit = unusedLimit;
    next()
}

const checkNewCardRequest = (req, res, next) => { // Validate request for a new card
    if (!('limit' in req.body & 'name' in req.body)) {
        return res.status(400).send('Request body must contain limit and name of card')
    }

    const limit = Number(req.body.limit);
    const name = req.body.name.toString().trim();
    if (Number.isNaN(limit) || limit < 5000000) {
        return res.status(400).send('Proposed limit must be a number and at least VND 5,000,000')
    }
    if (name === "") {
        return res.status(400).send('The new card must have a non empty name')
    }
    if (limit > req.unusedLimit) {
        return res.status(400).send('Proposed limit exceeded available amount')
    }

    req.limit = limit;
    req.name = name;
    next()
}

const checkIfCardExists = (req, res, next) => { // Check whether card with given ID exists
    const id = req.params.id;
    const index = findCardById(cardList, id);
    if (index === false) {
        return res.status(400).send(`There is no card with ID ${id}`)
    }

    req.cardIndex = index;
    req.card = cardList[index];
    next()
}

const checkTransactionInfo = (req, res, next) => { // Validate info of new transaction to be added
    if (!('amount' in req.body & 'purpose' in req.body)) {
        return res.status(400).send('Request body must contain amount and purpose')
    }

    const amount = Number(req.body.amount);
    const purpose = req.body.purpose.toString().trim();
    if (Number.isNaN(amount) | amount === 0) {
        return res.status(400).send(`Amount must be a number`)
    }
    if (purpose === '') {
        return res.status(400).send('Purpose must not be empty')
    }

    const index = req.cardIndex;
    const card = req.card;
    const transactions = transactionList.filter(transaction => transaction.cardId === card.id);
    const {spending, balance} = updateBalance(transactions, card.limit);
    if (balance < amount) {
        return res.status(400).send('Transaction amount exceeds available balance. Transaction is not accepted')
    }

    req.amount = amount;
    req.purpose = purpose;
    next()
}

const checkIfThereAreCards = (req, res, next) => { // Check if at least one card has been issued
    if (cardList.length === 0) {
        return res.status(400).send('There is no card yet')
    }
    next()
}

const checkIfThereAreTransactions = (req, res, next) => {// Check if there are transactions already recorded
    if (transactionList.length === 0) {
        return res.status(400).send('There is no transaction yet')
    }
    next()
}

const checkDuration = (req, res, next) => {// Check if provided duration is valid
    if (!'duration' in req. body) {
        return res.status(400).send('Request body must contain duration')
    }

    const duration = Number(req.body.duration);
    if (Number.isNaN(duration) || duration <= 0) {
        return res.status(400).send('Duration must be a number greater than zero')
    }
    
    req.duration = duration;
    next()
}

// Preprocessing request
router.use('/', (req ,res, next) => {
    console.log('DATA BEFORE PROCESSING ANY REQUEST');
    console.log(`request body:`);
    console.log(req.body);
    console.log('Transaction list');
    console.log(transactionList);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>END')
    next()
})



// Issue total limit
router.post('/total/:limit', checkLimit, (req, res, next) => {
    if (activation) {
        return res.status(400).send('A total limit has already been set')
    }

    activation = true;
    totalLimit = req.limit;
    res.status(201).send(`Total limit of VND ${formatter.format(totalLimit)} has been set`)
})

// Get summary info
router.get('/total', (req, res, next) => {
    let message = '🥲 No credit line has been set yet';
    let data = {};
    if (activation) {
        if (cardList.length === 0) {
            message = "No card has been issued yet";
        } else {
            message = "Status: Active"
            const {spending, balance} = updateBalance(transactionList, totalLimit);
            totalSpending = spending;
            totalBalance = balance;
            data = {
                totalLimit: formatter.format(totalLimit),
                totalBalance: formatter.format(totalBalance),
                totalSpending: formatter.format(totalSpending),
                cardNames: cardList.map(card => card.name)
            }
        }
    }
    res.status(200).send({message, data})
})

// Get all cards
router.get('/cards', checkActivation, checkIfThereAreCards, (req, res, next) => {
    const allCardsInfo = cardList.map(card => reconstructCard(card, transactionList));
    res.status(200).send(allCardsInfo)
})

// Get all transactions
router.get('/transactions', checkActivation, checkIfThereAreTransactions, (req, res, next) => {
    res.status(200).send(transactionList)
})

// Get one card
router.get('/cards/:id', checkActivation, checkIfCardExists, (req, res, next) => {
    const cardInfo = reconstructCard(req.card, transactionList);
    res.status(200).send(cardInfo)
})

// Issue new card
router.post('/cards', checkActivation, checkUnusedLimit, checkNewCardRequest, (req, res, next) => {
    const cardIdList = cardList.map(card => card.id);
    const id = issueId('CARD', cardIdList, 5);
    const limit = req.limit;
    const name = req.name;
    const card = {id, name, limit};
    cardList.push(card);
    res.status(201).send(`New card has been issued with limit of ${formatter.format(limit)} and name of ${name}`);
})

//Add a transaction
router.post('/cards/:id/transactions', checkActivation, checkIfCardExists, checkTransactionInfo, (req, res, next) => {
    const amount = req.amount;
    const purpose = req.purpose;
    const card = req.card;
    const cardId = card.id;
    const transactionIdList = transactionList.map(transaction => transaction.id);
    const transactionId = issueId('TRXN', transactionIdList, 6);
    const timestamp = new Date;
    const transaction = {transactionId, cardId, amount, timestamp, purpose};
    transactionList.push(transaction);
    res.status(201).send(`New transaction on card ${card.name} has been added at ${timestamp}. Amount: ${formatter.format(amount)}. Purpose: ${purpose}.`)
})

//Change limit of one card
router.put('/cards/:id/limit/:limit', checkActivation, checkIfCardExists, checkLimit, checkLimitChangeRequest, (req, res, next) => {
    const oldLimit = req.card.limit;
    cardList[req.cardIndex].limit = req.limit;
    res.status(201).send(`Card ${req.card.name}'s limit has been updated from ${formatter.format(oldLimit)} to ${formatter.format(req.limit)}`)
})

//Rename one card
router.put('/cards/:id', checkActivation, checkIfCardExists, (req, res, next) => {
    if (!('name' in req.body)) {
        return res.status(400).send('Request body must contain name')
    }
    const newName = req.body.name.toString().trim();
    if (newName === "") {
        return res.status(400).send('Name must not be empty')
    }
    
    const oldName = cardList[req.cardIndex].name;
    cardList[req.cardIndex].name = newName;
    res.status(400).send(`Card ${oldName} has been renamed to ${newName}`)   
})

//Delete all cards
router.delete('/cards', checkActivation, (req, res, next) => {
    cardList.splice(0, cardList.length);
    transactionList.splice(0, transactionList.length);
    totalBalance = 0;
    totalSpending = 0;
    res.status(200).send(`All cards and transactions has been deleted but total limit remains ${formatter.format(totalLimit)}. 
    Total balance is set to ${formatter.format(totalBalance)}.
    Total spending is set to ${formatter.format(totalSpending)}`)
})

//Delete all transactions within a time frame
router.delete('/transactions/', checkActivation, checkIfThereAreTransactions, checkDuration, (req, res, next) => {
    const currentTime = new Date;
    const duration = req.duration;
    console.log('Processing delete recent')
    transactionList = transactionList.filter(transaction => checkTimeGap(transaction, currentTime, duration));
    res.status(200).send(`All transactions created within ${duration} minute(s) have been deleted`)
})

// Delete everything
router.delete('/total', (req, res, next) => {
    activation = false;
    totalLimit = 0;
    totalBalance = 0;
    totalSpending = 0;
    cardList = [];
    transactionList = [];
    res.status(201).send(`Everything is deleted. Back from the beginning!`)
})

module.exports = router;