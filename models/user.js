const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");
const Message = require("./message");

/** User class for message.ly */



/** User of the site. */

class User {

  constructor(username,password, first_name, last_name, phone, join_at){
    this.username = username,
    this.password = password,
    this.first_name = first_name,
    this.last_name = last_name,
    this.phone = phone,
    this.join_at = join_at
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    if(!username || !password){
      throw new ExpressError("Username and Password Required", 400);
    }
    //current timestamp
    const nowTimeStamp = new Date().toISOString();
    //hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    //save to db
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone, nowTimeStamp, nowTimeStamp]
    )
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password
      FROM users
      WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (user){
      if (await bcrypt.compare(password, user.password)) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const user = User.get(username);
    if (!user){
      throw new ExpressError(`no such user: ${username}`, 404);
    }
    const now = new Date().toISOString();
    const results = await db.query(
      `UPDATE users 
      SET last_login_at = $1
      WHERE username = $2
      RETURNING username, last_login_at`,
      [now, username]
    );
    return results.rows[0];
  }
    
  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const result = await db.query(
      `SELECT username, first_name, last_name, phone 
      FROM users`);
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
      FROM users
      WHERE username = $1`,
      [username]
    );
    if (result.rows.length === 0){
      throw new ExpressError(`no such user: ${username}`, 404);
    }
    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const user = User.get(username);
    if (!user){
      throw new ExpressError(`no such user: ${username}`, 404);
    }

    const result = await db.query(
      `SELECT * FROM messages AS m INNER JOIN users AS u ON m.to_username = u.username
      WHERE from_username = $1`,
      [username]
    );
    return result.rows.map(d => ({
      id: d.id,
      to_user: d.to_user,
      body: d.body,
      sent_at: d.sent_at,
      read_at: d.read_at,
      to_user: {
        username: d.username,
        first_name: d.first_name,
        last_name: d.last_name,
        phone: d.phone
      }
    }));
  }
  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const user = User.get(username);
    if (!user){
      throw new ExpressError(`no such user: ${username}`, 404);
    }
    const result = await db.query(
      `SELECT * FROM messages AS m INNER JOIN users AS u ON m.from_username = u.username
      WHERE to_username = $1`,
      [username]
    );
    return result.rows.map(d => ({
      body: d.body,
      from_user: {
        first_name: d.first_name,
        last_name: d.last_name,
        phone: d.phone,
        username: d.username
      },
      id: d.id,
      read_at: d.read_at,
      sent_at: d.sent_at
    }));
  }
}


module.exports = User;