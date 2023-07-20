const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { performance } = require('perf_hooks');

// Password encryption method
const bcrypt = require('bcrypt');
const saltRounds = 10;

router.use(bodyParser.urlencoded({extended: false}), cookieParser());

const {createNewUser, checkUserExists} = require("../database/users");
const {newSession, setCAPTCHA} = require("../middleware/authMiddleware");

//TODO:
// - implement rate-limiting to limit the number of registration attempts that can be made from a single IP address or user account.
//Registration form handling
router.post('/register', setCAPTCHA, async (req, res, next) => {
    let {name, email, password, confirm} = req.body;
    const captcha = req.body['g-recaptcha-response'];
    // Trim whitespaces if any
    name = name.trim()
    email = email.trim()
    password = password.trim()
    confirm = confirm.trim()

    if (!name || !email || !password || !confirm) {
        return res.status(400).render('register', {
            error: 'Please fill out all the fields',
            formInput: {name: name, email: email}
        });
    } else {
        if (captcha === ""){
            console.log("no response");
            return res.status(400).render('register', {
                error: 'Please complete CAPTCHA.',
                formInput: {name: name, email: email}
            });
        }
        // Validate and sanitize user input
        if (typeof name !== 'string' || name.length === 0 || name.search(/[^a-z0-9.\-\s]/gi) > 0) {
            const sanitizedName = name.replace(/[^a-z0-9.\-\s]/gi, '')
            return res.status(400).render('register', {
                error: 'Name input is invalid or contains illegal characters, please make sure to only use ' +
                    'English alphabet letters (A-Z and a-z) and/or numbers (0-9), ' +
                    'with exception for couple of approved special characters such as periods (.), hyphens (-), and spaces.',
                formInput: {name: sanitizedName, email: email}
            });
        }

        // Email validation
        if (typeof email !== 'string' || !/[^\s@]+@[^\s@]+\.[^\s@]+/gi.test(email)) {
            return res.status(400).render('register',
                {
                    error: 'Invalid email address, please enter a valid email address',
                    formInput: {name: name, email: email}
                });
        }
        // Check if the confirmation password matches
        if (password !== confirm) {
            return res.status(400).render('register',
                {
                    error: 'Passwords do not match, please check your password and try again',
                    formInput: {name: name, email: email}
                });
        }

        // validate password strength
        const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/g;
        if (!passwordPattern.test(password)) {
            let reasons = []
            if (!/^.{8,}$/g.test(password)) {
                reasons.push('Is at least 8 characters long')
            }
            if (!/\d/g.test(password)) {
                reasons.push('Contains at least one number')
            }
            if (!/[a-z]/g.test(password) || !/[A-Z]/g.test(password)) {
                reasons.push('Contains both lowercase and uppercase letters')
            }
            if (!/[^A-Za-z0-9]/g.test(password)) {
                reasons.push('Contains at least one special character')
            }

            return res.status(400).render('register',
                {
                    error: 'Weak password, please ensure your password:',
                    reasons: reasons,
                    formInput: {name: name, email: email}
                });
        }

        try {
            // Encrypt password
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);
            const userId = await createNewUser(name, email, hashedPassword);
            if (userId === -1) {
                return res.status(400).render('register',
                    {
                        error: 'This email address is already registered',
                        formInput: {name: name, email: email}
                    });
            }
            console.log(`New user created with ID ${userId}`);
            // Store user details for next middleware
            req.user = {
                email: email,
                name: name,
                id: userId
            };
        } catch (err) {
            next(err);
            return;
            // return res.status(500).send('Registration failed.');
        }
        next();
    }
}, newSession, (req, res) => {
    return res.redirect('/')
});

// Login authentication
router.post('/login', setCAPTCHA, async function (req, res, next) {
    const delay_time = 500;
    let elapsed = 0;
    const {email, password} = req.body;
    const captcha = req.body['g-recaptcha-response'];
    // console.log("reCAPTCHA", captcha);
    // Check fields are filled.
    if (!email || !password) {
        return res.status(400).render('login', {error: 'Please fill in all fields'});
    } else {
        // Email validation
        if (!/[^\s@]+@[^\s@]+\.[^\s@]+/gi.test(email)) {
            return res.status(400).render('login', {error: 'Not a valid email address format.'});
        } else {
            if (captcha === "") {
                console.log("no response");
                return res.status(400).render('login', {error: 'Please complete CAPTCHA.'});
            }
            console.log("reCAPTCHA complete");
            const startTime = performance.now();
            // Check if user exists in database
            const userCheck = await checkUserExists(email);
            if (userCheck) { // User found...
                console.log(("User exists."))
                // Compare passwords.
                bcrypt.compare(password, userCheck.password, (err, isMatch) => {
                    if (err) {
                        throw err;
                    }

                    if (isMatch) { // Passwords match.
                        req.user = {
                            email: userCheck.email,
                            name: userCheck.name,
                            id: userCheck.id
                        };
                        next();
                    } else {// Passwords do not match.
                        while (delay_time > elapsed) {
                            const endTime = performance.now();
                            elapsed = endTime - startTime;
                        }
                        return res.status(401).render('login', {error: 'User does not exist with those details.'});
                    }
                });
            } else { // User not found...
                while (delay_time > elapsed) {
                    const endTime = performance.now();
                    elapsed = endTime - startTime;
                }
                return res.status(401).render('login', {error: 'User does not exist with those details.'});
            }
        }
    }
}, newSession, (req, res) => {
    return res.redirect('/')
});

module.exports = router;
