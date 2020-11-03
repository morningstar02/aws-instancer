const express = require('express');
const router = express.Router();
const userService = require('./user.service');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);
router.post('/createec2', createec2);
router.post('/listec2', listec2);
router.post('/runssmCommand', runssmCommand);

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