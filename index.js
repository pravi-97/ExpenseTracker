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
    connectionString: "postgres://pravi894:XyA4hx85PRBA3qGpF1Fc@food-delivery-app.cb28a28y2knz.ap-south-1.rds.amazonaws.com/postgres",
    ssl: 'aws-rds'
});

const URL = "libsql://expense-tracker-pravi-97.turso.io";
const TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3MTIwNDQ3NzUsImlkIjoiZTI3MGExMzItODEzYS00Y2M2LWE3YzEtNjhjY2YxYzk1MTk4In0.3P_jsYqmmnkL22aSXEK6wL1XmPMd6QW2HFEv9Q2JztpD9x6Cm6GHszI37PpCrQ19v4qNdyIQjgkC6iZl3Nt9DA";

// async function fetchData() {
    // const client = createClient({  
    //     url: URL,
    //     authToken: TOKEN,
    // });
//     try {
//         const result = await client.execute("SELECT * FROM expense");
//         return result;
//     } finally {
//         await client.close();
//     }
// }

app.get('/all', async (req, res) => {
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        // `SELECT to_char(date, 'YYYY-MM-DD') AS formatted_date, * FROM expenses;`
        // const response = await pool.query("SELECT to_char(date, 'YYYY-MM-DD') AS formatted_date, * FROM expenses where deleted = false order by id DESC");
        const response = await client.execute("SELECT * FROM expenses WHERE deleted = 0 ORDER BY id DESC;");
        // console.log(response.rows);
        
        res.status(200).send(response.rows);
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');  
    } finally{
        await client.close();
    }
})
app.get('/tag/:tag', async (req, res) => {
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        // const month = req.query.monthyear.substring(0, 1).padStart(2, '0');
        // const year = req.query.monthyear.substring(2, 6);
        if (req.params.tag.trim() != ""){
            let query = "";
            if (req.query.monthyear == undefined){
                query = `SELECT * FROM expenses where type = '${req.params.tag}' AND deleted = false order by id DESC`;
            }else {
                console.log(req.query.monthyear.substring(0, 2));
                console.log(req.query.monthyear.substring(3, 7));
                // query = `SELECT to_char(date, 'YYYY-MM-DD') AS formatted_date, * FROM expenses where type = '${req.params.tag}' and 
                // EXTRACT(MONTH FROM date) = ${req.query.monthyear.substring(0, 1)} AND EXTRACT(YEAR FROM date) = ${req.query.monthyear.substring(2, 6) } AND deleted = false order by id DESC`;
                query = `SELECT * FROM expenses WHERE type = '${req.params.tag}' AND strftime('%m', date) = '${req.query.monthyear.substring(0, 2)}' AND strftime('%Y', date) = '${req.query.monthyear.substring(3, 7)}' AND deleted = 0 ORDER BY id DESC;`;
            }
            // const response = await pool.query(query);
            const response = await client.execute(query);
            res.status(200).send(response.rows);
        }else{
            // const response = await pool.query(`SELECT * FROM expenses  WHERE deleted = false order by id DESC`);
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
        const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        // const response1 = await pool.query("SELECT type, CAST(sum(price) AS numeric) AS total_price FROM expenses where deleted = false group by type");

        const response1 = await client.execute("SELECT type, CAST(sum(price) AS numeric) AS total_price FROM expenses where deleted = false group by type");
        // const response1 = await client.execute(`SELECT mn.month_name || ' ' || strftime('%Y', date) AS formatted_date, strftime('%Y%m', date) AS yearmonth, SUM(price) AS price FROM expenses INNER JOIN month_names mn ON strftime('%m', date) = mn.month_number GROUP BY formatted_date, yearmonth ORDER BY yearmonth;`);
        // console.log(result.rows);
        // const formattedData = response1.rows.map(row => {
        //     row.total_price = parseFloat(row.total_price); 
        //     return row;
        // });
        let response = {};
        // const response2 = await pool.query(`SELECT distinct to_char(date, 'Month') as MMMM, EXTRACT(MONTH FROM date) as MM, EXTRACT(YEAR FROM date) AS year FROM expenses where deleted = false;`);
        const response2 = await client.execute(`SELECT distinct (CASE WHEN strftime('%m', date) = '01' THEN 'January' WHEN strftime('%m', date) = '02' THEN 'February' WHEN strftime('%m', date) = '03' THEN 'March' WHEN strftime('%m', date) = '04' THEN 'April' WHEN strftime('%m', date) = '05' THEN 'May' WHEN strftime('%m', date) = '06' THEN 'June' WHEN strftime('%m', date) = '07' THEN 'July' WHEN strftime('%m', date) = '08' THEN 'August' WHEN strftime('%m', date) = '09' THEN 'September' WHEN strftime('%m', date) = '10' THEN 'October' WHEN strftime('%m', date) = '11' THEN 'November' WHEN strftime('%m', date) = '12' THEN 'December' ELSE strftime('%m', date) END) AS mmmm, strftime('%m', date) AS mm, strftime('%Y', date) AS year FROM expenses WHERE deleted = 0;`);

        response.sum = response1.rows;
        response.date = response2.rows;
        res.status(200).send(response);
    }
    catch(e){
        console.log(e.message);
        res.status(500).send({"Error: ": e});
    } finally {
        await client.close();
    }
})

