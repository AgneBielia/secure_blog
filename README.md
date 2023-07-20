# Secure Blog System

The aim of this project is to create a secure web-based blog system that mitigates the five most common security vulnerabilities: account enumeration, session hijacking, SQL injection, cross-site scripting, and cross-site request forgery. This project will utilize Node.js and related technologies.

## Installation

- Clone the repository to your local machine.
- Install Node.js and npm.
- Install project dependencies with the command `npm install`.

## Prerequisites

Before you can initialize the database using the SQL script, you need to have the following software installed on your machine:

- PostgreSQL: You can download and install PostgreSQL from the official website: https://www.postgresql.org/download/

Once you have installed PostgreSQL and running, you can follow these steps to initialize the database:

**Note:** for the ``build`` to work, your PostgreSQL command line functionality needs to be working, test by running `psql --version`.
If it is not recognized, the directory where PostgreSQL is installed on your system may need to be added to the PATH.
On Windows, this is typically `C:\Program Files\PostgreSQL\{version}\bin`. 

1. Open the `.env` file and change the port to the port (`PG_PORT`) to the port your PostgreSQL server is running on,
change `DB_MAIN_USER` to your PostgreSQL username. The rest of the env file can be left as is.
2. To create the database, run ` npm run build`. This script will create a database and any tables in `db_init/init.sql`, it will also automatically generate the DB roles required `db_init/roles_init.sql`.
3. Once the SQL script has finished running, you can verify that the database has been initialized by running
the following command: `SELECT * FROM users;` This should display a list of the two users that were inserted into the `users` table during initialization.

## Usage

- Run the command `npm start` to start the server.
- Open a web browser and navigate to `localhost:3000` to view the blog system.

## Security Features

### Authentication and passwords

We enforce a strong password policy, requiring all user to create strong password (at least 8 characters long, contain at least 1 uppercase and at least one lowercase letter, a number and a special character)

