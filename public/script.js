const baseRoute = 'http://localhost:3000/';

// Helper
const renderResponse = async (arr) => {
    const [el, response] = arr;
    const text = await response.text();
    el.innerHTML = '';
    if (response.ok) {
        el.innerHTML += `<p><strong>👍 Success </strong> ${text}</p>`
    } else {
        el.innerHTML += `<p><strong>🥲 Failure </strong> ${text}</p>`
    }
    return false
}

// Apply for total limit and display response
const postTotalLimitBttn = document.getElementById('post-total-limit-submit');
const postTotalLimitInput = document.getElementById('post-total-limit-input');
const postTotalLimitResponse = document.getElementById('post-total-limit-response');

const postTotalLimit = async () => {
    const totalLimit = postTotalLimitInput.value | 0;
    const url = baseRoute + 'total/' + totalLimit;
    const response = await fetch(url, {method: 'POST'});
    return [postTotalLimitResponse, response]
}

postTotalLimitBttn.addEventListener("click", (event) => {
    postTotalLimit().then(renderResponse);
    updateSummary();
    event.preventDefault();
    return false
}, false);

// Issue new card and display response
const postCardBttn = document.getElementById('post-card-submit');
const postCardNameInput = document.getElementById('post-card-name-input');
const postCardlimitInput = document.getElementById('post-card-limit-input');
const postCardResponse = document.getElementById('post-card-response');

const postCard = async () => {
    const limit = postCardlimitInput.value;
    const name = postCardNameInput.value;
    const url = baseRoute + 'cards';
    const data = {name, limit};
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    return [postCardResponse, response]
} 

postCardBttn.addEventListener("click", (event) => {
    postCard().then(renderResponse);
    updateSummary();
    updateCards();
    event.preventDefault();
    return false
}, false)

// Record transactions
const postTransactionStartBttn = document.getElementById('post-transaction-start');
const postTransactionSubmitBttn = document.getElementById('post-transaction-submit');
const postTransactionResponse = document.getElementById('post-transaction-response');
const selectCard = document.getElementById('post-transaction-card-input');

const renderCardSelect = (cards) => {
    selectCard.innerHTML = ""
    if (cards.length > 0) {
        for (card of cards) {
            selectCard.innerHTML += `<option value="${card.id}">${card.name}</option>`
        }
    }
    return false
}

const postTransaction = async () => {
    const cardId = selectCard.options[selectCard.selectedIndex].value;
    const url = baseRoute + `cards/${cardId}/transactions`;
    const amount = document.getElementById('post-transaction-amount-input').value;
    const purpose = document.getElementById('post-transaction-purpose-input').value;
    const data = {amount, purpose};
    const response = await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    return [postTransactionResponse, response]
}

postTransactionSubmitBttn.addEventListener('click', (event) => {
    postTransaction().then(renderResponse);
    updateSummary();
    updateTransactions();
    event.preventDefault();
    return false
})

// Fetch and show sumamry
const summarySection = document.getElementById('summary-section');

const getSummary = async () => {
    const url = baseRoute + 'total';
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Request failed!')
    }
    const jsonResponse = await response.json();
    return jsonResponse
}

const renderSummary = (jsonResponse) => {
    summarySection.innerHTML = '';
    summarySection.innerHTML += `<p>${jsonResponse.message}</p>`;
    const data = jsonResponse.data;
    if (Object.keys(data).length > 0) {
        const {totalLimit, totalBalance, totalSpending, cardNames} = data;
        const ul = document.createElement('ul');
        ul.innerHTML += `<li>Total limit: ${totalLimit}</li>`;
        ul.innerHTML += `<li>Total balance: ${totalBalance}</li>`;
        ul.innerHTML += `<li>Total spending: ${totalSpending}</li>`;
        ul.innerHTML += `<li>Cards: ${cardNames.join(', ')}</li>`;
        summarySection.append(ul)
    }
}

