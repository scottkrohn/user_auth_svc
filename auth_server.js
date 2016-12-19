'use strict';

const restify = require('restify');
const userModel = require('./users_funcs');

var server = restify.createServer({
    name: "user_auth_svc",
    version: "0.0.1"
});

server.use(restify.authorizationParser());
server.use(restify.queryParser());
server.use(restify.bodyParser({mapParams: true}));


server.post('/create-user', (req, res, next) => {
    console.log('create-user visited...');
    userModel.addUser(req.params.username, req.params.password).then(result =>{
        res.send(result);
        next(false);
    }).catch(err => {
        res.send(500, err);
        next(false);
    });
});


server.post('/passwordCheck', (req, res, next) => {
    userModel.passwordCheck(req.params.username, req.params.password).then(result => {
        console.log(result);
        res.send(result);
        next(false);
    }).catch(err => {
        res.send(500, err);
        next(false);
    });
});

server.get('/find/:username', (req, res, next) => {
    userModel.find(req.params.username).then(result => {
        res.send(result);
    });
});

server.listen(3001, 'https://www.scottkrohn.com', function(){
    console.log(server.name + ' listening at ' + server.url);
});



//Mimic API authentication.
var apikeys = [{
    user: 'them',
    key: "D4E44-FDER4-DFFDE"
}];

function check(req, res, next){
    if(req.authorization){
        var found = false;
        for(let auth of apikeys){
            if(auth.key === req.authorization.basic.password && auth.user === req.authorization.basic.username) {
                found = true;
                break;
            }
        }
        if(found) next();
        else{
            res.send(401, new Error("Not authenticated"));
            error('Failed auth check ' + util.inspect(req.authorization));
        }
    }
    else{
        res.send(500, new Error("No auth key"));
        error("NO AUTHORIZATION");
        next(false);
    }
};