For password encryption we are using [bcrypt package](https://www.npmjs.com/package/bcrypt) with 10 salt rounds.
The bcrypt library is not susceptible to timing attacks ([read more](https://www.npmjs.com/package/bcrypt#a-note-on-timing-attacks)). 

### reCAPTCHA

The use of bots is a common practise in both breaking into accounts and compromising the availability of websites. To mitigate against such attacks, our blog implements reCAPTCHA by Google. This simple addition prevents the use of brute force attacks on users accounts as well as making sure that the server is not able to be flooded with requests. It involves simply ticking a box, thus usability is not impacted.
 
---

### Account Enumeration Mitigation

To mitigate account enumeration:
- We use generic error messages on failed user authentication which does not disclose whether the username or password
entered is valid or not.
- Timing attack mitigation: We have implemented a 500 ms timeout while the login details are being validated. 
To get as accurate as possible timestamps to execute this delay we have applied `perf_hooks` package `performance.now()`
high-resolution millisecond timestamp. With this optimization, the response times for requests have been stabilized 
at an average of 513 ms +- 4. As a result, incorrect email and incorrect password queries now have the same response time ranges.

### Session Hijacking Mitigation

* #### Random session id generation (RFC version 4 UUID)
    
    Session ID is generated using uuid package, RFC version 4 (random) UUID.
    
    The RFC version 4 UUID which is meant to generate random numbers, consists of 128 bits, 6 bits used to identify the version, and 4 bits to identify
    the variant, the rest is generated randomly using random numbers.
    
    From documentation for creation of [RFC4122](https://www.ietf.org/rfc/rfc4122.txt#:~:text=4.4.%20%20Algorithms%20for%20Creating%20a%20UUID%20from%20Truly%20Random%20or%0A%20%20%20%20%20%20Pseudo%2DRandom%20Numbers):
    ```
    ...
    4.4.  Algorithms for Creating a UUID from Truly Random or
          Pseudo-Random Numbers
    
    The algorithm is as follows:
    
    o  Set the two most significant bits (bits 6 and 7) of the
    clock_seq_hi_and_reserved to zero and one, respectively.
    
    o  Set the four most significant bits (bits 12 through 15) of the
    time_hi_and_version field to the 4-bit version number from
    Section 4.1.3.
    
    o  Set all the other bits to randomly (or pseudo-randomly) chosen
    values.
    ...
    ```
    Example (ref: [uuid - npm](https://www.npmjs.com/package/uuid#uuidv4options-buffer-offset:~:text=otherwise%20returns%20buffer-,Example%3A,%3B%0A%0Auuidv4()%3B%20//%20%E2%87%A8%20%271b9d6bcd%2Dbbfd%2D4b2d%2D9b5d%2Dab8dfbbd4bed%27,-Example%20using%20predefined)):
    ```
    import { v4 as uuidv4 } from 'uuid';
    uuidv4(); // ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
    ```
* #### Session timeout
    The session timeout is set to terminate after **an hour**, automatically logging out the user out of the system.
This helps to reduce the window of opportunity for attackers to steal the session.

* #### Using HTTP Only cookies to store session id
  When session id is stored in the cookies, the cookie is set to have HTTPOnly flag, preventing the session from being 
  hijacked using client side JavaScript during an XSS attack.
---
### SQL Injection Mitigation

* #### Parameterized queries (Upgraded to Prepared statements but functionality remains the same)
    Using precompiled SQL queries with parameter placeholders, allows us to send SQL statement and parameters separately.
    This allows the parameter values to be escaped and quoted properly by the database when executing.
    
    Parametrized query use makes manipulation of SQL queries through input field much more difficult,
    preventing execution of unauthorized commands.

    **Update**: The parametrized queries have been upgraded to stored statements, which in addition to above, it allows better
    performance by storing the queries during the first call, making the consequential queries run much faster.

* ##### Least privilege roles policy
  
  We enforce the least privilege role policy, by creating roles assigned the minimum privileges they require to perform
  certain actions. The roles were created to cover different tables based on teh information sensitivity, and on each of the table, 
  additional roles are created to perform different actions such as read-only, edit/insert and delete.
  By enforcing such policy we ensure that SQL injection attempts cause the least possible amount of damage to the 
  stored data. 
---
### Cross-Site Scripting (XSS) Mitigation

* #### HTTP Only cookies to store tokens
  While using cookies to establish user sessions, there is a potential threat that client-side JavaScript can be applied
  to gain unauthorized access to the users session. To prevent this from happening when setting session id in the cookies, 
  the `httpOnly` option is set to `true`.
  
  Additionally, when creating or editing posts, when creating CSRF token for form submission authentication, the
  `httpOnly` option is set to `true` when CSRF token is stored in cookies for the form submission user session.

* #### Escaping HTML user generated input
  To ensure that user generated input is not rendered as HTML, we apply "double-stash" `{{ ... }}` which 
in Handlebars escapes values returned and renders user-generated input only as text on the page.
* #### Preventing XSS with JavaScript user-generated input
  Handlebars `{{ ... }}` "double-stash" expression escapes HTML, however it does not escape JavaScript strings.
  [The warning on Handlebars](https://handlebarsjs.com/guide/#html-escaping:~:text=is%20not%20used.-,WARNING,inline%20event%20handlers%2C%20could%20potentially%20lead%20to%20cross%2Dsite%20scripting%20vulnerabilities.,-%23):
  ```text
  WARNING
  
  Handlebars does not escape JavaScript strings.
  Using Handlebars to generate JavaScript, such as inline event handlers, 
  could potentially lead to cross-site scripting vulnerabilities.
  ```
  Keeping this in mind, we do not use Handlebars with user-generated content to generate JavaScript, in turn protecting 
  the site from XSS with JavaScript user-generated input.

---
### Cross-Site Request Forgery (CSRF) Mitigation

To ensure that the blog posts are created, edited and deleted safely, 
we have implemented a "double submit cookie" technique for every post creation and editing request. 
The process includes generating a CSRF token using uuid package (RFC version 4 UUID) and inserting it as a cookie 
for the user session and including it in the hidden input field of the submission form.
This allows us to confirm that the submitted form is sent by the authenticated user, helping us
protect the system against potential cross-site forgery attacks.

CSRF token generation function (middleware/authMiddleware.js) :
```js
// Generate CSRF token for new post creation or post edits
function generateCsrfToken(req, res, next) {
  const csrfToken = uuid.v4();
  // pass token to cookies (creating second "user session") for POST request verification
  res.cookie('form_csrfToken', csrfToken, { httpOnly: true, sameSite: 'strict', maxAge: 3600000}); // max age - 1 hour
  // pass token to local variables for setting hidden form csrf field
  res.locals.csrfToken = csrfToken;

  next();
}
```
