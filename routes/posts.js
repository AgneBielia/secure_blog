const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

router.use(bodyParser.urlencoded({ extended: false }), cookieParser());

const {getPost, getPostComments, newPost, editPost, deletePost} = require("../database/posts_db");
const {authenticate, generateCsrfToken} = require("../middleware/authMiddleware");
const uuid = require("uuid");

router.use(authenticate);

// Redirect /posts to homepage
router.get('/', (req, res) => {
    return res.redirect('/');
});

// Open post editor for a new post creation
router.get('/new', generateCsrfToken, (req, res) => {

    return res.render('postEditor', {session: true, title: 'Create new post', csrfToken: res.locals.csrfToken});
});

// Process new post creation request
router.post('/new', async (req, res, next) => {
    // Get user session csrfToken from cookies
    const csrfToken = req.cookies.form_csrfToken;
    // Get csrf token from the hidden form field
    const {title, content, _csrf} = req.body;
    const post = {
        title: title,
        content: content
    };
    // Confirm that the form token matches the session token
    if (_csrf === csrfToken) {

        if (!post.title){
            return res.render('postEditor', {session: true, title: 'Create new post',post: post, error: "Title cannot be empty", csrfToken: _csrf});
        }

        if (!post.content){
            return res.render('postEditor', {session: true, title: 'Create new post', post: post, error: "Post body cannot be empty", csrfToken: _csrf});
        }

        const postId = await newPost(title, content, req.user);
        // Clear cookie after the post content has been sent to DB
        res.clearCookie('form_csrfToken');

        if (postId) {
            res.redirect(postId);
        } else {
            res.redirect('/');
        }
    } else {
        // Clear CSRF token in cookie after no match
        res.clearCookie('form_csrfToken');
        // Throw unauthorized request error if tokens do not match
        let err = new Error('Illegal form submission, CSRF token did not match');
        err.status = 401;
        next(err);
    }
});

// Validate id
router.use('/:id', (req, res, next) => {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
        let err = new Error('Invalid post ID has been queried');
        err.status = 400;
        next(err);
        return;
    }
    next();
});

// View specific post
router.get('/:id', async function (req, res, next) {
    const postId = req.params.id;
    if (postId) {
        try {
            const result = await getPost(postId);
            if (!result){
                const err = new Error("Post "+postId+ " does not exist");
                err.status = 404;
                next(err);
                return;
            }
            let [userId, post] = result;
            let edit = false;
            if (userId === req.user) {
                edit = true;
                const csrfToken = uuid.v4();
                // pass token to cookies (creating second "user session") for POST request verification
                res.cookie('del_csrfToken', csrfToken, { httpOnly: true, sameSite: 'strict', maxAge: 3600000}); // max age - 1 hour
                // pass token to local variables for setting hidden form csrf field
                res.locals.csrfToken = csrfToken;
            }
            const comments = await getPostComments(postId);
            post.comment_count = comments === null ? 0 : comments.length;
            return res.render('post', {session: true, post: post, comments: comments, edit});
        }
        catch (err) {
            next(err);
        }
    }
});

// Edit specific post
router.get('/:id/edit', generateCsrfToken, async (req, res, next) => {
    const postId = req.params.id;
    if (postId) {
        try {
            const result = await getPost(postId);
            if (!result){
                const err = new Error("Post "+postId+ " does not exist");
                err.status = 404;
                next(err);
                return;
            }
            let [userId, post] = result;
            if (userId === req.user) {
                return res.render('postEditor', {session: true, title: 'Edit post', csrfToken: res.locals.csrfToken, post});
            } else {
                return res.redirect('/posts/'+postId);
            }
        }
        catch (err) {
            next(err);
        }
    }
});

// Process post edit request
router.post('/:id/edit', async (req, res, next) => {
    const postId = req.params.id;
    // Get user session csrfToken from cookies
    const csrfToken = req.cookies.form_csrfToken;
    // Get csrf token from the hidden form field
    const {title, content, _csrf} = req.body;
    const post = {
        id: postId,
        title: title,
        content: content
    };
    // Confirm that the form token matches the session token
    if (csrfToken && _csrf && _csrf === csrfToken) {
        if (!post.title){
            return res.render('postEditor', {session: true, title: 'Create new post',post: post, error: "Title cannot be empty", csrfToken: _csrf});
        }

        if (!post.content){
            return res.render('postEditor', {session: true, title: 'Create new post', post: post, error: "Post body cannot be empty", csrfToken: _csrf});
        }

         await editPost(postId, title, content, req.user);

        // Clear cookie after the post content has been sent to DB
        res.clearCookie('form_csrfToken');

        if (postId) {
            res.redirect('/posts/'+postId);
        } else {
            res.redirect('/');
        }
    } else {
        // Clear CSRF token in cookie after no match
        res.clearCookie('form_csrfToken');
        // Throw unauthorized request error if tokens do not match
        let err = new Error('Illegal form submission, CSRF token did not match');
        err.status = 401;
        next(err);
    }
});

// Process post edit request
router.post('/:id/delete', async (req, res, next) => {
    const postId = req.params.id;
    // Get user session csrfToken from cookies
    const csrfToken = req.cookies.del_csrfToken;
    // Get csrf token from the hidden form field
    const {_csrf} = req.body;

    // Confirm that the form token matches the session token
    if (csrfToken && _csrf && _csrf === csrfToken) {
        // Delete post, using post id and
        await deletePost(postId, req.user);

        // Clear cookie after the post content has been deleted from DB
        res.clearCookie('del_csrfToken');

        res.redirect('/');

    } else {
        // Clear CSRF token in cookie after no match
        res.clearCookie('del_csrfToken');
        // Throw unauthorized request error if tokens do not match
        let err = new Error('Illegal form submission, CSRF token did not match');
        err.status = 401;
        next(err);
    }
});

router.use('/:id', authenticate, (req, res) => {
    const postId = req.params.id;
    res.redirect('/posts/'+postId)
    // res.status(404).render('errorStatus', {title: "404 - Page Not Found", message: "The page you are looking for does not exist", session: true});
});

module.exports = router;