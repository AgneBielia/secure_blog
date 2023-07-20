require('dotenv').config()
const {Pool} = require('pg');
const {preparedStatements} = require("./database_prep");

// Role with read only access to posts and comments
const read_only_pool = new Pool({
    user: process.env.READONLY_POSTS_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.READONLY_POSTS_PASS,
    port: process.env.PG_PORT
});

// Role with INSERT, SELECT AND UPDATE access to posts and comments
const insert_update_pool = new Pool({
    user: process.env.INSERT_EDIT_POSTS_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.INSERT_EDIT_POSTS_PASS,
    port: process.env.PG_PORT
});

// Role with DELETE access to posts and comments
const delete_pool = new Pool({
    user: process.env.DELETE_POSTS_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.DELETE_POSTS_PASS,
    port: process.env.PG_PORT
});

/**
 * Retrieves posts by created date in descending order
 * @throws {err} If db query fails unexpectedly
 * @param offset - the offset to retrieve teh posts from (for pagination)
 * @param limit - the amount of posts to retrieve
 * @param content_char_limit - the content character cutoff point
 */
async function getPosts(offset, limit, content_char_limit = null) {
    const client = await read_only_pool.connect();
    try {
        const batch = await client.query({
            name: preparedStatements.get_posts_batch.name,
            text: preparedStatements.get_posts_batch.text,
            values: [offset, limit],
        });
        if (batch.rows.length === 0) {
            return null;
        }

        return batch.rows.map(row => {
            return {
                id: row.id,
                title: row.title,
                author: row.name,
                content: content_char_limit && row.content.length > content_char_limit ? row.content.substring(0, content_char_limit) + '...' : row.content,
                created_at: row.f_datetime,
                comment_count: row.comment_count,
                total_count: row.total_count
            };
        });
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Retrieves post by the postId
 * @throws {err} If db query fails unexpectedly
 * @param postId - id of the post to be retrieved
 */
async function getPost(postId) {
    const client = await read_only_pool.connect();
    try {
        const post = await client.query({
            name: preparedStatements.get_post.name,
            text: preparedStatements.get_post.text,
            values: [postId],
        });
        if (post.rows.length === 0) {
            return null
        }
        return [post.rows[0].user_id, {
            id: post.rows[0].id,
            title: post.rows[0].title,
            author: post.rows[0].name,
            content: post.rows[0].content,
            created_at: post.rows[0].f_datetime,
            edited: post.rows[0].edited,
        }];
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Retrieves post comments by the postId
 * @throws {err} If db query fails unexpectedly
 * @param postId - id of the post to be retrieved
 * @return array of comments, or null if no comments where found
 */
async function getPostComments(postId) {
    const client = await read_only_pool.connect();
    try {
        const comments = await client.query({
            name: preparedStatements.get_post_comments.name,
            text: preparedStatements.get_post_comments.text,
            values: [postId],
        });
        if (comments.rows.length === 0) {
            return null
        }
        return comments.rows.map(row => {
            return {
                id: row.id,
                author: row.name,
                content: row.content,
                created_at: row.f_datetime,
            };
        });

    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Create a new post
 * @throws {err} If db query fails unexpectedly
 * @param title - post title
 * @param content - post content
 * @param userId - user ID
 */
async function newPost(title, content, userId) {
    const client = await insert_update_pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query({
            name: preparedStatements.create_new_post.name,
            text: preparedStatements.create_new_post.text,
            values: [title, content, userId]});
        await client.query('COMMIT');
        return result.rows[0].id;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Update existing post
 * @throws {err} If db query fails unexpectedly
 * @param postId - post id
 * @param title - post title
 * @param content - post content
 * @param userId - user ID
 */
async function editPost(postId, title, content, userId) {
    const client = await insert_update_pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query({
            name: preparedStatements.edit_post.name,
            text: preparedStatements.edit_post.text,
            values: [title, content, postId, userId]});
        await client.query('COMMIT');
        if (result.rowCount > 0){
            console.log("Post "+postId+" updated successfully.");
        } else {
            console.log("No rows were updated when editing post.")
        }
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Delete existing post
 * @throws {err} If db query fails unexpectedly
 * @param postId - post id
 * @param userId - user ID
 */
async function deletePost(postId, userId) {
    const client = await delete_pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query({
            name: preparedStatements.delete_post.name,
            text: preparedStatements.delete_post.text,
            values: [postId, userId]});
        await client.query('COMMIT');
        if (result.rowCount > 0){
            console.log("Post "+postId+" deleted successfully.");
        } else {
            console.log("No rows were affected when deleting post "+postId)
        }
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {getPosts, getPost, getPostComments, newPost, editPost, deletePost};