app.get('/monthly', async (req, res) => {
        const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        if (req.query.month.trim() == "" || req.query.month == undefined || req.query.year.trim() == "" || req.query.year == undefined){
            // const response = await pool.query(`SELECT type, CAST(sum(price) AS numeric) AS total_price FROM expenses where deleted = false group by type`);
            const response = await client.execute(`SELECT type, CAST(SUM(price) AS NUMERIC) AS total_price FROM expenses WHERE deleted = 0 GROUP BY type;`);
            // console.log(result.rows);
            // const formattedData = response.rows.map(row => {
            //     row.total_price = parseFloat(row.total_price);
            //     return row;
            // });
            const month = req.query.month.padStart(2, '0');
            const year = req.query.year;
            res.status(200).send(response.rows);
        }else{
            const month = req.query.month.padStart(2, '0'); 
            const year = req.query.year;
            // const response = await pool.query(`SELECT type, CAST(sum(price) AS numeric) AS total_price FROM expenses WHERE EXTRACT(MONTH FROM date) = ${req.query.month} AND EXTRACT(YEAR FROM date) = ${req.query.year}  AND deleted = false group by type`);
            const response = await client.execute(`SELECT type, SUM(price) AS total_price FROM expenses WHERE strftime('%m', date) = '${month}' AND strftime('%Y', date) = '${year}' AND deleted = false GROUP BY type;`);
            const formattedData = response.rows.map(row => {
                row.total_price = parseFloat(row.total_price);
                return row;
            });
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
    try{
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        // const response = await pool.query(`SELECT EXTRACT(YEAR FROM date) AS year, EXTRACT(MONTH FROM date) AS formatted_date, SUM(price) AS PRICE FROM expenses where deleted = false GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date) order by EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date);`);
        const response = await client.execute(`SELECT mn.month_name || ' ' || strftime('%Y', date) AS formatted_date, strftime('%Y%m', date) AS yearmonth, SUM(price) AS price FROM expenses INNER JOIN month_names mn ON strftime('%m', date) = mn.month_number WHERE deleted = 0 GROUP BY formatted_date, yearmonth ORDER BY yearmonth;`);
        // const formattedData = response.rows.map(row => {
        //     row.price = parseFloat(row.price);
        //     return row;
        // });
        res.status(200).send(response.rows);
    }
    catch(error){
        console.log(error.message);
    }
})
app.post('/', async (req, res) =>{
    try{
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        console.log(req.body);
        const response = await client.execute({
            sql: "INSERT INTO expenses (date, remarks, type, price, deleted) values ( ? , ? , ? , ? , ? )",
            args: [req.body.date, req.body.remarks, req.body.type, req.body.price, false],
        });
        await client.close();
        // console.log("req.body: ", req.body.body);
        // const result = await pool.query(`INSERT INTO expenses (date, remarks, type, price, deleted) values ( '${req.body.body.date}', '${req.body.body.remarks}', '${req.body.body.type}', '${req.body.body.price}', false )`);
        res.send("OK");
    }
    catch(error){
        console.log(error.message);
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
            sql: `UPDATE expenses SET ${req.query.field} = ? WHERE ID = ?`,
            args: [req.query.value, req.query.id],
        });
        console.log(req.query.id);
        console.log(req.query.field);
        console.log(req.query.value);
        await client.close();
        // const result = await pool.query(`UPDATE expenses SET ${req.query.field} = '${req.query.value}' WHERE ID = '${req.query.id}'`);
        res.send("OK");
    }
    catch (error) {
        console.log(error);
        res.status(500).send('Error');
    }
})

app.delete('/:id', async (req, res) => {
    try {
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        const response = await client.execute({
            sql: `update expenses set deleted = true WHERE ID = ?`,
            args: [req.params.id],
        });
        // console.log(req.params.id);
        // const response = await pool.query(`update expenses set deleted = true WHERE ID = ${req.params.id}`);
        // const response = await client.execute(`update expenses set deleted = true WHERE ID = ${req.params.id}`);
        res.send("OK");
    }
    catch (error) {
        console.log(error);
        // await client.close();
        res.status(500).send('Error');
    } finally{
        await client.close();
    }
})
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})