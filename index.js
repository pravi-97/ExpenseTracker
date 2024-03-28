const { createClient } = require("@libsql/client");
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const port = 3000

const URL = "libsql://test-db-pravi-97.turso.io";
const TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3MTExNTIwMDYsImlhdCI6MTcxMDU3OTUwNCwiaWQiOiJjOWQ3ZTRlNS1jMzM2LTExZWUtYjA3MS01MjA1M2M0YjIzYTYifQ.4kWZrwu1ChjtJkzNaKens6FJjF1MamUxspzHs4u27SMb1gxcQrTgn7YupNysw4imHv3GDDDq5hfQYyCNe-FYAA";
const data = [
    { "date": "2024-01-04", "type": "Bills", "remarks": "Internet bill", "price": 125 },
    { "date": "2024-01-07", "type": "Entertainment", "remarks": "Streaming service subscription", "price": 220 },
    { "date": "2024-01-08", "type": "Entertainment", "remarks": "Movie ticket", "price": 85 },
    { "date": "2024-01-09", "type": "Other", "remarks": "Clothes", "price": 180 },
    { "date": "2024-01-12", "type": "Bills", "remarks": "Electricity bill", "price": 78 },
    { "date": "2024-01-14", "type": "Entertainment", "remarks": "Book", "price": 110 },
    { "date": "2024-01-16", "type": "Bills", "remarks": "Phone bill", "price": 295 },
    { "date": "2024-01-19", "type": "Entertainment", "remarks": "Concert ticket", "price": 1500 },
    { "date": "2024-01-22", "type": "Other", "remarks": "Donation", "price": 100 },
    { "date": "2024-01-23", "type": "Bills", "remarks": "Water bill", "price": 42 },
    { "date": "2024-01-25", "type": "Transportation", "remarks": "Bus ticket", "price": 120 },
    { "date": "2024-01-29", "type": "Other", "remarks": "Haircut", "price": 87 },
    { "date": "2024-01-31", "type": "Other", "remarks": "Gift", "price": 215 },
    { "date": "2024-02-01", "type": "Entertainment", "remarks": "Movie rental", "price": 15 },
    { "date": "2024-02-03", "type": "Transportation", "remarks": "Bus pass", "price": 170 },
    { "date": "2024-02-05", "type": "Other", "remarks": "Gym membership", "price": 75 },
    { "date": "2024-02-09", "type": "Transportation", "remarks": "Car gas", "price": 190 },
    { "date": "2024-02-10", "type": "Food", "remarks": "Restaurant lunch", "price": 280 },
    { "date": "2024-02-11", "type": "Transportation", "remarks": "Taxi ride", "price": 95 },
    { "date": "2024-02-12", "type": "Food", "remarks": "Snacks", "price": 32 },
    { "date": "2024-02-14", "type": "Food", "remarks": "Restaurant dinner", "price": 350 },
    { "date": "2024-02-16", "type": "Groceries", "remarks": "Top-up shopping", "price": 132 },
    { "date": "2024-02-19", "type": "Food", "remarks": "Coffee", "price": 78 },
    { "date": "2024-02-20", "type": "Groceries", "remarks": "Weekly shopping", "price": 580 },
    { "date": "2024-02-21", "type": "Other", "remarks": "Car wash", "price": 40 },
    { "date": "2024-02-22", "type": "Food", "remarks": "Coffee (friend)", "price": 8 },
    { "date": "2024-02-23", "type": "Transportation", "remarks": "Train ticket", "price": 450 },
    { "date": "2024-02-24", "type": "Groceries", "remarks": "Fruits", "price": 105 },
    { "date": "2024-02-27", "type": "Food", "remarks": "Takeout", "price": 182 },
    { "date": "2024-02-28", "type": "Groceries", "remarks": "Monthly shopping", "price": 890 },
    { "date": "2024-02-29", "type": "Bills", "remarks": "Credit card", "price": 450 }
];
async function fetchData() {
    const client = createClient({  
        url: URL,
        authToken: TOKEN,
    });
    try {
        const result = await client.execute("SELECT * FROM expense");
        return result;
    } finally {
        await client.close();
    }
}

app.get('/', async (req, res) => {
    try {
        const response = await fetchData();
        res.send(response);
        // res.sendStatus(200).send(data);
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');  
    }
})

app.post('/', async (req, res) =>{
    try{
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        console.log(req.body);
        const result = await client.execute({
            sql: "INSERT INTO expense (date, remarks, type, price) values ( ? , ? , ? , ? )",
            args: [req.body.date, req.body.remarks, req.body.type, req.body.price],
        });
        await client.close();
        res.send("OK");
    }
    catch(error){
        console.log(error);
        await client.close();
        res.status(500).send('Error');
    }
})

app.put('/', async (req, res) => {
    try {
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        const result = await client.execute({
            sql: `UPDATE expenses SET ${field} = ? WHERE ID = ?`,
            args: [req.query.value, req.query.id],
        });
        console.log(req.query.id);
        console.log(req.query.field);
        console.log(req.query.value);
        await client.close();
        res.send("OK");
    }
    catch (error) {
        console.log(error);
        await client.close();
        res.status(500).send('Error');
    }
})

app.delete('/:id', async (req, res) => {
    try {
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        const result = await client.execute({
            sql: `DELETE FROM expense WHERE ID = ?`,
            args: [req.params.id],
        });
        console.log(req.params.id);
        await client.close();
        res.send("OK");
    }
    catch (error) {
        console.log(error);
        await client.close();
        res.status(500).send('Error');
    }
})
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})