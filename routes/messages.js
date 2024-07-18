const express = require("express");
const messageRoutes = new express.Router();
const Message = require("../models/message");
const ExpressError = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
messageRoutes.get('/:id/', ensureLoggedIn, async (req, res, next)=>{
    try{
        const message = await Message.get(req.params.id);
        if(req.user.username != message.to_user.username && req.user.username != message.from_user.username){
            new ExpressError(`cannot view message if you are not the recipient or sender`, 400);
        }else{
            return res.json({message:message});
        }
    }catch(e){
        return next(e);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
messageRoutes.post('/', ensureLoggedIn, async (req, res, next)=>{
    try{
        console.log(`req.user.username = ${req.user.username}`);
        newMsg = await Message.create(req.user.username, req.body.to_username, req.body.body);
        return res.json({message: newMsg});
    }catch(e){
        return next(e);
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
messageRoutes.post('/:id/', ensureLoggedIn, async (req, res, next)=>{
    try{
        const msg = await Message.get(req.params.id);
        console.log(`req user: ${req.user.username}...to_user: ${msg.to_user.username}`);
        if(req.user.username == msg.to_user.username){
            const readReceipt = await Message.markRead(req.params.id);
            return res.json({readReceipt:readReceipt});
        }else{
            new ExpressError(`You can only mark messages you received as read.`,400);
        }
    }catch(e){
        return next(e);
    }
})
module.exports = messageRoutes;