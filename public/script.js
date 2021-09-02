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

const fetchTotalLimitApproval = async () => {
    const totalLimit = postTotalLimitInput.value | 0;
    const url = baseRoute + 'total/' + totalLimit;
    const response = await fetch(url, {method: 'POST'});
    return [postTotalLimitResponse, response]
}

postTotalLimitBttn.addEventListener("click", (event) => {
    fetchTotalLimitApproval().then(renderResponse);
    updateSummary(event);
    event.preventDefault();
    return false
}, false);

// Issue new card and display response
const postCardBttn = document.getElementById('post-card-submit');
const postCardNameInput = document.getElementById('post-card-name-input');
const postCardlimitInput = document.getElementById('post-card-limit-input');
const postCardResponse = document.getElementById('post-card-response');

const fetchCardApproval = async () => {
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
    fetchCardApproval().then(renderResponse);
    updateSummary(event);
    event.preventDefault();
    return false
}, false)

// Fetch and show all cards
const showCardsBttn = document.getElementById('show-cards-bttn');
const showCardsResponse = document.getElementById('show-cards-response')

const fetchAllCards = async () => {
    const url = baseRoute + 'cards';
    const response = await fetch(url);
    return response
}

const renderAllCards = async (response) => {
    showCardsResponse.innerHTML = '';
    if (response.ok) {
        const cards = await response.json();
        for (card of cards) {
            const cardDiv = document.createElement('div');
            cardDiv.setAttribute('class', 'card-info');
            cardDiv.innerHTML += `<p><strong>${card.name}</strong></p>`;
            const cardProps = document.createElement('ul')
            for (prop in card) {
                if (prop !== 'transactions' & prop !== 'name') {
                    cardProps.innerHTML += `<li>${prop}: ${card[prop]}</li>`
                } 
            }
            cardDiv.append(cardProps);
            showCardsResponse.append(cardDiv);
        }
    } else {
        const text = await response.text();
        showCardsResponse.innerHTML += `<p><strong>🥲 Failure </strong> ${text}</p>`
    }
}

showCardsBttn.addEventListener('click', (event) => {
    fetchAllCards().then(renderAllCards);
    event.preventDefault();
    return false
})

// Record transactions
const postTransactionStartBttn = document.getElementById('post-transaction-start');
const postTransactionSubmitBttn = document.getElementById('post-transaction-submit');
const postTransactionResponse = document.getElementById('post-transaction-response');
const selectCard = document.getElementById('post-transaction-card-input');

const renderCardSelect = async () => {
    const response = await fetchAllCards();
    if (!response.ok) {
        postTransactionResponse.innerHTML += `<p>${await response.text()}</p>`
        return false
    }
    const cards = await response.json();
    selectCard.innerHTML = ""
    for (card of cards) {
        selectCard.innerHTML += `<option value="${card.id}">${card.name}</option>`
    }
}

const fetchTransactionApproval = async () => {
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

postTransactionStartBttn.addEventListener('click', async (event) => {
    await renderCardSelect();
    event.preventDefault();
    return false
})

postTransactionSubmitBttn.addEventListener('click', (event) => {
    fetchTransactionApproval().then(renderResponse);
    updateSummary(event);
    event.preventDefault();
    return false
})

// Fetch and show sumamry
const summarySection = document.getElementById('summary-section');

const fetchSummary = async () => {
    const url = baseRoute + 'total';
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Request failed!')
    }
    const jsonResponse = await response.json();
    return jsonResponse
}

const renderSummary = (jsonResponse) => {
    summarySection.innerHTML = '<h2>Summary</h2>'
    summarySection.innerHTML += `<p><strong>${jsonResponse.message}</strong></p>`;
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

const updateSummary = (event) => {
    fetchSummary().then(renderSummary).catch((e) => {console.log(e.stack)});
    return false
}

window.onload = (event) => {
    updateSummary(event);
    return false
}
