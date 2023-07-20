const uuid = require("uuid");
const { exec } = require('child_process');
const fs = require('fs')
require('dotenv').config()

const roles = [
    {
        name: 'readonly_posts',
        password: uuid.v4(),
        tables: 'posts, comments, users',
        access: 'SELECT'
    },
    {
        name: 'readonly_users',
        password: uuid.v4(),
        tables: 'users',
        access: 'SELECT'
    },
    {
        name: 'readonly_session',
        password: uuid.v4(),
        tables: 'sessions',
        access: 'SELECT'
    },
    {
        name: 'insert_edit_posts',
        password: uuid.v4(),
        tables: 'posts, comments',
        access: 'INSERT, UPDATE, SELECT',
        f_key_table: 'users'
    },
    {
        name: 'insert_users',
        password: uuid.v4(),
        tables: 'users',
        access: 'INSERT, SELECT'
    },
    {
        name: 'insert_session',
        password: uuid.v4(),
        tables: 'sessions',
        access: 'INSERT, SELECT',
        f_key_table: 'users'
    },
    {
        name: 'delete_posts',
        password: uuid.v4(),
        tables: 'posts, comments',
        access: 'DELETE, SELECT'
    },
    // Not used at this time
    // {
    //     name: 'delete_users',
    //     password: uuid.v4(),
    //     tables: 'users',
    //     access: 'DELETE'
    // },
    {
        name: 'delete_session',
        password: uuid.v4(),
        tables: 'sessions',
        access: 'DELETE, SELECT'
    },
]

console.log('Creating roles.')
let commands = ""
let store = ""
for (let i = 0; i < roles.length; i++){
    console.log(`GRANT ${roles[i].access} ON ${roles[i].tables} TO ${roles[i].name}`)
    commands = commands + `CREATE ROLE ${roles[i].name} WITH LOGIN PASSWORD '${roles[i].password}'; GRANT ${roles[i].access} ON ${roles[i].tables} TO ${roles[i].name}; `;
    if (roles[i].access.includes('INSERT')){
        let tables = roles[i].tables.split(",");
        if (tables.length > 1) {
            let tables_command = `${tables[0].replace(' ', '')}_id_seq`
            for (let j = 1; j < tables.length; j++) {
                tables_command = tables_command + `, ${tables[j].replace(' ', '')}_id_seq`
            }
            commands = commands + ` GRANT USAGE, SELECT ON ${tables_command} TO ${roles[i].name};`
            console.log(`GRANT USAGE, SELECT ON ${tables_command} TO ${roles[i].name}`)
        } else {
            commands = commands + ` GRANT USAGE, SELECT ON ${roles[i].tables.replace(' ', '')}_id_seq TO ${roles[i].name};`
            console.log(`GRANT USAGE, SELECT ON ${roles[i].tables}_id_seq TO ${roles[i].name}`)
        }
        // if (roles[i].f_key_table) {
        //     commands = commands + ` GRANT REFERENCES ON ${roles[i].f_key_table} TO ${roles[i].name};`
        //     console.log(`GRANT REFERENCES ON ${roles[i].f_key_table} TO ${roles[i].name}`)
        // }
    }
    store = store + `\n\n${roles[i].name.toUpperCase()}_PASS='${roles[i].password}'\n${roles[i].name.toUpperCase()}_USER='${roles[i].name}'`;
}

exec(`psql -p ${process.env.PG_PORT} -d ${process.env.PG_DATABASE} -U ${process.env.DB_MAIN_USER} -c "${commands}"`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`${stdout} ${stderr}`);
    fs.appendFileSync('./.env', store);
    console.log(`Roles have been created, view roles in .env file`);
});