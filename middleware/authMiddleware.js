const {getSession, createNewSession, deleteSession} = require("../database/session_db");
const uuid = require("uuid");
require('dotenv').config()

// End user session (logout)
const endSession = async (req, res, next) => {
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
        try {
            await deleteSession(sessionId);
            console.log("Session deleted")
            res.clearCookie('sessionId');
            console.log("Cookies cleared")
            return res.redirect('/');
        } catch (err) {
            next(err);
        }
    } else {
        return res.redirect('/');
    }
};

// Authenticate user session
const authenticate = async (req, res, next) => {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
        try {
            const userId = await getSession(sessionId);
            if (userId === -1) {
                res.clearCookie('sessionId');
                return res.redirect('/login');
            }
            req.user = userId;
            console.log("User authenticated " + userId)
            next();
        } catch (err) {
            res.clearCookie('sessionId');
            next(err);
        }
    } else {
        return res.redirect('/login');
    }
};

// Create new user session
const newSession = async (req, res, next) => {
    try {
        // create new session id using uuid package
        let sessionId = uuid.v4();
        sessionId = await createNewSession(req.user.id, sessionId);
        while (sessionId === -1) {
            // while sessionId already continue creating new session ids
            sessionId = uuid.v4();
            sessionId = await createNewSession(req.user.id, sessionId);
        }
        res.cookie('sessionId', sessionId, {httpOnly: true, maxAge: 3600000}); // max age - 1 hour
        next();
    } catch (err) {
        res.clearCookie('sessionId');
        next(err);
    }
};

// Generate CSRF token for new post creation or post edits
function generateCsrfToken(req, res, next) {

    const csrfToken = uuid.v4();
    // pass token to cookies (creating second "user session") for POST request verification
    res.cookie('form_csrfToken', csrfToken, {httpOnly: true, sameSite: 'strict', maxAge: 3600000}); // max age - 1 hour
    // pass token to local variables for setting hidden form csrf field
    res.locals.csrfToken = csrfToken;

    next();
}

const setCAPTCHA = (req, res, next) => {
    res.locals.captcha_key = process.env.CAPTCHA_KEY;
    next();
}

module.exports = {newSession, authenticate, endSession, generateCsrfToken, setCAPTCHA}