const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const totalAmount = document.getElementById("total-amount");
const currencySelector = document.getElementById("currency-selector");
const ctx = document.getElementById("expense-chart").getContext("2d");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

const API_KEY = "8d00119da5734f4b9dc825b1fd6d15a6"
let exchangeRates = {};
let currentCurrency = "USD";


const currencySymbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
};


let expenseChart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: [],
        datasets: [{
            label: "Expenses by Category",
            data: [],
            backgroundColor: ["#3E7CB1", "#7DAA92", "#C49A6C", "#6C5B7B", "#FF8C42"],
            borderColor: "#2C3E50",
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});


async function fetchExchangeRates() {
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD?apikey=${API_KEY}`);
        const data = await response.json();
        exchangeRates = data.rates;
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
    }
}


expenseForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("expense-name").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;

    if (!name || !amount || !category) {
        alert("Please fill out all fields.");
        return;
    }

    const expense = { id: Date.now(), name, amount, category };
    expenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(expenses)); 

    expenseForm.reset();
    renderExpenses();
    updateChart();
});


function renderExpenses() {
    expenseList.innerHTML = "";
    let total = 0;
    const symbol = currencySymbols[currentCurrency] || "$";

    expenses.forEach((expense) => {
        const convertedAmount = (expense.amount * (exchangeRates[currentCurrency] || 1)).toFixed(2);
        total += parseFloat(convertedAmount);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${expense.name}</td>
            <td>${symbol}${convertedAmount}</td>
            <td>${expense.category}</td>
            <td><button onclick="deleteExpense(${expense.id})">Delete</button></td>
        `;
        expenseList.appendChild(row);
    });

    totalAmount.innerText = `${symbol}${total.toFixed(2)}`;
}


function deleteExpense(id) {
    expenses = expenses.filter((expense) => expense.id !== id);
    localStorage.setItem("expenses", JSON.stringify(expenses)); 
    renderExpenses();
    updateChart();
}


function convertCurrency() {
    const selectedCurrency = currencySelector.value;

    if (!exchangeRates[selectedCurrency]) {
        alert("Exchange rate not available. Try again later.");
        return;
    }

    currentCurrency = selectedCurrency;
    renderExpenses();
    updateChart();
}


function updateChart() {
    let categoryTotals = {};
    
   
    expenses.forEach(expense => {
        let convertedAmount = expense.amount * (exchangeRates[currentCurrency] || 1);
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + convertedAmount;
    });


    let categories = Object.keys(categoryTotals);
    let values = Object.values(categoryTotals);


    expenseChart.data.labels = categories;
    expenseChart.data.datasets[0].data = values;
    expenseChart.update();
}


fetchExchangeRates();
renderExpenses();
updateChart();