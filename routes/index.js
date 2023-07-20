const express = require('express');
const {authenticate, endSession, setCAPTCHA} = require("../middleware/authMiddleware");
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const {getPosts} = require("../database/posts_db");

router.use(bodyParser.urlencoded({ extended: false }), cookieParser());

// Home page
router.get('/', authenticate, async function (req, res, next) {
    try {
        // Pagination
        let page = parseInt(req.query.page) || 1;
        page = Math.abs(page);
        const page_limit = 10;
        const offset = (page-1)*page_limit;
        const posts = await getPosts(offset, page_limit, 400);
        if (!posts && page === 1){
            // Render homepage
            return res.render('home', {session: true, posts: null, pages: null});
        }
        else if (!posts) {
            const err = new Error("The page number is out of range");
            err.status = 404;
            next(err);
            return;
        }

        const pages_count = Math.ceil(posts[0].total_count/page_limit);

        let pages = [];
        for (let i = 1; i <= pages_count; i++) {
            pages.push({ page: i, current: i === page });
        }

        // Render homepage
        return res.render('home', {session: true, posts: posts, pages: pages,
            next: page < pages_count ? page+1 : null , previous: page-1 > 0 ? page-1 : null});
    }
    catch (err) {
        next(err);
    }
});

// Register page
router.get('/register', setCAPTCHA, function(req, res) {
    if (req.cookies.sessionId) {
        res.redirect('/')
    }
    res.render('register');
});

// Login page
router.get('/login', setCAPTCHA, function(req, res) {
    if (req.cookies.sessionId) {
        res.redirect('/')
    }
    res.render('login');
});

// Logout
router.get('/logout', endSession);

module.exports = router;