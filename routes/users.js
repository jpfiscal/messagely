const express = require("express");
const userRoutes = new express.Router();
const { ensureLoggedIn } = require("../middleware/auth");
const User = require('../models/user');
const ExpressError = require("../expressError");
/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
userRoutes.get('/',ensureLoggedIn, async (req,res,next)=>{
    try{
        const users = await User.all();
        return res.json({users: users});
    }catch(e){
        return next(e);
    }
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
userRoutes.get("/:username", ensureLoggedIn, async (req,res,next) =>{
    try{
        if(req.user.username == req.params.username){
            const user = await User.get(req.body.username);
            return res.json({user: user});
        }
        throw new ExpressError("Cannot request details of an account other than your own!", 400);
    }catch(e){
        return next(e);
    }
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
userRoutes.get("/:username/to", ensureLoggedIn, async (req,res,next)=>{
    try{
        if(req.user.username == req.params.username){
          to_user = await User.messagesTo(req.params.username);
          return res.json({messages: to_user});
        }
        throw new ExpressError("Cannot request messages of an account other than your own!", 400);
    }catch(e){
        return next(e);
    }
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
userRoutes.get("/:username/from", ensureLoggedIn, async (req,res,next)=>{
    try{
        if(req.user.username == req.params.username){
            from_user = await User.messagesFrom(req.params.username);
            return res.json({messages:from_user});
        }
        throw new ExpressError("Cannot request messages of an account other than your own!", 400);
    }catch(e){
        return next(e);
    }
})

module.exports = userRoutes;