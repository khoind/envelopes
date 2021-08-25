const express = require('express')
const morgan = require('morgan')
const router = require('./routes');

const app = express()
// Mount routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('tiny'));
app.use('/', router);

// Final step
const port = 3000;
app.listen(port, () => {
    console.log(`Listening at port ${port}`)
})