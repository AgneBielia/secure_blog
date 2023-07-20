
const express = require('express');
const hbs = require('express-handlebars');

const router = require('./routes/index')
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const {authenticate} = require("./middleware/authMiddleware");

const app = express();

const error_title = {
    400: 'Bad Request',
    401: 'Unauthorized request',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
}

// Engine setup
app.engine('hbs', hbs.engine({extname: 'hbs', defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', __dirname +'/views');
app.set('view engine', 'hbs');

app.use('/', router);
// Authentication handling
app.use('/auth', authRouter);
// Posts handling
app.use('/posts', postsRouter);

app.use(authenticate, (err, req, res, next) => {
    console.error(err.stack);

    const error_status = err.status || 500;
    return res.status(error_status).render('errorStatus', {
        title: error_status,
        message: error_title[error_status],
        session: true
    });
});

app.use(authenticate, (req, res) => {
    res.status(404).render('errorStatus', {title: "404 - Page Not Found", message: "The page you are looking for does not exist", session: true});
});

app.listen(3000);