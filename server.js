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

app.post('/api/registration', async (req, res) => {
    let { username, password } = req.body
    let conn;
    try {
        conn = await pool.getConnection();

        const res = await conn.query("INSERT INTO User value (?,?)", [username, hash(password)]);

    }
    catch (error) {
        res.status(500).send("server error ", error)
        return;
    }

    finally {
        if (conn) conn.release(); //release to pool
    }
    res.status(201).send("Created")
})

app.post('/api/addseight', async (req, res) => {
    let { name , xcoordinate , ycoordinate , type , price, description , opening_times} = req.body;
    let conn;
    try {
        conn = await pool.getConnection();

        const res = await conn.query("INSERT INTO User value (?,?,?,?,?,?,?)", [name, xcoordinate, ycoordinate, type, price, description, opening_times]);

    }
    catch (error) {
        res.status(500).send("server error ", error)
        return;
    }

    finally {
        if (conn) conn.release(); //release to pool
    }
    res.status(201).send("Created")
})


///api/getsight/:id

app.post('/api/login', async (req, res) => {
    let { username, password } = req.body
    let conn;
    try {
        conn = await pool.getConnection();
        const db_getdata = await conn.query("SELECT username , password FROM User where username = (?)", [username]);
        if (db_getdata){
            const check = bcrypt.compare(password, db_getdata.password);
            if (!check) {
                return res.status(404).send("Nutzer nicht gefunden");
            }
        }    
    } catch (error) {
        res.status(500).send("server error ", error)
        return;
    } finally {
        if (conn) conn.release(); //release to pool
    }
    res.status(201).send("Created")
})

app.post('/api/getsight/:id', async (req, res) => {
    let { id } = req.params
    let conn;
    try {
        conn = await pool.getConnection();
        const db_getdata = await conn.query("SELECT * FROM User where id = (?)", [id]);
        res.status(200).send(db_getdata)
    } catch (error) {
        res.status(500).send("server error ", error)
        return;
    } finally {
        if (conn) conn.release(); //release to pool
    }
    
})

app.post('/api/allinteraction/:id',async (req, res) => {
    let {id} = req.params
    let conn;
    try {
        conn = await pool.getConnection();
        const db_getdata = await conn.query("SELECT * FROM User where id = (?) and type = true", [id]);
        anzahl_likes = db_getdata.rowCount
        const db_getdata_negative = await conn.query("SELECT * FROM User where id = (?) and type = false", [id]);
        anzahl_dislikes = db_getdata_negative.rowCount
        res.status(200).send(anzahl_likes , anzahl_dislikes)
    } catch (error) {
        res.status(500).send("server error ", error)
        return;
    } finally {
        if (conn) conn.release(); //release to pool
    }

}

)


app.listen(3000, () => {
    console.log("Server opened on port 3000");
})