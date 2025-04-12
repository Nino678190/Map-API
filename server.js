const express = require('express');
const mariadb = require('mariadb');
const pool = mariadb.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER, connectionLimit: 5 });
const app = express();
const bcrypt = require('bcrypt');
app.use(express.json())
const saltRounds = 10
function hash(password) {
    return bcrypt.hash(password, saltRounds);
}


//Bcrypt importieren
//Hash Funktion zum laufen kriegen
//Registierungesendpoint mit Post methode
//Username und Passwort akzeptieren
//Passwort hashen
//Username + Passwort -> DB
//201 Code mit Created

app.post('/api/registration', async (req,res)=>{
    let {username,password} = req.body
    let conn;
    try {
        conn = await pool.getConnection();

        const res = await conn.query("INSERT INTO myTable value (?,?)", [username,hash(password)]);

    } 
    catch (error) {
        res.status(500).send("server error ",error)
        return;
    }
    
    finally {
        if (conn) conn.release(); //release to pool
    }
    res.status(201).send("Created")
})


app.listen(3000, () => {
    console.log("Server opened on port 3000");
})