const updateSummary = () => {
    getSummary().then(renderSummary).catch((e) => {console.log(e.stack)});
    emptyInputs();
    return false
}

window.onload = updateSummary;

// Fetch and show all cards
const showCardsResponse = document.getElementById('show-cards-response');

const getCards = async () => {
    const url = baseRoute + 'cards';
    const response = await fetch(url);
    return response
}

const renderCards = async (response) => {
    showCardsResponse.innerHTML = `<p><strong>List of cards</strong></p>`;
    if (!response.ok) {
        const text = await response.text();
        showCardsResponse.innerHTML += `<p><strong>🥲 ${text}</p>`
        return false  
    } 
    const cards = await response.json();
    for (card of cards) {
        const {name, limit, spending, balance} = card;
        const cardDiv = document.createElement('div');
        cardDiv.innerHTML += `<p><em>${name}</em></p>`;
        const cardProps = document.createElement('ul');
        cardProps.innerHTML += `<li>Limit: ${limit}</li>`;
        cardProps.innerHTML += `<li>Spending: ${spending}</li>`;
        cardProps.innerHTML += `<li>Balance: ${balance}</li>`;
        cardDiv.append(cardProps);
        showCardsResponse.append(cardDiv);
    }
    return cards
}

const updateCards = () => {
    getCards().then(renderCards).then(renderCardSelect);
    return false
}

// Fetch and show transactions
const showTransactionsResponse = document.getElementById('show-transactions-response');

const getTransactions = async () => {
    const url = baseRoute + 'transactions';
    const response = await fetch(url);
    return response
}

const renderTransactions = async (response) => {
    showTransactionsResponse.innerHTML = '<p><strong>List of transactions</strong></p>';
    if (!response.ok) {
        const text = await response.text();
        showTransactionsResponse.innerHTML += `<p>🥲 ${text}</p>`
        return false
    }
    const transactions = await response.json();
    for (txn of transactions) {
        const txnDiv = document.createElement('div');
        txnDiv.innerHTML += `<em>At ${txn.timestamp}</em>`;
        const txnProps = document.createElement('ul');
        for (prop in txn) {
            if (prop !== 'timestamp') {
                txnProps.innerHTML += `<li>${prop}: ${txn[prop]}</li>`;
            }
        }
        txnDiv.append(txnProps);
        showTransactionsResponse.append(txnDiv)
    }
    return false
}

const updateTransactions = () => {
    getTransactions().then(renderTransactions);
    return false;
}

// Delete everything
const deleteAllBttn = document.getElementById('delete-all-bttn');
const deleteAllResponse = document.getElementById('delete-all-response')

const deleteAll = async () => {
    url = baseRoute + 'total';
    const response = await fetch(url, {
        method: "DELETE",
    })
    return [deleteAllResponse, response]
}

deleteAllBttn.addEventListener('click', (event) => {
    deleteAll().then(renderResponse);
    updateSummary();
    emptyResponses();
    event.preventDefault();
    return false
})

// Empty input fields
const inputs = document.getElementsByTagName('input');

const emptyInputs = () => {
    for (input of inputs) {
        input.value = ''
    }
    return false;
}

// Empty responses
const responses = document.getElementsByClassName('response');

const emptyResponses = () => {
    console.log('did this run?')
    for (response of responses) {
        console.log(`${response}`);
        if (response.id !== "delete-all-response") {
            response.innerHTML = ""
        }
    }
    return false
}

// Delete recent transactions
const deleteTxnsBttn = document.getElementById('delete-txns-bttn');
const deleteTxnsResponse = document.getElementById('delete-txns-response');

const deleteTxns = async () =>  {
    const url = baseRoute + 'transactions';
    const data = {"duration": document.getElementById("delete-txns-input").value};
    console.log(data);
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    return [deleteTxnsResponse, response]
}

deleteTxnsBttn.addEventListener('click', (event) => {
    deleteTxns().then(renderResponse);
    updateSummary();
    updateTransactions();
    event.preventDefault()
    return false;
})
