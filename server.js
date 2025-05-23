const express = require("express");
const mysql = require('mysql2/promise'); // mysql2/promise für Promise-Support
const cors = require('cors');
const bcrypt = require('bcrypt'); // Korrektur: require statt Zuweisung
const sleep = require('atomic-sleep');
require('dotenv').config();

const ratelimit = require('express-rate-limit');
const limiter = ratelimit({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    max: 100, // Limit von 100 Anfragen pro IP
    message: "Zu viele Anfragen von dieser IP, bitte später erneut versuchen"
});

app.use(limiter);

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
app.use(cors());
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
//* Funktioniert
app.post('/api/registration', async (req, res) => {
    let { username, password } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        const [checkResult] = await connection.query("SELECT Name FROM User WHERE Name = ?", [username]);
        console.log(checkResult);
        const hashedPassword = await hash(password);
        console.log(hashedPassword);
        await connection.query("INSERT INTO User (Name, Password) VALUES (?, ?)", [username, hashedPassword]);
        res.status(201).send("Created");
    } catch (error) {
        if (error.contains("ER_DUP_ENTRY") || error.code === "ER_DUP_ENTRY") {
            return res.status(409).send("Username already exists");
        }
        return res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release(); // Release to pool
    }
});

//Interaction : ADD
//* Funktioniert
app.post('/api/addinteraction', async (req, res) => {
    let { user, likeordislike, bewertungid } = req.body;
    let connection;
    console.log(user, likeordislike, bewertungid);
    try {
        connection = await pool.getConnection();

        const [checkResult] = await connection.query("SELECT UserID FROM Interaction WHERE BewertungsID = ?", [bewertungid]);
        if (checkResult.length >= 1) {
            return res.status(400).send("This User already left a like/dislike here");
        }

        await connection.query("INSERT INTO Interaction (UserID, Typ, BewertungsID) VALUES (?,?,?)", [user, likeordislike, bewertungid]);
        res.status(201).send("Created");
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

//ort : ADD
//* Funktioniert
app.post('/api/addort', async (req, res) => {
    let { Name, Breitengrad, Längengrad, Typ, Preise, Öffnungszeiten, Beschreibung } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.query("INSERT INTO Ort (Name, Breitengrad, Längengrad, Typ, Preise, Öffnungszeiten, Beschreibung) VALUES (?,?,?,?,?,?,?)",
            [Name, Breitengrad, Längengrad, Typ, Preise, Öffnungszeiten, Beschreibung]);
        res.status(201).send("Created");
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});



//User: Login (with compare)
//* Funktioniert
app.post('/api/login', async (req, res) => {
    let { username, password } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        const [users] = await connection.query("SELECT Name, password FROM User WHERE Name = ?", [username]);

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

//ort: GET
//* Funktioniert
app.get('/api/getsight/:id', async (req, res) => {
    let { id } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [sights] = await connection.query("SELECT * FROM Ort WHERE OrtID = ?", [id]);
        res.status(200).json(sights);
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

//Interaction: GET total
//TODO: Fixe die SQL Abfrage
app.get('/api/allinteraction/:id', async (req, res) => {
    let { id } = req.params;
    let connection;

    try {
        connection = await pool.getConnection();
        const [likesResult] = await connection.query("SELECT COUNT(*) as count FROM Interaction WHERE BewertungsID = ? AND Typ = 1", [id]);
        const anzahl_likes = likesResult[0].count;

        const [dislikesResult] = await connection.query("SELECT COUNT(*) as count FROM Interaction WHERE BewertungsID = ? AND Typ = 2", [id]);
        const anzahl_dislikes = dislikesResult[0].count;

        res.status(200).json({ likes: anzahl_likes, dislikes: anzahl_dislikes });
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

//* Funktioniert
app.post('/api/addfeedback/:ortid', async (req, res) => {
    let { ortid } = req.params;
    let { user, feedback } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.query("INSERT INTO Bewertungen (OrtID, UserID, Beschreibung) VALUES (?,?,?)", [ortid, user, feedback]);
        res.status(200).send("Feedback added");
    } catch (error) {
        res.status(500).send(`Server error: ${error.message}`);
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/location/:latitude/:longitude', async (req, res) => {
    let {latitude, longitude} = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [data] = await connection.query(
            `SELECT *, 
            (6371 * ACOS(
                COS(RADIANS(?)) * 
                COS(RADIANS(Breitengrad)) * 
                COS(RADIANS(Längengrad) - RADIANS(?)) + 
                SIN(RADIANS(?)) * 
                SIN(RADIANS(Breitengrad))
            )) AS distance 
            FROM Ort 
            HAVING distance <= 10 
            ORDER BY distance`,
            [latitude, longitude, latitude]
        );
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server error");
    } finally {
        if (connection) connection.release();
    }
})

app.get('/api/user/interaction/:userid', async (req, res) => {
    let { userid } = req.params;
    let connection;

    try {
        connection = await pool.getConnection();
        const [data] = await connection.query("SELECT * FROM Interaction WHERE UserID = ?", [userid]);
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server error");
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/ratings/:userid', async (req, res) => {
    let { userid } = req.params;
    let connection;

    try {
        connection = await pool.getConnection();
        const [data] = await connection.query("SELECT * FROM Bewertungen WHERE UserID = ?", [userid]);
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server error");
    } finally {
        if (connection) connection.release();
    }
});

app.put('/api/user/name', async (req, res) => {
    let { oldname, newname } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.query("UPDATE User SET Name = ? WHERE Name = ?", [newname, oldname]);
        res.status(200).send("Name updated");
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server error");
    } finally {
        if (connection) connection.release();
    }
});

app.put('/api/user/password', async (req, res) => {
    let { username, oldpassword, newpassword } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        const [users] = await connection.query("SELECT Name, password FROM User WHERE Name = ?", [username]);

        if (users.length > 0) {
            const user = users[0];
            const check = await bcrypt.compare(oldpassword, user.password);

            if (!check) {
                return res.status(404).send("Nutzer nicht gefunden");
            }
            const hashedPassword = await hash(newpassword);
            await connection.query("UPDATE User SET Password = ? WHERE Name = ?", [hashedPassword, username]);
            res.status(200).send("Password updated");
        } else {
            res.status(404).send("Nutzer nicht gefunden");
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send("Server error");
    } finally {
        if (connection) connection.release();
    }
});

app.listen(3000, () => {
    console.log("Server opened on port 3000");
})