const { createClient } = require("@libsql/client");  // Use require for Node.js
const express = require('express')
const app = express()
const port = 3000

async function fetchData() {
    const client = createClient({  // Create client outside the route handler
        url: "libsql://test-db-pravi-97.turso.io",
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3MTExNTIwMDYsImlhdCI6MTcxMDU3OTUwNCwiaWQiOiJjOWQ3ZTRlNS1jMzM2LTExZWUtYjA3MS01MjA1M2M0YjIzYTYifQ.4kWZrwu1ChjtJkzNaKens6FJjF1MamUxspzHs4u27SMb1gxcQrTgn7YupNysw4imHv3GDDDq5hfQYyCNe-FYAA",
    });
    try {
        const result = await client.execute("SELECT * FROM users");
        return result;
    } finally {
        // Consider closing the client connection here for proper resource management
        await client.close();  // Optional, but recommended for long-running applications
    }
}

app.get('/', async (req, res) => {
    try {
        const response = await fetchData();
        res.send(response);
    } catch (error) {
        console.error('Error :', error);
        res.status(500).send('Error fetching data');  // Handle error gracefully with a response
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
