const { createClient } = require("@libsql/client");
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const port = 3000

const URL = "libsql://expense-tracker-pravi-97.turso.io";
const TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MTIwNDQ3NzUsImlkIjoiZTI3MGExMzItODEzYS00Y2M2LWE3YzEtNjhjY2YxYzk1MTk4In0.3P_jsYqmmnkL22aSXEK6wL1XmPMd6QW2HFEv9Q2JztpD9x6Cm6GHszI37PpCrQ19v4qNdyIQjgkC6iZl3Nt9DA";

app.get('/all', async (req, res) => {
    console.log("GET all");
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        const response = await client.execute("SELECT * FROM expenses WHERE deleted = 0 ORDER BY id DESC;");
        res.status(200).send(response.rows);
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');  
    } finally{
        await client.close();
    }
})
app.get('/tag/:tag', async (req, res) => {
    console.log("GET /tag/:tag");
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        if (req.params.tag.trim() != ""){
            let query = "";
            if (req.query.monthyear == undefined){
                query = `SELECT * FROM expenses where type = '${req.params.tag}' AND deleted = false order by id DESC`;
            }else {
                query = `SELECT * FROM expenses WHERE type = '${req.params.tag}' AND strftime('%m', date) = '${req.query.monthyear.substring(0, 2)}' AND strftime('%Y', date) = '${req.query.monthyear.substring(3, 7)}' AND deleted = 0 ORDER BY id DESC;`;
            }
            const response = await client.execute(query);
            res.status(200).send(response.rows);
        }else{
            const response = await client.execute(`SELECT * FROM expenses  WHERE deleted = false order by id DESC`);
            res.status(200).send(response.rows);
        }
     } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');
    } finally{
        await client.close();
    }
})

app.get('/group', async (req, res) => {
    console.log("GET group");
        const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        let response = {};
        const response1 = await client.execute("SELECT type, CAST(sum(price) AS numeric) AS total_price FROM expenses where deleted = false group by type");
        const response2 = await client.execute(`SELECT distinct (CASE WHEN strftime('%m', date) = '01' THEN 'January' WHEN strftime('%m', date) = '02' THEN 'February' WHEN strftime('%m', date) = '03' THEN 'March' WHEN strftime('%m', date) = '04' THEN 'April' WHEN strftime('%m', date) = '05' THEN 'May' WHEN strftime('%m', date) = '06' THEN 'June' WHEN strftime('%m', date) = '07' THEN 'July' WHEN strftime('%m', date) = '08' THEN 'August' WHEN strftime('%m', date) = '09' THEN 'September' WHEN strftime('%m', date) = '10' THEN 'October' WHEN strftime('%m', date) = '11' THEN 'November' WHEN strftime('%m', date) = '12' THEN 'December' ELSE strftime('%m', date) END) AS mmmm, strftime('%m', date) AS mm, strftime('%Y', date) AS year FROM expenses WHERE deleted = 0;`);
        response.sum = response1.rows;
        response.date = response2.rows;
        res.status(200).send(response);
    }
    catch(e){
        console.log(e);
        res.status(500).send({"Error: ": e});
    } finally {
        await client.close();
    }
})

app.get('/monthly', async (req, res) => {
    console.log("GET monthly");
        const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        const month = req.query.month;
        const year = req.query.year;
        if (req.query.month.trim() == "" || req.query.month == undefined || req.query.year.trim() == "" || req.query.year == undefined){
            const response = await client.execute(`SELECT type, SUM(price) AS total_price FROM expenses WHERE deleted = 0 GROUP BY type;`);
            res.status(200).send(response.rows);
        }else{
            const response = await client.execute(`SELECT type, SUM(price) AS total_price FROM expenses WHERE strftime('%m', date) = '${month}' AND strftime('%Y', date) = '${year}' AND deleted = 0 GROUP BY type;`);
            res.status(200).send(response.rows);
        }
    }
    catch (e) {
        console.log(e.message);
        res.status(500).send({ "Error: ": e });
    } finally {
        await client.close();
    }
})

app.get('/month', async (req, res) => {
    console.log("GET month");
    try{
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        const response = await client.execute(`SELECT mn.month_name || ' ' || strftime('%Y', date) AS formatted_date, strftime('%Y%m', date) AS yearmonth, SUM(price) AS price FROM expenses INNER JOIN month_names mn ON strftime('%m', date) = mn.month_number WHERE deleted = 0 GROUP BY formatted_date, yearmonth ORDER BY yearmonth;`);
        res.status(200).send(response.rows);
    }
    catch(error){
        console.log(error.message);
    }
})
app.post('/', async (req, res) =>{
    console.log("POST /");
    try{
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        const response = await client.execute({
            sql: "INSERT INTO expenses (date, remarks, type, price, deleted) values ( ? , ? , ? , ? , ? )",
            args: [req.body.date, req.body.remarks, req.body.type, req.body.price, false],
        });
        await client.close();
        res.send("OK");
    }
    catch(error){
        console.log(error.message);
        res.status(500).send('Error');
    }
})

app.put('/', async (req, res) => {
    console.log("PUT /");
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        const result = await client.execute({
            sql: `UPDATE expenses SET ${req.query.field} = ? WHERE ID = ?`,
            args: [req.query.value, req.query.id],
        });
        res.send("OK");
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Error');
    }finally{
        await client.close();
    }
})

app.delete('/:id', async (req, res) => {
    console.log("DELETE id");
    try {
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        const response = await client.execute({
            sql: `update expenses set deleted = true WHERE ID = ?`,
            args: [req.params.id],
        });
        res.send("OK");
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Error');
    } finally{
        await client.close();
    }
})
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})