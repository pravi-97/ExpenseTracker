require("dotenv").config();
const { createClient } = require("@libsql/client");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const URL = process.env.URL;
const TOKEN = process.env.TOKEN;

app.get("/getcategory", async (req, res) => {
  console.log("GET CATEGORY");

  const client = createClient({
    url: URL,
    authToken: TOKEN,
  });
  try {
    const response = await client.execute(
      "SELECT DISTINCT TYPE FROM EXPENSES WHERE DELETED = FALSE"
    );
    res.status(200).send(response.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
});

app.get("/getbudgets", async (req, res) => {
  console.log("GET BUDGETS");

  const client = createClient({
    url: URL,
    authToken: TOKEN,
  });
  try {
    const response = await client.execute({
      sql: "SELECT * FROM BUDGETS WHERE USERID = ?",
      args: [req.query.userid],
    });
    res.status(200).send(response.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
});

app.post("/addbudget", async (req, res) => {
  console.log("ADD BUDGET");
  console.log(req.body);
  const client = createClient({
    url: URL,
    authToken: TOKEN,
  });
  try {
    const response = await client.execute({
      sql: "INSERT INTO BUDGETS (USERID, BUDGET_NAME, BUDGET_CATEGORY, BUDGET_AMOUNT, PERIOD, NOTES) VALUES ( ? , ? , ? , ? , ? , ? )",
      args: [
        req.body.userid,
        req.body.budgetName,
        req.body.budgetCategory,
        req.body.budgetAmount,
        req.body.period,
        req.body.note,
      ],
    });
    res.status(200).send(response.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
});

app.get("/getbudgetdetails", async (req, res) => {
  console.log("GET BUDGET DETAILS");

  let response = [];
  const client = createClient({
    url: URL,
    authToken: TOKEN,
  });
  try {
    const response_budget = await client.execute({
      sql: "SELECT * FROM BUDGETS WHERE USERID = ?",
      args: [req.query.userid],
    });
    for (const budget of response_budget.rows) {
      if (budget.period == "monthly") {
        let ctgy = "";
        if (budget.budget_category != "") {
          ctgy = `AND TYPE = '${budget.budget_category}'`;
        }
        const response1 = await client.execute({
          sql:
            "SELECT SUM(PRICE) AS TOTAL_PRICE FROM expenses WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now') AND DELETED = ? AND USERID = ? " + ctgy,
          args: [false, req.query.userid],
        });
        console.log("SELECT SUM(PRICE) AS TOTAL_PRICE FROM expenses WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now') AND DELETED = ? AND USERID = ? " + ctgy);
        const rec = {
            budgetName: budget.budget_name,
            budgetCategory: budget.budget_category,
            budgetAmount: budget.budget_amount,
            budgetNote: budget.notes,
            budgetPeriod: budget.period,
            actualExpense : response1.rows[0].TOTAL_PRICE,
        }
        response.push(rec);
      } else if (budget.period == "yearly") {
        let ctgy = "";
        if (budget.budget_category != "") {
          ctgy = `AND TYPE = '${budget.budget_category}'`;
        }
        const response2 = await client.execute({
          sql:
            "SELECT SUM(PRICE) AS TOTAL_PRICE FROM expenses WHERE strftime('%Y', date) = strftime('%Y', 'now') AND DELETED = ? AND USERID = ? " + ctgy,
          args: [false, req.query.userid],
        });
        
        const rec = {
            budgetName: budget.budget_name,
            budgetCategory: budget.budget_category,
            budgetAmount: budget.budget_amount,
            budgetNote: budget.notes,
            budgetPeriod: budget.period,
            actualExpense : response2.rows[0].TOTAL_PRICE,
        }
        response.push(rec);
      }
    }
    res.status(200).send(response);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
});

module.exports = app;