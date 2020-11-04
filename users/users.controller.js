const express = require('express');
const router = express.Router();
const userService = require('./user.service');
const cors = require('cors');

var whitelist = ['http://localhost:4200', '*'];

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  
  console.log('#####origin: ');
  console.log('origin: ', req.header('Origin'));
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
    console.log('origin: ', req.header('Origin'));
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    console.log('returning: ', corsOptions);
  } else {
    corsOptions = { origin: false } // disable CORS for this request
    console.log('returning: ', corsOptions);
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

// routes
router.post('/authenticate', cors(corsOptionsDelegate),authenticate);
router.post('/register', cors(corsOptionsDelegate),register);
router.get('/', cors(corsOptionsDelegate),getAll);
router.get('/current', cors(corsOptionsDelegate),getCurrent);
router.get('/:id', cors(corsOptionsDelegate),getById);
router.put('/:id', cors(corsOptionsDelegate),update);
router.delete('/:id', cors(corsOptionsDelegate),_delete);
router.post('/createec2', cors(corsOptionsDelegate),createec2);
router.post('/listec2', cors(corsOptionsDelegate),listec2);
router.post('/runssmCommand', cors(corsOptionsDelegate),runssmCommand);

module.exports = router;

function authenticate(req, res, next) {
    console.log('^^^^ayth')
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function createec2(req, res, next) {
    console.log('#$#$#$#$');
    userService.createec2(req.body)
        .then(data => {
            console.log('data^^^^', JSON.stringify(data));
            res.json({
                status: 'creating',
                instanceData: data
            });
        })
        .catch(err => next(err));
}

function listec2(req, res, next) {
    console.log('#$#$#$#$');
    userService.listInstances(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'List EC2 Error' }))
        .catch(err => next(err));
}

function runssmCommand(req, res, next) {
    console.log('#$#$#$#$');
    userService.runSSMCommand(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Run SSM Command error' }))
        .catch(err => next(err));
}  

function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    userService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}