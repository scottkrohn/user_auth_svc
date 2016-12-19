'use strict';

const Sequelize = require('sequelize');
const jsyaml = require('js-yaml');
const fs= require('fs-extra');
const bcrypt = require('bcryptjs');

var SQuser;
var seq;

exports.connectDB = function(){
    if(SQuser) return SQuser.sync();
    
    return new Promise((resolve, reject) => {
        fs.readFile('seq_mysql.yaml', 'utf8', (err, data) => {
            if(err) reject(err);
            else resolve(data);
        });
    }).then(fileData => {
        return jsyaml.safeLoad(fileData, 'utf8');
    }).then(params => {
        if(!seq){
            try{
                seq = new Sequelize(params.dbname, params.username, params.password, params.params);
            }
            catch(err) {
                console.log(err);
            }
        }

        if(!SQuser){
            SQuser = seq.define('User', {
                username: {type: Sequelize.STRING, unique: true},
                hash_pw: Sequelize.STRING
            });
        }
        return SQuser.sync();
    });
};

/*
    Add a user to the database.
 */
exports.addUser = function(username, plaintext_pw){
    console.log("addUser called...");
    // Connect to the database if not already connected.
    return exports.connectDB().then(SQuser => {
        // Hash the user's plaintext password before storing in the DB.
        bcrypt.hash(plaintext_pw, 10).then(hash => {
            // Store the user in the database.
            return SQuser.create({
                username: username,
                hash_pw: hash
            }).catch(err=>{
                throw new Error(err);
            });
        }).catch(err => {
            throw new Error(err);
        });
    });
};

/*
    Find a user in the database.
 */
exports.find = function(username) {
    // Connect to the database if not already connected.
    return exports.connectDB().then(user =>{
        return user.find({where: {username: username}});
    }).then(user => {
        return user ? exports.sanitizedUser(user) : undefined;
    });
};

/*
    Check if a user's password matches input information.
 */
exports.passwordCheck = function(username, plaintext_pw){
    // Connect to the database if not already connected.
    return exports.connectDB().then(SQuser => {
        // Check if the username exists in DB.
        return SQuser.find({where: {username: username}});
    }).then(user => {
        return new Promise((resolve, reject) => {
            // If the user isn't found, return false.
            if(!user){
                return {check: false, username: username, message: "User not found."};
            }
            else{
                // If the user is found, compared the password entered with the hashed PW in the DB.
                bcrypt.compare(plaintext_pw, user.hash_pw).then(res =>{
                    if(res == true){
                        resolve({check: true, username: username, message: "User authenticated."});
                    }
                    else{
                        resolve({check: false, username: username, message: "Invalid password."});
                    }
                })
            }
        });
    });
};


/*
    Return a user without their password.
 */
exports.sanitizedUser = function(user){
    return {
        id: user.username,
        username: user.username
    };
};

function compareHashedPW(plaintext, hash){
    bcrypt.compare(plaintext, hash).then(res =>{
        if(res == true){
            return true;
        }
        return false;
    });
}