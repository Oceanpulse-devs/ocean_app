const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const port = process.env.PORT || 5000




const app = express();

const routes = require('./src/routes/mainRoutes')
app.use('/', routes)


app.listen(port , ()=>{
    console.log(`Server running on port ${port}`)
})