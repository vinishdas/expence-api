const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

let expenses = [];
const categories = ["Food", "Travel", "Bills", "Entertainment"];

// Middleware for validation
const validateExpense = (req, res, next) => {
  const { category, amount, date } = req.body;
  if (!categories.includes(category)) return res.status(400).json({ status: "error", error: "Invalid category" });
  if (typeof amount !== "number" || amount <= 0) return res.status(400).json({ status: "error", error: "Invalid amount" });
  if (!date || isNaN(new Date(date).getTime())) return res.status(400).json({ status: "error", error: "Invalid date" });
  next();
};

// Add a new expense
app.post("/expenses", validateExpense, (req, res) => {
  const { category, amount, date } = req.body;
  const expense = { id: expenses.length + 1, category, amount, date };
  expenses.push(expense);
  res.json({ status: "success", data: expense });
});

// Get all expenses with optional filters
app.get("/expenses", (req, res) => {
  const { category, start_date, end_date } = req.query;
  let filteredExpenses = [...expenses];

  if (category) filteredExpenses = filteredExpenses.filter(e => e.category === category);
  if (start_date || end_date) {
    const startDate = start_date ? new Date(start_date) : new Date(-8640000000000000);
    const endDate = end_date ? new Date(end_date) : new Date(8640000000000000);
    filteredExpenses = filteredExpenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  res.json({ status: "success", data: filteredExpenses });
});

// Analyze spending
app.get("/expenses/analysis", (req, res) => {
  let totalSpent = 0;
  const categoryTotals = {};

  expenses.forEach(exp => {
    totalSpent += exp.amount;
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const highestCategory = Object.keys(categoryTotals).reduce((a, b) => (categoryTotals[a] > categoryTotals[b] ? a : b), null);
  res.json({
    status: "success",
    data: {
      total_spent: totalSpent,
      highest_category: highestCategory,
    },
  });
});

// Get expenses for a specific month
app.get("/expenses/monthly", (req, res) => {
  const { month, year } = req.query;

  if (!month || !year || isNaN(month) || isNaN(year)) {
    return res.status(400).json({ status: "error", error: "Invalid month or year" });
  }

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getMonth() + 1 === parseInt(month) &&
      expenseDate.getFullYear() === parseInt(year)
    );
  });

  const totalSpent = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  res.json({
    status: "success",
    data: {
      month: parseInt(month),
      year: parseInt(year),
      total_spent: totalSpent,
      expenses: filteredExpenses,
    },
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
