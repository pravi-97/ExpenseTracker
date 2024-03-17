const { createClient } = require("@libsql/client");
const express = require('express')
const app = express()
const port = 3000

async function fetchData() {
    const client = createClient({  
        url: "libsql://test-db-pravi-97.turso.io",
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3MTExNTIwMDYsImlhdCI6MTcxMDU3OTUwNCwiaWQiOiJjOWQ3ZTRlNS1jMzM2LTExZWUtYjA3MS01MjA1M2M0YjIzYTYifQ.4kWZrwu1ChjtJkzNaKens6FJjF1MamUxspzHs4u27SMb1gxcQrTgn7YupNysw4imHv3GDDDq5hfQYyCNe-FYAA",
    });
    try {
        const result = await client.execute("SELECT * FROM expense");
        return result.rows;
    } finally {
        await client.close();
    }
}

app.get('/', async (req, res) => {
    try {
        const response = await fetchData();
        res.send(response);
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');  
    }
})

app.post('/', async (req, res) =>{
    try{

    }
    catch(error){

    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
