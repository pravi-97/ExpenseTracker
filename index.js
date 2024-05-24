require('dotenv').config(); 
const { createClient } = require("@libsql/client");
const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const port = 3000

const URL = process.env.URL;
const TOKEN = process.env.TOKEN;

app.get('/ping', async (req, res) => {
    console.log("PING");
    res.status(200).send({message: 'Ping Success'});
})
app.get('/all', async (req, res) => {
    console.log("GET all");
    console.log(`userid = ${req.query.userid}`);
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        const response = await client.execute({
            sql: "SELECT * FROM expenses WHERE deleted = 0 and userid = ? ORDER BY date DESC;",
            args: [req.query.userid],
        });
        res.status(200).send(response.rows);
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');
    } finally {
        await client.close();
    }
})
app.get('/getall', async (req, res) => {
    console.log("GET Backup");
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        const response = await client.execute({
            sql: "SELECT * FROM expenses"
        });
        res.status(200).send(response.rows);
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');
    } finally {
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
        if (req.params.tag.trim() != "") {
            let query = {};
            if (req.query.monthyear == undefined) {
                query = {
                    sql: "SELECT * FROM expenses where type = ? AND deleted = 0 and userid = ? order by id DESC",
                    args: [req.params.tag, req.query.userid],
                }
            } else {
                query = {
                    sql: "SELECT * FROM expenses WHERE type = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ? AND deleted = 0 and userid = ? ORDER BY id DESC;",
                    args: [req.params.tag, req.query.monthyear.substring(0, 2), req.query.monthyear.substring(3, 7), req.query.userid],
                }
            }
            const response = await client.execute(query);
            res.status(200).send(response.rows);
        } else {
            const response = await client.execute({
                sql: "SELECT * FROM expenses  WHERE deleted = false and userid = ? order by date DESC",
                args: [req.query.userid]
            });
            res.status(200).send(response.rows);
        }
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');
    } finally {
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
        const response1 = await client.execute({
            sql: "SELECT type, CAST(sum(price) AS numeric) AS total_price FROM expenses where deleted = false and userid = ? group by type",
            args: [req.query.userid]
        });
        const response2 = await client.execute({
            sql: "SELECT distinct (CASE WHEN strftime('%m', date) = '01' THEN 'January' WHEN strftime('%m', date) = '02' THEN 'February' WHEN strftime('%m', date) = '03' THEN 'March' WHEN strftime('%m', date) = '04' THEN 'April' WHEN strftime('%m', date) = '05' THEN 'May' WHEN strftime('%m', date) = '06' THEN 'June' WHEN strftime('%m', date) = '07' THEN 'July' WHEN strftime('%m', date) = '08' THEN 'August' WHEN strftime('%m', date) = '09' THEN 'September' WHEN strftime('%m', date) = '10' THEN 'October' WHEN strftime('%m', date) = '11' THEN 'November' WHEN strftime('%m', date) = '12' THEN 'December' ELSE strftime('%m', date) END) AS mmmm, strftime('%m', date) AS mm, strftime('%Y', date) AS year, strftime('%Y', date)|| '' || strftime('%m', date) as mmyy FROM expenses WHERE deleted = 0 and userid = ? order by MMYY",
            args: [req.query.userid]
        });
        response.sum = response1.rows;
        response.date = response2.rows;
        res.status(200).send(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ "Error: ": error });
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
        if (req.query.month.trim() == "" || req.query.month == undefined || req.query.year.trim() == "" || req.query.year == undefined) {
            const response = await client.execute({
                sql: "SELECT type, SUM(price) AS total_price FROM expenses WHERE deleted = 0 and userid = ? GROUP BY type",
                args: [req.query.userid]
            });
            res.status(200).send(response.rows);
        } else {
            const response = await client.execute({
                sql: "SELECT type, SUM(price) AS total_price FROM expenses WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ? AND deleted = 0 and userid = ? GROUP BY type",
                args: [month, year, req.query.userid]
            });
            res.status(200).send(response.rows);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ "Error: ": e });
    } finally {
        await client.close();
    }
})

app.get('/month', async (req, res) => {
    console.log("GET month");

    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        const response = await client.execute({
            sql: "SELECT mn.month_name || ' ' || strftime('%Y', date) AS formatted_date, strftime('%Y%m', date) AS yearmonth, SUM(price) AS price FROM expenses INNER JOIN month_names mn ON strftime('%m', date) = mn.month_number WHERE deleted = 0 and userid = ? GROUP BY formatted_date, yearmonth ORDER BY yearmonth",
            args: [req.query.userid]
        });
        res.status(200).send(response.rows);
    }
    catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
})

app.get('/details', async (req, res) => {
    console.log("GET month");
    
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        const response = await client.execute({
            sql: "SELECT mn.month_name || ' ' || strftime('%Y', date) AS formatted_date, strftime('%Y%m', date) AS yearmonth, SUM(price) AS price FROM expenses INNER JOIN month_names mn ON strftime('%m', date) = mn.month_number WHERE deleted = 0 and userid = ? GROUP BY formatted_date, yearmonth ORDER BY yearmonth",
            args: [req.query.userid]
        });
        res.status(200).send(response.rows);
    }
    catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
})

app.post('/', async (req, res) => {
    console.log("POST /");
    try {
        const client = createClient({
            url: URL,
            authToken: TOKEN,
        });
        const response = await client.execute({
            sql: "INSERT INTO expenses (date, remarks, type, price, deleted, userid) values ( ? , ? , ? , ? , ? , ? )",
            args: [req.body.date, req.body.remarks, req.body.type, req.body.price, false, req.body.userid],
        });
        await client.close();
        res.send({message: "posted"});
    }
    catch (error) {
        console.error(error.message);
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
        console.log(req.query.field, " ", req.query.value," ", req.query.id);
        const result = await client.execute({
            sql: `UPDATE expenses SET ${req.query.field} = ? WHERE ID = ?`,
            args: [req.query.value, req.query.id],
        });
        res.send({message : "updated"});
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error');
    } finally {
        await client.close();
    }
})

app.delete('/:id', async (req, res) => {
    console.log("DELETE id");
    const client = createClient({
        url: URL,
        authToken: TOKEN,
    });
    try {
        const response = await client.execute({
            sql: `update expenses set deleted = true WHERE ID = ?`,
            args: [req.params.id],
        });
        res.send({message: "deleted"});
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error');
    } finally {
        await client.close();
    }
})
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
