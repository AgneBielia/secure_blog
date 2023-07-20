// Prepared parametrized statements

const preparedStatements = {
    // ***** USERS/AUTH *****
    // Get user by email
    select_user: {
        name: 'select_user',
        text: 'SELECT * FROM users WHERE email = $1 LIMIT 1;'
    },
    // Create new user
    insert_new_user_query: {
        name: 'insert_new_user_query',
        text: 'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id;'
    },
    // Check if user exists by email
    user_exists_check: {
        name: 'user_exists_check',
        text: 'SELECT EXISTS(SELECT * FROM users WHERE email = $1);'
    },
    // ***** USER SESSION *****
    // Store new user session
    new_session: {
        name: 'new_session',
        text: 'INSERT INTO sessions (user_id, session_id) VALUES ($1, $2);'
    },
    // Retrieve active user session
    get_active_session: {
        name: 'get_active_session',
        text: 'SELECT * FROM sessions WHERE session_id = $1 and now() - created_at <= INTERVAL \'1 hour\';'
    },
    // Check if user session exists
    check_session: {
        name: 'check_session',
        text: 'SELECT EXISTS(SELECT * FROM sessions WHERE session_id = $1);'
    },
    // Delete user session
    delete_session: {
        name: 'delete_session',
        text: 'DELETE FROM sessions WHERE session_id = $1;'
    },
    // ***** POSTS *****
    // Retrieve a posts batch for homepage
    get_posts_batch: {
        name: 'get_posts_batch',
        text:
            ' SELECT p.id,\n' +
            '           p.title,\n' +
            '           p.content,\n' +
            '           TO_CHAR(p.created_at, \'YYYY-MM-DD HH24:MI\') as f_datetime,\n' +
            '           u.name                                        AS name,\n' +
            '           COUNT(c.id)                                   AS comment_count,\n' +
            '           (Select count(*) from posts)                  as total_count\n' +
            '    FROM posts p\n' +
            '             JOIN users u ON p.user_id = u.id\n' +
            '             LEFT JOIN comments c ON p.id = c.post_id\n' +
            '    GROUP BY p.id, u.name, p.created_at\n' +
            '    ORDER BY p.created_at DESC\n' +
            '    OFFSET $1 LIMIT $2;',
    },
    // Get specific post by id
    get_post: {
        name: 'get_post',
        text: 'SELECT posts.id,\n' +
            '           posts.user_id,\n' +
            '           title,\n' +
            '           content,\n' +
            '           TO_CHAR(created_at, \'YYYY-MM-DD HH24:MI\') AS f_datetime,\n' +
            '           u.name                                      as name,\n' +
            '           posts.edited\n' +
            '    FROM posts\n' +
            '             INNER JOIN users u on u.id = posts.user_id\n' +
            '    where posts.id = $1;',
    },
    // Get post comments based on post id
    get_post_comments: {
        name: 'get_post_comments',
        text: 'SELECT c.id, content, TO_CHAR(created_at, \'YYYY-MM-DD HH24:MI\') AS f_datetime, u.name as name\n' +
            '    FROM comments c\n' +
            '             INNER JOIN users u on u.id = c.user_id\n' +
            '    where c.post_id = $1;',
    },
    // Create new post
    create_new_post: {
        name: 'create_new_post',
        text: 'INSERT INTO posts (title, content, user_id)\n' +
            '    VALUES ($1, $2, $3)\n' +
            '    RETURNING id;',
    },
    //  Edit existing post
    edit_post: {
        name: 'edit_post',
        text: 'UPDATE posts\n' +
            '    SET title   = $1,\n' +
            '        content = $2,\n' +
            '        edited  = true\n' +
            '    WHERE id = $3\n' +
            '      AND user_id = $4;',
    },
    // Delete post
    delete_post: {
        name: 'delete_post',
        text: ' DELETE\n' +
            '    FROM posts\n' +
            '    WHERE id = $1\n' +
            '      AND user_id = $2;',
    }
};

module.exports = {preparedStatements};
