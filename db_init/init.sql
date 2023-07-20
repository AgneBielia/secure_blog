SET TIME ZONE 'Europe/London';

CREATE TABLE users
(
    id       SERIAL PRIMARY KEY,
    name     TEXT        NOT NULL,
    email    TEXT UNIQUE NOT NULL,
    password TEXT        NOT NULL
);

INSERT INTO users (name, email, password)
VALUES ('bob bobson', 'bob@email.com', 'password'),
       ('anna bobson', 'anna@email.com', '12345');

-- Sessions table
CREATE TABLE sessions
(
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users (id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
-- forum posts
CREATE TABLE posts
(
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(100) NOT NULL,
    content    TEXT         NOT NULL,
    user_id    INTEGER REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    edited     BOOL      DEFAULT FALSE
);
CREATE TABLE comments
(
    id         SERIAL PRIMARY KEY,
    post_id    INTEGER NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    content    TEXT    NOT NULL,
    user_id    INTEGER REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Populate database with fake data
-- Fake posts
INSERT INTO posts (title, content, user_id)
VALUES ('Lorem ipsum dolor sit amet',
        'Lacus viverra vitae congue eu consequat ac felis. Mattis nunc sed blandit libero. ' ||
        'Adipiscing elit pellentesque habitant morbi. Turpis massa sed elementum tempus egestas ' ||
        'sed sed risus pretium. Hac habitasse platea dictumst vestibulum rhoncus est pellentesque elit.' ||
        ' Urna porttitor rhoncus dolor purus. Tellus molestie nunc non blandit massa enim nec. Bibendum enim ' ||
        'facilisis gravida neque convallis a cras semper auctor. Lectus magna fringilla urna porttitor rhoncus ' ||
        'dolor. Diam quam nulla porttitor massa id neque aliquam vestibulum. Fames ac turpis egestas integer eget ' ||
        'aliquet nibh praesent. Rhoncus aenean vel elit scelerisque mauris pellentesque pulvinar pellentesque ' ||
        'habitant. Praesent tristique magna sit amet purus gravida quis blandit turpis. Ultrices dui sapien eget' ||
        ' mi. Consectetur libero id faucibus nisl tincidunt eget nullam. Augue ut lectus arcu bibendum at varius. ' ||
        'Est lorem ipsum dolor sit amet consectetur adipiscing elit. Consequat mauris nunc congue nisi vitae suscipit.',
        1),
       ('Pulvinar mattis nunc sed blandit',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Amet consectetur adipiscing elit pellentesque habitant. Pulvinar mattis nunc sed blandit libero volutpat sed. Sed felis eget velit aliquet sagittis id consectetur purus ut. Pretium fusce id velit ut tortor pretium viverra. Tristique senectus et netus et malesuada fames. Vitae tortor condimentum lacinia quis. Ut faucibus pulvinar elementum integer enim. Netus et malesuada fames ac turpis egestas. Sagittis purus sit amet volutpat consequat mauris nunc congue nisi. Ut tortor pretium viverra suspendisse potenti. Vitae auctor eu augue ut. Orci a scelerisque purus semper eget. Facilisis volutpat est velit egestas dui id.
Bibendum neque egestas congue quisque egestas diam in arcu. In hac habitasse platea dictumst quisque sagittis purus sit. Ac odio tempor orci dapibus ultrices in iaculis nunc. Et magnis dis parturient montes nascetur. Ac odio tempor orci dapibus ultrices in iaculis nunc sed. Felis imperdiet proin fermentum leo vel. Blandit volutpat maecenas volutpat blandit aliquam etiam. Aliquam ut porttitor leo a diam sollicitudin tempor. Placerat in egestas erat imperdiet sed euismod nisi porta lorem. Ultrices vitae auctor eu augue ut. Cras ornare arcu dui vivamus arcu felis. At consectetur lorem donec massa sapien. Mattis enim ut tellus elementum sagittis vitae et leo duis.
Velit aliquet sagittis id consectetur. Nec ultrices dui sapien eget mi proin. Adipiscing tristique risus nec feugiat in fermentum posuere. Mi proin sed libero enim sed faucibus. Sed adipiscing diam donec adipiscing tristique risus. Lectus quam id leo in vitae turpis massa sed elementum. Tortor vitae purus faucibus ornare suspendisse sed nisi lacus sed. Sem fringilla ut morbi tincidunt augue. Eu volutpat odio facilisis mauris sit amet massa vitae tortor. Elit at imperdiet dui accumsan sit amet nulla facilisi. Dui sapien eget mi proin sed libero enim. Auctor urna nunc id cursus metus aliquam eleifend mi. Id velit ut tortor pretium viverra suspendisse potenti nullam ac. Neque aliquam vestibulum morbi blandit cursus. Dictumst quisque sagittis purus sit amet volutpat consequat mauris nunc. Turpis egestas maecenas pharetra convallis posuere morbi leo urna. Amet commodo nulla facilisi nullam vehicula. Aliquam sem fringilla ut morbi tincidunt augue interdum. Eu consequat ac felis donec et. Tempus iaculis urna id volutpat lacus.
Vitae et leo duis ut diam quam nulla. Fringilla phasellus faucibus scelerisque eleifend donec. Tellus mauris a diam maecenas sed enim. Facilisis sed odio morbi quis commodo odio aenean sed. Est ultricies integer quis auctor elit sed. Pharetra et ultrices neque ornare aenean euismod elementum nisi quis. Cursus turpis massa tincidunt dui ut ornare lectus. Interdum posuere lorem ipsum dolor sit amet consectetur. Elementum facilisis leo vel fringilla est ullamcorper. Quam viverra orci sagittis eu volutpat. Elit at imperdiet dui accumsan. Nisi est sit amet facilisis magna etiam. At quis risus sed vulputate odio ut enim. Aliquam sem fringilla ut morbi. Augue neque gravida in fermentum et sollicitudin ac orci phasellus. Ac turpis egestas integer eget.
Nisi porta lorem mollis aliquam ut porttitor leo a diam. Eget gravida cum sociis natoque penatibus et. Egestas congue quisque egestas diam in arcu cursus. Cursus in hac habitasse platea dictumst quisque sagittis. Faucibus turpis in eu mi. Integer enim neque volutpat ac tincidunt. Duis ut diam quam nulla. Eu mi bibendum neque egestas congue quisque egestas. Phasellus egestas tellus rutrum tellus pellentesque eu. Sed pulvinar proin gravida hendrerit lectus. Et egestas quis ipsum suspendisse ultrices gravida dictum fusce ut. Eu non diam phasellus vestibulum lorem sed risus ultricies tristique. Tincidunt dui ut ornare lectus. Nulla facilisi etiam dignissim diam quis.',
        2);
-- Fake comments
INSERT INTO comments (post_id, content, user_id)
VALUES (1,
        'Non diam phasellus vestibulum lorem sed risus ultricies tristique nulla. In hendrerit gravida rutrum quisque non tellus orci ac.',
        2),
       (2,
        'Dolor magna eget est lorem ipsum dolor sit. Mi eget mauris pharetra et ultrices neque ornare.',
        1);

-- Duplicate posts 3 times to fill db
INSERT INTO posts (title, content, user_id)
SELECT title, content, user_id
FROM posts;
-- Duplicate posts and set date to a day ago
INSERT INTO posts (title, content, user_id, created_at)
SELECT title, content, user_id, now() - INTERVAL '1 day'
FROM posts;
-- Duplicate posts again and set date to a month ago
INSERT INTO posts (title, content, user_id, created_at)
SELECT title, content, user_id, now() - INTERVAL '1 month'
FROM posts;

-- Generate comments to random posts from random users
INSERT INTO comments (post_id, content, user_id)
SELECT (SELECT id FROM posts ORDER BY random() LIMIT 1), content, (SELECT id FROM users ORDER BY random() LIMIT 1)
FROM comments;
-- A day ago
INSERT INTO comments (post_id, content, user_id, created_at)
SELECT (SELECT id FROM posts ORDER BY random() LIMIT 1),
       content,
       (SELECT id FROM users ORDER BY random() LIMIT 1),
       now() - INTERVAL '1 day'
FROM comments;
-- A month ago
INSERT INTO comments (post_id, content, user_id, created_at)
SELECT (SELECT id FROM posts ORDER BY random() LIMIT 1),
       content,
       (SELECT id FROM users ORDER BY random() LIMIT 1),
       now() - INTERVAL '1 month'
FROM comments;