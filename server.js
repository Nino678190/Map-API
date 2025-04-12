const express = require("express");
const mysql = require('mysql2/promise'); // mysql2/promise für Promise-Support
const cors = require('cors');
const bcrypt = require('bcrypt'); // Korrektur: require statt Zuweisung
const sleep = require('atomic-sleep')

console.time('sleep')
setTimeout(() => { console.timeEnd('sleep') }, 100)
sleep(1000)


const pool = mysql.createPool({
    host: 'db',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database_name' // Datenbank hinzugefügt
});

const app = express();

app.use(express.json())
const saltRounds = 10
function hash(password) {
    return bcrypt.hash(password, saltRounds);
}

//Connection to DB
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
    connection.release(); // Release the connection back to the pool
});

//User : ADD
app.post('/api/registration', async (req, res) => {
    let { username, password } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        const [checkResult] = await connection.query("SELECT Name FROM User WHERE Name = ?", [username]);
        console.log(checkResult);
        const hashedPassword = await hash(password);
        console.log(hashedPassword);
        await connection.query("INSERT INTO User VALUES (?,?)", [username, hashedPassword]);
        res.status(201).send("Created");
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release(); // Release to pool
    }
});

//Interaction : ADD
app.post('/api/addinteraction', async (req, res) => {
    let { user, likeordislike, bewertungid } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();

        const [checkResult] = await connection.query("SELECT user FROM interactions WHERE bewertungid = ?", [bewertungid]);
        if (checkResult.length >= 1) {
            return res.status(400).send("This User already left a like/dislike here");
        }

        await connection.query("INSERT INTO Interactions VALUES (?,?,?)", [user, likeordislike, bewertungid]);
        res.status(201).send("Created");
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

//Seight : ADD
app.post('/api/addseight', async (req, res) => {
    let { name, xcoordinate, ycoordinate, type, price, description, opening_times } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.query("INSERT INTO seights VALUES (?,?,?,?,?,?,?)",
            [name, xcoordinate, ycoordinate, type, price, description, opening_times]);
        res.status(201).send("Created");
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});



//User: Login (with compare)
app.post('/api/login', async (req, res) => {
    let { username, password } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        const [users] = await connection.query("SELECT username, password FROM User WHERE username = ?", [username]);

        if (users.length > 0) {
            const user = users[0];
            const check = await bcrypt.compare(password, user.password);

            if (!check) {
                return res.status(404).send("Nutzer nicht gefunden");
            }
            res.status(200).send("Login erfolgreich");
        } else {
            res.status(404).send("Nutzer nicht gefunden");
        }
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

//Seight: GET
app.get('/api/getsight/:id', async (req, res) => {
    let { id } = req.params;
    let connection;

    try {
        connection = await pool.getConnection();
        const [sights] = await connection.query("SELECT * FROM seights WHERE id = ?", [id]);
        res.status(200).json(sights);
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

//Interaction: GET total
app.get('/api/allinteraction/:id', async (req, res) => {
    let { id } = req.params;
    let connection;

    try {
        connection = await pool.getConnection();
        const [likesResult] = await connection.query("SELECT COUNT(*) as count FROM interactions WHERE bewertungid = ? AND type = true", [id]);
        const anzahl_likes = likesResult[0].count;

        const [dislikesResult] = await connection.query("SELECT COUNT(*) as count FROM interactions WHERE bewertungid = ? AND type = false", [id]);
        const anzahl_dislikes = dislikesResult[0].count;

        res.status(200).json({ likes: anzahl_likes, dislikes: anzahl_dislikes });
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

//
app.post('/api/addfeedback/:seightid', async (req, res) => {
    let { seightid } = req.params;
    let { user, feedback } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.query("INSERT INTO Feedback VALUES (?,?,?)", [seightid, user, feedback]);
        res.status(200).send("Feedback added");
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

app.listen(3000, () => {
    console.log("Server opened on port 3000");
})