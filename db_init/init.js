const {exec} = require('child_process');
require('dotenv').config()

const pgpass =
    {
        hostname: process.env.PG_HOST,
        port: process.env.PG_PORT,
        database: process.env.PG_DATABASE,
        username: process.env.PG_USER,
        password: process.env.PG_PASSWORD
    }

// create the database
console.log(`Attempting to create database ${process.env.PG_DATABASE} as user ${process.env.DB_MAIN_USER}`);
exec(`createdb -U ${process.env.DB_MAIN_USER} -p ${process.env.PG_PORT} ${process.env.PG_DATABASE}`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Database ${process.env.PG_DATABASE} created successfully`);
    // console.log(`Running "CREATE USER ${process.env.PG_USER} WITH PASSWORD '${process.env.PG_PASSWORD}'"`);
    // create a user for the database
    console.log(`Attempting to creating and populate database tables`);
    exec(`psql -U ${process.env.DB_MAIN_USER} -p ${process.env.PG_PORT} -d ${pgpass.database} -f ./db_init/init.sql`, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`${stdout} ${stderr}`)
        console.log(`Database tables have been created`);
    });
});