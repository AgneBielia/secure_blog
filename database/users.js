require('dotenv').config()
const {Pool} = require('pg');
const {preparedStatements} = require("./database_prep");

const read_only_pool = new Pool({
    user: process.env.READONLY_USERS_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.READONLY_USERS_PASS,
    port: process.env.PG_PORT
});

const insert_pool = new Pool({
    user: process.env.INSERT_USERS_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.INSERT_USERS_PASS,
    port: process.env.PG_PORT
});

async function createNewUser(name, email, password) {
    const client = await insert_pool.connect();
    const read_only_client = await read_only_pool.connect()
    try {
        const check = await read_only_client.query({
            name: preparedStatements.user_exists_check.name,
            text: preparedStatements.user_exists_check.text,
            values: [email]});
        if (!check.rows[0].exists){
            await client.query('BEGIN');
            const result = await client.query({
                name: preparedStatements.insert_new_user_query.name,
                text: preparedStatements.insert_new_user_query.text,
                values: [name, email, password]});
            await client.query('COMMIT');
            return result.rows[0].id;
        } else {
            return -1
        }
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        read_only_client.release();
        client.release();
    }
}

async function checkUserExists(email) {
    const client = await read_only_pool.connect();
    try {
        const results = await client.query({
            name: preparedStatements.select_user.name,
            text: preparedStatements.select_user.text,
            values: [email]});
        if (results.rows.length > 0) {
            return results.rows[0];
        } else {
            return false;
        }
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {createNewUser, checkUserExists};
