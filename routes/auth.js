const express = require("express");
const authRoutes = new express.Router();
const db = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require('../models/user');
const { SECRET_KEY } = require("../config");
const ExpressError = require("../expressError");
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
authRoutes.post('/login', async(req,res,next) =>{
    try{
        const {username, password} = req.body;
        if (!username || !password) {
            throw new ExpressError("Username and password required", 400);
        }
        if(await User.authenticate(username, password)){
            const token = jwt.sign({username}, SECRET_KEY);
            User.updateLoginTimestamp(username);
            return res.json({message: `Logged in!`, token});
        }
        throw new ExpressError("Invalid username/password", 400);
    }catch(e){
        return next(e);
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
authRoutes.post('/register', async(req, res, next) =>{
    try{
        const {username, password, first_name, last_name, phone} = req.body;
        if (!username || !password) {
            throw new ExpressError("Username and password required", 400);
        }
        newUser = await User.register({username, password, first_name, last_name, phone});

        const isAuthenticated = await User.authenticate(username, password);
        if (isAuthenticated){
            const token = jwt.sign({username}, SECRET_KEY);
            await User.updateLoginTimestamp(username);
            return res.status(201).json({token});
        }else{
            throw new ExpressError("Authentication failed after registration", 500);
        }
    }catch(e){
        return next(e);
    }
})

module.exports = authRoutes;
