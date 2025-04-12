const express = require('express');
const mariadb = require('mariadb');
const pool = mariadb.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, connectionLimit: 5 });
const app = express();
app.use(express.json())





//POST Anfrage
//Email-Adresse bekommen (keine KOntrolle)
//In Datenbank speichern
//201 mit hinzugefügt


app.post('/', async (req,res)=>{
    let {email} = req.body
    let conn;
    try {

        conn = await pool.getConnection();

        const res = await conn.query("INSERT INTO myTable value (?)", [email]);
        // res: { affectedRows: 1, insertId: 1, warningStatus: 0 }

    } 
    catch(error){
        res.status(500).send("server error ",error)
        return;
    }
    
    finally {
        if (conn) conn.release(); //release to pool
    }
    res.status(201).send("hinzugefügt")
})


app.listen(3000, () => {
    console.log("Server opened on port 3000");
})