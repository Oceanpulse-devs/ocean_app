const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const port = process.env.PORT || 5000
const redisClient = require('./src/config/redisdb')
const db = require('./models')
const pool = require('./src/config/database')
const cookieParser = require('cookie-parser')




const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // Allow cookies to be sent with requests
}));



//routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/', authRoutes)



db.sequelize.sync().then((req)=>{})
app.listen(port , ()=>{
    console.log(`● Server running on port ${port} ✅`)
})