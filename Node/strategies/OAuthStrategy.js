const { auth } = require('express-openid-connect');
const UserManager = require('../helpers/UserManager');
const Utils = require('../helpers/utils');
const Settings = require('../models/Settings');
const System = require('../models/System');
const Globals = require('../Globals');

class OAuthStrategy {

    async saveInitialConfig(settings){
        let system = System.getInstance();
        let logoutIdp = true;
        if(settings.issuerBaseUrl === 'https://accounts.google.com/')
            logoutIdp = false;

        system.setProperty('OAuth', {            
            IssuerBaseUrl: settings.IssuerBaseUrl,
            ClientId: settings.ClientId,
            BaseUrl: settings.BaseUrl,
            Secret: settings.Secret,
            LogoutIdp: logoutIdp
        });
        return true;
    }

    init(app) 
    {
        let system = System.getInstance();
        let oauth = system.getProperty('OAuth');
        let authOptions = {
            authRequired: true,
            issuerBaseURL: oauth.IssuerBaseUrl,
            clientID: oauth.ClientId,
            baseURL: oauth.BaseUrl,
            secret: oauth.Secret,
            enableTelemetry: false,
            idpLogout: !!oauth.LogoutIdp, 
            routes: {
                postLogoutRedirect:'/logged-out'
            }
        };

        app.get('/logged-out', (req, res) => {    
            let fullyLoggedOut = system.getProperty('OAuth').LogoutIdp;
            if(system.AllowGuest && fullyLoggedOut)
                return res.redirect('/');

            res.render('logged-out', 
            { 
                title: 'Logged Out',
                version: Globals.getVersion()
            });
        });

        app.use(
            auth(authOptions)
        );

        app.use(async (req, res, next) =>{
            if(req.url.startsWith('/401'))
            {
                next();
                return;
            }
            if(req.oidc.isAuthenticated()){
                if(!req.user)
                {
                    let userManager = UserManager.getInstance();
                    let username = req.oidc.user.email || req.oidc.user.username || req.oidc.user.name;
                    req.user = userManager.getUser(username);
                    if(!req.user){
                        // register the user
                        if(userManager.getNumberOfUsers() > 0 && system.AllowRegister === false){
                            res.redirect('/401?msg=no-register');
                            return;
                        }
                        req.user = await userManager.register(username, new Utils().newGuid());
                    }
                    req.settings = await Settings.getForUser(req.user.Uid);
                }
            }
            else if(system.AllowGuest === false)
            {
                res.redirect('/login');
                return;
            }
            else 
            {                
                req.isGuest = true;
                req.settings = await Settings.getForGuest();
            }
            next();
        })
    }

    errorHandler = (err, req, res, next) => {
        console.log(`ERROR FOR: [${req.url}] [${req.baseUrl}] ${err.statusCode}: `, err);
        if(req.url === '/callback' && err.error === 'unauthorized') {
            res.redirect('/401?msg=unauthorized');
        }
        else{
            next(err);
        }
    };
}

module.exports = OAuthStrategy;