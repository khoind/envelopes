const crypto = require('crypto');

const updateBalance = (transactionList, limit) => { //Update balance and spending
    spending = transactionList.reduce((amount, transaction) => amount + transaction.amount, 0);
    balance = limit - spending;
    return {spending, balance}
}

const updateUnusedLimit = (cardList, totalLimit) => { //Update the amount of limit that has not been allocated to any card
    const usedLimit = cardList.reduce((amount, card) => amount + card.limit, 0);
    return totalLimit - usedLimit
}

const formatter = new Intl.NumberFormat('en-US', { // Format number as currency
    style: 'currency',
    currency: 'VND'
})

const issueId = (obj, idList, bytenum) => { // Generate a unique card number
    const id = obj + crypto.randomBytes(bytenum).toString('hex');
    while (idList.includes(id)) {
        id = crypto.randomBytes(bytenum).toString('hex');
    }
    return id
}

const findCardById = (cardList, id) => { // Return the index of card with a given ID in cardList
    for (let i = 0; i < cardList.length; i++) {
        if (cardList[i].id === id) {
            return i
        }
    }
    return false
}

const checkTimeGap = (transaction, currentTime, duration) => { // Check if transactin was recorded within provide duration in minutes
    return (currentTime - transaction.timestamp) > duration * 60000
}

const reconstructCard = (card, transactionList) => { // Add balance, spending, transactions to card info
    const transactions = transactionList.filter(transaction => transaction.cardId === card.id);
    const {spending, balance} = updateBalance(transactions, card.limit);
    const cardInfo = Object.assign({}, card);
    cardInfo.limit = formatter.format(cardInfo.limit);
    cardInfo.spending = formatter.format(spending);
    cardInfo.balance = formatter.format(balance);
    return cardInfo
}

module.exports = {
    updateBalance,
    updateUnusedLimit,
    formatter,
    issueId,
    findCardById,
    checkTimeGap,
    reconstructCard
}