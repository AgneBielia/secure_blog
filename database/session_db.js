require('dotenv').config()
const {Pool} = require('pg');
const {preparedStatements} = require("./database_prep");

const read_only_pool = new Pool({
    user: process.env.READONLY_SESSION_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.READONLY_SESSION_PASS,
    port: process.env.PG_PORT
});

const insert_pool = new Pool({
    user: process.env.INSERT_SESSION_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.INSERT_SESSION_PASS,
    port: process.env.PG_PORT
});

const delete_pool = new Pool({
    user: process.env.DELETE_SESSION_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.DELETE_SESSION_PASS,
    port: process.env.PG_PORT
});

/**
 * Create new session on login or successful registration.
 * Checks the database for duplicates by querying for a session id that matches the new session id
 * If no duplicates are found, new session id is registered.
 *
 * @param userID - Existing user id
 * @param sessionID - New session id (not yet stored in the database).
 *
 * @returns sessionID is successfully registered, -1 if sessionID already exists.
 *
 * @throws {err} If sessionID check fails unexpectedly
 */
async function createNewSession(userID, sessionID) {
    const client = await insert_pool.connect();
    const read_only_client = await read_only_pool.connect();
    try {
        // Check if the same active session ID already exists (to avoid duplicates)
        const sessionRes = await read_only_client.query({
            name: preparedStatements.check_session.name,
            text: preparedStatements.check_session.text,
            values: [sessionID]});
        if (sessionRes.rows[0].exists){
            return -1;
        }
        else {
            await client.query('BEGIN');
            await client.query({
                name: preparedStatements.new_session.name,
                text: preparedStatements.new_session.text,
                values: [userID, sessionID]});
            await client.query('COMMIT');
        }
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
        read_only_client.release();
    }
    return sessionID;
}

/**
 * Checks the database for a session id
 * @param sessionId - existing session id
 * @returns sessionID if successfully retrieved, -1 if sessionID was not found.
 * @throws {err} If sessionID check fails unexpectedly

 */
async function getSession(sessionId) {
    const client = await read_only_pool.connect();
    try {
        const sessionRes = await client.query({
            name: preparedStatements.get_active_session.name,
            text: preparedStatements.get_active_session.text,
            values: [sessionId]});
        if (sessionRes.rows.length === 0) {
            return -1
        }
        return sessionRes.rows[0].user_id;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Checks the database for an active session id, and removes it if exists
 * @throws {err} If sessionID removal fails unexpectedly
 * @param sessionID - active user session id
 */
async function deleteSession(sessionID) {
    const client = await delete_pool.connect();
    const read_only_client = await read_only_pool.connect();
    try {
        // Check if the active session ID exists
        const sessionRes = await read_only_client.query({
            name: preparedStatements.get_active_session.name,
            text: preparedStatements.get_active_session.text,
            values: [sessionID]});
        if (sessionRes.rows.length > 0){
            await client.query('BEGIN');
            await client.query({
                name: preparedStatements.delete_session.name,
                text: preparedStatements.delete_session.text,
                values: [sessionID]});
            await client.query('COMMIT');
        }
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
        read_only_client.release();
    }
}

module.exports = {createNewSession, getSession, deleteSession}