const env = require('env2')('./.env');
const jwt = require('jsonwebtoken');
const util = require('util');

['sign', 'verify', 'decode']
  .forEach( method=>{
    jwt[method] = util.promisify(jwt[method]);
  })

const connection = require ('./dbConnection');
const sendMail = require ('./mailer');
const emailContent = require ('./content/magicLinkEmail');
const goCheckYerEmail = require ('./content/goCheckYerEmail');
const welcomePage = require ('./content/welcomePage');
const deniedPage = require ('./content/deniedPage');

const { JWT_SECRET, SERVER } = process.env;

let cookieDefaults = { secure: true };
// or, for dev:
cookieDefaults = {  };



const sessionLength = async user=> {
  // await user's own expiry prefs
  // or just call it a day
  return 24*60*60*1000;
}

const isUser = email=> new Promise( (resolve, reject)=>{
  resolve ({ email })
})

// resolves with an object { email, expiry, loggedIn, etc... } containing the credentials that were signed.
const isCookieGood = cookie=> new Promise((resolve, reject)=>{
  // accept either a bare JWT string or cookie object containing a JWT string as .jwt
  // console.log('cookie:',cookie);
  if (!cookie)
    reject ({ error: 'No cookie', code: 500, note: 'No JWT cookie!' })
  cookie = cookie.jwt || cookie;
  jwt.verify(cookie, JWT_SECRET)
    .then(contents=> {
      // reject if cookie has expired
      if (contents.expires < Date.now())
        reject({ error: 'Expired cookie', code: 401, note: `JWT cookie expired ${(contents.expires-Date.now())/1000} ms ago.` });
      // resolve if isUser resolves (with a value)
      // if isUser finshes without resolving or rejecting, it will return undefined, so this clause will reject (and be caught)
      // if isUser rejects, the rejection will bubble up (and be caught). Add another .catch for a more accurate error.
      isUser(contents.email)
        .then (ok=>{
          if (ok)
            resolve(contents)
          else
            reject ({ error: 'User not found', code: 401, note: `User ${contents.email} not found.` });
        })
      })
    .catch(error=> {
      // TODO: test errors to find which was caught.
      console.log('Probably a forged JWT cookie');
      reject ({ error, code:401, note: 'Probably a forged JWT cookie' })
    });
})

const loginByMagicLink = async (req, res)=> {
  const { login } = req.query;

  try {
    const creds = await isCookieGood(login);
    const sessionExpiry = await sessionLength(login.email);
    console.log('Received validly signed credentials:', creds );
    creds.expires = Date.now()+sessionExpiry;
    creds.loggedIn = true;
    console.log('Updated credentials to send back:',creds);
    const cookie = await jwt.sign(creds, JWT_SECRET);
    console.log(`For the next 24 hours, user can return with a cookie:\n jwt=${cookie} or with route /login and querystring:\n ?login=${cookie}`);
    console.log('To disable this credential, delete the jwt cookie locally. To block it, add the exact cookie to a blacklist.');
    res.cookie( 'jwt', cookie, { ...cookieDefaults, maxAge: sessionExpiry });
    res.send(welcomePage(creds.user || creds.email));
  } catch(error) {
      if (error.code<500)
        res.status(401)
          .send(deniedPage())
      else
        res.status(500)
          .send(`<p>Network Error.</p>`);
  }
}

// pass {expiry : unixTime } or {expiryTime : msFromNow } to override 15 min default
const magicLink = async (email, options={} )=>{
  const { expires, expiryTime } = options;
  let url = options.url || `${SERVER}/login`;
  const creds= {
    email,
    expires: expires || (Date.now() + (expiryTime || 15*60*1000))
  }
  return `${url}?login=${ await jwt.sign(creds, JWT_SECRET) }`;
}

const sendMagicLink = async (email, options={} )=>{
  const link = await magicLink( email, options ) ;
  const content = emailContent( email, link, options ) ;

  sendMail ({ ...content, to: email })
    .then(console.log);
}


const signupByMagicLink = async (req, res)=> {
  const { email } = req.body;
  if (!email) {
    res.status(400)
      .send(`<p>Send your email in a POST request including an 'email' field.</p>`);
    return
  }

  sendMagicLink(email)
    .then( ()=> {
      res.send(goCheckYerEmail(email));
    })
    .catch( error=> {
      res.status(500)
        .send(`<p>Server on fire. Our bad.</p>`);
    })
}

module.exports = { isCookieGood, magicLink, loginByMagicLink, signupByMagicLink };
