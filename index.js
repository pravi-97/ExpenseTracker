const { createClient } = require("@libsql/client");
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const port = 3000
const { Pool } = require('postgres-pool');
const pool = new Pool({
    connectionString: "postgres://pravi894:XyA4hx85PRBA3qGpF1Fc@food-delivery-ap.cb28a28y2knz.ap-south-1.rds.amazonaws.com/postgres",
    ssl: 'aws-rds'
});

const URL = "libsql://test-db-pravi-97.turso.io";
const TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3MTExNTIwMDYsImlhdCI6MTcxMDU3OTUwNCwiaWQiOiJjOWQ3ZTRlNS1jMzM2LTExZWUtYjA3MS01MjA1M2M0YjIzYTYifQ.4kWZrwu1ChjtJkzNaKens6FJjF1MamUxspzHs4u27SMb1gxcQrTgn7YupNysw4imHv3GDDDq5hfQYyCNe-FYAA";

// async function fetchData() {
//     const client = createClient({  
//         url: URL,
//         authToken: TOKEN,
//     });
//     try {
//         const result = await client.execute("SELECT * FROM expense");
//         return result;
//     } finally {
//         await client.close();
//     }
// }

app.get('/all', async (req, res) => {
    try {
        // `SELECT to_char(date, 'YYYY-MM-DD') AS formatted_date, * FROM expenses;`
        const response = await pool.query("SELECT to_char(date, 'YYYY-MM-DD') AS formatted_date, * FROM expenses order by id");
        // const response = await pool.query("SELECT * from expenses");
        // console.log(response.rows);
        
        res.status(200).send(response.rows);
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');  
    }
})

app.get('/tag', async (req, res) => {
    //     const client = createClient({
    //     url: URL,
    //     authToken: TOKEN,
    // });
    try {
        const result = await pool.query("SELECT type, CAST(sum(price) AS numeric) AS total_price FROM expenses group by type");
        // console.log(result.rows);
        const formattedData = result.rows.map(row => {
            row.total_price = parseFloat(row.total_price); 
            return row;
        });
        res.status(200).send(result.rows);
    }
    catch(e){
        res.status(500).send({"Error: ": e});
    } finally {
        // await client.close();
    }
})

app.post('/', async (req, res) =>{
    try{
        // const client = createClient({
        //     url: URL,
        //     authToken: TOKEN,
        // });
        // console.log(req.body);
        // const result = await client.execute({
        //     sql: "INSERT INTO expense (date, remarks, type, price) values ( ? , ? , ? , ? )",
        //     args: [req.body.date, req.body.remarks, req.body.type, req.body.price],
        // });
        // await client.close();
        const result = await pool.query(`INSERT INTO expense (date, remarks, type, price) values ( '${req.body.date}', '${req.body.remarks}', '${req.body.type}', '${req.body.price}' )`);
        res.send("OK");
    }
    catch(error){
        console.log(error);
        // await client.close();
        res.status(500).send('Error');
    }
})

app.put('/', async (req, res) => {
    try {
        // const client = createClient({
        //     url: URL,
        //     authToken: TOKEN,
        // });
        // const result = await client.execute({
        //     sql: `UPDATE expenses SET ${field} = ? WHERE ID = ?`,
        //     args: [req.query.value, req.query.id],
        // });
        console.log(req.query.id);
        console.log(req.query.field);
        console.log(req.query.value);
        // await client.close();
        const result = await pool.query(`UPDATE expenses SET ${req.query.field} = '${req.query.value}' WHERE ID = '${req.query.id}'`);
        res.send("OK");
    }
    catch (error) {
        console.log(error);
        // await client.close();
        res.status(500).send('Error');
    }
})

app.delete('/:id', async (req, res) => {
    try {
        // const client = createClient({
        //     url: URL,
        //     authToken: TOKEN,
        // });
        // const result = await client.execute({
        //     sql: `DELETE FROM expense WHERE ID = ?`,
        //     args: [req.params.id],
        // });
        console.log(req.params.id);
        // await client.close();
        const result = await pool.query(`DELETE FROM expenses WHERE ID = ${req.params.id}`);
        res.send("OK");
    }
    catch (error) {
        console.log(error);
        // await client.close();
        res.status(500).send('Error');
    }
})
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})